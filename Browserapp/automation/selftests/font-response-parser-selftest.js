'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { sanitizeCss, sanitizeHtml, updateCspHeaders, CssFontResponseRewriter } = require('../css-font-response-rewrite');
const allowed = new Set(['arial', 'segoe ui']);
const sanitize = (css) => sanitizeCss(css, allowed, 'Blocked');

for (const css of [
  '@font-face { src: local("Other"); }',
  '@FoNt-FaCe { src: LoCaL("Other"); }',
  '@f\\6f nt-face { src: l\\6f cal("Other"); }',
  '@font-face/**/{font-family:"A}B";src:local(Other)}',
  '@media screen { @font-face {src:local("Other"),url("font.woff2")} }',
]) {
  const result = sanitize(css);
  assert.ok(result.includes('local("Blocked")'), result);
  assert.equal(sanitize(result), result, 'rewriting must be idempotent');
}
for (const css of [
  '@font-face{src:local("Arial"),local(Segoe UI),url("font.woff2")}',
  '@font-face{src:local("\\41 rial")}',
  '/* @font-face {src:local(Other)} */ a{color:red}',
  'a{content:"@font-face {src:local(Other)}"}',
  '@font-face{src:url("https://example.test/local(Other)")}',
  '@font-face{src:local("Other")',
]) assert.equal(sanitize(css), css, css);
const pathological = '@font-face' + '/* comment */'.repeat(50000) + ';';
const start = performance.now();
assert.equal(sanitize(pathological), pathological);
assert.ok(performance.now() - start < 2000, 'comment scanning must stay bounded');

const fontStyle = '@font-face{src:local("Other")}';
const rewriteHtml = (html) => sanitizeHtml(html, allowed, 'Blocked');
for (const html of [
  '<script>const template="<style>' + fontStyle + '</style>";</script>',
  '<!-- <style>' + fontStyle + '</style> -->',
  '<textarea><style>' + fontStyle + '</style></textarea>',
  '<script><!--<script></script><style>' + fontStyle + '</style>--></script>',
  '<style type="application/json">' + fontStyle + '</style>',
  '<div data-template=\'<style>' + fontStyle + '</style>\'></div>',
]) assert.equal(rewriteHtml(html), html, 'raw text and attributes must not be parsed as HTML elements');
for (const html of [
  '<style data-marker=">">' + fontStyle + '</style>',
  '<STYLE>' + fontStyle + '</STYLE>',
  '<link href="data:text/css,' + encodeURIComponent(fontStyle) + '" rel="stylesheet">',
  '<link rel=stylesheet href="data:text/c&#115;s;base64,' + Buffer.from(fontStyle).toString('base64') + '">',
]) assert.notEqual(rewriteHtml(html), html, html);
for (const algorithm of ['sha256', 'sha384', 'sha512']) {
  const oldHash = `'${algorithm}-${crypto.createHash(algorithm).update(fontStyle).digest('base64')}'`;
  const next = sanitize(fontStyle);
  const newHash = `'${algorithm}-${crypto.createHash(algorithm).update(next).digest('base64')}'`;
  const pairs = [{ oldContent: fontStyle, newContent: next }];
  const policy = `script-src ${oldHash}; style-src ${oldHash}; report-uri /${oldHash}`;
  const headers = [{ name: 'Content-Security-Policy', value: policy }];
  const rewritten = updateCspHeaders(headers, pairs)[0].value;
  assert.ok(rewritten.includes('script-src ' + oldHash + ';'), 'script authorization must stay unchanged');
  assert.ok(rewritten.includes('style-src ' + oldHash + ' ' + newHash));
  assert.ok(rewritten.endsWith('report-uri /' + oldHash));
  const fallback = updateCspHeaders([{ name: 'Content-Security-Policy', value: 'default-src \'self\' ' + oldHash }], pairs)[0].value;
  assert.ok(fallback.startsWith('default-src \'self\' ' + oldHash + ';'), 'default script policy must stay byte-for-byte unchanged');
  assert.ok(fallback.includes('style-src \'self\' ' + oldHash + ' ' + newHash));
  assert.equal(updateCspHeaders([{ name: 'Content-Security-Policy', value: rewritten }], pairs)[0].value, rewritten);
  const html = '<meta http-equiv="Content-Security-Policy" content="style-src ' + oldHash + '"><style>' + fontStyle + '</style>';
  assert.ok(rewriteHtml(html).includes(newHash), 'meta CSP tracks rewritten styles too');
}

