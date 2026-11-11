/**
 * Chrome Web Store metadata / icon pipeline.
 *
 * Owns bounded downloads and caches for:
 * the CRX package download, the store detail-page scrape with its TTL cache,
 * og:* metadata parsing, icon download and the userData/app-center-icons
 * disk cache. Consumed by main.js for the `extensions:add-store` proxy
 * fallback and the `automation:app-center-*` IPC handlers.
 */

const { app, session } = require('./host-bridge');
const path = require('path');
const fsp = require('fs/promises');
const { readResponseBuffer } = require('./automation/response-body');

async function fetchStorePackage(url, proxyValue = null, { signal } = {}) {
  signal?.throwIfAborted();
  const initial = new URL(url);
  if (initial.protocol !== 'https:' || initial.hostname !== 'clients2.google.com') throw new Error('Chrome 商店下载地址无效');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const storeSession = session.fromPartition('persist:openbrowser-extension-store');
    if (proxyValue === 'system') await storeSession.setProxy({ mode: 'system' });
    else if (proxyValue) await storeSession.setProxy({ mode: 'fixed_servers', proxyRules: proxyValue });
    else await storeSession.setProxy({ mode: 'direct' });
    signal?.throwIfAborted();
    const response = await storeSession.fetch(url, { redirect: 'follow', signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal, headers: { 'user-agent': 'Mozilla/5.0 OpenBrowserLocal/3.0' } });
    const finalUrl = new URL(String(response.url || url));
    if (finalUrl.protocol !== 'https:' || !['clients2.google.com', 'clients2.googleusercontent.com'].includes(finalUrl.hostname)) throw new Error('Chrome 商店返回了不受信任的下载地址');
    if (!response.ok) throw new Error('Chrome 商店下载失败（HTTP ' + response.status + '）');
    return await readResponseBuffer(response, 120 * 1024 * 1024, '扩展包超过 120 MB 限制');
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('连接 Chrome 应用商店超时，请检查系统代理/VPN，或先给任一目标环境配置可访问 Google 的代理');
    throw error;
  } finally { clearTimeout(timer); }
}

const chromeStoreIconRequests = new Map();

function validChromeStoreId(value) {
  return /^[a-p]{32}$/i.test(String(value || '')) ? String(value).toLowerCase() : null;
}

function chromeStoreImageUrl(html) {
  const text = String(html || '');
  const match = text.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)
    || text.match(/https:\/\/[a-z0-9.-]+\.googleusercontent\.com\/[^"'\\s>]+\.(?:png|jpe?g|webp)/i)
    || text.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\\s>]+/i);
  if (!match) return null;
  return String(match[1] || match[0]).replace(/&amp;/g, '&');
}

function isChromeStoreIconHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'chromewebstore.google.com' || host.endsWith('.googleusercontent.com') || host.endsWith('.gstatic.com') || host.endsWith('.ggpht.com');
}

// In-flight and recently-fetched store detail pages. The metadata path (og:tags)
// and the icon path (og:image) used to each download the same page separately;
// one fetch now serves both within a short window.
const chromeStorePageRequests = new Map();
const CHROME_STORE_PAGE_TTL_MS = 30_000;
const chromeStorePageCache = new Map(); // safeId -> { html, fetchedAt }
const CHROME_STORE_PAGE_CACHE_MAX = 24;

// Bounded insert: Map preserves insertion order, so the first key is the
// oldest entry. Unbounded growth would retain every store page ever opened
// for the lifetime of the app session.
function rememberChromeStorePage(safeId, html) {
  chromeStorePageCache.set(safeId, { html, fetchedAt: Date.now() });
  while (chromeStorePageCache.size > CHROME_STORE_PAGE_CACHE_MAX) {
    const oldestKey = chromeStorePageCache.keys().next().value;
    if (oldestKey === undefined) break;
    chromeStorePageCache.delete(oldestKey);
  }
}

