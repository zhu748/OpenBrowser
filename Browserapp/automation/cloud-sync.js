'use strict';

/**
 * OpenBrowser cloud backup / restore.
 * Providers: local file path, WebDAV, GitHub repo Contents API.
 * Payload includes profiles (cookies/password/2FA/proxy/fingerprint/prefs),
 * groups, proxy library snapshot, and optional per-profile browser data files.
 */

const fsp = require('fs/promises');
const path = require('path');
const { request } = require('./cloud/transport');
const crypto = require('crypto');
const { URL } = require('url');
const zlib = require('zlib');
const gzipAsync = require('util').promisify(zlib.gzip);
const gunzipAsync = require('util').promisify(zlib.gunzip);
const { assertProfileId } = require('./isolation');

const BACKUP_VERSION = 1;
const REMOTE_NAME = 'openbrowser-backup.obpack';
const { MAX_BACKUP_PACKAGE_BYTES, MAX_BACKUP_JSON_BYTES, MAX_BROWSER_DATA_BYTES,
  MAX_REMOTE_ERROR_BYTES } = require('./cloud/limits');
const SAFE_GITHUB_NAME = /^[A-Za-z0-9_.-]{1,100}$/;
const SAFE_GITHUB_BRANCH = /^[A-Za-z0-9._\/-]{1,255}$/;

function nowIso() {
  return new Date().toISOString();
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const { encryptPayload, decryptPayload, encryptPayloadAsync, decryptPayloadAsync } = require('./cloud/package-crypto');
const { collectProfileDataFiles, restoreProfileDataFiles } = require('./cloud/profile-data');
const { profileStamp, mergeProfiles, mergeGroups, mergeProxies } = require('./cloud/merge');
function profileRemoteName(id) {
  const safe = assertProfileId(id);
  return `profiles/openbrowser-profile-${safe}.obpack`;
}

function safeRemotePath(value, fallback = '') {
  const raw = String(value || fallback).trim().replace(/\\/g, '/');
  if (!raw || raw.includes('\0') || raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) throw new Error('远程备份路径无效');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..' || part.length > 160)) {
    throw new Error('远程备份路径包含不安全片段');
  }
  return parts.join('/');
}

function safeLocalTarget(root, remoteName) {
  const base = path.resolve(String(root || ''));
  const rel = safeRemotePath(remoteName, REMOTE_NAME);
  const target = path.resolve(base, ...rel.split('/'));
  const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
  if (normalize(target) === normalize(base) || !normalize(target).startsWith(normalize(base) + path.sep)) {
    throw new Error('本地备份路径越过所选目录');
  }
  return { base, rel, target };
}

async function assertSafeLocalTarget(base, target) {
  try {
    if ((await fsp.lstat(base)).isSymbolicLink()) throw new Error('本地备份根目录不能是符号链接或 junction');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  let current = base;
  for (const part of path.relative(base, target).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await fsp.lstat(current)).isSymbolicLink()) throw new Error('本地备份路径包含符号链接或 junction');
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
}

function withRemoteName(config, provider, remoteName) {
  const c = { ...(config || {}) };
  const name = remoteName || REMOTE_NAME;
  if (String(provider) === 'github') {
    const base = safeRemotePath(c.path, `openbrowser/${REMOTE_NAME}`);
    const safeName = safeRemotePath(name, REMOTE_NAME);
    if (name === REMOTE_NAME) {
      c.path = base;
    } else {
      const dir = base.includes('/') ? base.replace(/\/[^/]+$/, '') : 'openbrowser';
      c.path = `${dir}/${safeName}`;
    }
  }
  return c;
}

