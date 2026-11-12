'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { execFile, execFileSync } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);
const commandOptions = { timeout: 20000, maxBuffer: 65536, windowsHide: true };

function caArgs(dir) {
  return ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', path.join(dir, 'ca.key'), '-out', path.join(dir, 'ca.crt'),
    '-days', '30', '-nodes', '-subj', '/CN=OpenBrowser Worker CA', '-addext', 'basicConstraints=critical,CA:TRUE',
    '-addext', 'keyUsage=critical,keyCertSign,cRLSign'];
}
function readCa(dir) {
  return { cert: fs.readFileSync(path.join(dir, 'ca.crt')), key: fs.readFileSync(path.join(dir, 'ca.key')), dir, serial: 1 };
}
function createCASync() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-ff-mitm-'));
  try { execFileSync('openssl', caArgs(dir), { ...commandOptions, stdio: 'ignore' }); return readCa(dir); }
  catch (error) { fs.rmSync(dir, { recursive: true, force: true }); throw error; }
}
async function createCA() {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ob-ff-mitm-'));
  try { await runFile('openssl', caArgs(dir), commandOptions); return readCa(dir); }
  catch (error) { await fs.promises.rm(dir, { recursive: true, force: true }); throw error; }
}

function leafArgs(ca, dir, host) {
  const key = path.join(dir, 'leaf.key'), csr = path.join(dir, 'leaf.csr');
  const cert = path.join(dir, 'leaf.crt'), ext = path.join(dir, 'leaf.ext');
  const ip = net.isIP(host) !== 0;
  return { key, cert, ext,
    extensions: `subjectAltName=${ip ? 'IP' : 'DNS'}:${host}\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n`,
    request: ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', csr, '-subj', '/CN=' + (ip ? 'mitm' : host)],
    sign: ['x509', '-req', '-in', csr, '-CA', path.join(ca.dir, 'ca.crt'), '-CAkey', path.join(ca.dir, 'ca.key'),
      '-set_serial', String(++ca.serial), '-days', '30', '-out', cert, '-extfile', ext, '-sha256'],
  };
}

class WorkerCertificates {
  constructor(ca, { cacheLimit = 128, concurrency = 2, queueLimit = 128 } = {}) {
    for (const [name, value, max] of [['cacheLimit', cacheLimit, 1024], ['concurrency', concurrency, 8], ['queueLimit', queueLimit, 1024]]) {
      if (!Number.isInteger(value) || value < 1 || value > max) throw new RangeError('Invalid certificate ' + name);
    }
    this.ca = ca;
    this.cacheLimit = cacheLimit;
    this.concurrency = concurrency;
    this.queueLimit = queueLimit;
    this.cache = new Map();
    this.pending = new Map();
    this.queue = [];
    this.active = 0;
    this.controller = new AbortController();
  }
  host(value) {
    if (this.closed) throw new Error('Certificate store is closed');
    const host = String(value || '').toLowerCase().replace(/^\[|\]$/g, '');
    if (!net.isIP(host) && !/^[a-z0-9_](?:[a-z0-9_.-]*[a-z0-9_.])?$/i.test(host)) throw new Error('Invalid certificate hostname');
    return host;
  }
  remember(host, leaf) {
    if (this.closed) throw new Error('Certificate store is closed');
    this.cache.delete(host); this.cache.set(host, leaf);
    while (this.cache.size > this.cacheLimit) this.cache.delete(this.cache.keys().next().value);
    return leaf;
  }
  getSync(value) {
    const host = this.host(value);
    if (this.cache.has(host)) return this.remember(host, this.cache.get(host));
    if (this.pending.has(host)) throw new Error('Certificate generation is already pending');
    const dir = fs.mkdtempSync(path.join(this.ca.dir, 'leaf-'));
    try {
      const args = leafArgs(this.ca, dir, host);
      fs.writeFileSync(args.ext, args.extensions);
      for (const command of [args.request, args.sign]) execFileSync('openssl', command, { ...commandOptions, stdio: 'ignore' });
      return this.remember(host, { cert: fs.readFileSync(args.cert), key: fs.readFileSync(args.key), host });
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
  get(value) {
    let host;
    try { host = this.host(value); } catch (error) { return Promise.reject(error); }
    if (this.cache.has(host)) return Promise.resolve(this.remember(host, this.cache.get(host)));
    if (this.pending.has(host)) return this.pending.get(host);
    if (this.queue.length >= this.queueLimit) return Promise.reject(new Error('Certificate queue is full'));
    let resolve, reject;
    const operation = new Promise((done, fail) => { resolve = done; reject = fail; });
    this.pending.set(host, operation);
    const release = () => { if (this.pending.get(host) === operation) this.pending.delete(host); };
    operation.then(release, release);
    this.queue.push({ host, resolve, reject }); this.pump();
    return operation;
  }
  pump() {
    while (!this.closed && this.active < this.concurrency && this.queue.length) {
      const job = this.queue.shift(); this.active++;
      this.generate(job.host).then(job.resolve, job.reject).finally(() => { this.active--; this.pump(); });
    }
  }
  async generate(host) {
    const dir = await fs.promises.mkdtemp(path.join(this.ca.dir, 'leaf-'));
    try {
      const args = leafArgs(this.ca, dir, host);
      await fs.promises.writeFile(args.ext, args.extensions);
      for (const command of [args.request, args.sign]) {
        await runFile('openssl', command, { ...commandOptions, signal: this.controller.signal });
      }
      return this.remember(host, { cert: await fs.promises.readFile(args.cert), key: await fs.promises.readFile(args.key), host });
    } finally { await fs.promises.rm(dir, { recursive: true, force: true }); }
  }
  close() {
    return this.closing ||= (async () => {
      this.closed = true;
      const pending = Promise.allSettled([...this.pending.values()]);
      this.controller.abort();
      for (const job of this.queue.splice(0)) job.reject(new Error('Certificate store is closed'));
      await pending;
      this.cache.clear();
      if (this.ca.dir) await fs.promises.rm(this.ca.dir, { recursive: true, force: true });
    })();
  }
}
module.exports = { WorkerCertificates, createCA, createCASync };
