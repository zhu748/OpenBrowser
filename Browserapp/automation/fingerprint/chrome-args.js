'use strict';

/**
 * Chromium launch flags derived from a fingerprint (webdriver flags, UA
 * quirks, GPU policy). Extracted verbatim from the former
 * automation/fingerprint.js.
 */

const { mergeFlags, LIST_VALUE_FLAGS, chromeArgsForUa } = require('./shared');


function chromeArgsForFingerprint(fp, profile = {}, options = {}) {
  let args = [];
  // Critical: without this, Chromium/CDP sets navigator.webdriver = true
  args.push('--disable-blink-features=AutomationControlled');
  // Never enable automation switch (some launchers add it by default)
  if (fp.userAgent) args.push(`--user-agent=${fp.userAgent}`);
  // TLS extension permutation by Chrome major from UA
  if (fp.uaProfile) {
    // Feature flags are list-valued: merging has to append and de-duplicate
    // rather than let one occurrence replace the other.
    args = mergeFlags(args, chromeArgsForUa(fp.uaProfile), { listFlags: LIST_VALUE_FLAGS });
  }
  if (fp.screen?.width && fp.screen?.height) {
    args.push(`--window-size=${fp.screen.width},${fp.screen.height}`);
  }
  if (fp.webrtc === 'disabled' || fp.webrtc === 'proxy') {
    args.push(
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--enforce-webrtc-ip-permission-check'
    );
  }
  if (fp.webgl?.mode === 'blocked') {
    args.push('--disable-webgl', '--disable-webgl2', '--disable-3d-apis');
  } else {
    // Ensure WebGL is available even on VMs/older GPUs that Chrome would normally blocklist
    args.push('--ignore-gpu-blocklist', '--enable-webgl');
    // Issue #19: SwiftShader software rendering when requested or when no GPU available
    if (profile.privacy?.softwareWebgl || profile.advanced?.softwareWebgl || fp.webgl?.software) {
      args.push(
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--disable-gpu-compositing'
      );
    }
  }
  if (fp.audio?.mode === 'muted' || profile.privacy?.audio === 'muted') args.push('--mute-audio');
  if (fp.doNotTrack === '1' || profile.privacy?.dnt || profile.privacy?.dntMode === 'on') args.push('--do-not-track');
  // 硬件加速模式：关闭时整体走软件渲染。WebGL 仍需可用（blocked 时上面已单独禁掉），
  // 所以补上 SwiftShader 组合，避免「关硬件加速」把 WebGL 一起弄挂。
  if (profile.privacy?.hardwareAcceleration === 'off' && fp.webgl?.mode !== 'blocked') {
    for (const flag of ['--disable-gpu', '--disable-gpu-compositing', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']) {
      if (!args.includes(flag)) args.push(flag);
    }
  }
  // 禁用沙盒：每个环境独立 opt-in。多开容器/无特权 Linux 环境常见需求，但会降低隔离强度。
  if (profile.privacy?.noSandbox) args.push('--no-sandbox');
  // SSL 指纹设置：真实 Chromium 开关（ssl-version-min / cipher-suite-black-list），
  // 由编辑器「SSL 指纹设置」写入 privacy.fingerprint。黑名单只接受 0xHHHH 套件号。
  const sslMin = String(profile.privacy?.fingerprint?.sslVersionMin || '').trim();
  if (sslMin === 'tls1.2' || sslMin === 'tls1.3') args.push(`--ssl-version-min=${sslMin}`);
  const sslBlacklist = String(profile.privacy?.fingerprint?.sslBlacklist || '')
    .split(/[\s,;，；]+/)
    .map((s) => s.trim())
    .filter((s) => /^0x[0-9a-fA-F]{4}$/.test(s));
  if (sslBlacklist.length) args.push(`--cipher-suite-black-list=${sslBlacklist.join(',')}`);
  // Use full BCP47 when present (ja-JP / zh-CN); Chrome accepts --lang=ja-JP
  const lang = (fp.languages && fp.languages[0]) || profile.language;
  if (lang) {
    const tag = String(lang).trim();
    const primary = tag.split(',')[0].trim();
    if (primary) args.push(`--lang=${primary}`);
  }
  if (process.platform === 'win32') {
    // Keep a *single* consistent UI scale across all multi-environment windows on Windows
    // (so no window ends up with 1.25x enlarged toolbars/tabbars), but default it to the host
    // display's real scale instead of hardcoding 1. Hardcoding 1 renders the whole browser
    // chrome (tabs, toolbar, omnibox, icons, page baseline) at 100% physical pixels, so on a
    // 125%/150%/200% Windows display everything looks proportionally too small.
    // Resolution order: explicit profile override -> host display scale -> 1.
    const hostScale = Number(options?.hostScaleFactor);
    const scaleFactor = profile.privacy?.forceDeviceScaleFactor
      || profile.deviceScaleFactor
      || (Number.isFinite(hostScale) && hostScale > 0 ? hostScale : 1);
    args.push(`--force-device-scale-factor=${scaleFactor}`);
  }
  // Cloudflare 验证优化：关闭时更激进（可能卡盾）；开启时减少部分干扰
  if (profile.privacy?.cfOptimize === false) {
    // keep aggressive isolation defaults already applied by noise modes
  } else {
    // prefer not to hard-disable site features that CF challenge pages need
    // (no --disable-webgl here unless user chose blocked webgl above)
  }
  return args;
}

module.exports = {
  chromeArgsForFingerprint,
};
