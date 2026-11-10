(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBrowserIpcResult = api;
})(globalThis, () => {
  'use strict';

  // Return plain data across IPC/contextBridge: Error custom properties are lost.
  async function captureIpcResult(operation) {
    try {
      return { ipcResult: 1, ok: true, value: await operation() };
    } catch (error) {
      const detail = { message: String(error?.message || error || 'Operation failed') };
      if (typeof error?.code === 'string' || typeof error?.code === 'number') detail.code = error.code;
      if (Array.isArray(error?.stale)) {
        detail.stale = error.stale.map(({ id, baseRev, rev }) => ({ id, baseRev, rev }));
      }
      return { ipcResult: 1, ok: false, error: detail };
    }
  }

  function unwrapIpcResult(result) {
    if (!result || result.ipcResult !== 1) return result;
    if (result.ok) return result.value;
    const detail = result.error || {};
    const error = new Error(detail.message || 'Operation failed');
    if (detail.code !== undefined) error.code = detail.code;
    if (Array.isArray(detail.stale)) error.stale = detail.stale;
    throw error;
  }

  return { captureIpcResult, unwrapIpcResult };
});
