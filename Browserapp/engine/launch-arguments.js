'use strict';

const { allowGoogleLogin } = require('../automation/profile-defaults');
const path = require('node:path');
const { LIST_VALUE_FLAGS, appendFlagValue, mergeFlags } = require('../automation/command-line-flags');
const { chromeArgsForFingerprint } = require('../automation/fingerprint');
const { backgroundNetworkFlagsForProfile } = require('../automation/request-header-rewriter');

// Custom flags cannot override the engine's routing, isolation or CDP policy.
const SECURITY_SWITCH_DENYLIST = new Set([
  'proxy-server',
  'proxy-bypass-list',
  'proxy-pac-url',
  'force-webrtc-ip-handling-policy',
  'remote-debugging-port',
  'remote-debugging-pipe',
  'remote-allow-origins',
  'user-data-dir',
  'profile-directory',
  'load-extension',
  'disable-web-security',
  'no-sandbox',
  'disable-ipv6',
]);

/** Build the initial flags without acquiring processes, locks or sockets. */
function buildBaseLaunchArguments({ root, fingerprint, profile, hostScaleFactor = null }) {
  let args = [
    `--user-data-dir=${root}`,
    `--disk-cache-dir=${path.join(root, 'OpenBrowserCache')}`,
    `--crash-dumps-dir=${path.join(root, 'OpenBrowserCrashReports')}`,
    '--profile-directory=Default',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-crash-restore-bubble',
    '--disable-session-crashed-bubble',
    '--disable-background-mode',
    '--enable-unsafe-extension-debugging',
    // --extensions-on-chrome-urls was dropped: it is in Chromium's kBadFlags table
    // (bad_flags_prompt.cc) and produced the "unsupported command-line flag" infobar.
    // The bundled extension only matches http/https, so chrome:// access is unused.
    // --test-type=gpu suppresses both startup infobars without touching the binary:
    //   * infobar_utils.cc skips ChromeForTestingInfoBarDelegate when IsGpuTest()
    //   * the same function returns early on any --test-type, before ShowBadFlagsPrompt
    // It is not a kBadFlag, so it never introduces a new warning, and it has nothing
    // to do with --enable-automation (deleted in kernel-init-sync.js).
    '--test-type=gpu',
    '--enable-features=AutomaticFullscreenContentSetting,WindowPlacement,WindowManagement',
    '--disable-gesture-requirement-for-presentation',
    '--disable-fullscreen-low-power-mode',
    // Random loopback port only; never bind 0.0.0.0. Restrict CDP WebSocket origins
    // (was * — any local page that learns the port could attach and steal session).
    '--remote-debugging-port=0',
    '--remote-allow-origins=http://127.0.0.1,http://localhost',
  ];
  // Fingerprint chrome flags (UA / webrtc / webgl / lang / window-size)
  args = mergeFlags(args, chromeArgsForFingerprint(fingerprint, profile, { hostScaleFactor }), {
    listFlags: LIST_VALUE_FLAGS,
  });
  const langList = (Array.isArray(fingerprint?.languages) && fingerprint.languages.length)
    ? fingerprint.languages
    : (Array.isArray(profile?.languages) && profile.languages.length)
      ? profile.languages
      : profile?.language
        ? [profile.language]
        : [];
  if (langList.length && !args.some((a) => a.startsWith('--accept-lang='))) {
    args.push(`--accept-lang=${langList.join(',')}`);
  }
  return args;
}