async function main() {
  const disabled = new CssFontResponseRewriter({ enabled: false });
  await disabled.enable({ command() { throw new Error('disabled policy must not enable Fetch'); } });
  const cssCache = new CssFontResponseRewriter({ personaFonts: ['Arial'], blockedFont: 'PolicyA' });
  const firstRewrite = cssCache.rewriteStylesheet(fontStyle);
  assert.equal(cssCache.rewriteStylesheet(fontStyle), firstRewrite);
  assert.ok(firstRewrite.includes('PolicyA'));
  cssCache.setPersonaFonts(['Other']);
  assert.equal(cssCache.rewriteStylesheet(fontStyle), fontStyle, 'changed white lists invalidate the transform policy');
  const otherPolicy = new CssFontResponseRewriter({ personaFonts: ['Arial'], blockedFont: 'PolicyB' });
  assert.ok(otherPolicy.rewriteStylesheet(fontStyle).includes('PolicyB'), 'profiles never reuse another blocked-font identity');
  assert.notEqual(otherPolicy.rewriteStylesheet(fontStyle + 'a{color:red}'), otherPolicy.rewriteStylesheet(fontStyle));
  const event = (sessionId = 'a', extra = {}) => ({ method: 'Fetch.requestPaused', sessionId,
    params: { requestId: 'same-id', resourceType: 'Stylesheet', responseStatusCode: 200,
      request: { url: 'http://localhost/style' }, responseHeaders: [{ name: 'Content-Type', value: 'text/css' }], ...extra } });
  for (const extra of [
    { responseStatusCode: 302 }, { responseStatusCode: 204 }, { request: { method: 'HEAD' } },
    { resourceType: 'Document', responseHeaders: [{ name: 'Content-Type', value: 'application/pdf' }] },
  ]) {
    const calls = [], writer = new CssFontResponseRewriter();
    await writer.handleEvent(event('skip', extra), { command: async (method) => { calls.push(method); return {}; } });
    assert.deepEqual(calls, ['Fetch.continueRequest'], 'redirects, bodyless and unsupported resources stay native');
  }
  const deferred = new Map(), calls = [];
  const writer = new CssFontResponseRewriter();
  const connection = { command: async (method, params, options) => {
    calls.push([options.sessionId, method]);
    if (method === 'Fetch.getResponseBody') return new Promise((resolve) => deferred.set(options.sessionId, resolve));
    return {};
  } };
  const a = writer.handleEvent(event('a'), connection);
  assert.equal(writer.handleEvent(event('a'), connection), a, 'duplicate events share the same operation');
  const b = writer.handleEvent(event('b'), connection);
  assert.equal(writer.inFlightRequests.size, 2, 'equal request ids from different sessions are isolated');
  writer.cleanupSession('a');
  assert.equal(writer.inFlightRequests.size, 1);
  deferred.get('a')({ body: fontStyle });
  deferred.get('b')({ body: fontStyle });
  await Promise.all([a, b]);
  assert.deepEqual(calls.filter(([session]) => session === 'a').map(([, method]) => method), ['Fetch.getResponseBody']);
  assert.ok(calls.some(([session, method]) => session === 'b' && method === 'Fetch.fulfillRequest'));
  assert.equal(writer.operations.size, 0);
  let release;
  const destroyed = writer.handleEvent(event('destroy'), { command: async (method) => {
    assert.equal(method, 'Fetch.getResponseBody');
    return new Promise((resolve) => { release = resolve; });
  } });
  writer.destroy(); release({ body: fontStyle }); await destroyed;
  assert.equal(writer.inFlightRequests.size, 0);
  assert.equal(writer.operations.size, 0);
  let fulfilled;
  const latin = new CssFontResponseRewriter();
  await latin.handleEvent(event('latin', { responseHeaders: [{ name: 'Content-Type', value: 'text/css; charset=windows-1252' }] }), {
    command: async (method, params) => {
      if (method === 'Fetch.getResponseBody') return { base64Encoded: true, body: Buffer.from('/* café */' + fontStyle, 'latin1').toString('base64') };
      if (method === 'Fetch.fulfillRequest') fulfilled = params;
      return {};
    },
  });
  assert.ok(Buffer.from(fulfilled.body, 'base64').toString('utf8').includes('café'));
  assert.ok(fulfilled.responseHeaders.some((h) => h.value === 'text/css; charset=utf-8'));
  for (const base64Encoded of [false, true]) {
    const calls = [];
    const original = '@font-face{src:local(Other)}' + ' '.repeat(100);
    const rewriter = new CssFontResponseRewriter({ personaFonts: ['Arial'], maxBodySize: 40 });
    const connection = { command: async (method) => {
      calls.push(method);
      if (method === 'Fetch.getResponseBody') return { body: base64Encoded ? Buffer.from(original).toString('base64') : original, base64Encoded };
      return {};
    } };
    rewriter.handleEvent({ method: 'Fetch.requestPaused', params: { requestId: 'test', resourceType: 'Stylesheet',
      responseStatusCode: 200, responseHeaders: [{ name: 'content-type', value: 'text/css' }], request: { url: 'http://localhost/style' } } }, connection);
    for (let i = 0; i < 20 && !calls.includes('Fetch.continueRequest'); i++) await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(calls, ['Fetch.getResponseBody', 'Fetch.continueRequest'], 'chunked/decompressed oversized bodies must not be scanned or fulfilled');
    assert.equal(rewriter.inFlightRequests.size, 0);
  }
  console.log('FONT_RESPONSE_PARSER_SELFTEST OK (case, escapes, strings, comments, nesting, idempotency, decoded limits, disabled policy)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
