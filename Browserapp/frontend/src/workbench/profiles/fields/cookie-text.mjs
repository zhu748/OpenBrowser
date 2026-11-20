const requiredDomain = '缺少 domain 信息，请在下面平台账号中选择或新增对应的业务平台';
const attributes = new Set(['domain', 'path', 'expires', 'expiry', 'maxage', 'secure', 'httponly', 'samesite']);
const attributeName = key => key.trim().toLowerCase().replaceAll('-', '');
const isAttribute = key => attributes.has(attributeName(key));
const isEnabled = value => value == null || value === '' || /^(1|true|yes)$/i.test(value.trim());
const segments = raw => raw.split(';').map(part => part.trim()).filter(Boolean);

function expirySeconds(value) {
  if (value == null || value === '') return -1;
  const number = Number(value);
  if (Number.isFinite(number)) return number > 0 ? Math.floor(number > 1e10 ? number / 1000 : number) : -1;
  const date = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(date) && date > 0 ? Math.floor(date / 1000) : -1;
}

const namedCookie = value => value && typeof value === 'object' && Boolean(value.name);

function normalize(cookie) {
  const expires = expirySeconds(cookie.expires ?? cookie.expiry);
  const setting = typeof cookie.sameSite === 'string' ? cookie.sameSite.trim().toLowerCase() : '';
  const sameSite = setting === 'none' ? 'None' : setting === 'strict' ? 'Strict' : 'Lax';
  return { ...cookie, name: String(cookie.name ?? ''), value: String(cookie.value ?? ''), domain: String(cookie.domain ?? ''),
    path: String(cookie.path || '/'), expires, httpOnly: Boolean(cookie.httpOnly), secure: sameSite === 'None' || Boolean(cookie.secure),
    sameSite, session: Boolean(cookie.session ?? expires === -1) };
}

function normalizedUnique(cookies) {
  const seen = new Set();
  const result = [];
  for (const cookie of cookies) {
    const key = JSON.stringify([cookie.name, cookie.domain ?? '', cookie.path || '/', cookie.value ?? '']);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalize(cookie));
  }
  return result;
}

function setAttribute(cookie, key, value) {
  switch (attributeName(key)) {
    case 'domain': cookie.domain = value?.trim() ?? ''; break;
    case 'path': cookie.path = value?.trim() || '/'; break;
    case 'expiry':
    case 'expires': cookie.expires = value?.trim(); break;
    case 'maxage': {
      const seconds = Number.parseInt(value?.trim(), 10);
      if (Number.isFinite(seconds)) cookie.expires = Math.floor(Date.now() / 1000) + seconds;
      break;
    }
    case 'secure': cookie.secure = isEnabled(value); break;
    case 'httponly': cookie.httpOnly = isEnabled(value); break;
    case 'samesite': cookie.sameSite = value?.trim(); break;
  }
}

function leadingAttributes(line) {
  const defaults = { path: '/' };
  let rest = line.trim();
  while (rest) {
    const attribute = /^(domain|path|expires|expiry|max-age|maxage|secure|httponly|samesite)=([^;]*)\s*;\s*/i.exec(rest);
    if (!attribute) break;
    setAttribute(defaults, attribute[1], attribute[2]);
    rest = rest.slice(attribute[0].length).trim();
  }
  return { defaults, rest };
}

function withDefaults(cookie, defaults) {
  const result = { httpOnly: false, secure: false, sameSite: 'Lax', ...defaults, ...cookie };
  result.path = String(result.path || '/');
  return result;
}

function splitPair(raw) {
  const offset = raw.indexOf('=');
  return offset < 0 ? { key: raw, value: undefined } : { key: raw.slice(0, offset).trim(), value: raw.slice(offset + 1) };
}

function readSemiColonLine(line, hints) {
  const { defaults, rest } = leadingAttributes(line);
  const plainPairs = segments(rest).map(splitPair);
  if (plainPairs.length && plainPairs.every(({ key, value }) => key && (value === undefined || !isAttribute(key)))) {
    return plainPairs.map(({ key, value }) => withDefaults({ name: key, value: value ?? '' }, { ...hints, ...defaults }));
  }
  const cookies = [];
  let current = withDefaults({}, hints);
  for (const { key, value } of segments(line).map(splitPair)) {
    if (value === undefined || !key) {
      if (current.name || String(current.domain ?? '').trim()) setAttribute(current, key);
    } else if (isAttribute(key)) setAttribute(current, key, value);
    else {
      if (current.name) cookies.push(current);
      current = withDefaults({ name: key, value }, hints);
    }
  }
  if (current.name) cookies.push(current);
  return cookies;
}