/** Complete policy flags and report rejected overrides to the caller. */
function completeLaunchArguments(initialArgs, { profile, proxyConfig, proxyEndpoint, windowPosition = null }) {
  let args = initialArgs.slice();
  if (!allowGoogleLogin(profile)) args.push('--disable-sync');
  if (profile.privacy.webgpu === 'blocked') args.push('--disable-features=WebGPU');
  if (profile.advanced.blockImages) args.push('--blink-settings=imagesEnabled=false');
  // Roxy 对齐：「声音 = 关闭」→ 内核真静音（disablePlaySound）；视频关闭仅能落到 autoplay 闸（内核级
  // disablePlayVideo 是 Roxy 自研内核能力，Chromium 无等价开关，见对齐矩阵）。
  if (profile.advanced.blockSound) args.push('--mute-audio');
  if (profile.advanced.blockVideo || profile.advanced.blockSound) args.push('--autoplay-policy=user-gesture-required');
  else args.push('--autoplay-policy=no-user-gesture-required');
  // Roxy 对齐：「忽略 HTTPS 证书错误」（ignoreHttpsError）
  if (profile.advanced.ignoreHttpsError) args.push('--ignore-certificate-errors');
  // 全屏启动 / 九宫格窗口位置（对齐「窗口大小 = 全屏」「窗口位置」）
  if (profile.privacy?.fullscreen) args.push('--start-fullscreen');
  const windowPositionArgValue = windowPosition;
  if (windowPositionArgValue && !profile.privacy?.fullscreen) args.push(windowPositionArgValue);
  // Honor the configured cap instead of a hardcoded 8GB: small-memory
  // machines got GC behavior budgeted for 8GB per environment.
  // jsHeapMax is normalized by the sanitizer (number = MB cap; true → 4096;
  // null = no cap), so the Number() fallback only guards direct callers.
  const jsHeapCap = profile.advanced.jsHeapMax;
  if (jsHeapCap) args.push(`--js-flags=--max-old-space-size=${Math.max(256, Math.min(16384, Number(jsHeapCap) || 4096))}`);
  const disabledFeatures = [];
  // Authenticated proxies are exposed to Chrome through the local bridge. Everything else takes
  // the canonical endpoint from the parser, never from a pattern match on the raw string:
  // `socks5h://`, a `#remark` suffix or a trailing slash used to miss every branch and emit no
  // `--proxy-server` at all, which let Chromium resolve through the host's system proxy — a
  // real-IP leak behind a UI that still reported the configured proxy.
  let proxy = proxyEndpoint;
  // systemProxy: off = 强制本机直连(不走系统代理)；use/global + Direct = 不传 --proxy-server（跟随系统路由）
  const sysMode = profile.proxyMeta?.systemProxy || 'global';
  if (profile.networkMode === 'proxy' && (!proxy || proxy === 'direct://')) {
    throw Object.assign(new Error('代理模式缺少有效路由，已停止启动'), { code: 'proxy-required' });
  }
  if (!proxy && sysMode === 'off') {
    proxy = 'direct://';
  }
  if (proxyConfig && !proxy && sysMode !== 'off') {
    // Fail closed rather than fall back to the host route. A profile that is configured with a
    // proxy must never quietly leave through the machine's own network.
    throw new Error('代理已配置但无法生成可用的浏览器代理端点，已按安全策略阻断启动以避免真实 IP 泄漏。');
  }
  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
    // HTTP/SOCKS proxies are IPv4; disable IPv6 so Chrome cannot skip the proxy.
    if (!args.includes('--disable-ipv6')) args.push('--disable-ipv6');
    args = args.filter((arg) => !arg.startsWith('--force-webrtc-ip-handling-policy='));
    args.push('--force-webrtc-ip-handling-policy=disable_non_proxied_udp');
    // 本机启动页必须直连，不走代理；可叠加用户直连白名单
    let bypass = '<-loopback>;127.0.0.1;localhost';
    if (profile.networkMode !== 'proxy' && profile.proxyMeta?.directBypass && profile.proxyMeta.bypassList) {
      // Clamp to host-shaped entries only：'*' 会让全部主机绕过路由且无任何校验，
      // 路径分隔符也不可能出现于 Chromium bypass 主机模式 —— 两者丢弃，其余原样透传。
      const extra = String(profile.proxyMeta.bypassList)
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter((s) => s && s !== '*' && !/[\\/]/.test(s));
      if (extra.length) bypass += ';' + extra.join(';');
    }
    const existingBypass = args.findIndex((a) => a.startsWith('--proxy-bypass-list='));
    if (existingBypass >= 0) args[existingBypass] = '--proxy-bypass-list=' + bypass;
    else args.push(`--proxy-bypass-list=${bypass}`);
  }
  // Startup URLs: do NOT put the OpenBrowser start page (or first custom URL) on the
  // CLI. The process would paint and run collectFingerprint before CDP inject.
  // Spawn on about:blank, inject via CDP, then keepDefaultTab navigates to startUrl.
  // All URLs, including restored tabs, are opened only after injection verification.
  args.push('about:blank');
  // Cross-platform process overhead reducers (safe for multi-profile fleets).
  // Applied for all envs — not only proxied ones — so Win/mac idle CPU stays low.
  const perfFlags = backgroundNetworkFlagsForProfile(profile);
  for (const flag of perfFlags) {
    if (!args.some((a) => a.split('=')[0] === flag.split('=')[0])) args.push(flag);
  }
  disabledFeatures.push(
    'OptimizationHints',
    'MediaRouter',
    'Translate',
    'AutofillServerCommunication',
    'NetworkPrediction',
    'InterestFeedContentSuggestions',
    'CalculateNativeWinOcclusion',
  );
  if (proxyConfig) {
    // Extra hardening when traffic already goes through a bridge.
    if (!args.includes('--disable-quic')) args.push('--disable-quic');
  }
  // Prefer process reuse when many profiles are open (lower RAM; still one renderer isolation base).
  if (!args.some((a) => a.startsWith('--renderer-process-limit='))) {
    args.push('--renderer-process-limit=4');
  }
  if (disabledFeatures.length) {
    // Appending without de-duplicating would repeat names already present
    // from either the base list or the fingerprint merge above.
    args = appendFlagValue(args, 'disable-features', disabledFeatures.join(','));
  }
  // 自定义启动参数（每环境高级逃生舱）：放在所有内置参数之后，同名单值参数后者生效，
  // 即用户显式覆盖内置默认；profile-sanitizer 已做 token 白名单（--flag 或 --flag=value，
  // 无空白）。安全类开关（代理/CDP/沙箱/同源策略等，见 SECURITY_SWITCH_DENYLIST）
  // 在此拒绝并告警，其余照常透传。
  const rejectedCustomSwitches = [];
  for (const token of String(profile.privacy?.customArgs || '').split(/\s+/)) {
    if (!/^--[a-z0-9][a-z0-9._-]*(=[^\s;]{0,500})?$/i.test(token)) continue;
    if (SECURITY_SWITCH_DENYLIST.has(token.slice(2).split('=')[0])) {
      rejectedCustomSwitches.push(token);
      continue;
    }
    args.push(token);
  }
  return { args, rejectedCustomSwitches };
}

module.exports = { buildBaseLaunchArguments, completeLaunchArguments, SECURITY_SWITCH_DENYLIST };
