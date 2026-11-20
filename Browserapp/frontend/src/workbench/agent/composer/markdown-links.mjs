const faviconAttribute = 'data-agent-favicon-url';
const globe = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20fill='currentColor'%20viewBox='0%200%2024%2024'%3e%3cpath%20fill-rule='evenodd'%20d='M1%2012C1%205.925%205.925%201%2012%201s11%204.925%2011%2011-4.925%2011-11%2011S1%2018.075%201%2012Zm2.055-1H7.05a16.3%2016.3%200%200%201%202.676-7.71A9.008%209.008%200%200%200%203.055%2011ZM12%203.55A14.3%2014.3%200%200%200%209.058%2011h5.884A14.3%2014.3%200%200%200%2012%203.55ZM14.942%2013A14.3%2014.3%200%200%201%2012%2020.45%2014.3%2014.3%200%200%201%209.058%2013h5.884ZM7.05%2013H3.055a9.008%209.008%200%200%200%206.67%207.71A16.3%2016.3%200%200%201%207.05%2013Zm7.224%207.71A16.3%2016.3%200%200%200%2016.95%2013h3.995a9.008%209.008%200%200%201-6.67%207.71ZM20.945%2011H16.95a16.3%2016.3%200%200%200-2.676-7.71A9.008%209.008%200%200%201%2020.945%2011Z'%20clip-rule='evenodd'/%3e%3c/svg%3e";

export const fallbackIcon = 'base/rx_ic_internet';
export function faviconForLink(value) {
  if (!value?.trim()) return;
  try {
    const url = new URL(value.trim());
    if (['http:', 'https:'].includes(url.protocol)) return new URL('/favicon.ico', url.origin).toString();
  } catch { /* Links without an HTTP(S) origin have no favicon. */ }
}

export function watchContainer(container) {
  if (!container || typeof MutationObserver === 'undefined' || !globalThis.Image) return () => {};
  const style = container.ownerDocument.createElement('style');
  const seen = new Set();
  const loading = new Map();
  style.textContent = `a[${faviconAttribute}] { --agent-favicon-fallback-image: url(${JSON.stringify(globe)}); }`;
  container.ownerDocument.head.append(style);
  function observeIcons() {
    container.querySelectorAll(`a[${faviconAttribute}]`).forEach(link => {
      const url = link.dataset.agentFaviconUrl;
      if (!url || seen.has(url)) return;
      seen.add(url);
      const image = new Image();
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      loading.set(url, image);
      image.addEventListener('load', () => {
        if (!loading.delete(url)) return;
        style.textContent += `\na[${faviconAttribute}=${JSON.stringify(url)}] {
  --agent-favicon-image: url(${JSON.stringify(url)});
  --agent-favicon-fallback-opacity: 0;
  --agent-favicon-fallback-scale: 0.85;
  --agent-favicon-opacity: 1;
  --agent-favicon-scale: 1;
}`;
      }, { once: true });
      image.addEventListener('error', () => loading.delete(url), { once: true });
      image.src = url;
    });
  }
  observeIcons();
  const observer = new MutationObserver(observeIcons);
  observer.observe(container, { attributes: true, attributeFilter: [faviconAttribute], childList: true, subtree: true });
  return () => { observer.disconnect(); loading.clear(); style.remove(); };
}

const removeDriveSlash = value => value.replace(/^\/(?=[a-z]:[\\/])/i, '');
const fileName = path => path.split(/[\\/]/).filter(Boolean).at(-1) || 'download';
function decodedUri(value) {
  try { return decodeURI(value); }
  catch { return value; }
}

export function normalizeLinkPaths(markdown) {
  return markdown.replace(/(\[[^\]\n]*\]\()((?:\/[a-z]:|[a-z]:|file:\/\/\/?[a-z]:)[^)\n]*)(\))/gi,
    (_whole, before, file, after) => `${before}${removeDriveSlash(file).replace(/\\+/g, '/')}${after}`);
}

function downloadPath(href) {
  const path = removeDriveSlash(decodedUri(href?.trim() || ''));
  if (path.startsWith('file://')) {
    const inner = removeDriveSlash(path.slice(7));
    return /^[a-z]:[\\/]/i.test(inner) ? inner : path;
  }
  if (/^[a-z]:[\\/]/i.test(path)) return path;
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/api/') ? decodedUri(path) : '';
}

function fileUrl(path) {
  if (path.startsWith('file://')) return encodeURI(path);
  const normalized = path.replaceAll('\\', '/');
  const encoded = normalized.split('/').map(part => encodeURIComponent(part).replaceAll('%3A', ':')).join('/');
  return /^[a-z]:\//i.test(normalized) ? `file:///${encoded}` : `file://${encoded}`;
}

export function prepareLinks(html) {
  if (typeof document === 'undefined') return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const link of template.content.querySelectorAll('a[href]')) {
    const path = downloadPath(link.getAttribute('href'));
    if (!path) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      continue;
    }
    link.setAttribute('href', fileUrl(path));
    link.download = fileName(path);
    link.dataset.localFilePath = path;
    link.removeAttribute('target');
    link.classList.add('agent-md-download');
    if (!link.textContent?.trim()) link.textContent = link.download;
  }
  return template.innerHTML;
}
