'use strict';
const assert = require('assert');
const net = require('net');
const http = require('http');
const {
  parseProxy,
  lookupProxyCountry,
  classifyProxyError,
  clearProbeCache,
  getProbeCacheStats,
  getProbeCacheKey,
  isProxyLinkError,
  isProbeServiceError,
  ProbeMemoryCache,
  DEFAULT_PROBE_CACHE_TTL_MS,
} = require('../../proxy-forwarder');

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function until(socket, marker) {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0);
    const onData = (chunk) => {
      data = Buffer.concat([data, chunk]);
      if (data.includes(marker)) { cleanup(); resolve(data); }
    };
    const onError = (error) => { cleanup(); reject(error); };
    const cleanup = () => { socket.off('data', onData); socket.off('error', onError); };
    socket.on('data', onData);
    socket.once('error', onError);
  });
}

async function run() {
  console.log('Starting Proxy Probe Resilience Selftest...');
  clearProbeCache();

  // =========================================================================
  // Test 1: Probe Cache Key and Credential Masking
  // =========================================================================
  {
    const configWithPass = parseProxy('socks5://admin:superSecretPassword123@192.168.1.100:1080#tokyo-proxy');
    const key = getProbeCacheKey(configWithPass, 'ip-api');
    assert.strictEqual(key.includes('superSecretPassword123'), false, 'Cache key must NEVER include password');
    assert.strictEqual(key.includes('admin'), true, 'Cache key must include username');
    assert.strictEqual(key.includes(':h_'), true, 'Cache key must include password hash prefix');
    assert.strictEqual(key.includes('192.168.1.100:1080'), true, 'Cache key must include host:port');
    assert.strictEqual(key.includes('channel=ip-api'), true, 'Cache key must include probe channel');
    assert.strictEqual(key.startsWith('socks5://'), true, 'Cache key must include protocol');

    // Distinct channel produces distinct key
    const keyIfconfig = getProbeCacheKey(configWithPass, 'ifconfig-me');
    assert.notStrictEqual(key, keyIfconfig, 'Different channel must produce different cache key');

    // Distinct user on same host:port produces distinct key
    const configUser2 = parseProxy('socks5://user2:anotherSecret@192.168.1.100:1080');
    const keyUser2 = getProbeCacheKey(configUser2, 'ip-api');
    assert.notStrictEqual(key, keyUser2, 'Different user must produce different cache key');

    // Distinct password on same host:port and same user produces distinct key (residential proxy session isolation)
    const configPass2 = parseProxy('socks5://admin:sess_different_pass@192.168.1.100:1080');
    const keyPass2 = getProbeCacheKey(configPass2, 'ip-api');
    assert.notStrictEqual(key, keyPass2, 'Different password on same host:port must produce different cache key');

    // Same credentials on same host:port produces identical key (cache reuse)
    const configPassSame = parseProxy('socks5://admin:superSecretPassword123@192.168.1.100:1080');
    const keyPassSame = getProbeCacheKey(configPassSame, 'ip-api');
    assert.strictEqual(key, keyPassSame, 'Identical credentials on same host:port must produce identical cache key');

    // Only password (token auth, no user) isolates properly
    const configOnlyPass1 = parseProxy('http://:sess_us_101@10.0.0.1:8080');
    const configOnlyPass2 = parseProxy('http://:sess_jp_202@10.0.0.1:8080');
    const keyOnlyPass1 = getProbeCacheKey(configOnlyPass1, 'ip-api');
    const keyOnlyPass2 = getProbeCacheKey(configOnlyPass2, 'ip-api');
    assert.notStrictEqual(keyOnlyPass1, keyOnlyPass2, 'Different passwords without username must produce different cache keys');
    assert.strictEqual(keyOnlyPass1.includes(':h_'), true, 'Only-password cache key must include password hash prefix');
    assert.strictEqual(keyOnlyPass1.includes('sess_us_101'), false, 'Only-password cache key must not leak raw password');

    // No credentials
    const configNoUser = parseProxy('http://10.0.0.1:8080');
    const keyNoUser = getProbeCacheKey(configNoUser, 'ip-api');
    assert.strictEqual(keyNoUser, 'http://10.0.0.1:8080#channel=ip-api');

    // Only username without password
    const configOnlyUser = parseProxy('http://admin@10.0.0.1:8080');
    const keyOnlyUser = getProbeCacheKey(configOnlyUser, 'ip-api');
    assert.strictEqual(keyOnlyUser, 'http://admin@10.0.0.1:8080#channel=ip-api');
    console.log('  PASS  Cache key isolation and password masking verified');
  }

  // =========================================================================
  // Test 2: ProbeMemoryCache operations and TTL expiration
  // =========================================================================
  {
    const cache = new ProbeMemoryCache(5);
    cache.set('key1', { ip: '1.1.1.1' }, 50); // 50ms TTL
    cache.set('key2', { ip: '2.2.2.2' }, 5000); // 5s TTL

    assert.strictEqual(cache.get('key1', { allowStale: false })?.value?.ip, '1.1.1.1');
    assert.strictEqual(cache.get('key2', { allowStale: false })?.value?.ip, '2.2.2.2');
    assert.strictEqual(cache.size, 2);

    // Wait for key1 to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Fresh lookup misses for expired key1
    assert.strictEqual(cache.get('key1', { allowStale: false }), null, 'Expired key must not be returned on fresh lookup');
    // Stale lookup hits for expired key1
    const staleHit = cache.get('key1', { allowStale: true });
    assert.ok(staleHit, 'Expired key must be available for allowStale fallback');
    assert.strictEqual(staleHit.value.ip, '1.1.1.1');

    // Eviction on capacity
    for (let i = 3; i <= 8; i++) {
      cache.set(`key${i}`, { ip: `${i}.${i}.${i}.${i}` }, 5000);
    }
    assert.ok(cache.size <= 5, 'Cache must not exceed capacity');
    cache.clear();
    assert.strictEqual(cache.size, 0, 'Cache clear must empty map');
    console.log('  PASS  ProbeMemoryCache TTL expiration, allowStale, and eviction verified');
  }

  // =========================================================================
  // Test 3: isProxyLinkError and isProbeServiceError classification
  // =========================================================================
  {
    // Proxy link errors (can drive Fail-Closed)
    assert.strictEqual(isProxyLinkError(new Error('SOCKS5 authentication failed')), true);
    assert.strictEqual(isProxyLinkError(new Error('SOCKS5 username or password was rejected')), true);
    assert.strictEqual(isProxyLinkError(new Error('SOCKS5 upstream connection failed with code 5')), true);
    assert.strictEqual(isProxyLinkError(new Error('Proxy test tunnel failed with HTTP 407')), true);
    assert.strictEqual(isProxyLinkError(new Error('Proxy test tunnel failed with HTTP 502')), true);
    assert.strictEqual(isProxyLinkError(new Error('Proxy upstream connection failed: connect ECONNREFUSED')), true);
    assert.strictEqual(isProxyLinkError(new Error('connect ECONNREFUSED 127.0.0.1:1080')), true);
    assert.strictEqual(isProxyLinkError(new Error('getaddrinfo ENOTFOUND proxy.example.com')), true);
    assert.strictEqual(isProxyLinkError(new Error('Proxy connection timed out')), true);
    assert.strictEqual(isProxyLinkError(new Error('EHOSTUNREACH')), true);
    assert.strictEqual(isProxyLinkError(new Error('ENETUNREACH')), true);

    // Probe service errors (must NOT be treated as proxy unavailable)
    assert.strictEqual(isProxyLinkError(new Error('Proxy exit lookup returned HTTP 429')), false);
    assert.strictEqual(isProxyLinkError(new Error('Proxy exit lookup returned HTTP 500')), false);
    assert.strictEqual(isProxyLinkError(new Error('Proxy exit lookup returned HTTP 503')), false);
    assert.strictEqual(isProxyLinkError(new Error('ifconfig.me proxy check returned HTTP 429')), false);
    assert.strictEqual(isProxyLinkError(new Error('Proxy exit lookup timed out')), false);
    assert.strictEqual(isProxyLinkError(new Error('HTTPS proxy request timed out')), false);
    assert.strictEqual(isProxyLinkError(new Error('lookup timed out')), false);
    assert.strictEqual(isProxyLinkError(new SyntaxError('Unexpected token < in JSON at position 0')), false);

    // Verify isProbeServiceError
    assert.strictEqual(isProbeServiceError(new Error('Proxy exit lookup returned HTTP 429')), true);
    assert.strictEqual(isProbeServiceError(new Error('Proxy exit lookup returned HTTP 500')), true);
    assert.strictEqual(isProbeServiceError(new Error('Proxy exit lookup timed out')), true);
    assert.strictEqual(isProbeServiceError(new Error('HTTPS proxy request timed out')), true);
    assert.strictEqual(isProbeServiceError(new Error('lookup timed out')), true);
    assert.strictEqual(isProbeServiceError(new SyntaxError('Unexpected token < in JSON at position 0')), true);
    assert.strictEqual(isProbeServiceError(new Error('Proxy exit lookup response was incomplete')), true);
    assert.strictEqual(isProbeServiceError(new Error('ifconfig.me response did not contain a valid IP address')), true);

    // Proxy link errors must NOT be probe service errors
    assert.strictEqual(isProbeServiceError(new Error('SOCKS5 authentication failed')), false);
    assert.strictEqual(isProbeServiceError(new Error('connect ECONNREFUSED 127.0.0.1:1080')), false);
    assert.strictEqual(isProbeServiceError(new Error('Proxy test tunnel failed with HTTP 407')), false);

    console.log('  PASS  isProxyLinkError and isProbeServiceError classifications verified');
  }

  // =========================================================================
  // Test 4: classifyProxyError classification
  // =========================================================================
  {
    assert.strictEqual(classifyProxyError(new Error('SOCKS5 authentication failed')), 'auth');
    assert.strictEqual(classifyProxyError(new Error('Proxy username or password was rejected')), 'auth');
    assert.strictEqual(classifyProxyError(new Error('Proxy test tunnel failed with HTTP 407')), 'auth');
    assert.strictEqual(classifyProxyError(new Error('connect ECONNREFUSED 127.0.0.1:1080')), 'unreachable');
    assert.strictEqual(classifyProxyError(new Error('getaddrinfo ENOTFOUND proxy.example.com')), 'unreachable');
    assert.strictEqual(classifyProxyError(new Error('SOCKS5 proxy selected an unsupported authentication method')), 'protocol');

    // Probe unavailable classification
    const errProbe = new Error('出口探测服务暂时不可用（限频或网络超时）');
    errProbe.code = 'probe-unavailable';
    assert.strictEqual(classifyProxyError(errProbe), 'probe-unavailable');

    assert.strictEqual(classifyProxyError(new Error('Proxy exit lookup returned HTTP 429')), 'probe-unavailable');
    assert.strictEqual(classifyProxyError(new Error('rate limit reached')), 'probe-unavailable');
    assert.strictEqual(classifyProxyError(new Error('ifconfig.me proxy check returned HTTP 429')), 'probe-unavailable');

    // Ensure probe-unavailable is NEVER classified as unreachable
    assert.notStrictEqual(classifyProxyError(errProbe), 'unreachable');
    assert.notStrictEqual(classifyProxyError(new Error('Proxy exit lookup returned HTTP 429')), 'unreachable');

    console.log('  PASS  classifyProxyError respects probe-unavailable and avoids unreachable misclassification');
  }

  // =========================================================================
  // Test 5: Live lookupProxyCountry caching and bypass (force / refresh)
  // =========================================================================
  {
    clearProbeCache();
    // Start a mock upstream server that acts as an HTTP proxy
    let probeRequestsCount = 0;
    const mockProxyServer = net.createServer((client) => {
      let buffer = Buffer.alloc(0);
      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) return;
        client.removeListener('data', onData);
        const header = buffer.subarray(0, marker + 4).toString('latin1');
        if (/^CONNECT/i.test(header)) {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          // Mock TLS or raw data for HTTPS probe
          client.destroy();
        } else {
          // Plain GET http://ip-api.com/json/?fields=...
          probeRequestsCount += 1;
          const body = JSON.stringify({
            status: 'success',
            query: '198.51.100.42',
            countryCode: 'JP',
            country: 'Japan',
            regionName: 'Tokyo',
            city: 'Tokyo',
            zip: '100-0001',
            timezone: 'Asia/Tokyo',
            lat: 35.6895,
            lon: 139.6917,
            isp: 'MockISP',
            org: 'MockOrg',
            as: 'AS12345 Mock',
            asname: 'Mock',
            mobile: false,
            proxy: true,
            hosting: false,
          });
          const resp = `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`;
          client.end(resp);
        }
      };
      client.on('data', onData);
    });

    const mockPort = await listen(mockProxyServer);
    const proxyConfig = parseProxy(`http://testuser:testpass@127.0.0.1:${mockPort}`);

    // Call 1: cold cache -> performs network probe.
    // Since d2c1154 the probes in one cycle run concurrently, so a bypassed
    // cycle reaches the mock through 3 plaintext GET channels (ip-api.com,
    // ipwhois.app, freeipapi.com); the HTTPS channels fail their TLS handshake
    // against this plain mock and never complete a request. Assert per-cycle
    // deltas instead of cumulative counts.
    const beforeFirst = probeRequestsCount;
    const result1 = await lookupProxyCountry(proxyConfig, { ttlMs: 60000 });
    assert.strictEqual(result1.ip, '198.51.100.42');
    assert.strictEqual(result1.countryCode, 'JP');
    assert.strictEqual(result1.fromCache, undefined);
    assert.strictEqual(probeRequestsCount - beforeFirst, 3, 'First call must probe the network');

    // Call 2: repeated call -> hits memory TTL cache
    const beforeSecond = probeRequestsCount;
    const result2 = await lookupProxyCountry(proxyConfig);
    assert.strictEqual(result2.ip, '198.51.100.42');
    assert.strictEqual(result2.countryCode, 'JP');
    assert.strictEqual(result2.cached, true, 'Second call must have cached: true');
    assert.strictEqual(result2.fromCache, true, 'Second call must have fromCache: true');
    assert.strictEqual(probeRequestsCount - beforeSecond, 0, 'Cache hit must NOT perform any network probe');

    // Call 3: bypass cache using force: true
    const beforeForce = probeRequestsCount;
    const result3 = await lookupProxyCountry(proxyConfig, { force: true });
    assert.strictEqual(result3.ip, '198.51.100.42');
    assert.strictEqual(result3.fromCache, undefined);
    assert.strictEqual(probeRequestsCount - beforeForce, 3, 'force: true must bypass cache and hit network');

    // Call 4: bypass cache using refresh: true
    const beforeRefresh = probeRequestsCount;
    const result4 = await lookupProxyCountry(proxyConfig, { refresh: true });
    assert.strictEqual(result4.ip, '198.51.100.42');
    assert.strictEqual(result4.fromCache, undefined);
    assert.strictEqual(probeRequestsCount - beforeRefresh, 3, 'refresh: true must bypass cache and hit network');

    await new Promise((resolve) => mockProxyServer.close(resolve));
    console.log('  PASS  lookupProxyCountry memory cache hit and force/refresh bypass verified');
  }

  // =========================================================================
  // Test 6: Probe Service Unavailable (429) -> Stale Cache Fallback
  // =========================================================================
  {
    clearProbeCache();
    let shouldRateLimit = false;
    const rateLimitProxyServer = net.createServer((client) => {
      let buffer = Buffer.alloc(0);
      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) return;
        client.removeListener('data', onData);
        const header = buffer.subarray(0, marker + 4).toString('latin1');
        if (/^CONNECT/i.test(header)) {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          client.destroy();
        } else {
          if (shouldRateLimit) {
            // Return 429 Too Many Requests
            const body = JSON.stringify({ status: 'fail', message: 'rate limited' });
            client.end(`HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n${body}`);
          } else {
            // Return 200 OK
            const body = JSON.stringify({
              status: 'success',
              query: '203.0.113.88',
              countryCode: 'SG',
              country: 'Singapore',
            });
            client.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n${body}`);
          }
        }
      };
      client.on('data', onData);
    });

    const rateLimitPort = await listen(rateLimitProxyServer);
    const proxyConfig = parseProxy(`http://127.0.0.1:${rateLimitPort}`);

    // First call: succeeds with 10ms TTL so it expires immediately
    const firstResult = await lookupProxyCountry(proxyConfig, { ttlMs: 10 });
    assert.strictEqual(firstResult.ip, '203.0.113.88');
    assert.strictEqual(firstResult.countryCode, 'SG');

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Enable rate limit (429)
    shouldRateLimit = true;

    // Call again: fresh cache is expired, network lookup returns 429 -> must fall back to stale cache!
    const fallbackResult = await lookupProxyCountry(proxyConfig);
    assert.strictEqual(fallbackResult.ip, '203.0.113.88', 'Must reuse expired cache IP on probe 429');
    assert.strictEqual(fallbackResult.countryCode, 'SG');
    assert.strictEqual(fallbackResult.stale, true, 'Must indicate stale result');
    assert.strictEqual(fallbackResult.probeUnavailable, true, 'Must indicate probe unavailable');

    await new Promise((resolve) => rateLimitProxyServer.close(resolve));
    console.log('  PASS  Probe service 429 correctly falls back to stale cache');
  }

  // =========================================================================
  // Test 7: Probe Service Unavailable (429) -> Profile exitIp Fallback
  // =========================================================================
  {
    clearProbeCache();
    // Server returns 429 on all requests
    const always429Server = net.createServer((client) => {
      let buffer = Buffer.alloc(0);
      client.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) return;
        const header = buffer.subarray(0, marker + 4).toString('latin1');
        if (/^CONNECT/i.test(header)) {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          client.destroy();
        } else {
          const body = JSON.stringify({ status: 'fail', message: 'rate limited' });
          client.end('HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n' + body);
        }
      });
    });
    const port429 = await listen(always429Server);
    const proxyConfig = parseProxy(`http://127.0.0.1:${port429}`);

    // No cache entry exists, but profile has known exitIp
    const profile = {
      exitIp: '198.51.100.99',
      exitCountryCode: 'DE',
      exitCountry: 'Germany',
    };

    const fallbackResult = await lookupProxyCountry(proxyConfig, { profile });
    assert.strictEqual(fallbackResult.ip, '198.51.100.99', 'Must reuse profile exitIp');
    assert.strictEqual(fallbackResult.countryCode, 'DE', 'Must reuse profile exitCountryCode');
    assert.strictEqual(fallbackResult.fallback, true, 'Must be marked as fallback');
    assert.strictEqual(fallbackResult.probeUnavailable, true, 'Must be marked as probeUnavailable');

    await new Promise((resolve) => always429Server.close(resolve));
    console.log('  PASS  Probe service 429 correctly falls back to profile existing exit details');
  }

  // =========================================================================
  // Test 8: Probe Service Unavailable with Zero Knowledge -> code 'probe-unavailable'
  // =========================================================================
  {
    clearProbeCache();
    const always429Server = net.createServer((client) => {
      client.on('data', () => {
        client.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
      });
    });
    const port429 = await listen(always429Server);
    const proxyConfig = parseProxy(`http://127.0.0.1:${port429}`);

    let caught = null;
    try {
      await lookupProxyCountry(proxyConfig);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught, 'Must throw error when completely unknown');
    assert.strictEqual(caught.code, 'probe-unavailable', 'Error code must be probe-unavailable');
    assert.strictEqual(caught.errorClass, 'probe-unavailable', 'errorClass must be probe-unavailable');
    assert.notStrictEqual(caught.errorClass, 'unreachable', 'Must NEVER disguise probe-unavailable as unreachable');

    await new Promise((resolve) => always429Server.close(resolve));
    console.log('  PASS  Probe service 429 with zero knowledge throws distinct probe-unavailable error');
  }

  // =========================================================================
  // Test 9: Proxy Link Failure (SOCKS5 Auth Failure) -> drives Fail-Closed
  // =========================================================================
  {
    clearProbeCache();
    // SOCKS5 server that immediately rejects authentication
    const rejectAuthSocksServer = net.createServer((sock) => {
      sock.on('error', () => {});
      sock.once('data', () => {
        sock.write(Buffer.from([5, 2])); // Require user/pass auth
        sock.once('data', () => {
          sock.write(Buffer.from([1, 1])); // Status 1: auth failed
        });
      });
    });
    const badAuthPort = await listen(rejectAuthSocksServer);
    const badProxy = parseProxy(`socks5://wronguser:wrongpass@127.0.0.1:${badAuthPort}`);

    // Even if profile has exitIp, a true PROXY LINK FAILURE must throw and NOT fall back!
    const profile = { exitIp: '1.2.3.4', exitCountryCode: 'US' };

    let caught = null;
    try {
      await lookupProxyCountry(badProxy, { profile });
    } catch (err) {
      caught = err;
    }

    assert.ok(caught, 'Must throw error on proxy link failure');
    assert.strictEqual(caught.errorClass, 'auth', 'Error class must be auth for SOCKS5 auth failure');
    assert.notStrictEqual(caught.errorClass, 'probe-unavailable', 'Proxy link failure must NOT be classified as probe-unavailable');

    await new Promise((resolve) => rejectAuthSocksServer.close(resolve));
    console.log('  PASS  True proxy link failure (auth) drives Fail-Closed and is NOT suppressed');
  }

  // =========================================================================
  // Test 10: Proxy Link Failure (ECONNREFUSED) -> drives Fail-Closed
  // =========================================================================
  {
    clearProbeCache();
    // Connect to a closed port
    const badProxy = parseProxy('http://127.0.0.1:1');
    const profile = { exitIp: '1.2.3.4', exitCountryCode: 'US' };

    let caught = null;
    try {
      await lookupProxyCountry(badProxy, { profile });
    } catch (err) {
      caught = err;
    }

    assert.ok(caught, 'Must throw error on connection refused');
    assert.strictEqual(caught.errorClass, 'unreachable', 'Error class must be unreachable for ECONNREFUSED');
    assert.notStrictEqual(caught.errorClass, 'probe-unavailable');

    console.log('  PASS  True proxy link failure (ECONNREFUSED) drives Fail-Closed and is NOT suppressed');
  }

  // =========================================================================
  // Test 11: 429 from the probe source must NOT count as tunnel verification
  // =========================================================================
  {
    clearProbeCache();
    const always429Server = net.createServer((client) => {
      let buffer = Buffer.alloc(0);
      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) return;
        client.removeListener('data', onData);
        const header = buffer.subarray(0, marker + 4).toString('latin1');
        if (/^CONNECT/i.test(header)) {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          client.destroy();
        } else {
          const body = JSON.stringify({ status: 'fail', message: 'rate limited' });
          client.end(`HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n${body}`);
        }
      };
      client.on('data', onData);
    });
    const port429 = await listen(always429Server);
    const proxyConfig = parseProxy(`http://127.0.0.1:${port429}`);

    // (a) completely unknown -> probe-unavailable error carrying NO verification
    let caught = null;
    try {
      await lookupProxyCountry(proxyConfig);
    } catch (err) {
      caught = err;
    }
    assert.ok(caught, 'Must throw when nothing is known');
    assert.strictEqual(caught.code, 'probe-unavailable');
    assert.notStrictEqual(caught.transportVerified, true, 'a 429 is NOT tunnel verification');
    assert.strictEqual(caught.transportVerifiedAt, undefined);

    // (b) prior exit info exists but was never verified -> degraded reuse, still NOT verified
    clearProbeCache();
    const fallback = await lookupProxyCountry(proxyConfig, {
      previousResult: { ip: '198.51.100.55', countryCode: 'FR', latencyMs: 120 },
    });
    assert.strictEqual(fallback.ip, '198.51.100.55');
    assert.strictEqual(fallback.fallback, true);
    assert.strictEqual(fallback.probeUnavailable, true);
    assert.notStrictEqual(fallback.transportVerified, true, 'reuse must never upgrade verification');
    assert.strictEqual(fallback.transportVerifiedAt, null, 'no timestamp is manufactured on reuse');

    await new Promise((resolve) => always429Server.close(resolve));
    console.log('  PASS  429 (probe unavailable) never counts as tunnel verification');
  }

  // =========================================================================
  // Test 12: real 2xx round trip through the tunnel -> transportVerified true
  // =========================================================================
  {
    clearProbeCache();
    const okServer = net.createServer((client) => {
      let buffer = Buffer.alloc(0);
      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) return;
        client.removeListener('data', onData);
        const header = buffer.subarray(0, marker + 4).toString('latin1');
        if (/^CONNECT/i.test(header)) {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          client.destroy();
          return;
        }
        const body = JSON.stringify({
          status: 'success',
          query: '198.51.100.42',
          countryCode: 'JP',
          country: 'Japan',
          regionName: 'Tokyo',
          city: 'Tokyo',
          timezone: 'Asia/Tokyo',
          isp: 'MockISP',
        });
        client.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`);
      };
      client.on('data', onData);
    });
    const okPort = await listen(okServer);
    const proxyConfig = parseProxy(`http://probeuser:probepass@127.0.0.1:${okPort}`);

    const result = await lookupProxyCountry(proxyConfig, { ttlMs: 60000 });
    assert.strictEqual(result.ip, '198.51.100.42');
    assert.strictEqual(result.transportVerified, true, 'a real 2xx round trip through the tunnel verifies the transport');
    assert.ok(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.transportVerifiedAt || ''),
      'verification must carry an ISO timestamp',
    );

    // Cache reuse keeps the stored verification state verbatim
    const cached = await lookupProxyCountry(proxyConfig);
    assert.strictEqual(cached.cached, true);
    assert.strictEqual(cached.transportVerified, true);
    assert.strictEqual(cached.transportVerifiedAt, result.transportVerifiedAt, 'reuse reports the stored timestamp');

    await new Promise((resolve) => okServer.close(resolve));
    console.log('  PASS  real 2xx through the tunnel sets transportVerified=true with ISO timestamp');
  }

  // =========================================================================
  // Test 13: startup gate - previously verified + probe failing now -> lenient pass
  // =========================================================================
  {
    clearProbeCache();
    let mode = 'ok';
    const gateServer = net.createServer((client) => {
      let buffer = Buffer.alloc(0);
      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) return;
        client.removeListener('data', onData);
        const header = buffer.subarray(0, marker + 4).toString('latin1');
        if (/^CONNECT/i.test(header)) {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          client.destroy();
          return;
        }
        if (mode === '429') {
          const body = JSON.stringify({ status: 'fail', message: 'rate limited' });
          client.end(`HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n${body}`);
          return;
        }
        const body = JSON.stringify({
          status: 'success',
          query: '203.0.113.21',
          countryCode: 'JP',
          country: 'Japan',
          timezone: 'Asia/Tokyo',
        });
        client.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`);
      };
      client.on('data', onData);
    });
    const gatePort = await listen(gateServer);
    const proxyUrl = `http://127.0.0.1:${gatePort}`;

    const events = [];
    const host = {};
    Object.assign(host, require('../../engine/profile-proxy'), {
      profiles: new Map(),
      networkInfo: new Map(),
      running: new Set(),
      emit(event) { events.push(event); },
      invalidateStatusCache() {},
      sanitizeProfile(profile) { return profile; },
      resolveStoredProxyProfile(profile) { return profile; },
      restoreStoredProxyCredentials(profile) { return profile; },
      fingerprintPatchFromNetwork() { return {}; },
      persist() { return Promise.resolve(); },
    });
    const baseProfile = (id) => ({
      id,
      name: 'gate-' + id,
      networkMode: 'proxy',
      proxy: proxyUrl,
      exitCountryCode: 'JP',
      privacy: { timezone: 'Asia/Tokyo' },
    });

    // (a) a genuine 2xx round trip produces a verified network record
    mode = 'ok';
    const okProfile = baseProfile('gate-verified');
    host.profiles.set(okProfile.id, okProfile);
    const network = await host.checkProxy(okProfile);
    assert.strictEqual(network.ip, '203.0.113.21');
    assert.strictEqual(network.transportVerified, true, '2xx through the tunnel verifies');
    assert.strictEqual(host.networkInfo.get(okProfile.id).transportVerified, true);

    // (b) probe failing now: with a previously verified tunnel the gate passes leniently.
    // The lenient branch reads the verification flag off the prior state; a prior
    // state that still carries a resolvable exit ip is served earlier by the
    // fallback-result path, so shape the prior state with the flag but no ip.
    mode = '429';
    clearProbeCache();
    const verifiedProfile = baseProfile('gate-lenient');
    host.profiles.set(verifiedProfile.id, verifiedProfile);
    host.networkInfo.set(verifiedProfile.id, {
      transportVerified: true,
      transportVerifiedAt: '2026-11-08T00:00:00.000Z',
      ip: '',
      countryCode: 'JP',
    });
    const passed = await host.prepareProfileProxyForStart(verifiedProfile);
    assert.strictEqual(passed.id, 'gate-lenient', 'lenient branch returns the working profile');
    assert.ok(passed.proxy && passed.proxy.length > 0, 'lenient branch keeps the proxy configured');
    assert.ok(
      events.some((e) => e.type === 'proxy-warn' && e.code === 'probe-unavailable'),
      'lenient pass must emit the probe-unavailable warning',
    );

    // (c) never verified + probe failing now -> startup is blocked (no real evidence)
    clearProbeCache();
    const unverifiedProfile = baseProfile('gate-blocked');
    host.profiles.set(unverifiedProfile.id, unverifiedProfile);
    host.networkInfo.set(unverifiedProfile.id, {
      transportVerified: false,
      ip: '',
      countryCode: 'JP',
    });
    let blocked = null;
    try {
      await host.prepareProfileProxyForStart(unverifiedProfile);
    } catch (error) {
      blocked = error;
    }
    assert.ok(blocked, 'an unverified tunnel must block startup');
    assert.strictEqual(blocked.code, 'probe-unavailable');
    assert.ok(
      events.some((e) => e.type === 'proxy-error' && e.code === 'probe-unavailable' && e.policy === 'block'),
      'block must be reported as proxy-error with policy block',
    );

    await new Promise((resolve) => gateServer.close(resolve));
    console.log('  PASS  startup gate: verified-before + probe-failing-now passes leniently, unverified blocks');
  }

  console.log('\nPROXY_PROBE_RESILIENCE_SELFTEST_OK 13/13 tests passed!\n');
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
