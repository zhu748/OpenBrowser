'use strict';

/** Read a fetch response with a byte cap; cancel rejected streams promptly. */
async function readResponseBuffer(response, limitBytes, message = 'Response body exceeds size limit') {
  const tooLarge = () => Object.assign(new Error(message), { code: 'ERESPONSETOOLARGE' });
  if (Number(response.headers?.get('content-length')) > limitBytes) {
    try { Promise.resolve(response.body?.cancel()).catch(() => {}); } catch { /* best effort */ }
    throw tooLarge();
  }
  const reader = response.body?.getReader?.();
  if (!reader) {
    // Compatibility with non-streaming adapters; their buffer is validated
    // after reading. Production host fetch responses expose a readable stream.
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > limitBytes) throw tooLarge();
    return buffer;
  }
  const chunks = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > limitBytes) throw tooLarge();
      chunks.push(Buffer.from(value));
    }
    return chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, received);
  } catch (error) {
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* best effort */ }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

module.exports = { readResponseBuffer };
