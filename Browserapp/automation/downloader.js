'use strict';

/**
 * Streaming file downloader with integrity verification.
 *
 * Writes to a temporary sibling file, verifies the digest, then renames into
 * place so readers never observe a half-written file. Existing destinations
 * that already match the expected digest are reused without a network round
 * trip. Supports HTTP range resumption when a partial temp file is present.
 *
 * Usage:
 *   const dl = new Downloader(url, { destPath, expectedMd5, expectedSha256 });
 *   dl.on('progress', ({ received, total }) => ...);
 *   const result = await dl.start();
 *
 * Two integrity guarantees are independent of any expected digest:
 *   - a response that announces Content-Length but delivers fewer bytes is
 *     rejected as truncated instead of being promoted silently;
 *   - the body only lands in its final name after verification passes.
 */

const EventEmitter = require('events');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const STATUS = {
  IDLE: 'idle',
  DOWNLOADING: 'downloading',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled',
};

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_REDIRECTS = 5;
const PROGRESS_EMIT_INTERVAL_MS = 100;

/**
 * A caller that asks for digest verification with a malformed digest must not
 * be silently downgraded to no verification: that is exactly the kind of
 * quiet failure an attacker would hope for. Empty means "no check wanted".
 */
function requireHexDigest(value, name, length) {
  if (value === undefined || value === null || value === '') return '';
  const text = String(value).trim().toLowerCase();
  if (!new RegExp(`^[0-9a-f]{${length}}$`).test(text)) {
    throw new TypeError(`${name} must be a ${length}-character hex digest`);
  }
  return text;
}

/** Extract a filename from a URL path, falling back to a timestamp. */
function fileNameFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    if (!last) return `${Date.now()}`;
    // Decode first, then basename: `files%2F..%2F..%2Fx.exe` decoded to a
    // path with separators and escaped the download directory.
    // A malformed escape falls back to the raw segment instead of throwing.
    let decoded = last;
    try { decoded = decodeURIComponent(last); } catch (_) {}
    const safe = path.basename(decoded).trim();
    return safe && safe !== '.' && safe !== '..' ? safe : `${Date.now()}`;
  } catch (_) {
    return `${Date.now()}`;
  }
}

/** Open a readable stream for url, following redirects. */
function openRequest(url, { headers = {}, maxRedirects = DEFAULT_MAX_REDIRECTS, timeoutMs, validateUrl } = {}) {
  return new Promise((resolve, reject) => {
    let redirects = 0;

    const attempt = (target) => {
      let parsed;
      try {
        parsed = new URL(target);
      } catch (err) {
        reject(new Error(`invalid url: ${target}`));
        return;
      }
      const transport = parsed.protocol === 'https:' ? https : http;
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        reject(new Error(`unsupported protocol: ${parsed.protocol}`));
        return;
      }
      // A redirect is a fresh decision about where to send the request, so the
      // same policy that vetted the original URL is applied to every hop. Without
      // this a response can move the transfer to any host it names.
      if (typeof validateUrl === 'function') {
        try {
          validateUrl(target);
        } catch (err) {
          reject(err);
          return;
        }
      }

      const req = transport.get(target, { headers }, (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          redirects += 1;
          res.resume();
          if (redirects > maxRedirects) {
            reject(new Error('too many redirects'));
            return;
          }
          attempt(new URL(res.headers.location, target).toString());
          return;
        }
        if (status >= 400) {
          res.resume();
          reject(Object.assign(new Error(`http ${status}`), { statusCode: status }));
          return;
        }
        resolve(res);
      });

      req.on('error', reject);
      if (timeoutMs) {
        req.setTimeout(timeoutMs, () => {
          req.destroy(new Error('request timeout'));
        });
      }
    };

    attempt(url);
  });
}

class Downloader extends EventEmitter {
  /**
   * @param {string} url
   * @param {object} [options]
   * @param {string} [options.destPath] Absolute destination; defaults to cwd + url basename.
   * @param {string} [options.dir] Destination directory when destPath is omitted.
   * @param {string} [options.fileName] Override the filename inferred from the url.
   * @param {string} [options.expectedMd5] Lowercase hex digest to verify.
   * @param {string} [options.expectedSha256] Lowercase hex SHA-256 digest to
   *   verify; preferred over expectedMd5 when both are known.
   * @param {boolean} [options.computeSha256] Compute (and report) the SHA-256
   *   of the transfer even when no digest is expected, so callers can pin it
   *   after a first successful download.
   * @param {number} [options.retries] Extra attempts after the first failure.
   * @param {number} [options.timeoutMs] Per-request timeout.
   * @param {object} [options.headers] Extra request headers.
   * @param {boolean} [options.resume] Allow resuming a leftover partial file.
   * @param {number} [options.maxBytes] Abort once the transfer would exceed this size.
   * @param {(url:string)=>void} [options.validateUrl] Vets the request target and
   *   every redirect target; throw to reject the hop.
   */
  constructor(url, options = {}) {
    super();
    if (!url || typeof url !== 'string') throw new TypeError('url is required');
    this.url = url;
    this.options = options;
    this.retries = Number.isInteger(options.retries) && options.retries > 0 ? options.retries : 0;
    this.timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
    this.expectedMd5 = requireHexDigest(options.expectedMd5, 'expectedMd5', 32);
    this.expectedSha256 = requireHexDigest(options.expectedSha256, 'expectedSha256', 64);
    this.computeSha256 = Boolean(options.computeSha256) || Boolean(this.expectedSha256);
    this.allowResume = options.resume !== false;

    this.fileName = options.fileName || fileNameFromUrl(url);
    this.dir = options.dir || process.cwd();
    this.destPath = options.destPath || path.join(this.dir, this.fileName);
    this.tmpPath = `${this.destPath}.partial`;

    this.status = STATUS.IDLE;
    this.progress = 0;
    this.received = 0;
    this.total = 0;
    this.attempt = 0;
    this._lastEmit = 0;
    this.canceled = false;
    // Rolling window of (time, received) samples for the progress speed readout.
    this._speedSamples = [];
    this._activeRes = null;
  }