function validatedGitHubConfig(config, remoteName) {
  const cfg = withRemoteName(config, 'github', remoteName);
  const owner = String(cfg.owner || '').trim();
  const repo = String(cfg.repo || '').trim();
  const token = String(cfg.token || '').trim();
  const branch = String(cfg.branch || 'main').trim() || 'main';
  const filePath = safeRemotePath(cfg.path, `openbrowser/${remoteName}`);
  if (!SAFE_GITHUB_NAME.test(owner) || !SAFE_GITHUB_NAME.test(repo) || !token) throw new Error('GitHub owner / repo / token 无效');
  if (!SAFE_GITHUB_BRANCH.test(branch) || branch.includes('..') || branch.startsWith('/') || branch.endsWith('/')) {
    throw new Error('GitHub branch 无效');
  }
  if (token.length > 1024) throw new Error('GitHub token 长度无效');
  return { owner, repo, token, branch, filePath };
}

function proxyUrlEmbedsCredentials(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return Boolean(u.username || u.password);
  } catch (_) {
    return true; // not a parseable URL — treat conservatively as sensitive
  }
}

/** True when a packed profile carries account credentials or browser data. */
function packedProfileContainsSecrets(profile) {
  if (!profile || typeof profile !== 'object') return false;
  const platform = profile.platform || {};
  if (String(profile.cookies || '').trim()) return true;
  if (String(platform.password || '').trim()) return true;
  if (String(platform.totpSecret || platform.otp || '').trim()) return true;
  if (proxyUrlEmbedsCredentials(profile.proxy) || proxyUrlEmbedsCredentials(platform.proxy)) return true;
  if (profile._dataFiles && Object.keys(profile._dataFiles).length) return true;
  return false;
}

function proxyRecordContainsSecrets(record) {
  if (!record || typeof record !== 'object') return false;
  if (String(record.username || record.user || '').trim() && String(record.password || record.pass || '').trim()) return true;
  return proxyUrlEmbedsCredentials(record.raw) || proxyUrlEmbedsCredentials(record.proxy);
}

/**
 * True when the `settings` block of a backup package carries provider
 * credentials (any WebDAV-style bridge account, a GitHub token, or an
 * unmasked passphrase). runCloudBackup used to pack the whole cloud config
 * with only the passphrase star-masked, so WebDAV passwords and GitHub
 * tokens could ride into an unencrypted package — the same plaintext
 * exposure the profiles/proxies gates exist to prevent.
 */
const CLOUD_SETTINGS_SECRET_FIELDS = new Set([
  'password', 'pass', 'token', 'secret', 'apiKey', 'apikey', 'credential', 'credentials', 'cookie',
]);

function cloudSettingsCarrySecrets(settings) {
  if (!settings || typeof settings !== 'object') return false;
  const cloud = settings.cloud && typeof settings.cloud === 'object' ? settings.cloud : null;
  if (!cloud) return false;
  if (String(cloud.passphrase || '').trim()) return true;
  // Any non-empty credential-looking field on any provider block counts.
  // Provider blocks also carry harmless keys (url/dir/owner/repo/branch);
  // only fields whose name marks them as secrets are considered.
  const stack = [cloud];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === 'object') { stack.push(value); continue; }
      const name = String(key);
      const looksSecret = CLOUD_SETTINGS_SECRET_FIELDS.has(name)
        || /passphrase|password|token|secret/i.test(name);
      if (looksSecret && String(value || '').trim() && String(value).trim() !== '***') return true;
    }
  }
  return false;
}

