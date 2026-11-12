'use strict';

const zlib = require('node:zlib');
const { Transform, Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { injectWorkerSource, isJavaScriptMime, MAX_WORKER_BYTES } = require('./worker-source');

function forwardHeaders(headers) {
  const out = { ...headers };
  const named = String(headers.connection || '').split(',').map((s) => s.trim().toLowerCase());
  for (const key of [...named, 'connection', 'proxy-connection', 'keep-alive',
    'proxy-authorization', 'proxy-authenticate', 'transfer-encoding', 'te', 'trailer', 'upgrade']) delete out[key];
  return out;
}

function byteLimit(limit) {
  let size = 0;
  return new Transform({ transform(chunk, encoding, done) {
    size += chunk.length;
    done(size > limit ? new Error('Worker response exceeds byte limit') : null, chunk);
  } });
}

async function forwardWorkerResponse(upstream, response, { method, isWorker, workerSource, maxWorkerBytes = MAX_WORKER_BYTES }) {
  const status = upstream.statusCode;
  const headers = forwardHeaders(upstream.headers);
  const workerScript = method !== 'HEAD' && isWorker && workerSource && isJavaScriptMime(headers['content-type']);
  if (workerScript && (status === 206 || headers['content-range'])) throw new Error('Partial worker scripts cannot be initialized safely');
  const rewrite = workerScript && status >= 200 && status < 300 && status !== 204 && status !== 205;
  if (!rewrite) {
    // Node owns framing (HEAD, 204/304, chunk trailers and close-delimited
    // messages). Ordinary resources stream with backpressure and retain their
    // content encoding; only worker scripts need buffering before injection.
    response.writeHead(status, headers);
    await pipeline(upstream, response);
    return;
  }

  const decoders = String(headers['content-encoding'] || '').split(',').map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== 'identity').reverse().map((encoding) => {
      if (encoding === 'gzip' || encoding === 'x-gzip') return zlib.createGunzip();
      if (encoding === 'deflate') return zlib.createInflate();
      if (encoding === 'br') return zlib.createBrotliDecompress();
      throw new Error('Unsupported worker content encoding: ' + encoding);
    });
  const chunks = [];
  await pipeline(upstream, byteLimit(maxWorkerBytes), ...decoders.flatMap((decoder) => [decoder, byteLimit(maxWorkerBytes)]),
    new Writable({ write(chunk, encoding, done) { chunks.push(chunk); done(); } }));
  const body = injectWorkerSource(Buffer.concat(chunks), workerSource);
  for (const key of ['content-encoding', 'content-length', 'etag', 'content-md5', 'digest', 'content-digest', 'repr-digest']) delete headers[key];
  // Never reuse a prefixed script under a different profile or runtime build.
  headers['cache-control'] = 'no-store';
  headers['content-length'] = String(body.length);
  response.writeHead(status, headers);
  response.end(body);
}

module.exports = { forwardWorkerResponse, forwardHeaders, MAX_WORKER_BYTES };
