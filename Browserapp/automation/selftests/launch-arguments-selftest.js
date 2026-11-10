'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');
const { buildBaseLaunchArguments, completeLaunchArguments, SECURITY_SWITCH_DENYLIST } = require('../../engine/launch-arguments');

const profile = sanitizeProfile({ id: 'launch', name: 'Launch', proxyMeta: { systemProxy: 'off' },
  privacy: { webgpu: 'blocked', customArgs: '--window-size=1000,700;--no-sandbox;--proxy-server=evil' },
  advanced: { blockSound: true, jsHeapMax: 1024 } });
const fingerprint = buildFingerprint(profile);
const root = path.join(process.cwd(), 'test profile');
const base = buildBaseLaunchArguments({ root, profile, fingerprint });
const initial = base.slice();
const before = JSON.stringify(profile);
const result = completeLaunchArguments(base, { profile, proxyEndpoint: '', startUrl: 'https://example.com', customStartUrls: [] });
assert.deepEqual(base, initial, 'policy completion does not mutate the caller array');
assert.equal(JSON.stringify(profile), before, 'argument construction never mutates profile state');
assert.ok(base.includes('--user-data-dir=' + root));
assert.ok(result.args.includes('--remote-debugging-port=0'));
assert.ok(result.args.includes('--proxy-server=direct://'));
assert.ok(result.args.includes('--mute-audio'));
assert.ok(result.args.includes('--js-flags=--max-old-space-size=1024'));
assert.ok(result.args.includes('--window-size=1000,700'));
assert.ok(result.args.includes('about:blank'));
assert.ok(!result.args.includes('https://example.com'), 'first navigation waits for fingerprint delivery');
assert.deepEqual(result.rejectedCustomSwitches, ['--no-sandbox', '--proxy-server=evil']);
assert.equal(result.args.filter((flag) => flag.startsWith('--disable-features=')).length, 1);
assert.match(result.args.find((flag) => flag.startsWith('--disable-features=')), /WebGPU/);
const proxied = sanitizeProfile({ ...profile, proxy: 'socks5://proxy.example:1080', networkMode: 'proxy',
  privacy: { ...profile.privacy, customArgs: [...SECURITY_SWITCH_DENYLIST].map((name) => '--' + name + '=unsafe').join(';') } });
assert.throws(() => completeLaunchArguments([], { profile: proxied, proxyEndpoint: '' }), (error) => error.code === 'proxy-required');
const bridged = completeLaunchArguments([], { profile: proxied, proxyConfig: {}, proxyEndpoint: 'socks5://127.0.0.1:12345', restoreSession: true });
assert.ok(bridged.args.includes('--proxy-server=socks5://127.0.0.1:12345'));
assert.ok(bridged.args.includes('--proxy-bypass-list=<-loopback>;127.0.0.1;localhost'));
assert.ok(bridged.args.includes('--force-webrtc-ip-handling-policy=disable_non_proxied_udp'));
assert.ok(bridged.args.includes('--disable-quic'));
assert.ok(bridged.args.includes('--restore-last-session'));
assert.ok(!bridged.args.includes('about:blank'));
assert.equal(bridged.rejectedCustomSwitches.length, SECURITY_SWITCH_DENYLIST.size);
assert.ok(!bridged.args.some((flag) => flag.endsWith('=unsafe')));
console.log('LAUNCH_ARGUMENTS_SELFTEST OK (routing, CDP isolation, startup barrier, custom overrides, feature merging and immutability)');