function readCommaLine(line, defaults) {
  const groups = [];
  let parts = [];
  for (const part of line.split(',').map(value => value.trim()).filter(Boolean)) {
    if (parts.length && !isAttribute(splitPair(part).key)) {
      groups.push(parts.join(', '));
      parts = [];
    }
    parts.push(part);
  }
  if (parts.length) groups.push(parts.join(', '));
  return groups.flatMap(group => {
    let cookie;
    for (const part of group.split(/,(?=\s*(?:domain|path|expires|expiry|max-age|maxage|secure|httponly|http-only|samesite|same-site)\s*=)/i)) {
      const { key, value } = splitPair(part.trim());
      if (!key || !cookie && (value === undefined || isAttribute(key))) return [];
      if (!cookie) cookie = withDefaults({ name: key, value }, defaults);
      else setAttribute(cookie, key, value);
    }
    return cookie ? [cookie] : [];
  });
}

function platformHost(platform) {
  const text = platform?.trim();
  if (!text) return '';
  const url = /^(https?:\/\/[^:\s{]+)/i.exec(text)?.[1] ?? text;
  try { return new URL(url).hostname; }
  catch { return url.replace(/^https?:\/\//i, '').split(/[/:?#]/)[0] ?? ''; }
}

function readNameValue(raw, { defaultAttributes = {}, platformUrls = [] }) {
  const result = [];
  let nextPlatform = 0;
  for (const line of raw.split('\n').map(value => value.trim()).filter(Boolean)) {
    const { defaults } = leadingAttributes(line);
    const hints = withDefaults(defaultAttributes, defaults);
    const cookies = normalizedUnique(line.includes(';') ? readSemiColonLine(line, hints) : readCommaLine(line, hints));
    if (!String(defaults.domain ?? '').trim() && cookies.some(cookie => !cookie.domain.trim())) {
      const host = platformHost(platformUrls[nextPlatform++]);
      if (!host) return { valid: false, message: $t('* {msg}', { msg: requiredDomain }) };
      for (const cookie of cookies) if (!cookie.domain.trim()) cookie.domain = host;
    }
    result.push(...cookies);
  }
  return result.length ? { valid: true, cookies: result } : invalidFormat();
}

const invalidFormat = () => ({ valid: false, message: $t('Cookie 格式错误，请检查格式') });

function isNetscape(raw) {
  if (/^#\s*(?:Netscape\s+)?HTTP Cookie File/m.test(raw)) return true;
  return raw.split('\n').some(line => {
    const fields = line.trimStart().split('\t');
    return !fields[0].startsWith('#') && fields.length >= 7 && [fields[1], fields[3]].every(value => /^(TRUE|FALSE)$/i.test(value.trim()));
  });
}

function readNetscape(raw) {
  const cookies = [];
  for (const row of raw.split('\n')) {
    const line = row.replace(/\r$/, '').trimStart();
    const httpOnly = line.startsWith('#HttpOnly_');
    if (!line || line.startsWith('#') && !httpOnly) continue;
    const fields = line.split('\t');
    if (fields.length < 7) continue;
    const [host, , path, secure, expiry, name, ...data] = fields;
    const domain = (httpOnly ? host.slice('#HttpOnly_'.length) : host).trim();
    if (domain && name.trim()) cookies.push(normalize({ domain, path: path.trim(), name: name.trim(), value: data.join('\t'),
      secure: secure.trim().toUpperCase() === 'TRUE', expires: Number.parseInt(expiry.trim(), 10), httpOnly }));
  }
  return cookies;
}

function validateCookies(input, options = {}) {
  const raw = input?.trim() ?? '';
  if (!raw) return { valid: true, cookies: [] };
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const cookies = normalizedUnique((Array.isArray(parsed) ? parsed : [parsed]).filter(namedCookie));
      return cookies.length ? { valid: true, cookies } : invalidFormat();
    } catch { return invalidFormat(); }
  }
  if (isNetscape(input)) {
    const cookies = readNetscape(input);
    return cookies.length ? { valid: true, cookies } : invalidFormat();
  }
  return readNameValue(raw, options);
}

function parseCookies(input, options) {
  const result = validateCookies(input, options);
  return result.valid ? result.cookies : null;
}

const normalizeCookies = value => Array.isArray(value) ? value.filter(namedCookie).map(normalize) : [];
const validCookie = (input, options) => !input || typeof input !== 'string' || validateCookies(input, options).valid;

function formatCookies(value) {
  const cookies = normalizeCookies(value);
  return cookies.length ? JSON.stringify(cookies, null, 2) : '';
}

function cookiesFromImport(value, accounts = []) {
  const platformUrls = accounts.map(account => account.platformUrl).filter(url => url?.trim());
  return parseCookies(value, { platformUrls }) ?? [];
}

async function importCookies() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'cookies Files', accept: { 'application/json': ['.json'], 'text/plain': ['.txt'] } }],
      excludeAcceptAllOption: true, multiple: false,
    });
    const data = await (await handle.getFile()).text();
    if (data && validCookie(data)) return { code: 0, data, message: $t('导入成功') };
    return { code: -1, data: null, message: $t('导入 Cookie 格式错误，请检查格式') };
  } catch (error) {
    if (error?.name !== 'AbortError') return { code: -1, data: null, message: error?.message || $t('导入 Cookie 格式错误，请检查格式') };
  }
}

export { importCookies as a, cookiesFromImport as i, normalizeCookies as n, formatCookies as o, parseCookies as r, validateCookies as s, validCookie as t };
