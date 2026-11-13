'use strict';

// Linear CSS token scanning for the response layer. Quoted text, comments and
// URLs are opaque; CSS escapes and case folding apply to names, not source bytes.
const isSpace = (ch) => ch !== undefined && /[\t\n\f\r ]/.test(ch);
const isName = (ch) => ch !== undefined && /[\w\-\u0080-\uffff]/.test(ch);

function escapeAt(text, start) {
  let end = start + 1;
  if (end >= text.length) return { end, value: '' };
  let hex = '';
  while (hex.length < 6 && /[\da-f]/i.test(text[end] || 'Z')) hex += text[end++];
  if (hex) {
    if (text[end] === '\r' && text[end + 1] === '\n') end += 2;
    else if (isSpace(text[end])) end += 1;
    const code = Number.parseInt(hex, 16);
    return { end, value: String.fromCodePoint(code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? 0xfffd : code) };
  }
  const ch = text[end++];
  if (ch === '\r' && text[end] === '\n') end += 1;
  return { end, value: /[\n\r\f]/.test(ch) ? '' : ch };
}

function nameAt(text, start) {
  let end = start, value = '';
  while (end < text.length) {
    if (text[end] === '\\') {
      const escaped = escapeAt(text, end);
      value += escaped.value; end = escaped.end;
    } else if (isName(text[end])) value += text[end++];
    else break;
  }
  return { end, value: value.toLowerCase() };
}

function stringAt(text, start) {
  const quote = text[start];
  let end = start + 1, value = '';
  while (end < text.length && text[end] !== quote) {
    if (text[end] === '\\') {
      const escaped = escapeAt(text, end);
      value += escaped.value; end = escaped.end;
    } else if (/[\n\r\f]/.test(text[end])) return { end, closed: false, value };
    else value += text[end++];
  }
  return { end: end < text.length ? end + 1 : end, closed: end < text.length, value };
}

function commentEnd(text, start) {
  const end = text.indexOf('*/', start + 2);
  return end < 0 ? text.length : end + 2;
}

function skipSpace(text, start) {
  let end = start;
  while (end < text.length) {
    if (isSpace(text[end])) end += 1;
    else if (text[end] === '/' && text[end + 1] === '*') end = commentEnd(text, end);
    else break;
  }
  return end;
}

function matchingEnd(text, start, open, close) {
  let depth = 1;
  for (let i = start + 1; i < text.length;) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const string = stringAt(text, i);
      if (!string.closed) return -1;
      i = string.end;
    } else if (ch === '/' && text[i + 1] === '*') i = commentEnd(text, i);
    else if (ch === '\\') i = escapeAt(text, i).end;
    else if (open === '{' && ch === '(') {
      const end = matchingEnd(text, i, '(', ')');
      if (end < 0) return -1;
      i = end;
    } else {
      if (ch === open) depth += 1;
      if (ch === close && --depth === 0) return i + 1;
      i += 1;
    }
  }
  return -1;
}

function rewriteBody(body, allowed, blocked) {
  let out = '', cursor = 0;
  for (let i = 0; i < body.length;) {
    const ch = body[i];
    if (ch === '"' || ch === "'") { i = stringAt(body, i).end; continue; }
    if (ch === '/' && body[i + 1] === '*') { i = commentEnd(body, i); continue; }
    if (!isName(ch) && ch !== '\\') { i += 1; continue; }
    const name = nameAt(body, i);
    const start = i;
    i = name.end;
    const paren = skipSpace(body, i);
    if (body[paren] !== '(') continue;
    const end = matchingEnd(body, paren, '(', ')');
    if (end < 0) break;
    i = end;
    if (name.value !== 'local') continue;
    let pos = skipSpace(body, paren + 1), family = '';
    if (body[pos] === '"' || body[pos] === "'") {
      const string = stringAt(body, pos);
      if (!string.closed || skipSpace(body, string.end) !== end - 1) continue;
      family = string.value;
    } else {
      let valid = true;
      while (pos < end - 1) {
        if (body[pos] === '/' && body[pos + 1] === '*') { family += ' '; pos = commentEnd(body, pos); }
        else if (body[pos] === '\\') { const escaped = escapeAt(body, pos); family += escaped.value; pos = escaped.end; }
        else if (isName(body[pos]) || isSpace(body[pos])) family += body[pos++];
        else { valid = false; break; }
      }
      if (!valid) continue;
    }
    family = family.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!family || allowed.has(family)) continue;
    out += body.slice(cursor, start) + 'local(' + JSON.stringify(blocked) + ')';
    cursor = end;
  }
  return cursor ? out + body.slice(cursor) : body;
}

function sanitizeFontCss(css, allowed, blocked) {
  if (typeof css !== 'string') return css;
  // Normal stylesheets usually contain no font declarations. Escaped names
  // still take the scanner, so this fast path cannot bypass CSS escape rules.
  if (!/@font-face/i.test(css) && !css.includes('\\')) return css;
  let out = '', cursor = 0;
  for (let i = 0; i < css.length;) {
    const ch = css[i];
    if (ch === '"' || ch === "'") { i = stringAt(css, i).end; continue; }
    if (ch === '/' && css[i + 1] === '*') { i = commentEnd(css, i); continue; }
    if (ch === '(') { const end = matchingEnd(css, i, '(', ')'); if (end < 0) break; i = end; continue; }
    if (ch !== '@') { i += 1; continue; }
    const name = nameAt(css, i + 1);
    i = name.end;
    if (name.value !== 'font-face') continue;
    const brace = skipSpace(css, i);
    if (css[brace] !== '{') continue;
    const end = matchingEnd(css, brace, '{', '}');
    if (end < 0) break;
    const body = css.slice(brace + 1, end - 1);
    const rewritten = rewriteBody(body, allowed, blocked);
    if (rewritten !== body) {
      out += css.slice(cursor, brace + 1) + rewritten + '}';
      cursor = end;
    }
    i = end;
  }
  return cursor ? out + css.slice(cursor) : css;
}

module.exports = { sanitizeFontCss };