async function fetchChromeStorePageHtml(safeId, timeoutMs = 25000, { signal } = {}) {
  signal?.throwIfAborted();
  const now = Date.now();
  const cachedPage = chromeStorePageCache.get(safeId);
  if (cachedPage) {
    if (now - cachedPage.fetchedAt < CHROME_STORE_PAGE_TTL_MS) return cachedPage.html;
    // Lazy eviction: an expired entry is dead weight until refetched.
    chromeStorePageCache.delete(safeId);
  }
  const pending = chromeStorePageRequests.get(safeId);
  if (pending && !signal) return pending;
  const request = (async () => {
    const storeSession = session.fromPartition('persist:openbrowser-extension-store');
    const pageUrl = `https://chromewebstore.google.com/detail/${safeId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await storeSession.fetch(pageUrl, {
        redirect: 'follow',
        signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
      if (!response.ok) return null;
      const html = (await readResponseBuffer(response, 4 * 1024 * 1024)).toString('utf8');
      if (html) rememberChromeStorePage(safeId, html);
      return html || null;
    } finally {
      clearTimeout(timeout);
      controller.abort();
    }
  })().catch((_error) => { signal?.throwIfAborted(); return null; }).finally(() => { if (!signal) chromeStorePageRequests.delete(safeId); });
  if (!signal) chromeStorePageRequests.set(safeId, request);
  return request;
}

// og:title / og:description / og:image out of a store detail page. The page
// markup keeps these meta tags near the head, so a lazy slice is enough and
// avoids regex-scanning megabytes of script bodies.
function chromeStoreTextMeta(html) {
  const text = String(html || '').slice(0, 512 * 1024);
  const read = (prop) => {
    const match = text.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
      || text.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
    return match ? String(match[1]).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';
  };
  return { title: read('og:title'), description: read('og:description') };
}

function bufferToDataUrl(buffer, contentType = '') {
  const type = String(contentType || '').toLowerCase().split(';')[0].trim();
  let mime = type.startsWith('image/') ? type : '';
  if (!mime && buffer?.length >= 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50) mime = 'image/png';
    else if (buffer[0] === 0xff && buffer[1] === 0xd8) mime = 'image/jpeg';
    else if (buffer[0] === 0x52 && buffer[1] === 0x49) mime = 'image/webp';
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) mime = 'image/gif';
    else mime = 'image/png';
  }
  return `data:${mime || 'image/png'};base64,${Buffer.from(buffer).toString('base64')}`;
}

async function cachedIconDataUrl(cacheFile) {
  try {
    const data = await fsp.readFile(cacheFile);
    if (!data.length) return null;
    return bufferToDataUrl(data);
  } catch (_) {
    return null;
  }
}

function extensionIconSource(manifest) {
  const sets = [manifest?.icons, manifest?.action?.default_icon, manifest?.browser_action?.default_icon, manifest?.page_action?.default_icon];
  for (const set of sets) {
    if (typeof set === 'string') return set;
    if (!set || typeof set !== 'object') continue;
    const entry = Object.entries(set).filter(([, value]) => typeof value === 'string')
      .sort(([left], [right]) => Number(right) - Number(left))[0];
    if (entry) return entry[1];
  }
  return null;
}

async function fetchChromeStoreMetadata(storeId, { signal } = {}) {
  signal?.throwIfAborted();
  const safeId = validChromeStoreId(storeId);
  if (!safeId) return null;
  const cacheDir = path.join(app.getPath('userData'), 'app-center-icons');
  const metadataFile = path.join(cacheDir, `${safeId}.json`);
  const cacheFile = path.join(cacheDir, `${safeId}.img`);
  try {
    const cached = JSON.parse(await fsp.readFile(metadataFile, 'utf8'));
    if (cached) {
      // Prefer live data URL from cached image bytes (sandbox-safe in renderer)
      const dataUrl = await cachedIconDataUrl(cacheFile);
      if (dataUrl) return { ...cached, icon_url: dataUrl };
      if (cached.icon_url && String(cached.icon_url).startsWith('data:')) return cached;
      if (cached.description) {
        // Try page icon scrape if only description was cached
        const icon = await fetchChromeStoreIcon(safeId, { signal });
        if (icon) {
          const next = { ...cached, icon_url: icon };
          await fsp.writeFile(metadataFile, JSON.stringify({ ...next, icon_url: 'file-cache' }), 'utf8').catch(() => {});
          return next;
        }
      }
      // 'file-cache' is an internal marker meaning "bytes live in the .img
      // cache" — never hand it to the renderer as an image URL (it renders a
      // broken image); fall back to the placeholder instead.
      if (cached.description) return { ...cached, icon_url: null };
      return cached.icon_url && String(cached.icon_url).startsWith('data:') ? cached : null;
    }
  } catch (_) {}

  let metadata = { name: '', description: '', icon_url: null };
  // Cold-cache fast path: the store detail page (og:title / og:description)
  // answers the metadata question in one small HTML fetch. The CRX route below
  // downloads the entire package just to read manifest.json — fine as an
  // install prerequisite, but as a metadata query it made every uncached
  // entry pay a full package download (up to the 180s budget when proxies
  // are unreachable). The page runs first; the package is only fetched for
  // whatever the page could not express.
  const pageHtml = await fetchChromeStorePageHtml(safeId, 25000, { signal });
  if (pageHtml) {
    const pageMeta = chromeStoreTextMeta(pageHtml);
    if (pageMeta.title) metadata.name = pageMeta.title;
    if (pageMeta.description) metadata.description = pageMeta.description;
    const pageIcon = chromeStoreImageUrl(pageHtml);
    if (pageIcon) metadata.icon_url = await fetchChromeStoreIcon(safeId, { signal });
  }
  // Page answered both fields: skip the package download entirely.
  const skipPackage = Boolean(metadata.name && metadata.description);
  try {
    if (!skipPackage) {
      const query = new URLSearchParams({ response: 'redirect', prodversion: '150.0.0.0', acceptformat: 'crx2,crx3', x: `id=${safeId}&installsource=ondemand&uc` });
      const buffer = await fetchStorePackage(`https://clients2.google.com/service/update2/crx?${query}`, null, { signal });
      const { parseCrx, readManifest, readFile } = require('./automation/crx-reader');
      const parsed = parseCrx(buffer);
      // The signing key decides the extension id. A package whose signed id does
      // not match the entry we asked for must not supply this entry's metadata.
      if (parsed.extensionId && parsed.extensionId !== safeId) {
        throw new Error(`CRX 签名 ID ${parsed.extensionId} 与商店 ID ${safeId} 不一致`);
      }
      // Read straight out of the package: no temp archive on disk, and no
      // dependency on an external unpacker being installed.
      const manifest = readManifest(parsed.zipBuffer);
      if (!metadata.name) metadata.name = typeof manifest.name === 'string' ? manifest.name : '';
      if (!metadata.description) metadata.description = typeof manifest.description === 'string' ? manifest.description : '';
      const iconPath = extensionIconSource(manifest)?.replace(/^[/\\]+/, '');
      if (iconPath && !iconPath.split('/').includes('..')) {
        let image = null;
        try { image = readFile(parsed.zipBuffer, iconPath); } catch (_) { image = null; }
        if (image && image.length && image.length <= 2 * 1024 * 1024) {
          await fsp.mkdir(cacheDir, { recursive: true });
          await fsp.writeFile(cacheFile, image);
          metadata.icon_url = bufferToDataUrl(image);
        }
      }
    }
  } catch (_) {
    // CRX download often blocked; fall through to store page scrape
  }

  if (!metadata.icon_url) {
    const icon = await fetchChromeStoreIcon(safeId, { signal });
    if (icon) metadata.icon_url = icon;
  }
  signal?.throwIfAborted();
  if (metadata.icon_url || metadata.description) {
    await fsp.mkdir(cacheDir, { recursive: true }).catch(() => {});
    // Don't store huge data URLs in JSON — image is in .img cache
    await fsp.writeFile(metadataFile, JSON.stringify({
      name: metadata.name,
      description: metadata.description,
      icon_url: metadata.icon_url ? 'file-cache' : null,
    }), 'utf8').catch(() => {});
  }
  return (metadata.icon_url || metadata.description) ? metadata : null;
}

