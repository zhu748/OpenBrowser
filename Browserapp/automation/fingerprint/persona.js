'use strict';

const { fingerprintVersion, createFingerprintDraw } = require('./generation');

const { normalizeCoordinates, normalizeNetworkInformation, toFiniteNumber } = require('../../shared/profile-values');
const { normalizeUaOs, parseChromeVersion, osChromeSupportViolation } = require('../user-agent');

/**
 * Persona construction: buildFingerprint (deterministic profile ->
 * static/dynamic fingerprint config) and its consistency diagnostics.
 * Extracted verbatim from the former automation/fingerprint.js.
 */

const { pickPersona, fontsForOs, exclusiveFontsForOtherOs, isPersonaWebglCompatible, resolveCompatiblePersona, applyPersonaPerturbations, mobilePersona, supportsRuntimePersona, buildUaProfile, randomUaForSeed, buildAcceptLanguageHeader, parseOsFromUa, OS_PRESETS, canonicalBridgeToken, hashSeed, mulberry32, WEBGL_PRESETS, webglPresetsForOs, webglParameterOverrides, expectedClientHintPlatform, buildWebglFpPayload, desktopOs, resolveStabilityPolicy, createBatteryFromSeed, createMediaDevicesFromSeed, createSpeechVoicesFromSeed, createDeviceNameFromSeed, createLocalIpFromSeed, createLocalMdnsFromSeed, formatGeopositionValue, audioMarkFromSeed, clientRectMarkFromSeed } = require('./shared');


/**
 * Build fingerprint config from profile + optional privacy.fingerprint overrides.
 */
