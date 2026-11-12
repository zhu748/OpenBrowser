'use strict';

/**
 * Lifecycle cleanup mixin for BrowserEngine (prototype-assigned by engine.js):
 * post-exit helper draining, profile-lock release, browser-gone handling, the
 * running-item watch dog, and the start-generation / stop-request latch that
 * keeps concurrent starts and stops from interleaving.
 *
 * Windows helper processes can outlive the browser by several seconds while
 * profile databases close; HELPER_CLEANUP_* keeps the profile lock held until
 * the OS process list confirms they are gone, giving taskkill enough time on
 * slower RDP/VM hosts.
 */

const HELPER_CLEANUP_ATTEMPTS = process.platform === 'win32' ? 32 : 3;
const HELPER_CLEANUP_DELAY_MS = process.platform === 'win32' ? 250 : 120;
const HELPER_CLEANUP_TIMEOUT_MS = process.platform === 'win32' ? 14000 : 3000;

const cdp = require('../cdp');
const isolation = require('../automation/isolation');
const { isPidAlive, isProfileLockOwner, lockPath, releaseProfileLock } = require('../automation/isolation');
const { fingerprintForNativeKernelInject } = require('../automation/kernel-init-sync');
const { killProcessTree } = require('../automation/protocol/cross-platform');
const { isChildExited, managedBrowserKillOptions, removeSingletonFiles, stopIpcStubForWindow } = require('./index');
const fs = require('fs');
const { saveDeferredSession } = require('./startup-session');
const { assertUrlAccessPolicySupported } = require('../automation/url-access-policy');
const { runtimePolicyProfile } = require('./runtime-policy');
const { closePageFingerprintConnections } = require('./fingerprint-transport');

