'use strict';

/**
 * Self-test for the zero-dependency DoH resolver.
 * Runs fully offline: DNS packets are built by hand and fetch is stubbed.
 */

const assert = require('assert');
const {
  DohResolver,
  encodeQuery,
  decodeResponse,
  readName,
  TtlCache,
  base64UrlEncode,
  createDohLookup,
  TYPE_BY_NAME,
} = require('../doh-resolver');

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err: err && err.message ? err.message : String(err) });
  }
}
async function checkAsync(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err: err && err.message ? err.message : String(err) });
  }
}

function encodeName(name) {
  const parts = String(name).split('.').filter(Boolean);
  const bufs = [];
  for (const p of parts) {
    const b = Buffer.from(p, 'utf8');
    bufs.push(Buffer.from([b.length]), b);
  }
  bufs.push(Buffer.from([0]));
  return Buffer.concat(bufs);
}

/** Build a DNS response: header + question + N answers (no compression except owner ptr). */
function buildResponse({ id = 0x1234, rcode = 0, questions = [], answers = [] }) {
  const header = Buffer.alloc(12);
  header.writeUInt16BE(id, 0);
  header.writeUInt16BE(0x8180 | rcode, 2); // QR=1 RD=1 RA=1
  header.writeUInt16BE(questions.length, 4);
  header.writeUInt16BE(answers.length, 6);

  const qParts = [];
  for (const q of questions) {
    qParts.push(encodeName(q.name));
    const t = Buffer.alloc(4);
    t.writeUInt16BE(q.type, 0);
    t.writeUInt16BE(1, 2);
    qParts.push(t);
  }

  const aParts = [];
  for (const a of answers) {
    aParts.push(a.owner === null ? Buffer.from([0xc0, 0x0c]) : encodeName(a.owner));
    const r = Buffer.alloc(10);
    r.writeUInt16BE(a.type, 0);
    r.writeUInt16BE(1, 2);
    r.writeUInt32BE(a.ttl, 4);
    r.writeUInt16BE(a.rdata.length, 8);
    aParts.push(r, a.rdata);
  }

  return Buffer.concat([header, ...qParts, ...aParts]);
}

function stubFetch(responseBuf, { status = 200, onUrl } = {}) {
  return async (url) => {
    if (onUrl) onUrl(url);
    return {
      status,
      arrayBuffer: async () => responseBuf.buffer.slice(
        responseBuf.byteOffset,
        responseBuf.byteOffset + responseBuf.byteLength
      ),
    };
  };
}