async function fetchChromeStoreIcon(storeId, { signal } = {}) {
  signal?.throwIfAborted();
  const safeId = validChromeStoreId(storeId);
  if (!safeId) return null;
  const cacheDir = path.join(app.getPath('userData'), 'app-center-icons');
  const cacheFile = path.join(cacheDir, `${safeId}.img`);
  const cached = await cachedIconDataUrl(cacheFile);
  if (cached) return cached;
  if (!signal && chromeStoreIconRequests.has(safeId)) return chromeStoreIconRequests.get(safeId);
  const request = (async () => {
    const storeSession = session.fromPartition('persist:openbrowser-extension-store');
    // Shared page fetch: the metadata path already downloaded the detail page
    // in most cases, so the icon only pays for the image download itself.
    const pageHtml = await fetchChromeStorePageHtml(safeId, 25000, { signal });
    if (!pageHtml) return null;
    const imageUrl = chromeStoreImageUrl(pageHtml);
    if (!imageUrl) return null;
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'https:' || !isChromeStoreIconHost(parsed.hostname)) return null;
    const imageController = new AbortController();
    const imageTimeout = setTimeout(() => imageController.abort(), 20000);
    let data;
    let contentType;
    try {
      const imageResponse = await storeSession.fetch(parsed.toString(), {
        redirect: 'follow',
        signal: signal ? AbortSignal.any([imageController.signal, signal]) : imageController.signal,
        headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
      });
      const finalUrl = new URL(imageResponse.url || parsed.toString());
      contentType = String(imageResponse.headers.get('content-type') || '').toLowerCase();
      if (!imageResponse.ok || !isChromeStoreIconHost(finalUrl.hostname)) return null;
      // Some CDNs omit content-type; accept by magic bytes later.
      if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) return null;
      data = await readResponseBuffer(imageResponse, 2 * 1024 * 1024);
      if (!data.length) return null;
    } finally {
      clearTimeout(imageTimeout);
      imageController.abort();
    }
    await fsp.mkdir(cacheDir, { recursive: true });
    await fsp.writeFile(cacheFile, data);
    return bufferToDataUrl(data, contentType);
  })().catch((_error) => { signal?.throwIfAborted(); return null; }).finally(() => { if (!signal) chromeStoreIconRequests.delete(safeId); });
  if (!signal) chromeStoreIconRequests.set(safeId, request);
  return request;
}

module.exports = {
  fetchStorePackage,
  fetchChromeStoreMetadata,
  fetchChromeStoreIcon,
  validChromeStoreId,
};