function buildFingerprint(profile = {}) {
  const stableIdentity = profile.id || profile.name || 'default';
  const launchSeed = String(profile.fingerprintLaunchSeed || '').trim();
  // No machine-id salt here: profiles sync across machines (cloud-sync), and an unseeded
  // profile must keep its fingerprint identity wherever it is restored. The replay risk of
  // sequence ids ("env-001") is closed at the engine layer instead — start.js rolls a random
  // persistent fingerprintSeed for legacy profiles on first launch.
  const identitySeed = profile.fingerprintSeed ? `${stableIdentity}:${profile.fingerprintSeed}` : stableIdentity;
  const seed = hashSeed(launchSeed ? `${identitySeed}:${launchSeed}` : identitySeed);
  const version = fingerprintVersion(profile.fingerprintVersion);
  const draw = createFingerprintDraw(seed, version);
  const rnd = mulberry32(draw('sequence', 0));
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
    : [4, 6, 8, 12, 16][draw('hardware.cores', 12) % 5];
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
    : memoryPool[draw('hardware.memory', 16) % memoryPool.length];
  // Non-persona default panel: 1280x820 is not a physical panel any monitor ships, and
  // "default" profiles clustering on one impossible size is a fleet-level signal. The
  // unseeded default now samples the common real panels instead (still overridable by
  // profile.width/height). Seed offset 86 is fresh.
  const REAL_PANELS = [
    [1920, 1080], [1920, 1080], [1920, 1080], [1536, 864], [1366, 768],
    [2560, 1440], [1440, 900], [1680, 1050], [1600, 900], [3840, 2160],
  ];
  const defaultPanel = REAL_PANELS[draw('screen.panel', 86) % REAL_PANELS.length];
  const width = Number(profile.width) || defaultPanel[0];
  const height = Number(profile.height) || defaultPanel[1];
  const isHdrRequested = Boolean(fpIn.hdr || privacy.hdr || profile.hdr || (Number(fpIn.colorDepth) === 30));
  let colorDepth = isHdrRequested ? 30 : 24;
  let devicePixelRatio = [1, 1, 1.25, 1.5, 2][draw('screen.dpr', 24) % 5];
  // Claimed-OS-aware DPR redraw for the non-persona desktop path (see the reassignment below
  // once uaOs is resolved): one global pool let a macOS claim land on 1.25 — a scaling step
  // macOS never offers — while Windows drew 2x. macOS defaults to 2x Retina, Windows laptops
  // cluster at 100/125/150%, Linux mostly 1x.

  // Numeric noise marks (canvas/webgl ±10000; audio/clientRects from seed formulas unless overridden)
  const canvasId = (draw('canvas.mark', 28) % 20000) - 10000 || 1;
  const webglId = (draw('webgl.mark', 32) % 20000) - 10000 || 1;
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
  const strictFull = profile.kernelVersion || OPENBROWSER_KERNEL_VERSION;
  const strictUa = fpIn.uaStrict || fpIn.uaGenerated;
  if (strictUa && uaOverride && strictMajor) {
    uaOverrideStr = uaOverride.replace(/(Chrome|Chromium|CriOS)\/[\d.]+/i,
      (_, brand) => `${brand}/${brand.toLowerCase() === 'crios' ? strictFull : `${strictMajor}.0.0.0`}`);
  }
  let uaProfile;
  if (uaOverrideStr) {
    const osFromUa = parseOsFromUa(uaOverrideStr);
    // buildUaProfile keys OS_PRESETS with exact lowercase ids; profile records may carry
    // aliases ("iOS", "Mac", "Win11") that would otherwise fall through to the host OS.
    uaProfile = buildUaProfile({
      userAgent: uaOverrideStr,
      // profile.os participates so a saved "macos_arm" profile keeps its Apple Silicon
      // identity (preset pins architecture=arm) even when it also pins a custom UA string.
      os: normalizeUaOs(fpIn.os || clientHintsIn.os || profile.os) || osFromUa,
      chromeMajor: (strictUa && strictMajor) || Number(fpIn.chromeMajor || clientHintsIn.chromeMajor) || undefined,
      chromeFull: strictUa ? strictFull : (fpIn.ua_full_version || clientHintsIn.ua_full_version || fpIn.fullVersion),
      platform: fpIn.platform,
      architecture: clientHintsIn.architecture ?? fpIn.architecture,
      platform_version: clientHintsIn.platform_version || fpIn.platformVersion,
      model: clientHintsIn.model,
      mobile: clientHintsIn.mobile,
      wow64: clientHintsIn.wow64,
      bitness: clientHintsIn.bitness,
      ua_full_version: strictUa ? strictFull : (clientHintsIn.ua_full_version || fpIn.ua_full_version),
    });
  } else {
    const desktopRequested = [fpIn.os, clientHintsIn.os, profile.os]
      .map(normalizeUaOs)
      .find((value) => value === "windows" || value === "macos" || value === "macos_arm" || value === "linux");
    uaProfile = randomUaForSeed(draw('userAgent', 44), {
      majors: uaMajorPool,
      fullVersion: profile.kernelVersion || OPENBROWSER_KERNEL_VERSION,
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
  if (!uaOverrideStr && String(profile.osVersion || '').trim()) {
    uaProfile = buildUaProfile({
      ...clientHintsIn,
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
  const personaRequested = version >= 2 || String(fpIn.deviceProfile ?? privacy.deviceProfile ?? '').toLowerCase() === 'persona';
  const mediaIn = (fpIn.mediaPreferences && typeof fpIn.mediaPreferences === 'object')
    ? fpIn.mediaPreferences
    : (privacy.mediaPreferences && typeof privacy.mediaPreferences === 'object' ? privacy.mediaPreferences : null);
  const mobileRequested = [fpIn.os, clientHintsIn.os, profile.os, uaProfile.os]
    .map(normalizeUaOs)
    .find((value) => value === 'android' || value === 'ios');
  // Non-persona desktop DPR now follows the claimed OS (mobile and persona paths overwrite
  // this below with the device record's own ratio).
  if (!personaRequested && !mobileRequested) {
    const dprPool = (uaOs === 'macos' || uaOs === 'macos_arm')
      ? [2, 2, 2, 1]
      : (uaOs === 'linux' ? [1, 1, 1, 1.25, 1.5] : [1, 1, 1, 1.25, 1.5]);
    devicePixelRatio = dprPool[draw('screen.dpr', 24) % dprPool.length];
  }
  const webglOptions = webglPresetsForOs(uaOs, { legacy: !personaRequested });
  let webglPreset = webglOptions[draw('webgl.preset', 8) % webglOptions.length];

  // --- coherent device persona (v2 default, legacy opt-in) ---
  // Drawing hardware axes independently can produce uncommon combinations.
  // A persona bundles CPU, memory, colour depth, pixel ratio and GPU from real
  // hardware. Version 1 retains its opt-in behavior; version 2 uses the coherent
  // pool by default without changing profiles saved under version 1.
  let devicePersona = null;
  if (personaRequested) {
    devicePersona = pickPersona(uaOs, draw('device.persona', 36));
    const useGating = version === 1 && fpIn.webglCapabilityGating !== false && privacy.webglCapabilityGating !== false;
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
  let mobileDevice = null;
  if (mobileRequested && supportsRuntimePersona(mobileRequested)) {
    const androidUa = uaOverrideStr.match(/Android\s+([0-9.]+);\s*([^;)]+)/i);
    const explicitMobileVersion = androidUa && !(androidUa[1] === '10' && androidUa[2].trim() === 'K')
      ? androidUa[1] : uaOverrideStr.match(/CPU (?:iPhone )?OS (\d+(?:_\d+)*)/i)?.[1].replace(/_/g, '.');
    mobileDevice = mobilePersona(draw('mobile.persona', 52), mobileRequested, {
      chromeMajor: kernelMajor || defaultKernelMajor || undefined,
      chromeFull: profile.kernelVersion || OPENBROWSER_KERNEL_VERSION,
      deviceModel: clientHintsIn.deviceModel,
      model: clientHintsIn.model !== 'K' ? (clientHintsIn.model || (uaOverrideStr ? uaProfile.metadata?.model : '')) : '',
      osVersion: clientHintsIn.platform_version || clientHintsIn.platformVersion || explicitMobileVersion || (!uaOverrideStr ? profile.osVersion : ''),
    });
    uaOs = mobileDevice.os;
    if (!hasCoresOverride) cores = mobileDevice.cores;
    if (!hasMemoryOverride) memory = mobileDevice.deviceMemory;
    colorDepth = isHdrRequested ? (mobileDevice.colorDepth || 30) : 24;
    devicePixelRatio = mobileDevice.dpr;
    // Android uses the Chromium ANGLE family template. Version 2 iOS uses
    // the Apple preset directly; version 1 retains its historical wrapper.
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
      vendor: version >= 2 && mobileRequested === 'ios' ? 'Apple Inc.' : `Google Inc. (${mobileDevice.gpu.vendor})`,
      renderer: version >= 2 && mobileRequested === 'ios' ? 'Apple GPU' : mobileAngleRenderer(mobileDevice),
      gpu: mobileDevice.gpu.family ? { vendor: mobileDevice.gpu.family, architecture: mobileGpuArch(mobileDevice.gpu.family) } : webglPreset.gpu,
    };
    // A pinned UA still wins, but the rest of the phone identity follows the sampled device.
    if (!uaOverrideStr) uaProfile = mobileDevice.uaProfile;
    else {
      uaProfile = buildUaProfile({
        userAgent: uaProfile.userAgent, os: mobileDevice.os,
        chromeMajor: uaProfile.chromeMajor, chromeFull: uaProfile.chromeFull,
        ...mobileDevice.uaProfile.clientHints,
        ua_full_version: uaProfile.chromeFull,
        platformNav: mobileDevice.uaProfile.platform, vendor: mobileDevice.vendor,
      });
      uaProfile.clientHints.deviceModel = mobileDevice.deviceModel;
    }
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
    : mediaDevicesMode === 'empty' ? []
    : createMediaDevicesFromSeed(stableIdentity + ':' + seed.toString('hex').slice(0, 12), {
      emptyLabels: mediaDevicesMode === 'empty',
      extra: Array.isArray(fpIn.mediaDevices) ? fpIn.mediaDevices : null,
      labels: mediaLabelTemplates,
      os: uaOs,
      laptop: devicePersona ? devicePersona.laptop !== false : undefined,
    });
  // Device class, not a coin flip, decides the battery shape. Desktop-class personas
  // (Mac mini / iMac / Studio, Linux towers, Windows desktops) have no battery hardware at
  // all: getBattery still exists on Chrome desktops, but the reading is always the
  // AC-powered full state. Laptop-class panels keep the seeded partial-charge draw. Screen
  // size is the class proxy that is already part of the persona record.
  const isLaptopClass = Boolean(mobileDevice)
    || (devicePersona
      ? Boolean(devicePersona.laptop)
      : !(Number(screenWidth) >= 2200 && Number(screenHeight) >= 1200));
  const battery = batteryMode === 'real'
    ? null
    : (batteryMode === 'blocked'
      ? { blocked: true }
      : createBatteryFromSeed(
        stableIdentity + ':battery:' + seed.toString('hex').slice(0, 8),
        fpIn.battery || privacy.batterySnapshot || null,
        { acPowered: !isLaptopClass || (!mobileDevice && (draw('battery.power', 72) % 10) < 4) },
      ));
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
  // Chrome's default mDNS privacy mode names the host candidate <uuid4>.local instead of a
  // raw RFC1918 address; see createLocalMdnsFromSeed. Consumed by the candidate rewrite
  // paths (document-webrtc proxy mode and the synthetic fallback).
  const webrtcLocalMdns = String(
    fpIn.webrtcLocalMdns
    || privacy.webrtcLocalMdns
    || ''
  ).trim() || createLocalMdnsFromSeed(stableIdentity + ':webrtc-mdns:' + seed.toString('hex').slice(0, 8));

  // MAC 地址（对齐常见指纹浏览器的设备标识组）：MAC 本身不会暴露给网页 JS，
  // 但作为环境硬件标识记录在 init.json 与概要中；custom 模式由用户固定。
  const macMode = mode('macMode', ['real', 'custom'], privacy.macMode === 'custom' ? 'custom' : 'real');
  const macValue = String(fpIn.mac || privacy.mac || '').trim().toUpperCase();

  // --- navigator.connection persona (Roxy networkType/networkSpeed/downloadSpeed/latency 对齐) ---
  // NetworkInformation exposes host NIC conditions (effectiveType / downlink / rtt) that a
  // datacenter desktop and a home laptop answer differently. A deterministic seeded draw keeps
  // the profile stable across restarts; privacy.network overrides individual fields, and
  // privacy.networkMode 'real' keeps the host answers untouched.
  const networkMode = mode('networkMode', ['real', 'noise'], 'noise');
  const networkIn = (fpIn.network && typeof fpIn.network === 'object')
    ? fpIn.network
    : (privacy.network && typeof privacy.network === 'object' ? privacy.network : null);
  const NETWORK_EFFECTIVE_TYPES = ['4g', '4g', '4g', '3g'];
  // Keep the v1 serialized draw for backup replay. Both injection builders
  // project it onto the native bound; v2 corrects only the formerly invalid slot.
  const NETWORK_DOWNLINK_POOL = [1.45, 2.3, 4.35, 5.6, 8.7, 9.15, version === 1 ? 10.1 : 10];
  const NETWORK_RTT_POOL = [50, 100, 150, 200, 250];
  // connection.type is Android-only in stock Chrome: a desktop build leaves the field
  // undefined, so a desktop persona reporting ethernet/wifi is a one-read tell — the key is
  // omitted on desktop unless the user pinned it. Seeds moved off 36/44 (which the persona
  // draw and the UA draw already use) onto their own offsets so the axes stay independent;
  // shared seed offsets make correlated draws, which is itself a fingerprint.
  // CSS media preference axes. Real-world distribution, not uniform: Chrome's own
  // telemetry (and every analytics vendor) shows ~80% light scheme, ~85% no reduced
  // motion, forced-colors is a rare accessibility setting (~3%), and pointer/hover
  // follow the device class (mobile -> coarse/none; desktop -> fine/hover). Drawn from
  // seed offsets 76-84 (fresh — no axis shares an offset with any other draw).
  const mediaPrefs = {
    colorScheme: mediaIn?.colorScheme
      || (draw('media.colorScheme', 76) % 10 < 8 ? 'light' : 'dark'),
    reducedMotion: mediaIn?.reducedMotion
      || (draw('media.reducedMotion', 78) % 20 < 17 ? 'no-preference' : 'reduce'),
    forcedColors: mediaIn?.forcedColors
      || (draw('media.forcedColors', 80) % 100 < 3 ? 'active' : 'none'),
    contrast: mediaIn?.contrast
      || (draw('media.contrast', 82) % 20 < 19 ? 'no-preference' : (draw('media.contrast', 82) % 40 < 21 ? 'more' : 'less')),
  };
  // Retained in the persisted identity shape for version-1 replay compatibility.
  // This historical table is NOT a runtime capability override: a coarse OS
  // label cannot supply native encoders or keep RTP answers in sync with SDP.
  const CODEC_MATRIX = {
    windows: {
      video: { 'video/mp4': true, 'video/webm': true, 'video/av1': true },
      audio: { 'audio/mp4': true, 'audio/webm': true, 'audio/ogg': true },
      recorder: { 'video/webm': true, 'video/mp4': true, 'video/x-matroska': true },
      rtcVideo: { 'video/vp8': true, 'video/vp9': true, 'video/av1': true, 'video/h264': true },
      rtcAudio: { 'audio/opus': true, 'audio/red': true, 'audio/G722': true, 'audio/PCMU': true, 'audio/PCMA': true },
    },
    macos: {
      video: { 'video/mp4': true, 'video/webm': true, 'video/av1': true },
      audio: { 'audio/mp4': true, 'audio/webm': true, 'audio/ogg': false },
      recorder: { 'video/webm': true, 'video/mp4': true, 'video/x-matroska': true },
      rtcVideo: { 'video/vp8': true, 'video/vp9': true, 'video/av1': true, 'video/h264': true },
      rtcAudio: { 'audio/opus': true, 'audio/red': true, 'audio/G722': true, 'audio/PCMU': true, 'audio/PCMA': true },
    },
    macos_arm: null, // same as macos — filled below
    linux: {
      video: { 'video/mp4': true, 'video/webm': true, 'video/av1': true },
      audio: { 'audio/mp4': true, 'audio/webm': true, 'audio/ogg': true },
      recorder: { 'video/webm': true, 'video/x-matroska': true },
      rtcVideo: { 'video/vp8': true, 'video/vp9': true, 'video/av1': true, 'video/h264': false },
      rtcAudio: { 'audio/opus': true, 'audio/red': true, 'audio/G722': true, 'audio/PCMU': true, 'audio/PCMA': true },
    },
  };
  CODEC_MATRIX.macos_arm = CODEC_MATRIX.macos;
  const codecMatrix = uaOs === 'linux'
    ? CODEC_MATRIX.linux
    : (uaOs === 'macos' || uaOs === 'macos_arm') ? CODEC_MATRIX.macos : CODEC_MATRIX.windows;
  let connection = networkMode === 'real' ? null : {
    ...(mobileDevice
      ? { type: String(networkIn?.type || (draw('network.type', 56) % 4 === 0 ? 'ethernet' : 'wifi')) }
      : (networkIn?.type ? { type: String(networkIn.type) } : {})),
    effectiveType: String(networkIn?.effectiveType || NETWORK_EFFECTIVE_TYPES[draw('network.effectiveType', 60) % NETWORK_EFFECTIVE_TYPES.length]),
    downlink: toFiniteNumber(networkIn?.downlink) !== null
      ? Number(networkIn.downlink)
      : NETWORK_DOWNLINK_POOL[draw('network.downlink', 64) % NETWORK_DOWNLINK_POOL.length],
    rtt: toFiniteNumber(networkIn?.rtt) !== null
      ? Number(networkIn.rtt)
      : NETWORK_RTT_POOL[draw('network.rtt', 68) % NETWORK_RTT_POOL.length],
    saveData: false,
  };
  if (version >= 2) connection = normalizeNetworkInformation(connection);

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
  const customLocation = normalizeCoordinates(privacy.latitude, privacy.longitude);
  const exitLocation = normalizeCoordinates(profile.exitLatitude, profile.exitLongitude);
  if (privacy.geoMode === 'custom' && customLocation.valid) {
    geoposition = {
      latitude: customLocation.latitude,
      longitude: customLocation.longitude,
      accuracy: Number(privacy.accuracy) || 100,
    };
  } else if (privacy.geoMode !== 'custom' && privacy.geoMode !== 'disabled' && privacy.geoMode !== 'prompt' && exitLocation.valid) {
    geoposition = { latitude: exitLocation.latitude, longitude: exitLocation.longitude, accuracy: Number(privacy.accuracy) || 1000 };
  }
  // Geolocation permission policy (Roxy geoLocation mode 0/1/2 对齐): 'deny' blocks the API
  // outright, 'allow' reports the permission as granted alongside the overridden coordinates,
  // and everything else leaves the native prompt flow. The editor derives geoMode from this
  // switch (deny→disabled / prompt→prompt), so the two stay consistent by construction.
  const requestedGeoPermission = privacy.geoMode === 'disabled' || String(privacy.geoPermission || '') === 'deny'
    ? 'denied'
    : (String(privacy.geoPermission || '') === 'allow' ? 'granted' : 'prompt');
  // An allowed permission without deliverable coordinates would expose the host location.
  const geoPermission = requestedGeoPermission === 'granted' && !geoposition ? 'denied' : requestedGeoPermission;

  let webglRenderer = (webglMetaMode === 'real')
    ? null
    : (webglMetaMode === 'blocked' ? '' : (fpIn.webglRenderer || webglPreset.renderer));
  const rLow = String(webglRenderer || '').toLowerCase();
  let resolvedVendor = fpIn.webglVendor || webglPreset.vendor;
  if (!fpIn.webglVendor && mobileDevice) {
    // Keep the device preset vendor, including version 2 iOS's Apple identity.
    resolvedVendor = webglPreset.vendor;
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
      const picked = winPresets[draw('webgl.preset', 8) % winPresets.length];
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
      const picked = andrPresets[draw('webgl.preset', 8) % andrPresets.length];
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
  const webglReconcileHost = version === 1
    && (fpIn.reconcileHost ?? fpIn.webglReconcileHost ?? privacy.webglReconcileHost ?? (process.platform === 'darwin'));
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
    ...(version >= 2 ? { generationVersion: version } : {}),
    ...(!uaOverrideStr && String(profile.osVersion || '').trim()
      ? { osVersion: String(profile.osVersion).trim() } : {}),
    seed: seed.toString('hex').slice(0, 16),
    profileId: profile.id,
    os: uaOs,
    timezone: timezoneDynamic,
    platform: fpIn.platform || uaProfile.platform || OS_PRESETS[uaOs].platformNav,
    userAgent: uaProfile.userAgent,
    uaProfile,
    kernelVersion: profile.kernelVersion || '',
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
    webrtcLocalMdns,
    deviceName,
    deviceNameMode,
    mac: {
      mode: macMode,
      value: macMode === 'custom' && /^[0-9A-F]{2}(:?[0-9A-F]{2}){5}$/.test(macValue.replace(/-/g, ':')) ? macValue.replace(/-/g, ':') : '',
    },
    connection,
    codecMatrix,
    mediaPreferences: mediaPrefs,
    geoPermission,
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
      blockCapture: privacy.media === 'blocked',
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
    vendor: fpIn.vendor ?? ((mobileDevice?.os === 'ios' || uaOs === 'ios' || (fpIn.platform && /iphone|ipad|ipod/i.test(fpIn.platform))) ? 'Apple Computer, Inc.' : (mobileDevice?.vendor ?? uaProfile?.vendor ?? 'Google Inc.')),
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
    webrtcLocalMdns,
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
    webrtcLocalMdns,
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
  const fpOsVersion = String(fp?.osVersion || (uaOs === 'macos' || uaOs === 'macos_arm'
    ? String(metadata?.platformVersion || '').split('.').slice(0, 2).join('.')
    : ({ '6.1': '7', '6.2': '8', '6.3': '8.1' }[windowsRelease] || ''))).trim();
  const osChromeViolation = fpOsVersion && fpChromeMajor
    ? osChromeSupportViolation({ id: uaOs }, fpOsVersion, fpChromeMajor)
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
  if (fp?.deviceMemory != null && ![0.25, 0.5, 1, 2, 4, 8].includes(Number(fp.deviceMemory))) {
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


module.exports = {
  buildFingerprint,
  fingerprintConsistencyIssues,
  assertFingerprintConsistency,
};