  /**
   * Abort the in-flight transfer; the pending start() call rejects with a
   * 'download canceled' error and retries are skipped.
   */
  cancel() {
    this.canceled = true;
    const res = this._activeRes;
    this._activeRes = null;
    if (res) res.destroy(new Error('download canceled'));
    if (this.status !== STATUS.COMPLETED) this.setStatus(STATUS.CANCELED);
  }

  setStatus(status) {
    this.status = status;
    this.emit('status', { status, progress: this.progress });
  }

  setProgress(received, total) {
    this.received = received;
    this.total = total;
    this.progress = total > 0 ? Math.min(1, received / total) : 0;
    const now = Date.now();
    this._speedSamples.push({ t: now, r: received });
    while (this._speedSamples.length > 8 || (this._speedSamples.length > 2 && now - this._speedSamples[0].t > 4000)) {
      this._speedSamples.shift();
    }
    const first = this._speedSamples[0];
    const dt = (now - first.t) / 1000;
    const speed = dt > 0.2 ? (received - first.r) / dt : 0;
    if (now - this._lastEmit >= PROGRESS_EMIT_INTERVAL_MS || received === total) {
      this._lastEmit = now;
      this.emit('progress', { received, total, progress: this.progress, speed });
    }
  }

  /** Digest of a file, streamed to avoid loading it into memory. */
  static digestFile(filePath, algorithm = 'md5') {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  static async fileExists(filePath) {
    try {
      await fsp.access(filePath);
      return true;
    } catch (_) {
      return false;
    }
  }

  static digestOf(buffer, algorithm = 'md5') {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }

  /** Ensure the destination directory exists and is writable. */
  async ensureWritable() {
    await fsp.mkdir(this.dir, { recursive: true });
    const probe = path.join(this.dir, `.write-probe-${process.pid}-${Date.now()}`);
    await fsp.writeFile(probe, 'ok');
    await fsp.unlink(probe);
  }

  /**
   * Download once (no retry logic). Resolves with the temp file path.
   * @returns {Promise<{path:string, md5:string, sha256:string|null, bytes:number, resumed:boolean}>}
   */
  async downloadOnce() {
    let startOffset = 0;
    if (this.allowResume && await Downloader.fileExists(this.tmpPath)) {
      const stat = await fsp.stat(this.tmpPath);
      startOffset = stat.size;
    }

    const headers = Object.assign({}, this.options.headers);
    if (startOffset > 0) headers.Range = `bytes=${startOffset}-`;

    const res = await openRequest(this.url, {
      headers,
      maxRedirects: this.options.maxRedirects,
      timeoutMs: this.timeoutMs,
      validateUrl: this.options.validateUrl,
    });
    this._activeRes = res;

    const resumed = startOffset > 0 && res.statusCode === 206;
    if (!resumed) startOffset = 0;

    const contentLength = Number(res.headers['content-length']) || 0;
    const maxBytes = Number(this.options.maxBytes) > 0 ? Number(this.options.maxBytes) : 0;
    if (maxBytes && contentLength > maxBytes) {
      res.resume();
      throw new Error(`download exceeds the ${maxBytes} byte limit`);
    }
    this.total = resumed ? startOffset + contentLength : contentLength;
    this.received = startOffset;
    this.setProgress(startOffset, this.total || startOffset);

    const hash = crypto.createHash('md5');
    // SHA-256 is only maintained when the caller expects it or wants it
    // reported for pinning; hashing a multi-hundred-megabyte archive twice
    // otherwise costs a second of CPU for nothing.
    const sha256Hash = this.computeSha256 ? crypto.createHash('sha256') : null;
    const updateHashes = (chunk) => {
      hash.update(chunk);
      if (sha256Hash) sha256Hash.update(chunk);
    };
    if (resumed) {
      // Re-read the partial file so the digest covers the whole payload.
      await new Promise((resolve, reject) => {
        const prior = fs.createReadStream(this.tmpPath);
        prior.on('error', reject);
        prior.on('data', (chunk) => updateHashes(chunk));
        prior.on('end', resolve);
      });
    }

    const out = fs.createWriteStream(this.tmpPath, { flags: resumed ? 'a' : 'w' });

    await new Promise((resolve, reject) => {
      const fail = (err) => {
        if (this._activeRes === res) this._activeRes = null;
        res.destroy();
        out.destroy();
        reject(err);
      };
      res.on('error', fail);
      out.on('error', fail);
      res.on('data', (chunk) => {
        updateHashes(chunk);
        this.received += chunk.length;
        // A missing or understated Content-Length must not let the transfer
        // grow past the ceiling either.
        if (maxBytes && this.received > maxBytes) {
          fail(new Error(`download exceeds the ${maxBytes} byte limit`));
          return;
        }
        this.setProgress(this.received, this.total || this.received);
      });
      // 'close' (not 'finish') guarantees the descriptor is closed before rename.
      out.on('close', resolve);
      res.pipe(out);
    });

    // A server that hangs up after sending fewer bytes than it announced
    // still ends the response stream cleanly, so the pipe above resolves. No
    // digest can make a truncated archive whole; refuse it here regardless of
    // whether one was supplied.
    if (this.total > 0 && this.received < this.total) {
      throw new Error(`truncated response: received ${this.received} of ${this.total} announced bytes`);
    }

    return {
      path: this.tmpPath,
      md5: hash.digest('hex'),
      sha256: sha256Hash ? sha256Hash.digest('hex') : null,
      bytes: this.received,
      resumed,
    };
  }

  /** Verify every supplied digest; a mismatch message names the algorithm. */
  verify(md5, sha256) {
    if (this.expectedSha256) {
      return sha256 === this.expectedSha256 ? true : 'sha256 mismatch';
    }
    if (this.expectedMd5) {
      return md5 === this.expectedMd5 ? true : 'md5 mismatch';
    }
    return true;
  }

  /**
   * Run the download, retrying on failure and verifying integrity before the
   * temp file is promoted to its final name.
   *
   * @returns {Promise<{path:string, md5:string, sha256:string|null, bytes:number, skipped:boolean, attempts:number}>}
   */
  async start() {
    try {
      await this.ensureWritable();

      // Reuse a destination that already matches the expected digest.
      const expectedNow = this.expectedSha256 || this.expectedMd5;
      if (expectedNow && await Downloader.fileExists(this.destPath)) {
        const algorithm = this.expectedSha256 ? 'sha256' : 'md5';
        const existing = await Downloader.digestFile(this.destPath, algorithm);
        if (existing === expectedNow) {
          this.progress = 1;
          this.setStatus(STATUS.COMPLETED);
          return {
            path: this.destPath,
            md5: algorithm === 'md5' ? existing : null,
            sha256: algorithm === 'sha256' ? existing : null,
            bytes: 0,
            skipped: true,
            attempts: 0,
          };
        }
      }

      let lastError = null;
      const maxAttempts = this.retries + 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        this.attempt = attempt;
        try {
          this.setStatus(STATUS.DOWNLOADING);
          const result = await this.downloadOnce();

          this.setStatus(STATUS.VERIFYING);
          const verdict = this.verify(result.md5, result.sha256);
          if (verdict !== true) {
            // A bad digest means the partial file is not trustworthy.
            await fsp.rm(this.tmpPath, { force: true });
            throw new Error(`${verdict}: got ${verdict.startsWith('sha256') ? result.sha256 : result.md5}, expected ${this.expectedSha256 || this.expectedMd5}`);
          }

          await fsp.mkdir(path.dirname(this.destPath), { recursive: true });
          await fsp.rm(this.destPath, { force: true });
          await fsp.rename(this.tmpPath, this.destPath);

          this.progress = 1;
          this.setStatus(STATUS.COMPLETED);
          this.emit('complete', { path: this.destPath, md5: result.md5, sha256: result.sha256, bytes: result.bytes });
          return {
            path: this.destPath,
            md5: result.md5,
            sha256: result.sha256,
            bytes: result.bytes,
            skipped: false,
            attempts: attempt,
          };
        } catch (err) {
          lastError = err;
          this.emit('retry', { attempt, error: err });
          if (this.canceled) {
            // A user cancel must not burn through the retry budget.
            break;
          }
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 200 * attempt));
          }
        }
      }

      if (this.canceled) {
        throw lastError || new Error('download canceled');
      }
      this.setStatus(STATUS.FAILED);
      this.emit('error', lastError);
      throw lastError || new Error('download failed');
    } catch (err) {
      if (this.canceled) {
        // Keep the canceled status distinct from a plain failure.
        throw err;
      }
      if (this.status !== STATUS.FAILED) {
        this.setStatus(STATUS.FAILED);
        this.emit('error', err);
      }
      throw err;
    }
  }

  /** Remove a leftover partial file, if any. */
  async cleanup() {
    await fsp.rm(this.tmpPath, { force: true });
  }
}

module.exports = {
  Downloader,
  STATUS,
  fileNameFromUrl,
  openRequest,
};