module.exports = {
  cleanupRunningItem(profileId, item, options = {}) {
    if (!item) return Promise.resolve({ id: profileId, running: false });
    if (item.cleanupPromise?.lifecycleSettled) item.cleanupPromise = null;
    if (item.cleanupPromise) return item.cleanupPromise;
    if (item.cleanedUp) return Promise.resolve({ id: profileId, running: false });

    // Private connections belong to the captured item. The directory, helper
    // scan and named IPC stub are shared across restarts and require current
    // generation AND lock ownership. Re-check after awaits, including child exit.
    const ownsSharedResources = () => {
      const current = this.running.get(profileId);
      if (current && current !== item) return false;
      const latest = Math.max(Number(this.lifecycleGenerations?.get(profileId)) || 0,
        Number(this.starting.get(profileId)?.lifecycleGeneration) || 0);
      if (Number(item.lifecycleGeneration) > 0 && latest > Number(item.lifecycleGeneration)) return false;
      return isProfileLockOwner(item.root, item.profileLock);
    };

    const reason = String(options.reason || 'browser-gone');
    const wasStopping = Boolean(item.stopping);
    const cleanup = async () => {
      // Mark first so the watcher and any late startup continuation stop touching
      // a browser whose ownership is already being torn down. Keep `running` until
      // all external resources have been released; start() waits on `stopping`.
      item.cleanupState = 'cleaning';
      item.cleanupAttempts = (item.cleanupAttempts || 0) + 1;
      item.cleanedUp = false;
      item.stopping = true;
      this.clearRunningWatch(item);
      if (ownsSharedResources()) await saveDeferredSession(item, (url) => this.isStartPageUrl?.(url)).catch(() => {});
      item.bidiConnection?.close();
      item.bidiConnection = null;
      item.workerFingerprintConnection?.close();
      item.workerFingerprintConnection = null;
      closePageFingerprintConnections(item);

      if (options.kill && !isChildExited(item.child) && item.pid) {
        await killProcessTree(item.pid, managedBrowserKillOptions(item, item.root)).catch(() => {});
      }
      if (options.waitForExit) {
        let exited = await this.waitForChildExit(item.child, Number(options.exitTimeout) || 6500);
        // A failed first kill must not release the profile lock while Chromium
        // still owns the profile. Retry the bounded kill/wait sequence once.
        if (!exited && !isChildExited(item.child) && item.pid) {
          await killProcessTree(item.pid, managedBrowserKillOptions(item, item.root)).catch(() => {});
          exited = await this.waitForChildExit(item.child, 2500);
        }
        item.childExitState = { ...(item.childExitState || {}), exited, code: item.child?.exitCode ?? null, signal: item.child?.signalCode || null };
        if (!exited) {
          // Fail closed: a live child may still own SQLite/LevelDB/profile locks.
          // Release auxiliary handles, but never release the profile lock or delete
          // the running item until a later cleanup attempt confirms child exit.
          try { item.cdpConnection?.close?.(); } catch (_) {}
          if (item.markerProcess && !item.markerProcess.killed) {
            try { item.markerProcess.kill(); } catch (_) {}
          }
          // Do not close proxyForwarder while child has not exited to avoid network leak to host
          if (ownsSharedResources()) stopIpcStubForWindow(item.kernelWindowName).catch(() => {});
          item.cleanupFailed = true;
          item.cleanupState = 'blocked';
          const failure = new Error(`Browser child exit was not confirmed for profile ${profileId}; cleanup is fail-closed`);
          failure.code = 'BROWSER_EXIT_UNCONFIRMED';
          item.cleanupError = failure;
          throw failure;
        }
      }

      // The tracked browser process can exit before Chromium's renderer/GPU
      // helpers. Re-scan the exact user-data-dir and terminate only those
      // helpers before releasing the profile lock.
      if (item.root && isChildExited(item.child) && ownsSharedResources()) {
        // drainProfileHelpers already performs bounded kill/re-scan attempts.
        // An unavailable process list is not proof that the directory is idle.
        const helperDrain = await this.drainProfileHelpers(item.root);
        const activeHelperPids = (helperDrain.pids || []).filter(isPidAlive);
        if (!helperDrain.known || activeHelperPids.length > 0) {
          const failure = new Error(`Chromium helper exit was not confirmed for profile ${profileId}; cleanup is fail-closed`);
          failure.code = 'BROWSER_HELPERS_EXIT_UNCONFIRMED';
          failure.pids = activeHelperPids;
          item.cleanupFailed = true;
          item.cleanupState = 'blocked';
          item.cleanupError = failure;
          throw failure;
        }
        if (ownsSharedResources()) await removeSingletonFiles(item.root, { attempts: 6, delayMs: 40 });
      }

      try { item.cdpConnection?.close?.(); } catch (_) {}
      if (item.markerProcess && !item.markerProcess.killed) {
        try { item.markerProcess.kill(); } catch (_) {}
      }
      await item.proxyForwarder?.close().catch(() => {});
      await item.workerMitmProxy?.close().catch(() => {});
      if (ownsSharedResources()) await stopIpcStubForWindow(item.kernelWindowName).catch(() => {});
      if (ownsSharedResources() && options.markCleanExit !== false) await this.markProfileCleanExit(item.root).catch(() => {});
      const lockReleased = ownsSharedResources()
        ? await releaseProfileLock(item.root, item.profileLock).catch(() => false) : false;
      if (!lockReleased && item.profileLock && fs.existsSync(lockPath(item.root))) {
        if (!options.ignoreForeignLock) {
          item.cleanupFailed = true;
          item.cleanupState = 'blocked';
          const failure = new Error(`Profile lock release failed for profile ${profileId}; cleanup is fail-closed`);
          failure.code = 'PROFILE_LOCK_RELEASE_FAILED';
          item.cleanupError = failure;
          throw failure;
        }
      }
      if (this.running.get(profileId) === item) this.running.delete(profileId);
      item.cleanupFailed = false;
      item.cleanupState = 'cleaned';
      item.cleanupError = null;
      item.cleanedUp = true;
      item.stopping = false;
      const live = this.profiles.get(profileId) || item.profile;
      const error = options.error === undefined ? null : (options.error || null);
      const currentItem = this.running.get(profileId);
      const mayEmitForGeneration = !currentItem || currentItem === item;
      if (mayEmitForGeneration && options.emitStatus !== false && !item.statusEmitted) {
        item.statusEmitted = true;
        this.emit({ type: 'status', id: profileId, running: false, stopping: false, error, reason });
      }
      if (mayEmitForGeneration && options.emitProfileClosed && live?.advanced?.cloudBackup && !wasStopping && !item.profileClosedEmitted) {
        item.profileClosedEmitted = true;
        this.emit({
          type: 'profile-closed',
          id: profileId,
          cloudBackup: true,
          cookieExported: false,
          profile: live,
          reason,
        });
      }
      return { id: profileId, running: false, reason };
    };

    const cleanupPromise = cleanup();
    cleanupPromise.lifecycleItem = item;
    cleanupPromise.lifecycleGeneration = item.lifecycleGeneration;
    cleanupPromise.lifecycleSettled = false;
    item.cleanupPromise = cleanupPromise;
    cleanupPromise.then(
      () => {
        cleanupPromise.lifecycleSettled = true;
        if (item.cleanupPromise === cleanupPromise) item.cleanupPromise = null;
      },
      (error) => {
        cleanupPromise.lifecycleSettled = true;
        // Keep the running item and lock visible, but allow an explicit retry after
        // the child eventually exits instead of memoizing a rejected promise forever.
        item.cleanupFailed = true;
        item.cleanupState = 'blocked';
        item.cleanupError = error;
        if (item.cleanupPromise === cleanupPromise) item.cleanupPromise = null;
      },
    );
    return cleanupPromise;
  },

  handleBrowserGone(profileId, item, reason = 'browser-gone', options = {}) {
    if (!item) return Promise.resolve({ id: profileId, running: false });
    if (item.cleanedUp) return Promise.resolve({ id: profileId, running: false });
    const pending = this.stopping.get(profileId);
    if (pending?.lifecycleSettled && this.stopping.get(profileId) === pending) this.stopping.delete(profileId);
    const activePending = this.stopping.get(profileId);
    if (activePending && (!activePending.lifecycleItem || activePending.lifecycleItem === item)) return activePending;
    if (item.cleanupPromise?.lifecycleSettled) item.cleanupPromise = null;
    if (item.cleanupPromise) return item.cleanupPromise;

    const current = this.running.get(profileId);
    const latestGeneration = Math.max(
      Number(this.lifecycleGenerations?.get(profileId)) || 0,
      Number(this.starting.get(profileId)?.lifecycleGeneration) || 0,
      Number(current?.lifecycleGeneration) || 0,
      Number(activePending?.lifecycleGeneration) || 0,
    );
    const staleGeneration = Number(item.lifecycleGeneration) > 0
      && latestGeneration > Number(item.lifecycleGeneration);
    if (staleGeneration || (current && current !== item) || (activePending && activePending.lifecycleItem && activePending.lifecycleItem !== item)) {
      // A late exit/error from an older generation must never replace the stop
      // barrier or status of the current browser generation.
      return this.cleanupRunningItem(profileId, item, {
        reason,
        expected: true,
        error: null,
        kill: options.kill !== false,
        waitForExit: options.waitForExit !== false,
        exitTimeout: options.exitTimeout,
        // A replacement generation may already be preparing the same profile.
        // Do not rewrite its Preferences from an old process callback.
        markCleanExit: false,
        emitStatus: false,
        emitProfileClosed: false,
        ignoreForeignLock: true,
      });
    }

    if (profileId) this.resetFingerprintVerificationFailures(profileId);
    const cleanupPromise = this.cleanupRunningItem(profileId, item, {
      reason,
      expected: options.expected !== undefined ? options.expected : item.stopping === true,
      error: options.error,
      kill: options.kill !== false,
      waitForExit: options.waitForExit !== false,
      exitTimeout: options.exitTimeout,
      markCleanExit: options.markCleanExit,
      emitProfileClosed: options.emitProfileClosed !== false,
    });
    cleanupPromise.lifecycleItem = item;
    cleanupPromise.lifecycleGeneration = item.lifecycleGeneration;
    this.stopping.set(profileId, cleanupPromise);
    cleanupPromise.finally(() => {
      if (this.stopping.get(profileId) === cleanupPromise) this.stopping.delete(profileId);
    }).catch(() => {});
    return cleanupPromise;
  },

  waitForChildExit(child, timeout = 3000) {
    if (isChildExited(child)) return Promise.resolve(true);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.removeListener?.('exit', onExit);
        child.removeListener?.('close', onExit);
        resolve(value);
      };
      const onExit = () => finish(true);
      const timer = setTimeout(() => finish(isChildExited(child)), timeout);
      child.once?.('exit', onExit);
      child.once?.('close', onExit);
    });
  },

  async drainProfileHelpers(root) {
    if (!root) return { known: true, pids: [], attempts: 0, timedOut: false };
    return isolation.drainProcessesUsingProfile(root, {
      attempts: HELPER_CLEANUP_ATTEMPTS,
      delayMs: HELPER_CLEANUP_DELAY_MS,
      timeoutMs: HELPER_CLEANUP_TIMEOUT_MS,
    });
  },

  /**
   * Watch launched browser: user clicking window X often leaves Chrome helpers alive
   * or never fires child 'exit'. Poll CDP — if port dies or all pages are gone, stop env.
   */
  startRunningWatch(item) {
    if (!item || item.watchTimer) return;
    const profileId = item.profile?.id;
    const tick = async () => {
      item.watchTimer = null;
      if (item.cleanedUp || item.stopping || !this.running.has(profileId)) return;
      let pageCount = -1;
      let cdpAlive = false;
      let processAlive = true;
      if (item.pid) {
        try {
          process.kill(item.pid, 0);
        } catch (error) {
          // Windows: EPERM/EACCES means the PID still exists but is not signalable — keep watching.
          processAlive = Boolean(error && (error.code === 'EPERM' || error.code === 'EACCES'));
        }
      }
      // Firefox runs without CDP: item.port is null for the whole session, so
      // the CDP probe below must not run for it. http.request on
      // "http://127.0.0.1:null/json/version" throws "Invalid URL" every tick;
      // cdpAlive came back false and, after two dead ticks, the watch
      // force-killed a perfectly healthy Firefox ~7s after launch. Firefox
      // liveness is the process check above plus the child exit/error
      // listeners installed by _startFirefox.
      const cdpCapable = Boolean(item.port) && item.engine !== 'firefox';
      if (cdpCapable) {
        try {
          // /json/version proves browser process still exposes CDP
          await cdp.json(`http://127.0.0.1:${item.port}/json/version`);
          cdpAlive = true;
          const pages = await cdp.tabs(item.port).catch(() => []);
          if (pages.length) item.sessionUrls = pages.map((page) => page.url);
          pageCount = Array.isArray(pages) ? pages.length : 0;
        } catch (_) {
          cdpAlive = false;
        }
      } else if (item.engine === 'firefox' && item.bidiConnection && !item.bidiConnection.closed) {
        try {
          const tree = await item.bidiConnection.command('browsingContext.getTree', { maxDepth: 0 }, 2000);
          if (tree.contexts?.length) item.sessionUrls = tree.contexts.map((context) => context.url);
          cdpAlive = true;
        } catch (_) { cdpAlive = false; }
      } else {
        cdpAlive = true;
      }

      // Stop may have started while the CDP probes were in flight. Never let a
      // stale watcher callback act on, or reschedule itself for, a torn-down item.
      if (item.cleanedUp || item.stopping || this.running.get(profileId) !== item) return;

      if (item.engine === 'firefox') {
        try { assertUrlAccessPolicySupported(runtimePolicyProfile(item.profile, this.profiles?.get?.(profileId)), 'firefox'); }
        catch (error) {
          item.cdpError = error.message;
          this.invalidateStatusCache?.();
          this.emit({ type: 'sync-error', action: 'url-access-policy', id: profileId, message: error.message });
          await this.handleBrowserGone(profileId, item, 'url-access-policy-unsupported', {
            expected: false, error: error.message, kill: true, waitForExit: true,
          }).catch((cleanupError) => this.emit({ type: 'sync-error', id: profileId, message: cleanupError.message }));
          return;
        }
      }

      if (!processAlive || !cdpAlive) {
        item.watchDeadTicks = (item.watchDeadTicks || 0) + 1;
        item.watchEmptyTicks = 0;
        // pid gone: stop immediately. A live process with a dead debug port can
        // be a transient renderer/GC stall, so demand an escalating number of
        // consecutive failures (2, 3, then 4 — the cap) before killing a
        // browser the OS still reports as healthy.
        const deadThreshold = Math.min(2 + Math.max(0, (item.watchKillAttempts || 0)), 4);
        if (!processAlive || item.watchDeadTicks >= deadThreshold) {
          item.watchKillAttempts = (item.watchKillAttempts || 0) + 1;
          item.watchDeadTicks = 0;
          this.handleBrowserGone(profileId, item, processAlive ? 'cdp-dead' : 'process-exit', {
            kill: true,
            waitForExit: true,
          }).catch((error) => this.emit({ type: 'sync-error', action: 'watch-cleanup', id: profileId, message: error.message }));
          return;
        }
      } else {
        item.watchDeadTicks = 0;
        item.watchKillAttempts = 0;
        // All windows closed (X on last window): no page targets remain.
        // Firefox has no CDP page targets at all, so an empty reading carries
        // no information there — never auto-stop a live Firefox from it.
        if (pageCount === 0 && cdpCapable) {
          item.watchEmptyTicks = (item.watchEmptyTicks || 0) + 1;
          if (item.watchEmptyTicks >= 2) {
            // Gracefully stop environment so UI matches closed browser
            this.stop(profileId).catch((error) => {
              this.emit({ type: 'sync-error', action: 'auto-stop-empty', id: profileId, message: error.message });
              this.handleBrowserGone(profileId, item, 'empty-windows', {
                kill: true,
                waitForExit: true,
              }).catch((error) => this.emit({ type: 'sync-error', action: 'auto-stop-empty-cleanup', id: profileId, message: error.message }));
            });
            return;
          }
        } else {
          item.watchEmptyTicks = 0;
          // New tabs must receive the same fingerprint inject as the launch tab.
          // Observe failures inside the watch loop and stop an unmanaged live target.
          if (cdpCapable && item.fingerprint && item.profile && !item.fpEnsureBusy) {
            item.fpEnsureBusy = true;
            const reFp = item.nativeKernelFingerprint
              ? fingerprintForNativeKernelInject(item.fingerprint)
              : item.fingerprint;
            this.applyRuntimeSettings(item.port, item.profile, reFp, {
              appliedTargetIds: item.fpAppliedTargets || new Set(),
              appliedFingerprintHash: item.fpAppliedHash,
              trackOn: item,
              phase: 'watch-ensure',
            }).catch((error) => {
              item.cdpError = `fingerprint injection failed: ${error.message}`;
              // cdpError is part of the public status view (local API reads it
              // directly); this path emits no 'status' event, so invalidate
              // explicitly.
              this.invalidateStatusCache?.();
              this.emit({
                type: 'fingerprint-injection-failed',
                id: profileId,
                message: error.message,
              });
              return this.handleBrowserGone(profileId, item, 'runtime-fingerprint-failed', {
                expected: false, error: error.message, kill: true, waitForExit: true,
              }).catch((cleanupError) => this.emit({ type: 'sync-error', id: profileId, message: cleanupError.message }));
            }).finally(() => { item.fpEnsureBusy = false; });
          }
        }
      }
      // 2.4s is enough for new-tab FP inject without burning CDP every 1.2s across fleets.
      if (!item.cleanedUp && !item.stopping && this.running.get(profileId) === item) {
        item.watchTimer = setTimeout(tick, 2400);
      }
    };
    // Delay first check so startup tabs can settle
    item.watchTimer = setTimeout(tick, 2500);
  },

  clearRunningWatch(item) {
    if (!item) return;
    if (item.watchTimer) {
      clearTimeout(item.watchTimer);
      item.watchTimer = null;
    }
    item.watchEmptyTicks = 0;
    item.watchDeadTicks = 0;
  },

  requestLifecycleStop(id, generation) {
    if (!this.lifecycleStopRequests) this.lifecycleStopRequests = new Map();
    this.lifecycleStopRequests.set(id, generation == null ? true : generation);
  },

  isLifecycleStopRequested(id, generation) {
    const requested = this.lifecycleStopRequests?.get(id);
    return requested === true || requested === generation;
  },

  clearLifecycleStopRequest(id, generation) {
    if (!this.lifecycleStopRequests) return;
    if (generation === undefined) return;
    const requested = this.lifecycleStopRequests.get(id);
    if (requested === generation || (generation === null && requested === true)) {
      this.lifecycleStopRequests.delete(id);
    }
  },

  nextLifecycleGeneration(id) {
    if (!this.lifecycleGenerations) this.lifecycleGenerations = new Map();
    const next = (Number(this.lifecycleGenerations.get(id)) || 0) + 1;
    this.lifecycleGenerations.set(id, next);
    return next;
  },

  assertStartGenerationActive(id, generation) {
    if (this.stopAllInProgress || this.isLifecycleStopRequested(id, generation)) {
      const error = new Error(`Browser start was cancelled for profile ${id}`);
      error.code = 'BROWSER_START_CANCELLED';
      throw error;
    }
  },};