async function buildBackupPackage({
  profiles = [],
  groups = [],
  proxies = [],
  settings = {},
  profileDataRoot,
  includeBrowserData = true,
  passphrase = '',
  profileIds = null,
}) {
  let list = Array.isArray(profiles) ? profiles : [];
  if (Array.isArray(profileIds) && profileIds.length) {
    const allow = new Set(profileIds.map(String));
    list = list.filter((p) => allow.has(String(p.id)));
  }
  // default: only environments that explicitly enable cloudBackup (per-profile opt-in)
  if (!Array.isArray(profileIds)) {
    list = list.filter((p) => Boolean(p?.advanced?.cloudBackup));
  }
  const packedProfiles = [];
  let browserDataBytes = 0;
  let estimatedJsonBytes = 0;
  for (const profile of list) {
    assertProfileId(profile?.id);
    const item = { ...profile, updatedAt: profile.updatedAt || nowIso() };
    if (includeBrowserData && profileDataRoot && profile?.id) {
      const root = path.join(profileDataRoot, profile.id);
      item._dataFiles = await collectProfileDataFiles(root, profile, {
        maxTotalBytes: Math.max(0, MAX_BROWSER_DATA_BYTES - browserDataBytes),
      });
      for (const encoded of Object.values(item._dataFiles)) {
        browserDataBytes += Buffer.byteLength(encoded, 'base64');
      }
    }
    estimatedJsonBytes += Buffer.byteLength(JSON.stringify(item));
    if (estimatedJsonBytes > MAX_BACKUP_JSON_BYTES) throw new Error('备份配置内容超过 120 MB 安全限制');
    packedProfiles.push(item);
  }
  const body = {
    version: BACKUP_VERSION,
    soft: 'OpenBrowser',
    createdAt: nowIso(),
    profiles: packedProfiles,
    groups,
    proxies,
    settings,
  };
  const json = Buffer.from(JSON.stringify(body), 'utf8');
  if (json.length > MAX_BACKUP_JSON_BYTES) throw new Error('备份内容超过 120 MB 安全限制');
  // Security gate: refuse to ship an UNENCRYPTED backup that carries account
  // credentials (cookies / passwords / TOTP / proxy logins / browser data).
  // Cloud destinations (WebDAV / GitHub / netdisk) must never hold plaintext
  // secrets — the user has to set a backup passphrase instead. The gate
  // covers packed profiles, the proxy library snapshot AND settings.cloud:
  // a WebDAV password or GitHub token in the cloud config is just as much
  // a plaintext credential as a proxy login in a profile.
  if (!passphrase) {
    const carriesSecrets = packedProfiles.some(packedProfileContainsSecrets)
      || (Array.isArray(proxies) && proxies.some(proxyRecordContainsSecrets))
      || cloudSettingsCarrySecrets(settings);
    if (carriesSecrets) {
      throw new Error('备份包含账号凭据（Cookie / 密码 / 2FA / 代理登录信息 / 云盘账号令牌或浏览器数据），必须先设置备份口令加密后再上传');
    }
  }
  const gz = await gzipAsync(json, { level: 9 });
  const { encrypted, data } = await encryptPayloadAsync(gz, passphrase);
  if (data.length > MAX_BACKUP_PACKAGE_BYTES) throw new Error('备份包超过 100 MB 安全限制');
  return {
    buffer: data,
    meta: {
      version: BACKUP_VERSION,
      encrypted,
      createdAt: body.createdAt,
      profileCount: packedProfiles.length,
      profileIds: packedProfiles.map((p) => p.id),
      bytes: data.length,
      sha256: sha256(data),
    },
  };
}

async function parseBackupPackage(buffer, passphrase = '') {
  const raw = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (raw.length > MAX_BACKUP_PACKAGE_BYTES) throw new Error('备份包超过 100 MB 安全限制');
  const decrypted = await decryptPayloadAsync(raw, passphrase);
  if (decrypted.length > MAX_BACKUP_PACKAGE_BYTES) throw new Error('备份包解密后超过安全限制');
  let jsonBuf;
  try {
    jsonBuf = await gunzipAsync(decrypted, { maxOutputLength: MAX_BACKUP_JSON_BYTES });
  } catch (_) {
    jsonBuf = decrypted;
  }
  if (jsonBuf.length > MAX_BACKUP_JSON_BYTES) throw new Error('备份内容超过 120 MB 安全限制');
  const body = JSON.parse(jsonBuf.toString('utf8'));
  if (!body || !Array.isArray(body.profiles)) throw new Error('备份格式无效');
  return body;
}

function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

