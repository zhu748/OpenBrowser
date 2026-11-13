'use strict';

const SPACE = /[\t\n\f\r ]/;
const RAW = new Set(['script', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript']);
const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', colon: ':', comma: ',', Tab: '\t', NewLine: '\n' };
function decodeAttribute(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|colon|comma|Tab|NewLine);/gi, (match, name) => {
    if (name[0] !== '#') return entities[name] ?? entities[name.toLowerCase()] ?? match;
    const code = name[1].toLowerCase() === 'x' ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1));
    return String.fromCodePoint(code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? 0xfffd : code);
  });
}
const quoteAttribute = (value) => '"' + value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"';
const boundary = (ch) => ch !== undefined && (SPACE.test(ch) || ch === '/' || ch === '>');

function readTag(html, start) {
  let i = start + 1;
  const closing = html[i] === '/';
  if (closing) i += 1;
  const nameStart = i;
  if (!/[a-z]/i.test(html[i] || '')) return null;
  while (i < html.length && !boundary(html[i])) i += 1;
  const name = html.slice(nameStart, i).toLowerCase();
  const attrs = new Map();
  while (i < html.length) {
    while (SPACE.test(html[i] || '') || html[i] === '/') i += 1;
    if (html[i] === '>') return { name, closing, attrs, end: i + 1 };
    if (i >= html.length) break;
    const begin = i;
    while (i < html.length && !/[\t\n\f\r /=<>]/.test(html[i])) i += 1;
    if (begin === i) { i += 1; continue; }
    const attrName = html.slice(begin, i).toLowerCase();
    while (SPACE.test(html[i] || '')) i += 1;
    let startValue = i, endValue = i, value = '';
    if (html[i] === '=') {
      i += 1;
      while (SPACE.test(html[i] || '')) i += 1;
      startValue = i;
      if (html[i] === '"' || html[i] === "'") {
        const quote = html[i++], from = i;
        while (i < html.length && html[i] !== quote) i += 1;
        if (i === html.length) return null;
        value = html.slice(from, i++);
      } else {
        const from = i;
        while (i < html.length && !SPACE.test(html[i]) && html[i] !== '>') i += 1;
        value = html.slice(from, i);
      }
      endValue = i;
    }
    // HTML keeps the first occurrence of a duplicated attribute.
    if (!attrs.has(attrName)) attrs.set(attrName, { value: decodeAttribute(value), start: startValue, end: endValue });
  }
  return null;
}

function rawEnd(html, lower, name, from) {
  if (name !== 'script') {
    let pos = from;
    while ((pos = lower.indexOf('</' + name, pos)) !== -1) {
      if (boundary(html[pos + name.length + 2])) return pos;
      pos += name.length + 2;
    }
    return -1;
  }
  // HTML's legacy script escaping can contain a literal </script> while
  // double-escaped. Keep that text opaque too, rather than parsing JS strings.
  let escaped = false, double = false;
  for (let i = from; i < html.length; i++) {
    if (!escaped && html.startsWith('<!--', i)) { escaped = true; i += 3; }
    else if (escaped && html.startsWith('-->', i)) { escaped = double = false; i += 2; }
    else if (escaped && !double && lower.startsWith('<script', i) && boundary(html[i + 7])) { double = true; i += 6; }
    else if (lower.startsWith('</script', i) && boundary(html[i + 8])) {
      if (double) { double = false; i += 7; }
      else return i;
    }
  }
  return -1;
}

/** Visit real HTML style/link/meta elements while preserving raw text and
 * comments byte-for-byte. Edits apply to original ranges, never serialized DOM. */
function rewriteHtmlStyles(html, rewriteCss, rewritePolicy) {
  const lower = html.toLowerCase();
  const edits = [], replacements = [], policies = [];
  const cssType = (tag) => !tag.attrs.has('type') || /^\s*(?:text\/css\s*(?:;.*)?)?$/i.test(tag.attrs.get('type').value);
  for (let i = 0; i < html.length;) {
    const start = html.indexOf('<', i);
    if (start < 0) break;
    if (html.startsWith('<!--', start)) {
      if (html.startsWith('<!-->', start)) { i = start + 5; continue; }
      if (html.startsWith('<!--->', start)) { i = start + 6; continue; }
      const close = /--!?>/g; close.lastIndex = start + 4;
      const match = close.exec(html); if (!match) break;
      i = match.index + match[0].length; continue;
    }
    if (html[start + 1] === '!' || html[start + 1] === '?') {
      const end = html.indexOf('>', start + 2); if (end < 0) break;
      i = end + 1; continue;
    }
    const tag = readTag(html, start);
    if (!tag) { i = start + 1; continue; }
    i = tag.end;
    if (tag.closing) continue;
    if (tag.name === 'plaintext') break;
    if (RAW.has(tag.name) || tag.name === 'style') {
      const end = rawEnd(html, lower, tag.name, tag.end);
      // A style element ending at EOF is still parsed by the browser.
      const contentEnd = end < 0 ? html.length : end;
      if (tag.name === 'style' && cssType(tag)) {
        const oldContent = html.slice(tag.end, contentEnd), newContent = rewriteCss(oldContent);
        if (newContent !== oldContent) {
          edits.push({ start: tag.end, end: contentEnd, value: newContent });
          replacements.push({ oldContent, newContent });
        }
      }
      if (end < 0) break;
      i = readTag(html, end)?.end || end + 2;
    } else if (tag.name === 'link' && cssType(tag)
      && /(?:^|\s)stylesheet(?:\s|$)/i.test(tag.attrs.get('rel')?.value || '')) {
      const href = tag.attrs.get('href');
      if (!href || !/^data:text\/css(?:[;,])/i.test(href.value)) continue;
      const comma = href.value.indexOf(','), meta = href.value.slice(0, comma), raw = href.value.slice(comma + 1);
      try {
        const base64 = /;base64$/i.test(meta);
        const css = base64 ? Buffer.from(raw, 'base64').toString('utf8') : decodeURIComponent(raw);
        const rewritten = rewriteCss(css);
        if (rewritten !== css) edits.push({ start: href.start, end: href.end,
          value: quoteAttribute(meta + ',' + (base64 ? Buffer.from(rewritten).toString('base64') : encodeURIComponent(rewritten))) });
      } catch (_) { /* preserve malformed data URLs */ }
    } else if (tag.name === 'meta'
      && /^content-security-policy$/i.test(tag.attrs.get('http-equiv')?.value || '')) {
      const content = tag.attrs.get('content'); if (content) policies.push(content);
    }
  }
  for (const policy of policies) {
    const rewritten = rewritePolicy(policy.value, replacements);
    if (rewritten !== policy.value) edits.push({ start: policy.start, end: policy.end, value: quoteAttribute(rewritten) });
  }
  edits.sort((a, b) => a.start - b.start);
  let out = '', cursor = 0;
  for (const edit of edits) { out += html.slice(cursor, edit.start) + edit.value; cursor = edit.end; }
  return { html: edits.length ? out + html.slice(cursor) : html, replacements };
}

module.exports = { rewriteHtmlStyles };