(async () => {
  // ---- encoding ----
  check('encodeQuery enforces the complete wire-name byte limit', () => {
    assert.doesNotThrow(() => encodeQuery([...Array(3).fill('a'.repeat(63)), 'b'.repeat(61)].join('.')));
    assert.throws(() => encodeQuery(Array(4).fill('a'.repeat(63)).join('.')), /name too long/);
    assert.throws(() => encodeQuery('example..com'), /empty dns label/);
    assert.throws(() => encodeQuery([...Array(4).fill('é'.repeat(31)), 'a', 'b'].join('.')), /name too long/);
  });

  await checkAsync('oversized streamed DoH responses are cancelled before decoding', async () => {
    let cancelled = false;
    let finish;
    const resolver = new DohResolver({ endpoints: ['https://doh.test/dns-query'], fetchImpl: async () => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(65536));
        finish = setTimeout(() => controller.close(), 50);
      },
      cancel() { clearTimeout(finish); cancelled = true; },
    })) });
    await assert.rejects(resolver.query('example.com'), /DNS response exceeds/);
    assert.strictEqual(cancelled, true);
    assert.strictEqual(resolver.controllers.size, 0);
  });

  check('encodeQuery builds a valid header', () => {
    const q = encodeQuery('example.com', 'A', 0x1234);
    assert.strictEqual(q.readUInt16BE(0), 0x1234, 'id');
    assert.strictEqual(q.readUInt16BE(2), 0x0100, 'RD flag');
    assert.strictEqual(q.readUInt16BE(4), 1, 'qdcount');
    assert.strictEqual(q.readUInt16BE(6), 0, 'ancount');
  });

  check('encodeQuery writes qname/qtype/qclass', () => {
    const q = encodeQuery('example.com', 'AAAA', 1);
    // 12 header + 7 "example" + 4 "com" + 1 root = 24, then 4 bytes qtype/qclass
    assert.strictEqual(q[12], 7);
    assert.strictEqual(q.slice(13, 20).toString(), 'example');
    assert.strictEqual(q[20], 3);
    assert.strictEqual(q.slice(21, 24).toString(), 'com');
    assert.strictEqual(q[24], 0);
    assert.strictEqual(q.readUInt16BE(25), 28, 'AAAA type');
    assert.strictEqual(q.readUInt16BE(27), 1, 'IN class');
  });

  check('encodeQuery rejects over-long labels', () => {
    assert.throws(() => encodeQuery(`${'a'.repeat(64)}.com`, 'A'), /label too long/);
  });

  check('encodeQuery rejects unsupported type', () => {
    assert.throws(() => encodeQuery('example.com', 'NOPE'), /unsupported dns type/);
  });

  // ---- decoding ----
  check('decodeResponse parses an A answer', () => {
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 300, rdata: Buffer.from([93, 184, 216, 34]) }],
    });
    const res = decodeResponse(buf);
    assert.strictEqual(res.rcode, 0);
    assert.strictEqual(res.questions[0].name, 'example.com');
    assert.strictEqual(res.answers.length, 1);
    assert.strictEqual(res.answers[0].data, '93.184.216.34');
    assert.strictEqual(res.answers[0].ttl, 300);
  });

  check('decodeResponse parses AAAA', () => {
    const ipv6 = Buffer.alloc(16);
    ipv6.writeUInt16BE(0x2606, 0);
    ipv6.writeUInt16BE(0x4700, 2);
    for (let i = 4; i < 16; i += 2) ipv6.writeUInt16BE(0, i);
    ipv6.writeUInt16BE(1, 14);
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 28 }],
      answers: [{ owner: null, type: 28, ttl: 60, rdata: ipv6 }],
    });
    const res = decodeResponse(buf);
    assert.strictEqual(res.answers[0].data, '2606:4700:0:0:0:0:0:1');
  });

  check('decodeResponse parses CNAME via compression pointer', () => {
    const target = encodeName('target.example.com');
    const buf = buildResponse({
      questions: [{ name: 'www.example.com', type: 5 }],
      answers: [{ owner: null, type: 5, ttl: 120, rdata: target }],
    });
    const res = decodeResponse(buf);
    assert.strictEqual(res.answers[0].data, 'target.example.com');
  });

  check('decodeResponse parses TXT chunks', () => {
    // Two character-strings in one TXT record.
    const rdata = Buffer.concat([
      Buffer.from([5]), Buffer.from('hello', 'utf8'),
      Buffer.from([5]), Buffer.from('world', 'utf8'),
    ]);
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 16 }],
      answers: [{ owner: null, type: 16, ttl: 30, rdata }],
    });
    const res = decodeResponse(buf);
    assert.strictEqual(res.answers[0].data, 'helloworld');
  });

  check('decodeResponse surfaces non-zero rcode', () => {
    const buf = buildResponse({ rcode: 3, questions: [{ name: 'nx.example', type: 1 }] });
    assert.strictEqual(decodeResponse(buf).rcode, 3);
  });

  check('decodeResponse rejects short buffers', () => {
    assert.throws(() => decodeResponse(Buffer.alloc(4)), /too short/);
  });

  check('readName detects pointer loops', () => {
    const buf = Buffer.from([0xc0, 0x00, 0x00]);
    assert.throws(() => readName(buf, 0), /pointer loop|out of range/);
  });

  // ---- helpers ----
  check('base64UrlEncode omits padding and uses url-safe alphabet', () => {
    const encoded = base64UrlEncode(Buffer.from([0xfb, 0xff, 0xfe]));
    assert.ok(!encoded.includes('='), 'no padding');
    assert.ok(!encoded.includes('+') && !encoded.includes('/'), 'url-safe alphabet');
  });

  await checkAsync('TtlCache expires entries', async () => {
    const cache = new TtlCache(10);
    cache.set('k', ['1.2.3.4'], 0.05);
    assert.deepStrictEqual(cache.get('k'), ['1.2.3.4']);
    await new Promise((r) => setTimeout(r, 90));
    assert.strictEqual(cache.get('k'), undefined);
  });

  check('TtlCache evicts beyond max size', () => {
    const cache = new TtlCache(2);
    cache.set('a', 1, 60);
    cache.set('b', 2, 60);
    cache.set('c', 3, 60);
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.get('a'), undefined);
    assert.deepStrictEqual(cache.get('c'), 3);
  });

  check('TtlCache does not retain a zero-TTL replacement', () => {
    const cache = new TtlCache();
    cache.set('key', 'old', 60);
    cache.set('key', 'new', 0);
    assert.strictEqual(cache.get('key'), undefined);
  });

  check('readName rejects a missing root terminator', () => {
    assert.throws(() => readName(Buffer.from([1, 97]), 0), /truncated/);
  });

  check('decodeResponse rejects an incomplete answer instead of returning partial data', () => {
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 60, rdata: Buffer.from([1, 2, 3, 4]) }],
    });
    assert.throws(() => decodeResponse(buf.subarray(0, -1)), /truncated/);
  });

  await checkAsync('zero-TTL addresses are returned but queried again', async () => {
    const resolver = new DohResolver();
    let calls = 0;
    resolver.query = async () => {
      calls += 1;
      return { rcode: 0, answers: [{ type: 'A', ttl: 0, data: '1.2.3.4' }] };
    };
    assert.deepStrictEqual(await resolver.resolve4('example.com'), ['1.2.3.4']);
    await resolver.resolve4('example.com');
    assert.strictEqual(calls, 2);
  });

  await checkAsync('CNAME TTL limits the lifetime of the resolved address', async () => {
    const resolver = new DohResolver();
    resolver.query = async () => ({ rcode: 0, answers: [
      { type: 'CNAME', ttl: 0, data: 'target.test' },
      { type: 'A', ttl: 300, data: '1.2.3.4' },
    ] });
    await resolver.resolve4('alias.test');
    assert.strictEqual(resolver.cache.size, 0);
  });

  await checkAsync('cancel stops endpoint failover and new queries can start immediately', async () => {
    let calls = 0;
    let started;
    const ready = new Promise((resolve) => { started = resolve; });
    const resolver = new DohResolver({
      endpoints: ['https://one.test/q', 'https://two.test/q'],
      fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
        calls += 1;
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
        started();
      }),
    });
    const pending = resolver.resolve4('example.com');
    await ready;
    resolver.cancel();
    resolver.query = async () => ({ rcode: 0, answers: [{ type: 'A', ttl: 60, data: '5.6.7.8' }] });
    const next = resolver.resolve4('example.com');
    await assert.rejects(pending, (error) => error.code === 'ECANCELLED');
    assert.deepStrictEqual(await next, ['5.6.7.8']);
    assert.strictEqual(calls, 1, 'cancel must not contact the second endpoint');
  });

  await checkAsync('endpoint timeouts are reported as timeouts rather than user cancellation', async () => {
    const resolver = new DohResolver({
      endpoints: ['https://one.test/q'], timeoutMs: 10,
      fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    });
    await assert.rejects(resolver.resolve4('example.com'), (error) => error.code === 'ETIMEDOUT');
  });

  await checkAsync('concurrent case variants of a DNS name share one query', async () => {
    const resolver = new DohResolver();
    let calls = 0;
    resolver.query = async () => {
      calls += 1;
      return { rcode: 0, answers: [{ type: 'A', ttl: 60, data: '1.2.3.4' }] };
    };
    await Promise.all([resolver.resolve4('EXAMPLE.com.'), resolver.resolve4('example.com')]);
    assert.strictEqual(calls, 1);
  });

  // ---- resolver behaviour ----
  await checkAsync('resolve4 returns addresses and caches them', async () => {
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 60, rdata: Buffer.from([1, 2, 3, 4]) }],
    });
    let calls = 0;
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: stubFetch(buf, { onUrl: () => { calls += 1; } }),
    });
    const first = await resolver.resolve4('example.com');
    const second = await resolver.resolve4('example.com');
    assert.deepStrictEqual(first, ['1.2.3.4']);
    assert.deepStrictEqual(second, ['1.2.3.4']);
    assert.strictEqual(calls, 1, 'second call served from cache');
  });

  await checkAsync('query builds a wire-format GET url', async () => {
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 60, rdata: Buffer.from([1, 1, 1, 1]) }],
    });
    let seen = null;
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: stubFetch(buf, { onUrl: (u) => { seen = u; } }),
    });
    await resolver.query('example.com', 'A');
    assert.ok(seen.startsWith('https://doh.test/dns-query?dns='), 'GET wire format used');
    const token = seen.split('dns=')[1];
    assert.ok(!token.includes('='), 'base64url unpadded');
    const decoded = decodeResponse(encodeQuery('example.com', 'A', 0));
    assert.ok(decoded, 'round-trip packet is decodable');
  });

  await checkAsync('resolves through whichever endpoint answers first', async () => {
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 60, rdata: Buffer.from([9, 9, 9, 9]) }],
    });
    const tried = [];
    // Endpoint order is randomised on purpose; only the outcome is asserted here.
    const resolver = new DohResolver({
      endpoints: ['https://bad.test/dns-query', 'https://good.test/dns-query'],
      fetchImpl: async (url) => {
        tried.push(url);
        if (url.includes('bad.test')) throw new Error('endpoint down');
        return {
          status: 200,
          arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
        };
      },
    });
    const addrs = await resolver.resolve4('example.com');
    assert.deepStrictEqual(addrs, ['9.9.9.9']);
    assert.ok(tried.length >= 1, 'at least one endpoint contacted');
    assert.ok(tried.every((u) => u.includes('bad.test') || u.includes('good.test')));
  });

  await checkAsync('exhausts every endpoint before failing', async () => {
    // Both endpoints fail, so the resolver must have visited each one.
    const tried = [];
    const resolver = new DohResolver({
      endpoints: ['https://one.test/dns-query', 'https://two.test/dns-query', 'https://three.test/dns-query'],
      fetchImpl: async (url) => {
        tried.push(url);
        throw new Error(`endpoint down: ${url}`);
      },
    });
    await assert.rejects(() => resolver.resolve4('example.com'), /endpoint down/);
    assert.strictEqual(tried.length, 3, 'every endpoint attempted before giving up');
    const hosts = new Set(tried.map((u) => new URL(u).host));
    assert.deepStrictEqual([...hosts].sort(), ['one.test', 'three.test', 'two.test']);
  });

  await checkAsync('resolve4 rejects when no answer section', async () => {
    const buf = buildResponse({ questions: [{ name: 'empty.example', type: 1 }], answers: [] });
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: stubFetch(buf),
    });
    await assert.rejects(() => resolver.resolve4('empty.example'), /no A record/);
  });

  await checkAsync('resolveTxt returns array-of-arrays', async () => {
    const rdata = Buffer.concat([Buffer.from([3]), Buffer.from('abc', 'utf8')]);
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 16 }],
      answers: [{ owner: null, type: 16, ttl: 30, rdata }],
    });
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: stubFetch(buf),
    });
    assert.deepStrictEqual(await resolver.resolveTxt('example.com'), [['abc']]);
  });

  await checkAsync('http error responses are retried then surfaced', async () => {
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: stubFetch(Buffer.alloc(12), { status: 503 }),
    });
    await assert.rejects(() => resolver.resolve4('example.com'), /http 503/);
  });

  await checkAsync('custom endpoints via setEndpoints are honored', async () => {
    const buf = buildResponse({
      questions: [{ name: 'example.com', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 60, rdata: Buffer.from([8, 8, 8, 8]) }],
    });
    let seen = null;
    const resolver = new DohResolver({
      fetchImpl: stubFetch(buf, { onUrl: (u) => { seen = u; } }),
    });
    resolver.setEndpoints(['https://custom.test/q']);
    await resolver.resolve4('example.com');
    assert.ok(seen.startsWith('https://custom.test/q'), 'custom endpoint used');
  });

  // ---- request-scoped lookup ----

  /** A resolver double with a known name and a missing one. */
  function fakeResolver() {
    return {
      resolve4: (hostname) => (hostname === 'known.test'
        ? Promise.resolve(['203.0.113.7', '203.0.113.8'])
        : Promise.reject(Object.assign(new Error('no record'), { code: 'ENODATA' }))),
      // Mirror resolve4's miss semantics: a name that has no record must miss
      // on AAAA too, otherwise the createDohLookup v6 fallback would answer an
      // unknown host from this stub and the system-resolver path would never
      // be exercised. known.test keeps an AAAA answer so the family tests pass.
      resolve6: (hostname) => (hostname === 'known.test'
        ? Promise.resolve(['2001:db8::1'])
        : Promise.reject(Object.assign(new Error('no record'), { code: 'ENODATA' }))),
    };
  }

  function callLookup(lookup, hostname, options) {
    return new Promise((resolve, reject) => {
      lookup(hostname, options, (err, address, family) => {
        if (err) reject(err); else resolve({ address, family });
      });
    });
  }

  check('a scoped lookup rejects a missing resolver instead of patching globals', () => {
    assert.throws(() => createDohLookup(null), /resolver required/);
    assert.throws(() => createDohLookup({}), /resolver required/);
    assert.throws(() => createDohLookup({ resolve4: () => {} }.resolve4 && {}), /resolver required/);
  });

  await checkAsync('a scoped lookup answers from the resolver', async () => {
    const lookup = createDohLookup(fakeResolver(), { systemLookup: () => { throw new Error('must not be used'); } });
    const result = await callLookup(lookup, 'known.test', {});
    assert.strictEqual(result.address, '203.0.113.7');
    assert.strictEqual(result.family, 4);
  });

  await checkAsync('a scoped lookup honours a family request', async () => {
    const lookup = createDohLookup(fakeResolver(), { systemLookup: () => { throw new Error('must not be used'); } });
    const result = await callLookup(lookup, 'known.test', { family: 6 });
    assert.strictEqual(result.address, '2001:db8::1');
    assert.strictEqual(result.family, 6);
  });

  await checkAsync('numeric and named family options select the requested resolver', async () => {
    const lookup = createDohLookup(fakeResolver(), { fallback: null });
    for (const options of [6, { family: 'IPv6' }]) {
      assert.deepStrictEqual(await callLookup(lookup, 'known.test', options), { address: '2001:db8::1', family: 6 });
    }
    assert.deepStrictEqual(await callLookup(lookup, 'known.test', { family: 'IPv4' }), { address: '203.0.113.7', family: 4 });
    assert.throws(() => lookup('known.test', { family: 7 }, () => {}), /family/);
  });

  await checkAsync('an explicit IPv4 miss never queries or returns IPv6', async () => {
    let v6Calls = 0;
    const lookup = createDohLookup({
      resolve4: async () => { throw Object.assign(new Error('no A record'), { code: 'ENODATA' }); },
      resolve6: async () => { v6Calls += 1; return ['2001:db8::1']; },
    }, { fallback: null });
    for (const options of [4, { family: 4 }, { family: 'IPv4', all: true }]) {
      await assert.rejects(callLookup(lookup, 'v6only.test', options), { code: 'ENOTFOUND' });
    }
    assert.strictEqual(v6Calls, 0);
  });

  await checkAsync('IP literals return asynchronously without DNS or system queries', async () => {
    const unexpected = () => { throw new Error('IP literals must not query DNS'); };
    const lookup = createDohLookup({ resolve4: unexpected, resolve6: unexpected }, { systemLookup: unexpected });
    for (const [address, family] of [['127.0.0.1', 4], ['::1', 6]]) {
      let synchronous = true;
      const result = new Promise((resolve, reject) => lookup(address, { all: true }, (error, rows) => {
        if (error) { reject(error); return; }
        try { assert.strictEqual(synchronous, false); resolve(rows); } catch (cause) { reject(cause); }
      }));
      synchronous = false;
      assert.deepStrictEqual(await result, [{ address, family }]);
    }
  });

  await checkAsync('the all flag yields the whole address list', async () => {
    const lookup = createDohLookup(fakeResolver(), { systemLookup: () => { throw new Error('must not be used'); } });
    const addresses = await new Promise((resolve, reject) => {
      lookup('known.test', { all: true }, (err, list) => (err ? reject(err) : resolve(list)));
    });
    assert.deepStrictEqual(addresses, [
      { address: '203.0.113.7', family: 4 },
      { address: '203.0.113.8', family: 4 },
    ]);
  });

  await checkAsync('a missing record falls back to the system resolver', async () => {
    let asked = null;
    const systemLookup = (hostname, options, callback) => {
      asked = hostname;
      callback(null, '198.51.100.9', 4);
    };
    const lookup = createDohLookup(fakeResolver(), { systemLookup });
    const result = await callLookup(lookup, 'unknown.test', {});
    assert.strictEqual(asked, 'unknown.test');
    assert.strictEqual(result.address, '198.51.100.9');
  });

  await checkAsync('the fallback can be disabled so a miss is reported', async () => {
    const lookup = createDohLookup(fakeResolver(), { fallback: null });
    await assert.rejects(() => callLookup(lookup, 'unknown.test', {}), /No record/);
  });

  await checkAsync('a transport failure is surfaced rather than silently re-resolved', async () => {
    let fellBack = false;
    const resolver = {
      resolve4: () => Promise.reject(Object.assign(new Error('upstream down'), { code: 'ETIMEOUT' })),
    };
    const lookup = createDohLookup(resolver, { systemLookup: () => { fellBack = true; } });
    await assert.rejects(() => callLookup(lookup, 'known.test', {}), /upstream down/);
    assert.strictEqual(fellBack, false, 'only a missing record should retry through the system resolver');
  });

  await checkAsync('the scoped lookup does not touch the global resolver', async () => {
    const dnsMod = require('dns');
    const original = dnsMod.lookup;
    const lookup = createDohLookup(fakeResolver(), { systemLookup: original });
    await callLookup(lookup, 'known.test', {});
    assert.strictEqual(dnsMod.lookup, original, 'dns.lookup is untouched');
  });

  await checkAsync('a callback that rejects the contract is reported clearly', async () => {
    const lookup = createDohLookup(fakeResolver(), { systemLookup: () => {} });
    assert.throws(() => lookup('known.test', {}), /callback required/);
  });

  check('consumer callback exceptions never trigger a second callback or DNS fallback', () => {
    const { execFileSync } = require('node:child_process');
    const source = `
      const assert = require('node:assert/strict');
      const { createDohLookup } = require(${JSON.stringify(require.resolve('../doh-resolver'))});
      let calls = 0, fallbacks = 0;
      const timer = setTimeout(() => { throw new Error('callback did not throw'); }, 1000);
      process.once('uncaughtException', (error) => {
        clearTimeout(timer);
        assert.equal(error.message, 'consumer failure');
        assert.equal(calls, 1);
        assert.equal(fallbacks, 0);
        console.log('callback propagated once');
      });
      process.on('unhandledRejection', () => { clearTimeout(timer); process.exitCode = 1; });
      createDohLookup({ resolve4: async () => ['192.0.2.1'] }, {
        systemLookup: (_host, _options, callback) => { fallbacks += 1; callback(null, '192.0.2.2', 4); },
      })('callback.test', {}, () => {
        calls += 1;
        throw Object.assign(new Error('consumer failure'), { code: 'ENODATA' });
      });
    `;
    assert.match(execFileSync(process.execPath, ['-e', source], { encoding: 'utf8', timeout: 3000 }), /callback propagated once/);
  });

  await checkAsync('an IPv6-only host is answered via the DoH AAAA fallback before the system resolver', async () => {
    // resolve4 ENODATA on an IPv6-only host: the scoped lookup must try AAAA
    // through DoH first. A hit there answers the request without consulting
    // the system resolver (plaintext ISP DNS), and the family resolves to 6.
    const resolver = {
      resolve4: () => Promise.reject(Object.assign(new Error('no record'), { code: 'ENODATA' })),
      resolve6: () => Promise.resolve(['2001:db8::53']),
    };
    let systemAsked = false;
    const lookup = createDohLookup(resolver, { systemLookup: () => { systemAsked = true; } });
    const result = await callLookup(lookup, 'v6only.test', {});
    assert.strictEqual(result.address, '2001:db8::53');
    assert.strictEqual(result.family, 6);
    assert.strictEqual(systemAsked, false, 'a v6-only host must not leak to the system resolver');
  });

  await checkAsync('an empty AAAA fallback is not treated as a hit', async () => {
    // resolve6 resolves to an empty list: that is still a miss, so the
    // original ENODATA must surface (and reach the system resolver), never a
    // fabricated empty answer.
    const resolver = {
      resolve4: () => Promise.reject(Object.assign(new Error('no record'), { code: 'ENODATA' })),
      resolve6: () => Promise.resolve([]),
    };
    let asked = null;
    const systemLookup = (hostname, options, callback) => {
      asked = hostname;
      callback(null, '198.51.100.10', 4);
    };
    const lookup = createDohLookup(resolver, { systemLookup });
    const result = await callLookup(lookup, 'v6empty.test', {});
    assert.strictEqual(asked, 'v6empty.test');
    assert.strictEqual(result.address, '198.51.100.10');
  });

  await checkAsync('concurrent first queries for the same host and type share one in-flight request', async () => {
    const buf = buildResponse({
      questions: [{ name: 'merge.test', type: 1 }],
      answers: [{ owner: null, type: 1, ttl: 60, rdata: Buffer.from([198, 51, 100, 77]) }],
    });
    let calls = 0;
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: stubFetch(buf, { onUrl: () => { calls += 1; } }),
    });
    const both = await Promise.all([resolver.resolve4('merge.test'), resolver.resolve4('merge.test')]);
    assert.deepStrictEqual(both[0], ['198.51.100.77']);
    assert.deepStrictEqual(both[1], ['198.51.100.77']);
    assert.strictEqual(calls, 1, 'two concurrent first queries must dial the endpoint once');
    assert.strictEqual(resolver._inFlight?.size ?? 0, 0, 'the in-flight entry is released after settling');
  });

  await checkAsync('in-flight merging never crosses hostname or type boundaries', async () => {
    // Route by the decoded wire query: each (hostname, type) pair gets its own
    // response, so the test can prove merging is keyed per hostname AND type.
    const router = async (url) => {
      const token = url.split('dns=')[1];
      // Re-decode the query to learn which name/type is being asked.
      const packet = Buffer.from(token, 'base64');
      const q = decodeResponse(packet);
      const name = q.questions[0].name;
      // decodeResponse normalises qtype to the name form ('A', 'TXT', ...);
      // buildResponse wants the numeric form back.
      const type = TYPE_BY_NAME[q.questions[0].type] || q.questions[0].type;
      const rdataByName = {
        'a.merge.test': Buffer.from([198, 51, 100, 1]),
        'b.merge.test': Buffer.from([198, 51, 100, 2]),
      };
      const rdata = type === 1
        ? rdataByName[name]
        : Buffer.concat([Buffer.from([4]), Buffer.from('spfm', 'utf8')]);
      const buf = buildResponse({
        questions: [{ name, type }],
        answers: [{ owner: null, type, ttl: 60, rdata }],
      });
      return {
        status: 200,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      };
    };
    let calls = 0;
    const counting = async (url) => {
      calls += 1;
      return router(url);
    };
    const resolver = new DohResolver({
      endpoints: ['https://doh.test/dns-query'],
      fetchImpl: counting,
    });
    const [a, b, txt] = await Promise.all([
      resolver.resolve4('a.merge.test'),
      resolver.resolve4('b.merge.test'),
      resolver.resolveTxt('a.merge.test'),
    ]);
    assert.deepStrictEqual(a, ['198.51.100.1']);
    assert.deepStrictEqual(b, ['198.51.100.2']);
    assert.deepStrictEqual(txt, [['spfm']]);
    assert.strictEqual(calls, 3, 'each distinct hostname/type pair dials separately');
  });

  // ---- report ----
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.err}`}`);
  }
  console.log(`\nDOH_RESOLVER_SELFTEST ${failed.length ? 'FAILED' : 'OK'} ${passed}/${results.length}`);
  if (failed.length) process.exitCode = 1;
})();