async function ensureWebDavDir(baseUrl, user, pass, relativeDir) {
  const parts = relativeDir.split('/').filter(Boolean);
  let cur = baseUrl.replace(/\/?$/, '/');
  for (const part of parts) {
    cur += encodeURIComponent(part) + '/';
    const res = await request(cur, {
      method: 'MKCOL',
      headers: { Authorization: basicAuth(user, pass) },
    });
    if (![201, 204, 405, 301, 302, 409].includes(res.status)) {
      // 409/405 often mean exists
      if (res.status >= 400 && res.status !== 405 && res.status !== 409) {
        throw new Error(`WebDAV MKCOL 失败 (${res.status})`);
      }
    }
  }
}

function webDavTarget(config, remoteName = REMOTE_NAME) {
  let parsed;
  try { parsed = new URL(String(config.url || '')); } catch (_) { throw new Error('请填写有效的 WebDAV 地址'); }
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname.toLowerCase());
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new Error('WebDAV 必须使用 HTTPS；仅本机回环地址允许 HTTP');
  }
  if (parsed.username || parsed.password) throw new Error('WebDAV 凭据必须使用独立账号字段');
  if (parsed.search) throw new Error('WebDAV 地址不能包含查询参数');
  parsed.hash = '';
  const base = parsed.toString().replace(/\/?$/, '/');
  const dir = safeRemotePath(config.dir, 'OpenBrowser');
  const name = safeRemotePath(remoteName, REMOTE_NAME);
  const rel = [dir, name].filter(Boolean).join('/');
  const encoded = rel.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return { base, dir, name, rel, target: base + encoded };
}

async function uploadWebDav(config, buffer, remoteName = REMOTE_NAME) {
  const user = String(config.username || '');
  const pass = String(config.password || '');
  const { base, rel, target } = webDavTarget(config, remoteName);
  if (!base || base === '/') throw new Error('请填写 WebDAV 地址');
  const parent = rel.includes('/') ? rel.replace(/\/[^/]+$/, '') : '';
  if (parent) await ensureWebDavDir(base, user, pass, parent);
  // Upload via a partial name first, then MOVE to the final name: a network
  // drop mid-PUT must not leave a half package at the canonical remote path
  // (the only backup a restore would see). WebDAV MOVE is part of RFC 4918;
  // servers that reject MOVE with 405/501 fall back to a direct PUT, which
  // keeps the old behavior on such deployments instead of failing uploads.
  const partialRel = `${rel}.partial-${crypto.randomBytes(4).toString('hex')}`;
  const partialTarget = webDavTarget(config, partialRel).target;
  const putRes = await request(partialTarget, {
    method: 'PUT',
    headers: {
      Authorization: basicAuth(user, pass),
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length,
    },
  }, buffer);
  if (putRes.status < 200 || putRes.status >= 300) {
    await request(partialTarget, {
      method: 'DELETE',
      headers: { Authorization: basicAuth(user, pass) },
    }).catch(() => {});
    throw new Error(`WebDAV 上传失败 (${putRes.status})`);
  }
  // RFC 4918: MOVE acts on the request URI (the source) and the Destination
  // header names the destination. Moving partial -> canonical keeps the
  // canonical path from ever holding a half package.
  const moveRes = await request(partialTarget, {
    method: 'MOVE',
    headers: {
      Authorization: basicAuth(user, pass),
      Destination: target,
      Overwrite: 'T',
    },
  });
  if (moveRes.status >= 200 && moveRes.status < 300) {
    return { provider: 'webdav', url: target, bytes: buffer.length, remoteName };
  }
  if (moveRes.status === 405 || moveRes.status === 501) {
    // Server without MOVE support: fall back to a direct PUT of the full
    // package (this is the pre-partial behavior, no worse than before).
    const directRes = await request(target, {
      method: 'PUT',
      headers: {
        Authorization: basicAuth(user, pass),
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length,
      },
    }, buffer);
    await request(partialTarget, {
      method: 'DELETE',
      headers: { Authorization: basicAuth(user, pass) },
    }).catch(() => {});
    if (directRes.status < 200 || directRes.status >= 300) {
      throw new Error(`WebDAV 上传失败 (${directRes.status})`);
    }
    return { provider: 'webdav', url: target, bytes: buffer.length, remoteName };
  }
  await request(partialTarget, {
    method: 'DELETE',
    headers: { Authorization: basicAuth(user, pass) },
  }).catch(() => {});
  throw new Error(`WebDAV MOVE 失败 (${moveRes.status})`);
}

