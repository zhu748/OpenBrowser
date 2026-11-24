'use strict';

const NETWORK_INFO_FIELDS = Object.freeze(['type', 'effectiveType', 'downlink', 'downlinkMax', 'rtt', 'saveData']);

// Evaluated in the document's main world. The paused-tab path only reads
// synchronous values, since a paused target cannot settle native promises.
const documentSnapshot = `((hints, networkFields) => {
  const network = navigator.connection;
  const connection = network
    ? Object.fromEntries(networkFields.filter(key => key in network).map(key => [key, network[key]]))
    : null;
  return {
    href: String(location.href || ''),
    userAgent: navigator.userAgent, platform: navigator.platform,
    language: navigator.language, languages: Array.from(navigator.languages || []),
    hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory,
    deviceMemoryPresent: 'deviceMemory' in navigator, secureContext: globalThis.isSecureContext === true,
    vendor: navigator.vendor, screenWidth: screen.width, screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio, connection,
    webdriver: navigator.webdriver === true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    uaDataPresent: Boolean(hints), uaDataPlatform: hints?.platform ?? null,
    uaDataBrands: hints ? Array.from(hints.brands || [], ({ brand, version }) => ({ brand, version })) : null,
    uaDataMobile: hints?.mobile ?? null,
  };
})(hints, ${JSON.stringify(NETWORK_INFO_FIELDS)})`;

const PAUSED_DOCUMENT_PROBE = `(() => { const hints = navigator.userAgentData; return ${documentSnapshot}; })()`;

const LIVE_PROBE_EXPRESSION = `(async () => {
  try {
    const hints = navigator.userAgentData;
    const snapshot = ${documentSnapshot};
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    let uaDataHighEntropy = null, uaDataError = null, entropyTimer;
    if (snapshot.uaDataPresent && snapshot.secureContext) {
      try {
        uaDataHighEntropy = await Promise.race([
          hints.getHighEntropyValues(['architecture', 'bitness', 'model', 'platformVersion', 'uaFullVersion', 'fullVersionList', 'wow64']),
          new Promise((resolve, reject) => { entropyTimer = setTimeout(() => reject(new Error('Client Hints probe timeout')), 1500); }),
        ]);
      } catch (error) { uaDataError = String(error && error.message || error); }
      finally { clearTimeout(entropyTimer); }
    }
    return {
      ...snapshot,
      webglContextPresent: Boolean(gl),
      webglUnmasked: Boolean(ext),
      webglVendor: gl ? gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR) : null,
      webglRenderer: gl ? gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) : null,
      uaDataHighEntropy, uaDataError,
    };
  } catch (error) {
    return { probeError: String(error && error.message || error) };
  }
})()`;

module.exports = { LIVE_PROBE_EXPRESSION, PAUSED_DOCUMENT_PROBE, NETWORK_INFO_FIELDS };
