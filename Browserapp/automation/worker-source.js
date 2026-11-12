'use strict';

const syntax = require('./vendor/acorn-runtime');
const MAX_WORKER_BYTES = 16 * 1024 * 1024;
const JAVASCRIPT_MIMES = new Set([
  'application/ecmascript', 'application/javascript', 'application/x-ecmascript', 'application/x-javascript',
  'text/ecmascript', 'text/javascript', 'text/jscript', 'text/livescript', 'text/x-ecmascript', 'text/x-javascript',
  ...['0', '1', '2', '3', '4', '5'].map((minor) => 'text/javascript1.' + minor),
]);

// Inspect only the directive prologue, not the entire (possibly multi-megabyte)
// program. Preserve hashbangs, ASI and native syntax errors; never wrap the user's
// program in a function or turn a non-directive string expression into strict mode.
function injectionPosition(source) {
  let position = 0;
  if (source.startsWith('#!')) {
    const end = source.search(/[\r\n\u2028\u2029]/);
    position = end < 0 ? source.length : end + (source.slice(end, end + 2) === '\r\n' ? 2 : 1);
  }
  const options = { ecmaVersion: 'latest', allowHashBang: true, sourceType: 'module' };
  try {
    const tokens = syntax.tokenizer(source, options);
    let token = tokens.getToken();
    while (token.type.label === 'string') {
      const expression = syntax.parseExpressionAt(source, token.start, options);
      if (expression.type !== 'Literal' || typeof expression.value !== 'string') break;
      do { token = tokens.getToken(); } while (token.start < expression.end);
      if (token.type.label === ';') {
        position = token.end; token = tokens.getToken();
      } else if (token.type.label === 'eof' || /[\r\n\u2028\u2029]/.test(source.slice(expression.end, token.start))) {
        position = expression.end;
      } else break;
    }
  } catch (_) { /* The browser remains responsible for parsing invalid syntax. */ }
  return position;
}

function injectWorkerSource(original, injection) {
  const text = Buffer.isBuffer(original) ? original.toString('utf8') : String(original);
  const bom = text.startsWith('\ufeff') ? '\ufeff' : '';
  const source = bom ? text.slice(1) : text;
  const position = injectionPosition(source);
  return Buffer.from(bom + source.slice(0, position) + '\n;' + injection + '\n;' + source.slice(position), 'utf8');
}

function rewrittenScriptHeaders(headers, size) {
  const stale = new Set(['content-length', 'content-encoding', 'transfer-encoding', 'cache-control',
    'etag', 'content-md5', 'digest', 'content-digest', 'repr-digest']);
  return [...(headers || []).filter((header) => !stale.has(String(header.name).toLowerCase())),
    { name: 'Cache-Control', value: 'no-store' }, { name: 'Content-Length', value: String(size) }];
}

function isJavaScriptMime(value) {
  return JAVASCRIPT_MIMES.has(String(value || '').split(';', 1)[0].trim().toLowerCase());
}

module.exports = { injectWorkerSource, injectionPosition, rewrittenScriptHeaders, isJavaScriptMime, MAX_WORKER_BYTES };
