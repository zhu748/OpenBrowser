'use strict';

const assert = require('node:assert/strict');
const { normalizeHostname, isPrivateOrLocalHostname, isCloudMetadataHostname } = require('../../network/address-policy');
const { assertSafeOutboundUrl } = require('../../proxy-forwarder');
const { assertSafeTemplateSyncUrl } = require('../template-sync');

const previous = process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC;
try {
  process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = '0';
  const privateHosts = ['127.0.0.1', '10.0.0.1', '192.168.1.1', '100.64.0.1', '169.254.1.1'];
  for (const host of privateHosts) {
    for (const spelling of [host, `[::ffff:${host}]`]) {
      const url = `http://${spelling}/`;
      assert.equal(isPrivateOrLocalHostname(new URL(url).hostname), true, url);
      assert.throws(() => assertSafeOutboundUrl(url, { allowPrivate: false }), /内网|本机/);
      assert.throws(() => assertSafeTemplateSyncUrl(url), /内网|本机/);
    }
  }
  for (const host of ['localhost.', 'sub.LOCALHOST.', '[0:0:0:0:0:0:0:1]', '[fe90::1]', '[febf::1]', '[fd00::1]']) {
    assert.equal(isPrivateOrLocalHostname(host), true, host);
  }
  assert.equal(normalizeHostname('[0:0:0:0:0:ffff:7f00:1]'), '127.0.0.1');
  assert.equal(normalizeHostname('::ffff:127.0.0.1'), '127.0.0.1');
  for (const host of ['[::ffff:169.254.169.254]', '[::ffff:a9fe:aa02]', 'metadata.google.internal.']) {
    const url = `http://${host}/`;
    assert.equal(isCloudMetadataHostname(new URL(url).hostname), true, url);
    assert.throws(() => assertSafeOutboundUrl(url, { allowPrivate: true }), /metadata/);
    process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = '1';
    assert.throws(() => assertSafeTemplateSyncUrl(url), /metadata/);
    process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = '0';
  }
  for (const host of ['example.com', '8.8.8.8', '[::ffff:8.8.8.8]', '[2606:4700:4700::1111]']) {
    const url = `https://${host}/`;
    assert.equal(isPrivateOrLocalHostname(new URL(url).hostname), false, url);
    assert.doesNotThrow(() => assertSafeOutboundUrl(url, { allowPrivate: false }));
    assert.doesNotThrow(() => assertSafeTemplateSyncUrl(url));
  }
  process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = '1';
  assert.doesNotThrow(() => assertSafeTemplateSyncUrl('http://[::ffff:127.0.0.1]/'));
  assert.doesNotThrow(() => assertSafeOutboundUrl('http://[::ffff:127.0.0.1]/', { allowPrivate: true }));
} finally {
  if (previous === undefined) delete process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC;
  else process.env.OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC = previous;
}
console.log('ADDRESS_POLICY_SELFTEST OK (mapped/expanded IPv6, metadata, caller policies, public addresses)');