async function downloadWebDav(config, remoteName = REMOTE_NAME) {
  const user = String(config.username || '');
  const pass = String(config.password || '');
  const { target } = webDavTarget(config, remoteName);
  const res = await request(target, {
    method: 'GET',
    headers: { Authorization: basicAuth(user, pass) },
  });
  if (res.status !== 200) {
    throw new Error(`WebDAV 下载失败 (${res.status})`);
  }
  return res.body;
}

async function uploadGitHub(config, buffer, remoteName = REMOTE_NAME) {
  const { owner, repo, token, branch, filePath } = validatedGitHubConfig(config, remoteName);
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  // C-10: the GitHub Contents API rejects requests whose JSON payload exceeds
  // ~100MB and becomes unreliable well below that; base64 inflates the package
  // by 4/3. Failing up front with a clear message beats pushing 70MB for a
  // minute only to get a 422 the message cannot distinguish from an auth issue.
  // WebDAV keeps no such cap (MAX_BACKUP_PACKAGE_BYTES stays the writer bound).
  const GITHUB_MAX_PACKAGE_BYTES = 50 * 1024 * 1024;
  if (buffer.length > GITHUB_MAX_PACKAGE_BYTES) {
    throw new Error(`备份包 ${(buffer.length / 1048576).toFixed(1)}MB 超过 GitHub 通道上限 50MB（Contents API 限制）；请改用 WebDAV 通道或减小备份范围`);
  }
  let sha;
  const getRes = await request(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.object+json',
      'User-Agent': 'OpenBrowser-CloudSync',
    },
    // Contents <=1 MiB include base64; larger files return metadata with this
    // media type. Bound successful metadata separately from short error text.
    maxBytes: 2 * 1024 * 1024,
  });
  if (getRes.status === 200) {
    sha = JSON.parse(getRes.body.toString('utf8')).sha;
    if (!/^[a-f0-9]{40,64}$/i.test(String(sha || ''))) throw new Error('GitHub 备份元数据缺少有效 SHA');
  } else if (getRes.status !== 404) throw new Error(`GitHub 备份元数据读取失败 (${getRes.status})`);
  const payload = JSON.stringify({
    message: `OpenBrowser backup ${nowIso()} · ${remoteName}`,
    content: buffer.toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  });
  const putRes = await request(apiBase, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'OpenBrowser-CloudSync',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    maxBytes: MAX_REMOTE_ERROR_BYTES,
  }, Buffer.from(payload));
  if (putRes.status < 200 || putRes.status >= 300) {
    throw new Error(`GitHub 上传失败 (${putRes.status})`);
  }
  return { provider: 'github', owner, repo, path: filePath, bytes: buffer.length, remoteName };
}

