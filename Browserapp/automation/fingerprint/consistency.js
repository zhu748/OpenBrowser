'use strict';

// Validate an assembled fingerprint without constructing or mutating its identity.
const { normalizeNetworkInformation, DEVICE_MEMORY_TIERS, MAX_FINGERPRINT_DPR } = require('../../shared/profile-values');
const { parseOsFromUa, parseChromeVersion, osChromeSupportViolation } = require('../user-agent');
const { desktopOs, OS_PRESETS, expectedClientHintPlatform, webglParameterOverrides } = require('./shared');

function fingerprintConsistencyIssues(fp) {
  const issues = [];
  const parsedOs = parseOsFromUa(fp?.userAgent);
  const mobileOs = (parsedOs === 'android' || parsedOs === 'ios') ? parsedOs : null;
  const uaOs = mobileOs
    ? mobileOs
    : (desktopOs(parsedOs) || 'windows');
  const expectedPlatform = mobileOs
    ? (mobileOs === 'ios' ? 'iPhone' : 'Linux armv8l')
    : (OS_PRESETS[uaOs]?.platformNav || OS_PRESETS.windows.platformNav);
  const expectedChPlatform = mobileOs === 'android' ? 'Android' : (mobileOs === 'ios' ? 'iOS' : expectedClientHintPlatform(uaOs));
  const renderer = String(fp?.webgl?.renderer || '');
  const vendor = String(fp?.webgl?.vendor || '');

  const add = (code, message, severity = 'warning') => issues.push({ code, severity, message });
  if (fp?.connection) {
    const projected = normalizeNetworkInformation(fp.connection);
    for (const key of ['downlink', 'rtt']) {
      if (!Object.prototype.hasOwnProperty.call(fp.connection, key)) continue;
      if (fp.connection[key] !== projected[key]) {
        add('network-native-bound', `navigator.connection.${key} must use Chromium's native bounds and buckets (effective value ${projected[key] ?? 'absent'}).`,
          (fp.generationVersion || 1) === 1 ? 'warning' : 'error');
      }
    }
  }
  if (fp?.platform !== expectedPlatform) {
    add('platform-ua-mismatch', `navigator.platform (${fp?.platform || 'empty'}) does not match the ${uaOs} user agent.`, 'error');
  }
  if (fp?.uaProfile?.engine !== 'firefox' && fp?.userAgentMetadata?.platform !== expectedChPlatform) {
    add('client-hints-ua-mismatch', `Client Hints platform (${fp?.userAgentMetadata?.platform || 'empty'}) does not match the ${uaOs} user agent.`, 'error');
  }
  const uaVersion = parseChromeVersion(fp?.userAgent);
  const actualKernelMajor = Number(String(fp?.kernelVersion || '').match(/^\d+/)?.[0]);
  if (uaVersion && actualKernelMajor && uaVersion.major !== actualKernelMajor) {
    add('ua-kernel-version-mismatch',
      `UA Chrome ${uaVersion.major} 与实际内核 ${actualKernelMajor} 不一致；请重新生成 UA、清空自定义 UA，或启用 UA 严格模式。`, 'error');
  }
  const metadata = fp?.userAgentMetadata;
  if (uaVersion && metadata) {
    const full = metadata.uaFullVersion || metadata.fullVersion;
    const versions = [full,
      ...(metadata.brands || []).filter((b) => /^(Chromium|Google Chrome)$/.test(b.brand)).map((b) => b.version),
      ...(metadata.fullVersionList || []).filter((b) => /^(Chromium|Google Chrome)$/.test(b.brand)).map((b) => b.version)];
    if (versions.some((value) => Number(String(value || '').split('.')[0]) !== uaVersion.major)
        || (metadata.uaFullVersion && metadata.fullVersion && metadata.uaFullVersion !== metadata.fullVersion)
        || (uaVersion.full !== `${uaVersion.major}.0.0.0` && uaVersion.full !== full)
        || (metadata.fullVersionList || []).some((b) => /^(Chromium|Google Chrome)$/.test(b.brand) && b.version !== full)) {
      add('client-hints-version-mismatch', 'UA, brands and fullVersionList must describe one browser version.', 'error');
    }
  }
  if (fp?.mobileDevice && metadata && mobileOs === 'android') {
    if (metadata.model !== fp.mobileDevice.model || Number(metadata.platformVersion?.split('.')[0]) !== fp.mobileDevice.osVersion || metadata.mobile !== true) {
      add('mobile-identity-mismatch', 'Mobile Client Hints must describe the sampled device and OS release.', 'error');
    }
    const explicit = String(fp.userAgent || '').match(/Android\s+([0-9.]+);\s*([^;)]+)/i);
    if (explicit && !(explicit[1] === '10' && explicit[2].trim() === 'K')
        && (Number(explicit[1].split('.')[0]) !== Number(metadata.platformVersion?.split('.')[0]) || explicit[2].trim() !== metadata.model)) {
      add('mobile-ua-metadata-mismatch', 'The full Android UA must match the device model and OS in Client Hints.', 'error');
    }
  }
  if (uaOs === 'windows' && /Apple M[0-9]|OpenGL 4\.1|Mesa|RADV|SwiftShader|llvmpipe|Software Rasterizer/i.test(renderer)) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a Windows renderer.');
  }
  if ((uaOs === 'macos' || uaOs === 'macos_arm') && (/Direct3D|D3D11|Mesa|RADV|SwiftShader|llvmpipe/i.test(renderer) || !/Apple|Intel|AMD/i.test(vendor + renderer))) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a macOS renderer.');
  }
  // CPU-architecture vs GPU: an x86 Client Hints architecture cannot ship an Apple M-series
  // GPU and an arm hint cannot ship an Intel/AMD discrete part. The legacy mixed pool used
  // to draw exactly that; this gate makes any future regression loud instead of silent.
  const fpArchitecture = String(fp?.clientHints?.architecture || '').toLowerCase();
  if (uaOs === 'macos' && /Apple M[0-9]/i.test(renderer) && fpArchitecture && fpArchitecture !== 'arm') {
    add('webgl-ua-mismatch', 'An Apple M-series GPU requires an arm Client Hints architecture; this profile claims x86.', 'error');
  }
  if (uaOs === 'macos_arm' && /Intel|Radeon|AMD/i.test(renderer)) {
    add('webgl-ua-mismatch', 'An arm macOS persona cannot ship an Intel/AMD GPU.', 'error');
  }
  // OS-version vs Chrome-major support window (Win7/8/8.1 → 109, macOS 10.15 → 138).
  const fpChromeMajor = Number(parseChromeVersion(fp?.userAgent)?.major) || 0;
  // Reduced macOS UAs report 10_15_7 on current systems too. Client Hints
  // carry the actual release; only Windows legacy NT tokens are unambiguous.
  const windowsRelease = String(fp?.userAgent || '').match(/Windows NT (6\.1|6\.2|6\.3)/i)?.[1];
  const selectedOsVersion = fp?.osVersion === 'all' ? '' : fp?.osVersion;
  const fpOsVersion = String(selectedOsVersion || (uaOs === 'macos' || uaOs === 'macos_arm'
    ? String(metadata?.platformVersion || '').split('.').slice(0, 2).join('.')
    : uaOs === 'android' ? fp.mobileDevice?.osVersion
      : ({ '6.1': '7', '6.2': '8', '6.3': '8.1' }[windowsRelease] || ''))).trim();
  const osChromeViolation = fpOsVersion && fpChromeMajor
    ? osChromeSupportViolation({ id: uaOs }, fpOsVersion, fpChromeMajor, fp.generationVersion)
    : null;
  if (osChromeViolation) {
    add('os-chrome-support-mismatch', `Chrome ${fpChromeMajor} never shipped on ${osChromeViolation.osId} ${osChromeViolation.osVersion} (last supporting major: ${osChromeViolation.maxChromeMajor}).`, 'error');
  }
  if (uaOs === 'linux' && (/Direct3D|D3D11|Apple M[0-9]/i.test(renderer) || !/Mesa|RADV|OpenGL/i.test(renderer))) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a Linux renderer.');
  }
  if (mobileOs && /Direct3D|D3D11|Apple M[0-9]|Mesa|RADV|SwiftShader|llvmpipe/i.test(renderer)) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a mobile GPU.');
  }
  if (fp?.mobile && !(Number(fp?.maxTouchPoints) > 0)) {
    add('mobile-touch-missing', 'A mobile profile must expose touch points.', 'error');
  }
  if (fp?.mobile && fp?.mobileDevice) {
    const { screen: mobileScreen, viewport } = fp.mobileDevice;
    if (mobileScreen?.width !== fp.screen?.width || mobileScreen?.height !== fp.screen?.height) {
      add('mobile-screen-mismatch', 'The mobile emulation screen and reported screen must agree.');
    }
    if (viewport && (!(viewport.width > 0 && viewport.height > 0)
      || viewport.width > fp.screen?.width || viewport.height > fp.screen?.height)) {
      add('mobile-viewport-invalid', 'The configured mobile viewport must fit within the screen.', 'error');
    }
  }
  const screen = fp?.screen || {};
  if (!(Number(screen.width) > 0 && Number(screen.height) > 0 && Number(screen.availWidth) > 0 && Number(screen.availHeight) > 0)) {
    add('screen-invalid', 'Screen dimensions must be positive.', 'error');
  } else if (Number(screen.availWidth) > Number(screen.width) || Number(screen.availHeight) > Number(screen.height)) {
    add('screen-available-invalid', 'Available screen dimensions cannot exceed total screen dimensions.', 'error');
  }
  if (Number(screen.availLeft) + Number(screen.availWidth) > Number(screen.width)
      || Number(screen.availTop) + Number(screen.availHeight) > Number(screen.height)) {
    add('screen-origin-invalid', 'Available screen origin and dimensions must remain inside the screen.', 'error');
  }
  if (Number(screen.screenX) < Number(screen.availLeft) || Number(screen.screenY) < Number(screen.availTop)) {
    add('window-origin-invalid', 'Window origin must not precede the available screen origin.', 'error');
  }
  if (!(Number(screen.devicePixelRatio) > 0 && Number(screen.devicePixelRatio) <= MAX_FINGERPRINT_DPR)) {
    add('device-pixel-ratio-invalid', 'devicePixelRatio must be within the supported range.', 'error');
  }
  if (fp?.hardwareConcurrency != null && (!Number.isInteger(fp.hardwareConcurrency) || fp.hardwareConcurrency < 1 || fp.hardwareConcurrency > 64)) {
    add('cores-invalid', 'hardwareConcurrency must be an integer between 1 and 64 when overridden.', 'error');
  }
  if (fp?.deviceMemory != null && !DEVICE_MEMORY_TIERS.includes(fp.deviceMemory)) {
    add('memory-invalid', 'deviceMemory must use a supported quantized tier.', 'error');
  }
  // Hardware-class coherence (the isCoherent rules from device-personas.js applied to the
  // final assembled fingerprint). These are heuristics, not physical constraints:
  // deviceMemory is quantised and RAM may be upgraded independently of the CPU.
  // (A macOS DPR of 1 is deliberately NOT flagged: a Mac on an external non-Retina display
  // answers exactly that, so the per-OS DPR pool keeps it as a legitimate draw.)
  const hwCores = Number(fp?.hardwareConcurrency) || 0;
  const hwMemory = Number(fp?.deviceMemory) || 0;
  if (hwCores >= 12 && hwMemory > 0 && hwMemory < 8) {
    add('hardware-class-incoherent', '12+ logical cores paired with <8 GB deviceMemory is unusual for the bundled device personas.', 'warning');
  }
  // window.outerWidth/outerHeight larger than screen.availWidth/availHeight: a window
  // cannot exceed the work area on any OS (taskbar/dock alone forbids the equality case
  // on the axis it occupies). A persona that draws them independently produces exactly
  // that impossible geometry.
  const hwAvailWidth = Number(fp?.screen?.availWidth) || 0;
  const hwAvailHeight = Number(fp?.screen?.availHeight) || 0;
  const hwOuterW = Number(fp?.windowOuter?.width ?? fp?.window?.outerWidth) || 0;
  const hwOuterH = Number(fp?.windowOuter?.height ?? fp?.window?.outerHeight) || 0;
  if (hwAvailWidth && hwOuterW && hwOuterW > hwAvailWidth) {
    add('window-exceeds-avail', 'window.outerWidth exceeds screen.availWidth; no OS draws a window wider than the work area.', 'warning');
  }
  if (hwAvailHeight && hwOuterH && hwOuterH > hwAvailHeight) {
    add('window-exceeds-avail', 'window.outerHeight exceeds screen.availHeight; the taskbar/dock alone makes that impossible.', 'warning');
  }
  // Low-end CPU with a workstation-class GPU: real machines pair RTX 40xx / RDNA3-class
  // cards with 8+ cores and 16+ GB. A 4-core/4 GB host driving an RTX 4080 is a pairing
  // no OEM ships, and "cheap CPU + top GPU" is exactly what lazy pool draws produce.
  const hwRenderer = String(fp?.webgl?.renderer || fp?.webglPreset?.renderer || '');
  const workstationGpu = /RTX 40[7-9]|RTX 50|RX 79|Radeon Pro W[67]|A[0-9]000|MPS/mi.test(hwRenderer);
  if (workstationGpu && hwCores > 0 && hwCores <= 4 && hwMemory > 0 && hwMemory <= 4) {
    add('hardware-class-incoherent', 'A workstation-class GPU paired with 4 cores / <=4 GB deviceMemory is unusual for the bundled device personas.', 'warning');
  }
  // WebGL and WebGPU read the same physical adapter, so a page that finds a disguised WebGL
  // renderer next to an untouched WebGPU adapter has two GPUs on one machine - a contradiction no
  // real desktop produces. Leaving WebGPU "real" is a legitimate user choice, so this is reported
  // rather than enforced: the point is that the trade-off is visible instead of silent.
  const webglGpu = fp?.webgl?.gpu || null;
  const webglDisguised = Boolean(webglGpu && (webglGpu.vendor || webglGpu.architecture)
    && String(fp?.webgl?.mode || 'noise') !== 'real');
  if (webglDisguised && String(fp?.webgpu?.mode || '') === 'real') {
    add('webgpu-real-vs-webgl-disguised',
      'WebGL reports a profile GPU while WebGPU is left on the host adapter; the two APIs will disagree.',
      'warning');
  }
  // The host OS is not a driver capability probe. Bounds are checked in each
  // live context; construction cannot claim they have already been verified.
  if (mobileOs === 'ios' && fp?.webgl?.metaMode !== 'real'
      && /ANGLE|Google Inc\./i.test(String(fp?.webgl?.vendor) + ' ' + String(fp?.webgl?.renderer))) {
    add('ios-webgl-shape', 'The iOS WebGL identity contains a desktop ANGLE wrapper.', 'warning');
  }
  if (webglGpu && (webglGpu.vendor || webglGpu.architecture) && !webglParameterOverrides(webglGpu)) {
    add('webgl-limits-unknown-gpu',
      `No driver limit table entry for ${String(webglGpu.vendor || 'unknown')}/${String(webglGpu.architecture || 'unknown')}.`,
      'warning');
  }
  return { ok: !issues.some((issue) => issue.severity === 'error'), issues };
}

function assertFingerprintConsistency(fp) {
  const result = fingerprintConsistencyIssues(fp);
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  if (errors.length) {
    const error = new Error('指纹配置不一致：' + errors.map((issue) => issue.message).join('; '));
    error.code = 'FINGERPRINT_CONFIG_INVALID';
    error.issues = errors;
    throw error;
  }
  return result;
}

module.exports = { fingerprintConsistencyIssues, assertFingerprintConsistency };
