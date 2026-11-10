'use strict';

const assert = require('node:assert/strict');
const dns = require('node:dns');
const http = require('node:http');
const { EventEmitter } = require('node:events');
const { createPolicyLookup } = require('../../network/address-policy');
const { fetchUrlText } = require('../../network/outbound');
const { fetchProcessPack } = require('../template-sync');

const lookup = (addresses, allowPrivate = false, all = false) => new Promise((resolve, reject) => {
  const guarded = createPolicyLookup({ allowPrivate, lookup: (_host, options, callback) => {
    assert.equal(options.all, true); callback(null, addresses);
  } });
  guarded('public.example', { all }, (error, address, family) => error ? reject(error) : resolve({ address, family }));
});

async function main() {
  const publicAddress = { address: '8.8.8.8', family: 4 };
  assert.deepEqual(await lookup([publicAddress]), { address: '8.8.8.8', family: 4 });
  assert.deepEqual((await lookup([publicAddress], false, true)).address, [publicAddress]);
  for (const address of ['127.0.0.1', '10.0.0.1', '::ffff:7f00:1', 'fe80::1']) {
    await assert.rejects(lookup([publicAddress, { address, family: address.includes(':') ? 6 : 4 }]), (error) => error.code === 'OUTBOUND_ADDRESS_BLOCKED');
  }
  assert.equal((await lookup([{ address: '127.0.0.1', family: 4 }], true)).address, '127.0.0.1');
  for (const address of ['169.254.169.254', '::ffff:a9fe:a9fe']) {
    await assert.rejects(lookup([{ address, family: address.includes(':') ? 6 : 4 }], true), /metadata/);
  }
  await assert.rejects(lookup([]), (error) => error.code === 'ENOTFOUND');
  await assert.rejects(lookup([{ address: 'invalid', family: 4 }]), (error) => error.code === 'ENOTFOUND');

  // Run both real request paths through an in-memory socket/DNS substitute;
  // a forbidden resolved address must fail before any HTTP response is read.
  const originalLookup = dns.lookup; const originalRequest = http.request;
  const priorPrivate = process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC;
  let calls = 0;
  try {
    process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = '0';
    dns.lookup = (_host, _options, callback) => { calls += 1; callback(null, [{ address: '127.0.0.1', family: 4 }]); };
    http.request = (urlOrOptions, requestOptions) => {
      const options = typeof urlOrOptions === 'string' ? requestOptions : urlOrOptions;
      assert.equal(typeof options.lookup, 'function', 'the request must use the guarded DNS lookup');
      const request = new EventEmitter();
      request.end = () => options.lookup('public.example', {}, (error) => request.emit('error', error || new Error('unexpected resolution')));
      request.write = () => {}; request.destroy = (error) => request.emit('error', error);
      return request;
    };
    await assert.rejects(fetchUrlText('http://public.example/proxy', { allowPrivate: false }), (error) => error.code === 'OUTBOUND_ADDRESS_BLOCKED');
    await assert.rejects(fetchProcessPack('http://public.example/pack.json.gz'), (error) => error.code === 'OUTBOUND_ADDRESS_BLOCKED');
    assert.equal(calls, 2, 'each request validates exactly the DNS lookup used by its socket');
  } finally {
    dns.lookup = originalLookup; http.request = originalRequest;
    if (priorPrivate === undefined) delete process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC;
    else process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = priorPrivate;
  }
  console.log('OUTBOUND_DNS_POLICY_SELFTEST OK (resolved addresses, mixed answers, metadata, caller policies, real request paths)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
