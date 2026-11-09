'use strict';

/**
 * Persona construction: buildFingerprint (deterministic profile ->
 * static/dynamic fingerprint config) and its consistency diagnostics.
 * Extracted verbatim from the former automation/fingerprint.js.
 */

const { pickPersona, fontsForOs, exclusiveFontsForOtherOs, getHostWebglLimits, isPersonaWebglCompatible, resolveCompatiblePersona, applyPersonaPerturbations, mobilePersona, supportsRuntimePersona, buildUaProfile, randomUaForSeed, buildAcceptLanguageHeader, parseOsFromUa, OS_PRESETS, canonicalBridgeToken, hashSeed, u32, mulberry32, WEBGL_PRESETS, webglPresetsForOs, WEBGL_PARAM_IDS, webglParameterOverrides, expectedClientHintPlatform, buildWebglFpPayload, desktopOs, resolveStabilityPolicy, createBatteryFromSeed, createMediaDevicesFromSeed, createSpeechVoicesFromSeed, createDeviceNameFromSeed, createLocalIpFromSeed, formatGeopositionValue, audioMarkFromSeed, clientRectMarkFromSeed } = require('./shared');


/**
 * Build fingerprint config from profile + optional privacy.fingerprint overrides.
 */
function buildFingerprint(profile = {}) {
  const stableIdentity = profile.id || profile.name || 'default';
  const launchSeed = String(profile.fingerprintLaunchSeed || '').trim();
  const seed = hashSeed(launchSeed ? `${stableIdentity}:${launchSeed}` : stableIdentity);
  const rnd = mulberry32(u32(seed, 0));
  const privacy = profile.privacy || {};
  const fpIn = (privacy.fingerprint && typeof privacy.fingerprint === 'object' ? privacy.fingerprint : null) || (profile.fingerprint && typeof profile.fingerprint === 'object' ? profile.fingerprint : {});

  const rawCoresOverride = fpIn.cores ?? privacy.cores;
  const rawMemoryOverride = fpIn.memory ?? privacy.memory;
  const coresOverride = rawCoresOverride === '' || rawCoresOverride === null || rawCoresOverride === undefined ? NaN : Number(rawCoresOverride);
  const memoryOverride = rawMemoryOverride === '' || rawMemoryOverride === null || rawMemoryOverride === undefined ? NaN : Number(rawMemoryOverride);
  const useRealCores = coresOverride === 0;
  const useRealMemory = memoryOverride === 0;
  // These are reassigned below when a coherent device persona is selected (opt-in), so the
  // hardware axes come from one real machine instead of being drawn independently.
  const hasCoresOverride = Number.isFinite(coresOverride) && coresOverride > 0;
  const hasMemoryOverride = Number.isFinite(memoryOverride) && memoryOverride > 0;
  let cores = hasCoresOverride
    ? Math.min(64, Math.max(1, Math.round(coresOverride)))
    : [4, 6, 8, 12, 16][u32(seed, 12) % 5];
  // navigator.deviceMemory is quantised by the spec to 0.25/0.5/1/2/4/8 and capped at 8, so the
  // former 16/32 draws were values no real Chrome can report — a single read identified the
  // browser as spoofed. Desktop Chrome effectively only ever reports 4 or 8. Correcting this
  // re-rolls the value on existing profiles; a profile that must keep its old reading can pin
  // it explicitly through privacy.fingerprint.memory.
  const DEVICE_MEMORY_STEPS = [0.25, 0.5, 1, 2, 4, 8];
  const memoryPool = [4, 8];
  let memory = hasMemoryOverride
    ? DEVICE_MEMORY_STEPS.reduce((best, step) => (
      Math.abs(step - memoryOverride) < Math.abs(best - memoryOverride) ? step : best
    ), 8)
    : memoryPool[u32(seed, 16) % memoryPool.length];
  const width = Number(profile.width) || 1280;
  const height = Number(profile.height) || 820;
  const isHdrRequested = Boolean(fpIn.hdr || privacy.hdr || profile.hdr || (Number(fpIn.colorDepth) === 30));
  let colorDepth = isHdrRequested ? 30 : 24;
  let devicePixelRatio = [1, 1, 1.25, 1.5, 2][u32(seed, 24) % 5];

  // Numeric noise marks (canvas/webgl ±10000; audio/clientRects from seed formulas unless overridden)
  const canvasId = (u32(seed, 28) % 20000) - 10000 || 1;
  const webglId = (u32(seed, 32) % 20000) - 10000 || 1;
  const audioIdDefault = audioMarkFromSeed(seed.toString('hex'));
  const clientRectsIdDefault = clientRectMarkFromSeed(seed);
  const audioId = Number.isFinite(Number(fpIn.audioId)) ? Number(fpIn.audioId) : audioIdDefault;
  const clientRectsId = Number.isFinite(Number(fpIn.clientRectsId)) ? Number(fpIn.clientRectsId) : clientRectsIdDefault;

  const mode = (name, allowed, fallback) => {
    const value = fpIn[name] ?? privacy[name];
    return allowed.includes(String(value || '')) ? String(value) : fallback;
  };

  const canvasMode = mode('canvas', ['real', 'noise', 'blocked'], privacy.canvas === 'blocked' ? 'blocked' : 'noise');
  const webglMode = mode('webgl', ['real', 'noise', 'blocked'], privacy.webgl === 'blocked' ? 'blocked' : 'noise');
  // Metadata (UNMASKED vendor/renderer) can stay real while image noise still runs.
  const webglMetaMode = mode('webglMeta', ['real', 'noise', 'blocked', 'custom'], privacy.webglMeta === 'real' ? 'real' : (privacy.webglMeta === 'blocked' ? 'blocked' : (privacy.webglMeta === 'custom' ? 'custom' : 'noise')));
  const audioMode = mode('audio', ['real', 'noise', 'muted'], privacy.audio === 'muted' ? 'muted' : 'noise');
  const clientRectsMode = mode('clientRects', ['real', 'noise'], 'noise');
  const webrtcMode = mode('webrtc', ['real', 'proxy', 'disabled'], privacy.webrtc || 'proxy');
  // Numeric shadow of webrtc mode only (not an independent control).
  const webrtcPolicy = webrtcMode === 'disabled' ? 0 : (webrtcMode === 'proxy' ? 3 : 1);
  const mediaDevicesMode = mode('mediaDevices', ['real', 'noise', 'empty'], privacy.mediaDevices === 'real' ? 'real' : (privacy.mediaDevices === 'empty' ? 'empty' : (privacy.media === 'noise' ? 'noise' : (privacy.media === 'blocked' ? 'empty' : 'noise'))));
  const speechChoice = privacy.speech === undefined || privacy.speech === null || privacy.speech === ""
    ? "noise"
    : String(privacy.speech);
  const speechMode = mode("speech", ["real", "noise", "blocked"], speechChoice === "blocked" ? "blocked" : (speechChoice === "real" ? "real" : "noise"));
  const batteryMode = mode('battery', ['real', 'noise', 'blocked'], privacy.battery === 'blocked' ? 'blocked' : (privacy.battery === 'real' ? 'real' : 'noise'));
  // Profiles the product saved carry an explicit choice (its own default is the WebGL derived
  // identity, see the renderer normalisation), but a profile that never went through that step - an
  // older record, an API created one - used to fall through to `real` here. That leaks the machine
  // adapter (vendor / architecture) while WebGL already reports the profile GPU, which is both a
  // hardware leak and a cross API contradiction. An unset value therefore follows the product
  // default; an explicit `real` still means real and is left alone.
  const webgpuChoice = privacy.webgpu === undefined || privacy.webgpu === null || privacy.webgpu === ''
    ? 'webgl'
    : String(privacy.webgpu);
  const webgpuMode = mode('webgpu', ['real', 'blocked', 'webgl'], webgpuChoice === 'blocked' ? 'blocked' : (webgpuChoice === 'webgl' ? 'webgl' : 'real'));
  const bluetoothMode = mode('bluetooth', ['real', 'blocked'], privacy.bluetooth === 'blocked' ? 'blocked' : 'real');
  const stability = resolveStabilityPolicy(privacy, {
    host: fpIn.stabilityHost || privacy.stabilityHost || profile.stabilityHost || '',
    mode: fpIn.stabilityMode || privacy.stabilityMode,
  });

  // --- User-Agent + Client Hints ---
  // Custom profile.userAgent wins; otherwise deterministic seeded UA.
  // clientHints / privacy.fingerprint.clientHints feed UserAgentMetadata.
  const uaOverride = String(fpIn.userAgent || profile.userAgent || '').trim();
  const clientHintsIn = (fpIn.clientHints && typeof fpIn.clientHints === 'object')
    ? fpIn.clientHints
    : (privacy.clientHints && typeof privacy.clientHints === 'object' ? privacy.clientHints
      : (profile.clientHints && typeof profile.clientHints === 'object' ? profile.clientHints : {}));
  const kernelMajor = Number(String(profile.kernelVersion || '').match(/^\d+/)?.[0]) || 0;
  // The UA major must track the actual browser kernel: an engine advertising
  // Chrome 128-137 while running a 148 kernel is a one-shot CSS/API
  // feature-detection tell. When the profile doesn't pin a kernel version,
  // derive the pool from the bundled kernel's major version.
  const { OPENBROWSER_KERNEL_VERSION } = require('../browser-kernel');
  const defaultKernelMajor = Number(String(OPENBROWSER_KERNEL_VERSION || '').match(/^\d+/)?.[0]) || 0;
  const uaMajorPool = kernelMajor ? [kernelMajor] : (defaultKernelMajor ? [defaultKernelMajor] : undefined);
  // UA 严格模式：强制自定义 UA 的 Chrome 主版本与内核一致 — UA 宣传 131 而内核是 148
  // 是一次性 CSS/API 特性探测即可识破的硬伤，与下方 uaMajorPool 的注释同理。
  let uaOverrideStr = uaOverride;
  const strictMajor = kernelMajor || defaultKernelMajor;
  if (fpIn.uaStrict && uaOverride && strictMajor) {
    const uaCurrentMajor = Number(uaOverride.match(/Chrome\/(\d+)/)?.[1]) || 0;
    if (uaCurrentMajor && uaCurrentMajor !== strictMajor) {
      uaOverrideStr = uaOverride.replace(/Chrome\/\d+/, `Chrome/${strictMajor}`);
    }
  }
  let uaProfile;
  if (uaOverrideStr) {
    const osFromUa = parseOsFromUa(uaOverrideStr);
    // buildUaProfile keys OS_PRESETS with exact lowercase ids; profile records may carry
    // aliases ("iOS", "Mac", "Win11") that would otherwise fall through to the host OS.
    const normalizeOsKey = (value) => {
      const v = String(value || '').toLowerCase().trim();
      if (v === 'win' || v === 'win32' || v === 'win64' || v.startsWith('windows')) return 'windows';
      if (v === 'mac' || v === 'darwin' || v === 'osx') return 'macos';
      if (v === 'macos_arm' || v === 'mac_arm') return 'macos_arm';
      if (v === 'iphone' || v === 'ipad' || v === 'ipod') return 'ios';
      return v;
    };
    uaProfile = buildUaProfile({
      userAgent: uaOverrideStr,
      // profile.os participates so a saved "macos_arm" profile keeps its Apple Silicon
      // identity (preset pins architecture=arm) even when it also pins a custom UA string.
      os: normalizeOsKey(fpIn.os || clientHintsIn.os || profile.os) || osFromUa,
      chromeMajor: (fpIn.uaStrict && strictMajor) || Number(fpIn.chromeMajor || clientHintsIn.chromeMajor) || undefined,
      chromeFull: fpIn.ua_full_version || clientHintsIn.ua_full_version || fpIn.fullVersion,
      platform: fpIn.platform,
      architecture: clientHintsIn.architecture || fpIn.architecture,
      platform_version: clientHintsIn.platform_version || fpIn.platformVersion,
      model: clientHintsIn.model,
      mobile: clientHintsIn.mobile,
      wow64: clientHintsIn.wow64,
      bitness: clientHintsIn.bitness,
      ua_full_version: clientHintsIn.ua_full_version || fpIn.ua_full_version,
    });
  } else {
    const desktopRequested = [fpIn.os, clientHintsIn.os, profile.os]
      .map((value) => String(value || "").toLowerCase().trim())
      .map((value) => {
        if (value === "win" || value === "win32" || value === "win64") return "windows";
        if (value === "mac" || value === "darwin" || value === "osx") return "macos";
        if (value === "macos_arm" || value === "mac_arm") return "macos_arm";
        return value;
      })
      .find((value) => value === "windows" || value === "macos" || value === "macos_arm" || value === "linux");
    uaProfile = randomUaForSeed(u32(seed, 44), {
      majors: uaMajorPool,
      // The UA is the source of truth for every OS-facing fingerprint surface.
      // macos_arm goes through as-is: OS_PRESETS.macos_arm emits the same MacIntel UA token
      // but pins Client Hints architecture=arm, which downstream persona/WebGL pools key on.
      osList: desktopRequested ? [desktopRequested] : ['windows', 'windows', 'macos', 'linux'],
    });
    // Apply explicit clientHints overrides on top of seeded UA
    if (Object.keys(clientHintsIn).length) {
      uaProfile = buildUaProfile({
        userAgent: uaProfile.userAgent,
        os: uaProfile.os,
        chromeMajor: uaProfile.chromeMajor,
        ...clientHintsIn,
        ua_full_version: clientHintsIn.ua_full_version || uaProfile.chromeFull,
      });
    }
  }

  // Roxy 对齐：编辑器「系统版本」下拉（profile.osVersion）参与 UA token 与
  // Client Hints platformVersion 生成；未选择时保持原有随机 UA 不变。
  if (String(profile.osVersion || '').trim()) {
    uaProfile = buildUaProfile({
      os: uaProfile.os || parseOsFromUa(uaProfile.userAgent),
      chromeMajor: uaProfile.chromeMajor,
      ua_full_version: uaProfile.chromeFull,
      osVersion: String(profile.osVersion).trim(),
    });
  }

  const parsedOsForFp = parseOsFromUa(uaProfile.userAgent);
  const detectedMobileOs = (uaProfile.os === "android" || parsedOsForFp === "android") ? "android" : ((uaProfile.os === "ios" || parsedOsForFp === "ios") ? "ios" : null);
  let uaOs = detectedMobileOs || desktopOs(uaProfile.os) || desktopOs(parsedOsForFp) || "windows";
  // macOS persona pools are split by CPU architecture (W2). The UA metadata decides which
  // side of the split this profile lives on: an arm Client Hint can never ship an Intel/AMD
  // GPU and an x86 hint can never ship an Apple M-series GPU.
  const uaArchitecture = String(uaProfile?.metadata?.architecture || '').toLowerCase();
  if (uaOs === 'macos' && uaArchitecture === 'arm') uaOs = 'macos_arm';
  else if (uaOs === 'macos_arm' && uaArchitecture && uaArchitecture !== 'arm') uaOs = 'macos';
  const personaRequested = String(fpIn.deviceProfile ?? privacy.deviceProfile ?? '').toLowerCase() === 'persona';
  const webglOptions = webglPresetsForOs(uaOs, { legacy: !personaRequested });
  let webglPreset = webglOptions[u32(seed, 8) % webglOptions.length];

  // --- coherent device persona (opt-in) ---------------------------------------------
  // Drawing CPU, memory, colour depth, pixel ratio and GPU from separate pools can produce
  // machines that do not exist (4 cores with 32 GB, a 1x non-Retina Mac), and detectors score
  // the combination rather than each value. A persona bundles axes that co-occur on real
  // hardware. Off by default: switching an existing profile's hardware identity mid-life is
  // itself a risk, so this only applies where it was explicitly requested.
  let devicePersona = null;
  if (personaRequested) {
    devicePersona = pickPersona(uaOs, u32(seed, 36));
    const useGating = fpIn.webglCapabilityGating !== false && privacy.webglCapabilityGating !== false;
    if (useGating && !isPersonaWebglCompatible(devicePersona, process.platform)) {
      devicePersona = resolveCompatiblePersona(devicePersona, process.platform);
    }
    devicePersona = applyPersonaPerturbations(devicePersona, seed) || devicePersona;
    if (!hasCoresOverride) cores = devicePersona.cores;
    if (!hasMemoryOverride) memory = Math.min(8, devicePersona.memory);
    colorDepth = isHdrRequested ? (devicePersona.colorDepth || 30) : 24;
    devicePixelRatio = devicePersona.devicePixelRatio;
    webglPreset = {
      ...webglPreset,
      vendor: devicePersona.webgl.vendor,
      renderer: devicePersona.webgl.renderer,
      gpu: devicePersona.webgl.gpu || webglPreset.gpu,
    };
  }

  // --- mobile device persona ------------------------------------------------
  // A phone is one device, not five independent numbers: the UA model, viewport, pixel ratio,
  // core count and GPU all come out of the same pool record, and only that single record is
  // sampled. The operating system has to be asked for explicitly because a desktop kernel
  // cannot fall into a phone identity by accident.
  const mobileRequested = [fpIn.os, clientHintsIn.os, profile.os, uaProfile.os]
    .map((value) => String(value || '').toLowerCase())
    .find((value) => value === 'android' || value === 'ios');
  let mobileDevice = null;
  if (mobileRequested && supportsRuntimePersona(mobileRequested)) {
    mobileDevice = mobilePersona(u32(seed, 52), mobileRequested, { chromeMajor: kernelMajor || undefined });
    uaOs = mobileDevice.os;
    if (!hasCoresOverride) cores = mobileDevice.cores;
    if (!hasMemoryOverride) memory = mobileDevice.deviceMemory;
    colorDepth = isHdrRequested ? (mobileDevice.colorDepth || 30) : 24;
    devicePixelRatio = mobileDevice.dpr;
    // Mobile WebGL identity is synthesised through the same ANGLE template the desktop pool
    // uses (fingerprint-generators.js android table): `ANGLE (<vendor>, <renderer>, OpenGL ES 3.2)`.
    // The old path copied the pool's raw gpuVendor/gpuRenderer ("Qualcomm"/"Adreno 540"), which
    // a one-line regex flags as synthetic; gpu.architecture was an empty string, pushing
    // webglParameterOverrides to its most conservative fallback.
    const mobileAngleRenderer = (dev) => `ANGLE (${dev.gpu.vendor}, ${dev.gpu.renderer}, OpenGL ES 3.2)`;
    // Architecture from the repo's existing mobile family mapping only (see normalizeGpuArchitecture
    // in fingerprint-generators.js): qualcomm->adreno-700, arm->valhall, samsung->rdna-2,
    // imagination->rogue. No invented values.
    const mobileGpuArch = (family) => {
      const f = String(family || '').toLowerCase();
      if (f === 'qualcomm') return 'adreno-700';
      if (f === 'arm') return 'valhall';
      if (f === 'samsung') return 'rdna-2';
      if (f === 'imagination') return 'rogue';
      return '';
    };
    webglPreset = {
      ...webglPreset,
      vendor: `Google Inc. (${mobileDevice.gpu.vendor})`,
      renderer: mobileAngleRenderer(mobileDevice),
      gpu: mobileDevice.gpu.family ? { vendor: mobileDevice.gpu.family, architecture: mobileGpuArch(mobileDevice.gpu.family) } : webglPreset.gpu,
    };
    // A pinned UA still wins, but the rest of the phone identity follows the sampled device.
    if (!uaOverrideStr) uaProfile = mobileDevice.uaProfile;
  }
  const inferGpuFromRenderer = (rendererStr) => {
    const s = String(rendererStr || '').toLowerCase();
    if (s.includes('nvidia') || s.includes('geforce') || s.includes('quadro') || s.includes('rtx') || s.includes('gtx')) {
      let arch = 'ampere';
      if (s.includes('40') || s.includes('ada')) arch = 'ada';
      else if (s.includes('30') || s.includes('ampere')) arch = 'ampere';
      else if (s.includes('20') || s.includes('16') || s.includes('turing')) arch = 'turing';
      else if (s.includes('10') || s.includes('pascal')) arch = 'pascal';
      return { vendor: 'nvidia', architecture: arch };
    }
    if (s.includes('intel') || s.includes('arc') || s.includes('iris') || s.includes('uhd') || s.includes('hd graphics')) {
      let arch = 'gen12';
      if (s.includes('arc') || s.includes('alchemist')) arch = 'alchemist';
      else if (s.includes('iris') || s.includes('770') || s.includes('gen12')) arch = 'gen12';
      else if (s.includes('630') || s.includes('620') || s.includes('gen9')) arch = 'gen9';
      return { vendor: 'intel', architecture: arch };
    }
    if (s.includes('amd') || s.includes('radeon')) {
      let arch = 'rdna-2';
      if (s.includes('7900') || s.includes('7800') || s.includes('7700') || s.includes('7600') || s.includes('780m') || s.includes('rdna-3') || s.includes('rdna3')) arch = 'rdna-3';
      else if (s.includes('6900') || s.includes('6800') || s.includes('6700') || s.includes('6600') || s.includes('680m') || s.includes('rdna-2') || s.includes('rdna2')) arch = 'rdna-2';
      else if (s.includes('580') || s.includes('570') || s.includes('590')) arch = 'gcn-4';
      return { vendor: 'amd', architecture: arch };
    }
    if (s.includes('apple') || s.includes('m1') || s.includes('m2') || s.includes('m3')) {
      return { vendor: 'apple', architecture: 'common-3' };
    }
    return null;
  };
  const effectiveRenderer = String(fpIn.webglRenderer || webglPreset.renderer || '');
  const inferredGpu = inferGpuFromRenderer(effectiveRenderer);
  const webglGpu = ((fpIn.webgpu && typeof fpIn.webgpu === 'object') || fpIn.gpuVendor || fpIn.gpuArchitecture)
    ? {
      vendor: String(fpIn.webgpu?.vendor || fpIn.gpuVendor || inferredGpu?.vendor || webglPreset.gpu?.vendor || ''),
      architecture: String(fpIn.webgpu?.architecture || fpIn.gpuArchitecture || inferredGpu?.architecture || webglPreset.gpu?.architecture || ''),
    }
    : (inferredGpu || webglPreset.gpu || null);

  // Prefer already-resolved profile.language (engine sets JP→ja-JP when languageMode=ip)
  let languagePrimary = String(profile.language || 'en-US').trim() || 'en-US';
  try {
    const { resolveProfileLanguage } = require('../locale-from-country');
    languagePrimary = resolveProfileLanguage(profile, {
      countryCode: profile.exitCountryCode,
    }) || languagePrimary;
  } catch (_) {}
  // Single languages chain: privacy.languages first, then privacy.fingerprint.languages, then
  // profile.languages, then the locale-derived default. navigator.languages, Emulation locale and
  // Accept-Language all read this one resolution, so the three surfaces cannot disagree. (The UI
  // has a single language intent: editor-language-mode + editor-language fallback; neither
  // privacy.languages nor privacy.fingerprint.languages has a UI entry.)
  const candidateLangs = (Array.isArray(privacy.languages) && privacy.languages.length)
    ? privacy.languages
    : (Array.isArray(fpIn.languages) && fpIn.languages.length)
      ? fpIn.languages
      : (Array.isArray(profile.languages) && profile.languages.length)
        ? profile.languages
        : null;
  let languages = candidateLangs
    ? candidateLangs.map((s) => String(s || '').trim()).filter(Boolean)
    : String(languagePrimary).split(',').map((s) => s.trim()).filter(Boolean);
  if (!languages.length) languages.push('en-US');
  if (languages.length === 1 && languages[0].includes('-')) {
    const base = languages[0].split('-')[0];
    if (!languages.includes(base)) languages.push(base);
  } else if (languages.length === 1 && languages[0].toLowerCase() === 'en') {
    if (!languages.includes('en-US')) languages.push('en-US');
  }

  // A persona carries its own panel size; without it the reported screen follows the window,
  // which is what makes "screen smaller than the viewport" style inconsistencies show up.
  // Phones report the full display, and their floor is far below the desktop minimum the window
  // sync assumes, so the panel comes from the persona without the desktop clamp.
  // privacy.resolutionMode === 'real' (跟随系统) opts out of the drawn panel: the engine passes
  // the host's real display bounds via profile.hostScreen and every screen field follows them.
  const mobileScreen = mobileDevice ? mobileDevice.screen : null;
  const hostScreen = (profile.hostScreen && Number(profile.hostScreen.width) >= 640 && Number(profile.hostScreen.height) >= 480)
    ? { width: Math.round(Number(profile.hostScreen.width)), height: Math.round(Number(profile.hostScreen.height)) }
    : null;
  const followHostScreen = String(privacy.resolutionMode || '') === 'real' && !mobileScreen && Boolean(hostScreen);
  const screenWidth = followHostScreen
    ? hostScreen.width
    : mobileScreen
      ? Math.round(Number(fpIn.screenWidth) || mobileScreen.width)
      : Math.max(640, Math.round(Number(fpIn.screenWidth) || devicePersona?.screen?.width || width));
  const screenHeight = followHostScreen
    ? hostScreen.height
    : mobileScreen
      ? Math.round(Number(fpIn.screenHeight) || mobileScreen.height)
      : Math.max(480, Math.round(Number(fpIn.screenHeight) || devicePersona?.screen?.height || height));
  const taskbarHeight = mobileScreen
    ? 0
    : Math.max(0, Math.round(Number(fpIn.taskbarHeight) || devicePersona?.screen?.taskbarHeight || (uaOs === 'macos' || uaOs === 'macos_arm' ? 25 : 40)));
  const availLeft = Math.round(Number(fpIn.availLeft) || 0);
  const availTop = Math.round(Number(fpIn.availTop) || 0);
  const availWidth = Math.min(screenWidth, Math.max(1, Math.round(Number(fpIn.availWidth) || screenWidth)));
  const availHeight = Math.min(screenHeight, Math.max(1, Math.round(Number(fpIn.availHeight) || (screenHeight - taskbarHeight))));
  const screenX = Math.max(availLeft, Math.round(Number(fpIn.screenX) || availLeft));
  const screenY = Math.max(availTop, Math.round(Number(fpIn.screenY) || availTop));

  const mediaLabelTemplates = (fpIn.mediaLabels && typeof fpIn.mediaLabels === 'object')
    ? fpIn.mediaLabels
    : ((privacy.mediaLabels && typeof privacy.mediaLabels === 'object') ? privacy.mediaLabels : null);
  const mediaDevices = mediaDevicesMode === 'real'
    ? null
    : createMediaDevicesFromSeed(stableIdentity + ':' + seed.toString('hex').slice(0, 12), {
      emptyLabels: mediaDevicesMode === 'empty',
      extra: Array.isArray(fpIn.mediaDevices) ? fpIn.mediaDevices : null,
      labels: mediaLabelTemplates,
      os: uaOs,
    });
  const battery = batteryMode === 'real'
    ? null
    : (batteryMode === 'blocked'
      ? { blocked: true }
      : createBatteryFromSeed(stableIdentity + ':battery:' + seed.toString('hex').slice(0, 8), fpIn.battery || privacy.batterySnapshot || null));
  const speechVoices = createSpeechVoicesFromSeed(
    stableIdentity + ':speech:' + seed.toString('hex').slice(0, 8),
    languages, // single resolved chain: same source as navigator.languages / Accept-Language
    speechMode,
    // Narrow the table to the claimed OS for every profile, not just persona ones. Mixing
    // families is not a cosmetic difference: a macOS answer containing "Microsoft David - English
    // (United States)" is a combination no real machine can produce, and looking for exactly that
    // is a standard voice-based OS check. Older profiles used to report that mix, which is worth
    // the one-time correction for the same reason navigator.deviceMemory 16 was.
    { os: uaOs }
  );
  const deviceNameMode = mode('deviceNameMode', ['noise', 'custom', 'real'], privacy.deviceNameMode || 'noise');
  const deviceName = createDeviceNameFromSeed(
    stableIdentity + ':device:' + seed.toString('hex').slice(0, 8),
    {
      mode: deviceNameMode,
      custom: fpIn.deviceName || privacy.deviceName || '',
    }
  );
  const webrtcLocalIp = String(
    fpIn.webrtcLocalIp
    || privacy.webrtcLocalIp
    || ''
  ).trim() || createLocalIpFromSeed(stableIdentity + ':webrtc-local:' + seed.toString('hex').slice(0, 8));

  // MAC 地址（对齐常见指纹浏览器的设备标识组）：MAC 本身不会暴露给网页 JS，
  // 但作为环境硬件标识记录在 init.json 与概要中；custom 模式由用户固定。
  const macMode = mode('macMode', ['real', 'custom'], privacy.macMode === 'custom' ? 'custom' : 'real');
  const macValue = String(fpIn.mac || privacy.mac || '').trim().toUpperCase();

  // Dynamic layer: may change with proxy/exit IP without rebuilding static seeds
  const webrtcAddress = String(
    fpIn.webrtcAddress
    || privacy.webrtcAddress
    || profile.exitIp
    || profile.exitIP
    || ''
  ).trim() || null;
  const timezoneDynamic = privacy.timezoneMode === 'real'
    ? null
    : (String(
        (privacy.timezoneMode === 'custom' ? privacy.timezone : '')
        || profile.exitTimezone
        || privacy.timezone
        || ''
      ).trim() || null);
  let geoposition = null;
  if (privacy.geoMode === 'custom' && Number.isFinite(Number(privacy.latitude)) && Number.isFinite(Number(privacy.longitude))) {
    geoposition = {
      latitude: Number(privacy.latitude),
      longitude: Number(privacy.longitude),
      accuracy: Number(privacy.accuracy) || 100,
    };
  } else if (privacy.geoMode !== 'disabled' && privacy.geoMode !== 'prompt') {
    const lat = Number(profile.exitLatitude);
    const lon = Number(profile.exitLongitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      geoposition = { latitude: lat, longitude: lon, accuracy: Number(privacy.accuracy) || 1000 };
    }
  }

  let webglRenderer = (webglMetaMode === 'real')
    ? null
    : (webglMetaMode === 'blocked' ? '' : (fpIn.webglRenderer || webglPreset.renderer));
  const rLow = String(webglRenderer || '').toLowerCase();
  let resolvedVendor = fpIn.webglVendor || webglPreset.vendor;
  if (!fpIn.webglVendor && mobileDevice) {
    // Adreno / Mali / PowerVR renderers carry no desktop keyword; the ANGLE-synthesised pool
    // vendor (Google Inc. (<chip vendor>)) is the only truthful answer, same as the ANGLE table.
    resolvedVendor = `Google Inc. (${mobileDevice.gpu.vendor})`;
  } else if (!fpIn.webglVendor && webglRenderer) {
    if (rLow.includes('nvidia') || rLow.includes('geforce')) resolvedVendor = 'Google Inc. (NVIDIA)';
    else if (rLow.includes('intel') || rLow.includes('arc') || rLow.includes('iris') || rLow.includes('uhd')) resolvedVendor = 'Google Inc. (Intel)';
    else if (rLow.includes('amd') || rLow.includes('radeon')) resolvedVendor = 'Google Inc. (AMD)';
    else if (rLow.includes('apple')) resolvedVendor = (uaOs === 'ios' || detectedMobileOs === 'ios') ? 'Apple Inc.' : 'Google Inc. (Apple)';
  }
  let webglVendor = (webglMetaMode === 'real')
    ? null
    : (webglMetaMode === 'blocked' ? '' : resolvedVendor);

  // Enforce cross-platform GPU consistency: prevent contradictory combinations
  // Only apply auto-correction when the caller did NOT supply an explicit webglRenderer override.
  const hasManualWebglOverride = Boolean(fpIn.webglRenderer);
  if (!hasManualWebglOverride && uaOs === 'windows') {
    if (webglRenderer && /metal|apple/i.test(webglRenderer)) {
      const winPresets = WEBGL_PRESETS.windows;
      const picked = winPresets[u32(seed, 8) % winPresets.length];
      webglRenderer = picked.renderer;
      webglVendor = picked.vendor;
      if (webglGpu) { webglGpu.vendor = picked.gpu.vendor; webglGpu.architecture = picked.gpu.architecture; }
    }
    if (webglVendor && /apple/i.test(webglVendor)) {
      webglVendor = 'Google Inc. (Intel)';
    }
  } else if (!hasManualWebglOverride && (uaOs === 'android' || detectedMobileOs === 'android')) {
    if (webglRenderer && /direct3d|d3d11|metal|nvidia|geforce|radeon|intel|iris|uhd|apple/i.test(webglRenderer)) {
      const andrPresets = WEBGL_PRESETS.android;
      const picked = andrPresets[u32(seed, 8) % andrPresets.length];
      webglRenderer = picked.renderer;
      webglVendor = picked.vendor;
      if (webglGpu) { webglGpu.vendor = picked.gpu.vendor; webglGpu.architecture = picked.gpu.architecture; }
    }
  } else if (!hasManualWebglOverride && (uaOs === 'ios' || detectedMobileOs === 'ios')) {
    if (webglRenderer && /direct3d|d3d11|nvidia|geforce|radeon|intel|adreno|mali|powervr/i.test(webglRenderer)) {
      webglVendor = 'Apple Inc.';
      webglRenderer = 'Apple GPU';
      if (webglGpu) { webglGpu.vendor = 'apple'; webglGpu.architecture = 'common-3'; }
    }
  }

  if (webglGpu && webglMetaMode !== 'real') {
    const vLow = String(webglVendor || '').toLowerCase();
    const curRLow = String(webglRenderer || '').toLowerCase();
    if (curRLow.includes('nvidia') || vLow.includes('nvidia')) {
      webglGpu.vendor = 'nvidia';
      if (!webglGpu.architecture) webglGpu.architecture = 'ampere';
    } else if (curRLow.includes('intel') || vLow.includes('intel')) {
      webglGpu.vendor = 'intel';
      if (!webglGpu.architecture) webglGpu.architecture = 'gen12';
    } else if (curRLow.includes('amd') || curRLow.includes('radeon') || vLow.includes('amd') || vLow.includes('radeon')) {
      webglGpu.vendor = 'amd';
      if (!webglGpu.architecture) webglGpu.architecture = 'rdna-2';
    } else if (curRLow.includes('apple') || vLow.includes('apple')) {
      webglGpu.vendor = 'apple';
      if (!webglGpu.architecture) webglGpu.architecture = 'common-3';
    }
  }
  const webglReconcileHost = fpIn.reconcileHost ?? fpIn.webglReconcileHost ?? privacy.webglReconcileHost ?? (process.platform === 'darwin');
  const webgl = {
    mode: webglMode,
    metaMode: webglMetaMode,
    vendor: webglVendor,
    renderer: webglRenderer,
    mark: Number.isFinite(Number(fpIn.webglId)) ? Number(fpIn.webglId) : webglId,
    gpu: webglMetaMode === 'real' ? null : webglGpu,
    reconcileHost: Boolean(webglReconcileHost),
    stability,
  };
  webgl.limits = webglMetaMode === 'real' ? null : webglParameterOverrides(webgl.gpu, {
    reconcileHost: webgl.reconcileHost,
    hostPlatform: process.platform,
  });
  webgl.fpPayload = buildWebglFpPayload(webgl);

  const fingerprint = {
    seed: seed.toString('hex').slice(0, 16),
    profileId: profile.id,
    os: uaOs,
    timezone: timezoneDynamic,
    platform: fpIn.platform || uaProfile.platform || OS_PRESETS[uaOs].platformNav,
    userAgent: uaProfile.userAgent,
    uaProfile,
    clientHints: uaProfile.clientHints,
    userAgentMetadata: uaProfile.metadata,
    // Single chain: fpIn.languages only participates upstream in candidateLangs, so all three
    // surfaces (JS navigator.languages, Emulation locale, Accept-Language) read one value.
    languages,
    hardwareConcurrency: useRealCores ? null : (Number(fpIn.hardwareConcurrency) > 0 ? Number(fpIn.hardwareConcurrency) : cores),
    deviceMemory: useRealMemory ? null : (Number(fpIn.deviceMemory) > 0 ? Number(fpIn.deviceMemory) : memory),
    screen: {
      width: screenWidth,
      height: screenHeight,
      availWidth,
      availHeight,
      availLeft,
      availTop,
      screenX,
      screenY,
      colorDepth: isHdrRequested ? (Number(fpIn.colorDepth) || colorDepth || 30) : 24,
      pixelDepth: isHdrRequested ? (Number(fpIn.colorDepth) || colorDepth || 30) : 24,
      devicePixelRatio: Number(fpIn.devicePixelRatio) || devicePixelRatio,
    },
    webgl,
    canvas: {
      mode: canvasMode,
      mark: Number.isFinite(Number(fpIn.canvasId)) ? Number(fpIn.canvasId) : canvasId,
      stability,
    },
    audio: {
      mode: audioMode,
      mark: Number.isFinite(Number(fpIn.audioId)) ? Number(fpIn.audioId) : audioId,
    },
    clientRects: {
      mode: clientRectsMode,
      mark: Number.isFinite(Number(fpIn.clientRectsId)) ? Number(fpIn.clientRectsId) : clientRectsId,
    },
    webrtc: webrtcMode,
    webrtcPolicy,
    webrtcAddress,
    webrtcLocalIp,
    deviceName,
    deviceNameMode,
    mac: {
      mode: macMode,
      value: macMode === 'custom' && /^[0-9A-F]{2}(:?[0-9A-F]{2}){5}$/.test(macValue.replace(/-/g, ':')) ? macValue.replace(/-/g, ':') : '',
    },
    battery: {
      mode: batteryMode,
      value: battery,
    },
    webgpu: {
      mode: webgpuMode,
      gpu: webglGpu,
    },
    bluetooth: {
      mode: bluetoothMode,
    },
    mediaDevices: {
      mode: mediaDevicesMode,
      devices: mediaDevices,
      labels: mediaLabelTemplates,
    },
    stability,
    speech: {
      mode: speechMode,
      voices: speechVoices,
    },
    // Font probing is a top-tier OS signal, and on a stock Chromium kernel the host's real
    // font list answers it. A persona carries the set its claimed platform ships, plus the
    // families exclusive to the other platforms so probes for those can be answered honestly
    // as absent. When claimed OS differs from host OS (e.g. Windows persona on macOS host),
    // enable font isolation even without explicit deviceProfile: 'persona'.
    // privacy.fontListMode: 'real' = 跟随系统（宿主真实字体列表应答），'noise' = 强制随机列表。
    fonts: (() => {
      if (String(privacy.fontListMode || '') === 'real') return null;
      // privacy.fingerprint.fonts: 自定义字体列表（编辑器「自定义列表」档），最高优先级。
      const customFonts = Array.isArray(fpIn.fonts)
        ? fpIn.fonts.map((s) => String(s).trim()).filter(Boolean)
        : (typeof fpIn.fonts === 'string'
          ? fpIn.fonts.split(/[\n,，;；]+/).map((s) => s.trim()).filter(Boolean)
          : null);
      const hostPlatformNorm = process.platform === "darwin" ? "macos" : (process.platform === "win32" ? "windows" : (process.platform === "linux" ? "linux" : process.platform));
      const foreignFonts = exclusiveFontsForOtherOs(uaOs);
      if (customFonts && customFonts.length) {
        return { os: uaOs, list: customFonts, foreign: foreignFonts };
      }
      const isCrossOs = String(uaOs || '').replace(/_arm$/, '') !== hostPlatformNorm;
      const shouldEnableFonts = String(privacy.fontListMode || '') === 'noise' || Boolean(devicePersona || mobileDevice || isCrossOs);
      return (shouldEnableFonts && Array.isArray(foreignFonts) && foreignFonts.length > 0)
        ? {
          os: uaOs,
          list: fontsForOs(uaOs) || [],
          foreign: foreignFonts,
        }
        : null;
    })(),
    maxTouchPoints: mobileDevice
      ? mobileDevice.maxTouchPoints
      : (Number(fpIn.maxTouchPoints) >= 0 ? Number(fpIn.maxTouchPoints) : 0),
    mobile: Boolean(mobileDevice),
    touch: Boolean(mobileDevice),
    mobileDevice: mobileDevice
      ? {
        name: mobileDevice.name,
        model: mobileDevice.model,
        os: mobileDevice.os,
        osVersion: mobileDevice.osVersion,
        cores: mobileDevice.cores,
        viewport: { ...mobileDevice.viewport },
        screen: { ...mobileDevice.screen },
        panel: { ...mobileDevice.panel },
        dpr: mobileDevice.dpr,
        gpu: { vendor: mobileDevice.gpu.vendor, renderer: mobileDevice.gpu.renderer, family: mobileDevice.gpu.family },
      }
      : null,
    vendor: fpIn.vendor || ((mobileDevice?.os === 'ios' || uaOs === 'ios' || (fpIn.platform && /iphone|ipad|ipod/i.test(fpIn.platform))) ? 'Apple Computer, Inc.' : (mobileDevice?.vendor || uaProfile?.vendor || 'Google Inc.')),
    acceptLanguage: buildAcceptLanguageHeader(languages),
    doNotTrack: privacy.dnt ? '1' : null,
    // Static noise identity vs dynamic exit-IP layer
    staticConfig: {
      hardwareConcurrency: useRealCores ? null : (Number(fpIn.hardwareConcurrency) > 0 ? Number(fpIn.hardwareConcurrency) : cores),
      deviceMemory: useRealMemory ? null : (Number(fpIn.deviceMemory) > 0 ? Number(fpIn.deviceMemory) : memory),
      platform: fpIn.platform || uaProfile.platform || OS_PRESETS[uaOs].platformNav,
      langs: languages,
      canvasMark: Number.isFinite(Number(fpIn.canvasId)) ? Number(fpIn.canvasId) : canvasId,
      webglMark: Number.isFinite(Number(fpIn.webglId)) ? Number(fpIn.webglId) : webglId,
      audioFp: Number.isFinite(Number(fpIn.audioId)) ? Number(fpIn.audioId) : audioId,
      clientRectFp: Number.isFinite(Number(fpIn.clientRectsId)) ? Number(fpIn.clientRectsId) : clientRectsId,
      maxTouchPoints: mobileDevice
        ? mobileDevice.maxTouchPoints
        : (Number(fpIn.maxTouchPoints) >= 0 ? Number(fpIn.maxTouchPoints) : 0),
      mediaDevices,
      mediaLabels: mediaLabelTemplates,
      battery,
      webrtcPolicy,
      webrtcLocalIp,
      deviceName,
      stability,
      userAgentMetadata: uaProfile.metadata,
      webglFp: webgl.fpPayload,
    },
    dynamicConfig: {
      timezone: timezoneDynamic,
      geoposition,
      geopositionText: formatGeopositionValue(geoposition),
      webrtcAddress,
      webrtcLocalIp,
      webrtc: webrtcMode,
    },
    // deterministic random for scripts
    _r0: rnd(),
  };

  const lazyFontPayload = fpIn.lazyFontPayload !== false && privacy.lazyFontPayload !== false;
  const fontBridgePlatform = (() => {
    const p = String(uaOs || fpIn.os || fpIn.platform || '').trim().toLowerCase();
    if (p.includes('win')) return 'windows';
    if (p.includes('mac') || p.includes('darwin')) return 'macos';
    if (p.includes('android')) return 'android';
    if (p.includes('linux')) return 'linux';
    if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'macos';
    return 'windows';
  })();
  const fontBridgeToken = canonicalBridgeToken(fingerprint);
  const fontBridgeChannel = '_' + String(fontBridgeToken).slice(0, 16);

  fingerprint.fontBlobBridge = lazyFontPayload ? {
    channelName: fontBridgeChannel,
    token: String(fontBridgeToken),
    platform: fontBridgePlatform,
    wanted: null,
  } : null;

  fingerprint.consistency = fingerprintConsistencyIssues(fingerprint);
  return fingerprint;
}

