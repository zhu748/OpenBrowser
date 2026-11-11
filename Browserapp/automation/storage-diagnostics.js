'use strict';

/** Summaries only: raw failed rows/errors can contain credentials. */
function collectStorageDiagnostics({ engine, automation } = {}) {
  const warnings = [];
  const decodeCount = engine?.sqliteStore?.decodeFailureReport?.().count || 0;
  if (decodeCount) warnings.push({ code: 'PROFILE_DECODE_FAILED', count: decodeCount,
    message: `Could not decode ${decodeCount} profile(s). Original data was preserved; check the key before restoring.` });
  if (engine?.storageRecovery) warnings.push({ code: 'ENGINE_RECOVERED',
    message: 'Profile settings were recovered from a backup. Check your recent changes.' });
  if (automation?.rpaStore?.loadReport?.quarantined) warnings.push({ code: 'RPA_QUARANTINED',
    message: 'The RPA store was damaged. The original file was preserved; restore plans and task history.' });
  const badProxies = automation?.proxyStore?.loadReport?.badRecordCount || 0;
  if (badProxies) warnings.push({ code: 'PROXY_RECORD_INVALID', count: badProxies,
    message: `${badProxies} proxy record(s) have invalid data. Review proxy settings.` });
  return { warnings };
}

module.exports = { collectStorageDiagnostics };
