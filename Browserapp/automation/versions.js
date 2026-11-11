'use strict';

/**
 * Single source of truth for kernel and Chrome version constants.
 *
 * These values used to live as scattered literals (browser-kernel.js,
 * kernel-init-sync.js, env-icon.js, user-agent.js, mobile-personas.js,
 * start-page-server.js) and drifted apart: the same kernel version string was
 * maintained in three places, and the Chrome major advertised by different
 * modules disagreed (131 / 137 / 148 / 120). Import from here instead of
 * redefining.
 *
 * Defaults follow the bundled kernel; a selected kernel supplies its own
 * major and full version at launch and in the editor UA generator.
 */

/** Bundled OpenBrowser 148 independent kernel (macOS x64 default). */
const OPENBROWSER_KERNEL_VERSION = '148.0.7778.165';

/** Kernel source id for the bundled OpenBrowser 148 build. */
const SOURCE_OPENBROWSER = 'openbrowser-148';

/** Major component of OPENBROWSER_KERNEL_VERSION. */
const OPENBROWSER_KERNEL_MAJOR = Number(OPENBROWSER_KERNEL_VERSION.match(/^\d+/)[0]);

/** Last-resort Chrome major for buildUserAgentString when nothing pins one. */
const DEFAULT_UA_CHROME_MAJOR = OPENBROWSER_KERNEL_MAJOR;

/** Majors pool for randomUaForSeed when the caller does not pass one. */
const RANDOM_UA_CHROME_MAJORS = [OPENBROWSER_KERNEL_MAJOR];

/** Chrome for Android major — mobile Chrome autoupdates, so it tracks the kernel. */
const MOBILE_DEFAULT_CHROME_MAJOR = OPENBROWSER_KERNEL_MAJOR;

/**
 * UA for main-process fetches (start-page reachability probes). Not a profile
 * fingerprint surface, but derived from the kernel major so main-process
 * traffic does not advertise a stale Chrome.
 */
function mainProcessProbeUa() {
  return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${OPENBROWSER_KERNEL_MAJOR}.0.0.0 Safari/537.36`;
}

module.exports = {
  OPENBROWSER_KERNEL_VERSION,
  SOURCE_OPENBROWSER,
  OPENBROWSER_KERNEL_MAJOR,
  DEFAULT_UA_CHROME_MAJOR,
  RANDOM_UA_CHROME_MAJORS,
  MOBILE_DEFAULT_CHROME_MAJOR,
  mainProcessProbeUa,
};