async function downloadGitHub(config, remoteName = REMOTE_NAME) {
  const { owner, repo, token, branch, filePath } = validatedGitHubConfig(config, remoteName);
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`;
  const res = await request(apiBase, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
      'User-Agent': 'OpenBrowser-CloudSync',
    },
    maxBytes: MAX_BACKUP_PACKAGE_BYTES,
  });
  if (res.status !== 200) throw new Error(`GitHub 下载失败 (${res.status})`);
  if (!res.body.length) throw new Error('GitHub 文件内容为空');
  return res.body;
}

/** Google Drive via "application data" style: user provides WebDAV-compatible endpoint or API key is not enough.
 *  We support "gdrive" as alias that expects a WebDAV bridge URL (Alist / rclone serve).
 */
async function uploadGoogleCloud(config, buffer, remoteName = REMOTE_NAME) {
  // Prefer WebDAV bridge fields; fall back to generic webdav keys.
  return uploadWebDav({
    url: config.url || config.webdavUrl,
    username: config.username || config.user || '',
    password: config.password || config.token || '',
    dir: config.dir || 'OpenBrowser',
  }, buffer, remoteName);
}

async function downloadGoogleCloud(config, remoteName = REMOTE_NAME) {
  return downloadWebDav({
    url: config.url || config.webdavUrl,
    username: config.username || config.user || '',
    password: config.password || config.token || '',
    dir: config.dir || 'OpenBrowser',
  }, remoteName);
}

async function uploadLocal(config, buffer, remoteName = REMOTE_NAME) {
  const dir = String(config.dir || '').trim();
  if (!dir) throw new Error('请选择本地备份目录');
  const { base, rel, target: file } = safeLocalTarget(dir, remoteName);
  await assertSafeLocalTarget(base, file);
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await assertSafeLocalTarget(base, file);
  // Write the package via a temp file in the same directory + rename, so a
  // crash mid-write cannot leave a truncated file at the canonical path.
  const tmpFile = `${file}.tmp-${crypto.randomBytes(4).toString('hex')}`;
  await fsp.writeFile(tmpFile, buffer, { mode: 0o600 });
  await fsp.rename(tmpFile, file);
  if (rel === REMOTE_NAME || !rel.includes('/')) {
    const stamp = nowIso().replace(/[:.]/g, '-');
    await fsp.writeFile(path.join(base, `openbrowser-backup-${stamp}.obpack`), buffer, { mode: 0o600 }).catch(() => {});
    await rotateLocalTimestampBackups(base).catch(() => {});
  }
  return { provider: 'local', path: file, bytes: buffer.length, remoteName: rel };
}

/**
 * Keep only the newest N timestamped copies (openbrowser-backup-<stamp>.obpack)
 * in a local backup root. Without rotation every full backup added another
 * stale copy forever; they have no restore entry point, so beyond a handful
 * they are pure disk waste. Newest-first lexical order = ISO stamp order.
 */
const LOCAL_TIMESTAMP_BACKUP_KEEP = 5;

async function rotateLocalTimestampBackups(base) {
  const keep = Number.isFinite(LOCAL_TIMESTAMP_BACKUP_KEEP) ? LOCAL_TIMESTAMP_BACKUP_KEEP : 5;
  if (keep < 0) return 0;
  let entries = [];
  try { entries = await fsp.readdir(base); } catch (_) { return 0; }
  const stamped = entries
    .filter((name) => /^openbrowser-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.obpack$/.test(name))
    .sort()
    .reverse();
  let removed = 0;
  for (const name of stamped.slice(keep)) {
    try {
      await fsp.rm(path.join(base, name), { force: true });
      removed += 1;
    } catch (_) {}
  }
  return removed;
}

async function downloadLocal(config, remoteName = REMOTE_NAME) {
  const dir = String(config.dir || '').trim();
  if (!dir) throw new Error('请选择本地备份目录');
  const { base, target: file } = safeLocalTarget(dir, remoteName);
  await assertSafeLocalTarget(base, file);
  return fsp.readFile(file);
}

/** WebDAV-bridge providers: Alist / OpenList / rclone serve for consumer clouds */
const WEBDAV_BRIDGE_PROVIDERS = new Set([
  'gdrive', 'google', 'gcs',
  'onedrive', 'microsoft', 'mscloud',
  'quark', 'kuake',
  'baidu', 'baiduyun', 'pan',
]);

function isWebDavBridgeProvider(provider) {
  return WEBDAV_BRIDGE_PROVIDERS.has(String(provider || '').toLowerCase());
}

async function upload(provider, config, buffer, remoteName = REMOTE_NAME) {
  const key = String(provider || 'local').toLowerCase();
  switch (key) {
    case 'webdav': return uploadWebDav(config, buffer, remoteName);
    case 'github': return uploadGitHub(config, buffer, remoteName);
    case 'local':
      return uploadLocal(config, buffer, remoteName);
    default:
      if (isWebDavBridgeProvider(key)) return uploadGoogleCloud(config, buffer, remoteName);
      return uploadLocal(config, buffer, remoteName);
  }
}

async function download(provider, config, remoteName = REMOTE_NAME) {
  const key = String(provider || 'local').toLowerCase();
  switch (key) {
    case 'webdav': return downloadWebDav(config, remoteName);
    case 'github': return downloadGitHub(config, remoteName);
    case 'local':
      return downloadLocal(config, remoteName);
    default:
      if (isWebDavBridgeProvider(key)) return downloadGoogleCloud(config, remoteName);
      return downloadLocal(config, remoteName);
  }
}

function emptyWebDavBridge() {
  return { url: '', username: '', password: '', dir: 'OpenBrowser' };
}

function defaultCloudConfig() {
  return {
    enabled: false,
    autoSyncOnQuit: true,
    includeBrowserData: true,
    provider: 'local',
    passphrase: '',
    restoreMode: 'merge',
    lastSyncAt: '',
    lastError: '',
    local: { dir: '' },
    webdav: emptyWebDavBridge(),
    github: { owner: '', repo: '', token: '', branch: 'main', path: 'openbrowser/openbrowser-backup.obpack' },
    gdrive: emptyWebDavBridge(),
    onedrive: emptyWebDavBridge(),
    quark: emptyWebDavBridge(),
    baidu: emptyWebDavBridge(),
  };
}

/** One-click presets shown in 本地设置 → 云同步 */
function cloudPresets() {
  return {
    onedrive: {
      id: 'onedrive',
      label: '微软云 OneDrive',
      provider: 'onedrive',
      dir: 'OpenBrowser',
      urlPlaceholder: 'https://你的域名/dav/onedrive',
      hint: '推荐用 Alist / OpenList 挂载 OneDrive，再填 WebDAV 地址。示例：https://alist.example.com/dav/onedrive 。用户名为 Alist 账号，密码为 Alist 密码或令牌。',
    },
    quark: {
      id: 'quark',
      label: '夸克云',
      provider: 'quark',
      dir: 'OpenBrowser',
      urlPlaceholder: 'https://你的域名/dav/quark',
      hint: '夸克无官方 WebDAV，请用 Alist / OpenList 挂载夸克网盘后填入桥接地址。Cookie 登录配置在 Alist 后台完成，此处只填 WebDAV 账号。',
    },
    baidu: {
      id: 'baidu',
      label: '百度云',
      provider: 'baidu',
      dir: 'OpenBrowser',
      urlPlaceholder: 'https://你的域名/dav/baidu',
      hint: '百度网盘请用 Alist / OpenList 挂载后使用 WebDAV。示例路径：/dav/baidu 或 /dav/百度网盘 。远程目录建议填 OpenBrowser。',
    },
  };
}

module.exports = {
  BACKUP_VERSION,
  REMOTE_NAME,
  defaultCloudConfig,
  cloudPresets,
  isWebDavBridgeProvider,
  WEBDAV_BRIDGE_PROVIDERS,
  buildBackupPackage,
  parseBackupPackage,
  restoreProfileDataFiles,
  mergeProfiles,
  mergeGroups,
  mergeProxies,
  profileRemoteName,
  profileStamp,
  withRemoteName,
  upload,
  download,
  encryptPayload,
  decryptPayload,
  safeRemotePath,
  safeLocalTarget,
  webDavTarget,
  validatedGitHubConfig,
  cloudSettingsCarrySecrets,
  rotateLocalTimestampBackups,
};