/**
 * Report contradictions that make a configured desktop environment implausible.
 * Overrides remain supported; callers can surface these warnings before launch.
 */
function fingerprintConsistencyIssues(fp) {
  const issues = [];
  const parsedOs = parseOsFromUa(fp?.userAgent);
  const mobileOs = (parsedOs === 'android' || parsedOs === 'ios') ? parsedOs : null;
  const uaOs = mobileOs
    ? mobileOs
    : (desktopOs(fp?.uaProfile?.os) || desktopOs(parsedOs) || 'windows');
  const expectedPlatform = mobileOs
    ? (mobileOs === 'ios' ? 'iPhone' : 'Linux armv8l')
    : (OS_PRESETS[uaOs]?.platformNav || OS_PRESETS.windows.platformNav);
  const expectedChPlatform = mobileOs === 'android' ? 'Android' : (mobileOs === 'ios' ? 'iOS' : expectedClientHintPlatform(uaOs));
  const renderer = String(fp?.webgl?.renderer || '');
  const vendor = String(fp?.webgl?.vendor || '');

  const add = (code, message, severity = 'warning') => issues.push({ code, severity, message });
  if (fp?.platform !== expectedPlatform) {
    add('platform-ua-mismatch', `navigator.platform (${fp?.platform || 'empty'}) does not match the ${uaOs} user agent.`);
  }
  if (fp?.userAgentMetadata?.platform !== expectedChPlatform) {
    add('client-hints-ua-mismatch', `Client Hints platform (${fp?.userAgentMetadata?.platform || 'empty'}) does not match the ${uaOs} user agent.`);
  }
  if (uaOs === 'windows' && /Apple M[0-9]|OpenGL 4\.1|Mesa|RADV/i.test(renderer)) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a Windows renderer.');
  }
  if ((uaOs === 'macos' || uaOs === 'macos_arm') && (/Direct3D|D3D11|Mesa|RADV/i.test(renderer) || !/Apple|Intel|AMD/i.test(vendor + renderer))) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a macOS renderer.');
  }
  if (uaOs === 'linux' && (/Direct3D|D3D11|Apple M[0-9]/i.test(renderer) || !/Mesa|RADV|OpenGL/i.test(renderer))) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a Linux renderer.');
  }
  if (mobileOs && /Direct3D|D3D11|Apple M[0-9]|Mesa|RADV/i.test(renderer)) {
    add('webgl-ua-mismatch', 'WebGL renderer does not look like a mobile GPU.');
  }
  if (fp?.mobile && !(Number(fp?.maxTouchPoints) > 0)) {
    add('mobile-touch-missing', 'A mobile profile must expose touch points.', 'error');
  }
  if (fp?.mobile && fp?.mobileDevice && Number(fp.mobileDevice.screen?.width) !== Number(fp?.screen?.width)) {
    add('mobile-screen-mismatch', 'The reported screen must be the panel of the sampled device.');
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
  if (!(Number(screen.devicePixelRatio) > 0 && Number(screen.devicePixelRatio) <= 4)) {
    add('device-pixel-ratio-invalid', 'devicePixelRatio must be within the supported desktop range.', 'error');
  }
  if (fp?.hardwareConcurrency != null && !(Number(fp.hardwareConcurrency) >= 1 && Number(fp.hardwareConcurrency) <= 64)) {
    add('cores-invalid', 'hardwareConcurrency must be between 1 and 64 when overridden.', 'error');
  }
  if (fp?.deviceMemory != null && !(Number(fp.deviceMemory) >= 1 && Number(fp.deviceMemory) <= 8)) {
    add('memory-invalid', 'deviceMemory must be between 1 and 8 when overridden.', 'error');
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
  // The driver limits are derived from the same GPU the renderer string names, so the class the
  // limits table knows about has to be the class the renderer claims. Mobile GPU families have no
  // table entry yet, which is why this is a warning - those profiles keep the host limits, and
  // surfacing that is the difference between a known gap and a silent one.
    const hostLimits = getHostWebglLimits(process.platform);
  if (webglGpu && hostLimits) {
    const rawLimits = webglParameterOverrides(webglGpu, { reconcileHost: false });
    if (rawLimits && rawLimits[WEBGL_PARAM_IDS.MAX_TEXTURE_SIZE] > hostLimits.maxTextureSize) {
      add('webgl-limits-reconciled-with-host',
        `GPU persona requires texture size ${rawLimits[WEBGL_PARAM_IDS.MAX_TEXTURE_SIZE]} which exceeds host execution capacity (${hostLimits.maxTextureSize}); reconciled to host capacity to maintain texImage2D validity.`,
        'info');
    }
  }
  if (webglGpu && (webglGpu.vendor || webglGpu.architecture) && !webglParameterOverrides(webglGpu)) {
    add('webgl-limits-unknown-gpu',
      `No driver limit table entry for ${String(webglGpu.vendor || 'unknown')}/${String(webglGpu.architecture || 'unknown')}.`,
      'warning');
  }
  return { ok: !issues.some((issue) => issue.severity === 'error'), issues };
}


module.exports = {
  buildFingerprint,
  fingerprintConsistencyIssues,
};
