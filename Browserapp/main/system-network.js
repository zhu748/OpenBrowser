'use strict';

const { assertSafeOutboundUrl } = require('../network/outbound');

function createSystemNetworkRequester(session) {
  let ready;
  return async (url, { timeout = 10000, maxBytes = 2 * 1024 * 1024 } = {}) => {
    // Only internal probe endpoints reach this transport. Do not follow redirects to other hosts.
    const target = assertSafeOutboundUrl(url, { allowPrivate: false });
    const networkSession = session.fromPartition('openbrowser-system-network');
    ready ||= networkSession.setProxy({ mode: 'system' }).catch(error => {
      ready = undefined;
      throw error;
    });
    await ready;
    const response = await networkSession.fetch(target.href, {
      credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(timeout),
    });
    const chunks = [];
    let received = 0;
    if (response.body) {
      for await (const chunk of response.body) {
        const part = chunk.subarray(0, maxBytes - received);
        chunks.push(part);
        received += part.length;
        if (received === maxBytes) break;
      }
    }
    return { status: response.status, body: Buffer.concat(chunks).toString('utf8') };
  };
}

module.exports = { createSystemNetworkRequester };
