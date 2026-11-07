'use strict';

/**
 * runtime-settings mixin for BrowserEngine (prototype-assigned by engine.js).
 * Extracted verbatim from engine.js during the decomposition; see the class
 * body in engine.js for the remaining methods and engine/start.js for the
 * startup routine that drives these.
 */

const cdp = require('../cdp');
const { applyFingerprintToTab, buildFingerprint } = require('../automation/fingerprint');
const { LIVE_PROBE_EXPRESSION, fpLog, summarizeFp, logPath: fingerprintLogPath } = require('../automation/fingerprint-debug-log');
const { sanitizeUrlForLog } = require('../automation/log-sanitizer');
const { buildPortScanProtectionScript } = require('../automation/port-scan-protection');
const { fingerprintConfigHash, isEphemeralDocumentUrl } = require('./fingerprint-injection');

module.exports = {
  async applyRuntimeSettings(port, profile, fingerprint = null, options = {}) {
    const phase = String(options.phase || 'applyRuntimeSettings');
    const tabs = await cdp.tabs(port);
    const network = this.networkInfo.get(profile.id) || {};
    // merge IP-detected geo/tz into profile for fingerprint apply
    const enriched = {
      ...profile,
      exitTimezone: profile.exitTimezone || network.timezone || '',
      exitLatitude: profile.exitLatitude ?? network.latitude,
      exitLongitude: profile.exitLongitude ?? network.longitude,
    };
    const fp = fingerprint || buildFingerprint(enriched);
    const fpHash = fingerprintConfigHash(fp);
    // Track which CDP page targets already received inject (new tabs must not skip FP)
    const applied = options.appliedTargetIds instanceof Set ? options.appliedTargetIds : new Set();
    // Only a recorded hash may invalidate the cache: callers that never tracked one keep the
    // previous behaviour, while a real config change forces every live tab to be re-applied.
    const configChanged = Boolean(options.appliedFingerprintHash)
      && options.appliedFingerprintHash !== fpHash;
    if (configChanged) applied.clear();
    const blocked = [];
    if (profile.advanced.blockVideo) blocked.push('*.mp4', '*.webm', '*.m3u8', '*.mov', '*.avi');
    const customBlock = String(profile.advanced.blockUrls || '')
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 200);
    for (const u of customBlock) if (!blocked.includes(u)) blocked.push(u);
    // Port scan protection: block common localhost probe ports unless allow-listed
    // Speech voices: fingerprint injection (speech.mode blocked/noise/real)
    let portScanScript = null;
    if (profile.privacy.portScanProtect) {
      portScanScript = buildPortScanProtectionScript(profile.privacy.portScanAllow);
    }

    // Re-injecting a document that already carries this exact config stacks a second layer of
    // noise on the readers, which moves canvas / clientRects while the profile is already in use,
    // so a pass only covers tabs that are unmarked or that carry a different config. Recovery of
    // a single suspect tab goes through applyFingerprintToTab directly instead.
    const force = configChanged;
    // Steady state: the watch loop calls this every ~2.4s per running profile. When every
    // live tab already carries the inject there is nothing to do, and logging begin/skip/end
    // each time would burn disk and append tab URLs to the diagnostic log forever.
    // Prune closed targets, keep the tracked state fresh, and return quietly.
    if (!force && tabs.every((tab) => applied.has(tab.id))) {
      const liveIds = new Set(tabs.map((tab) => tab.id));
      for (const id of [...applied]) {
        if (!liveIds.has(id)) applied.delete(id);
      }
      if (options.trackOn) {
        options.trackOn.fpAppliedTargets = applied;
        options.trackOn.fpAppliedHash = fpHash;
        options.trackOn.fingerprint = fp;
      }
      return fp;
    }

    await fpLog('inject.begin', {
      phase,
      profileId: profile.id,
      port,
      tabCount: tabs.length,
      tabUrls: tabs.map((t) => ({ id: t.id, url: String(t.url || '').slice(0, 200) })),
      intended: summarizeFp(fp),
      logFile: fingerprintLogPath(),
    });

    for (const tab of tabs) {
      if (!force && applied.has(tab.id)) {
        await fpLog('inject.skip-tab', { phase, profileId: profile.id, tabId: tab.id, url: tab.url, reason: 'already-applied' });
        continue;
      }
      try {
        const fontBlobBridge = fp?.fontBlobBridge || options?.trackOn?.fontBlobBridge || options?.trackOn?.fingerprint?.fontBlobBridge;
        if (fontBlobBridge?.channelName && tab.webSocketDebuggerUrl) {
          if (options?.trackOn) { options.trackOn.fontBlobBridge = fontBlobBridge; options.trackOn.fingerprint = fp; }
          try {
            await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.enable', {}).catch(() => {});
            await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.addBinding', { name: fontBlobBridge.channelName }).catch((err) => {
              const msg = String(err?.message || err);
              if (!/already exists/i.test(msg)) {}
            });
          } catch (_) {}
        }
        await applyFingerprintToTab(cdp.call, tab.webSocketDebuggerUrl, fp, enriched, {
          livePatchDocument: isEphemeralDocumentUrl(tab.url),
        });
        let live = null;
        try {
          const probe = await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: LIVE_PROBE_EXPRESSION,
            returnByValue: true,
          }, 8000);
          live = probe?.result?.value || probe?.value || null;
        } catch (probeError) {
          live = { probeError: String(probeError.message || probeError) };
        }
        const mismatch = live && !live.probeError ? {
          ua: Boolean(fp.userAgent && live.userAgent && fp.userAgent !== live.userAgent),
          platform: Boolean(fp.platform && live.platform && fp.platform !== live.platform),
          cores: fp.hardwareConcurrency != null && live.hardwareConcurrency != null
            && Number(fp.hardwareConcurrency) !== Number(live.hardwareConcurrency),
          memory: fp.deviceMemory != null && live.deviceMemory != null
            && Number(fp.deviceMemory) !== Number(live.deviceMemory),
          webglRenderer: Boolean(fp.webgl?.renderer && live.webglRenderer
            && String(live.webglRenderer) !== String(fp.webgl.renderer)
            && !String(live.webglRenderer).includes(String(fp.webgl.renderer).slice(0, 24))),
        } : null;
        await fpLog('inject.tab-ok', {
          phase,
          profileId: profile.id,
          tabId: tab.id,
          url: sanitizeUrlForLog(tab.url).slice(0, 240),
          intended: summarizeFp(fp),
          live,
          mismatch,
        });
        // If probe still shows host hardware, re-evaluate inject once more immediately.
        if (mismatch && (mismatch.cores || mismatch.webglRenderer || mismatch.memory)) {
          await fpLog('inject.tab-ineffective', {
            phase,
            profileId: profile.id,
            tabId: tab.id,
            mismatch,
          });
          try {
            await applyFingerprintToTab(cdp.call, tab.webSocketDebuggerUrl, fp, enriched, {
              force: true,
              livePatchDocument: isEphemeralDocumentUrl(tab.url),
            });
            const probe2 = await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
              expression: LIVE_PROBE_EXPRESSION,
              returnByValue: true,
            }, 8000);
            const live2 = probe2?.result?.value || probe2?.value || null;
            await fpLog('inject.tab-retry', {
              phase,
              profileId: profile.id,
              tabId: tab.id,
              live: live2,
            });
            const coresOk = !(fp.hardwareConcurrency != null && live2?.hardwareConcurrency != null
              && Number(fp.hardwareConcurrency) !== Number(live2.hardwareConcurrency));
            const webglOk = !(fp.webgl?.renderer && live2?.webglRenderer
              && String(live2.webglRenderer) !== String(fp.webgl.renderer)
              && /Radeon|GeForce|W6800|GTX |RTX /i.test(String(live2.webglRenderer)));
            if (coresOk && webglOk) applied.add(tab.id);
            // else leave unmarked so force/post-startpage can try again
          } catch (retryError) {
            await fpLog('inject.tab-retry-fail', {
              phase,
              profileId: profile.id,
              tabId: tab.id,
              error: String(retryError.message || retryError),
            });
          }
        } else {
          applied.add(tab.id);
        }
      } catch (error) {
        await fpLog('inject.tab-fail', {
          phase,
          profileId: profile.id,
          tabId: tab.id,
          url: sanitizeUrlForLog(tab.url).slice(0, 240),
          error: String(error.message || error),
        });
        // Soft-fail per tab: keep trying other tabs / later phases instead of aborting start.
        const msg = String(error.message || error || '');
        if (!/Uncaught|already in effect|cannot be overridden|softInject/i.test(msg)) {
          throw error;
        }
      }
      if (blocked.length) {
        await cdp.call(tab.webSocketDebuggerUrl, 'Network.enable');
        await cdp.call(tab.webSocketDebuggerUrl, 'Network.setBlockedURLs', { urls: blocked });
      }
      if (portScanScript) {
        await cdp.call(tab.webSocketDebuggerUrl, 'Page.addScriptToEvaluateOnNewDocument', { source: portScanScript });
        await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: portScanScript });
      }
      // applied.add only when probe matched (see above)
    }
    // Drop closed targets so Set does not grow forever
    const liveIds = new Set(tabs.map((t) => t.id));
    for (const id of [...applied]) {
      if (!liveIds.has(id)) applied.delete(id);
    }
    if (options.trackOn) {
      options.trackOn.fpAppliedTargets = applied;
      options.trackOn.fpAppliedHash = fpHash;
      options.trackOn.fingerprint = fp;
    }
    await fpLog('inject.end', { phase, profileId: profile.id, applied: applied.size, port });
    return fp;
  },
};
