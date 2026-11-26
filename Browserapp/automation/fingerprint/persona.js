'use strict';

const { fingerprintVersion, createFingerprintDraw } = require('./generation');
const { resolvePersonaLanguages } = require('./persona-locale');
const { inferGpuFromRenderer, resolvePersonaScreen } = require('./persona-display');
const { fingerprintConsistencyIssues, assertFingerprintConsistency } = require('./consistency');
const { resolveProfileGeolocation } = require('./geolocation-policy');

const { normalizeNetworkInformation, normalizeHardwareConcurrency, normalizeDeviceMemory,
  resolveDoNotTrackMode, resolveFingerprintSurfaceModes, toFiniteNumber, formatLocalMacAddress } = require('../../shared/profile-values');
const { normalizeUaOs } = require('../user-agent');
const { resolveProfileTimezone } = require('../locale-from-country');
const { OPENBROWSER_KERNEL_VERSION } = require('../versions');
const { resolvePersonaUa } = require('./persona-ua');
const { desktopPlatformVersion } = require('../device-personas');

/**
 * Persona construction: buildFingerprint (deterministic profile ->
 * static/dynamic fingerprint config). Locale, display projection and consistency
 * validation are separate pure stages; random draw order stays in this builder.
 */

const { pickPersona, fontsForOs, exclusiveFontsForOtherOs, isPersonaWebglCompatible, resolveCompatiblePersona, applyPersonaPerturbations, mobilePersona, supportsRuntimePersona, buildUaProfile, buildAcceptLanguageHeader, parseOsFromUa, OS_PRESETS, canonicalBridgeToken, hashSeed, mulberry32, WEBGL_PRESETS, webglPresetsForOs, webglParameterOverrides, buildWebglFpPayload, desktopOs, resolveStabilityPolicy, createBatteryFromSeed, createMediaDevicesFromSeed, createSpeechVoicesFromSeed, createDeviceNameFromSeed, createLocalIpFromSeed, createLocalMdnsFromSeed, formatGeopositionValue, audioMarkFromSeed, clientRectMarkFromSeed } = require('./shared');

// Defaults for the resolved effective type. Explicit measurements and the
// historical v1 draw retain their existing semantics.
const SLOW_NETWORK_PRESETS = new Map([
  ['3g', { downlink: [0.4, 0.55, 0.7, 0.85, 1, 1.15, 1.4], rtt: [450, 500, 600, 750, 900] }],
  ['2g', { downlink: [0.15, 0.2, 0.25, 0.3], rtt: [1800, 1950, 2100, 2250] }],
  ['slow-2g', { downlink: [0.05, 0.1], rtt: [2700, 2850, 3000] }],
]);

/**
 * Build fingerprint config from profile + optional privacy.fingerprint overrides.
 */
function buildFingerprint(profile = {}, { timezone: timezoneDynamic = resolveProfileTimezone(profile) || null } = {}) {
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

  const coresOverride = toFiniteNumber(fpIn.cores) ?? toFiniteNumber(privacy.cores);
  const memoryOverride = toFiniteNumber(fpIn.memory) ?? toFiniteNumber(privacy.memory);
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
  const memoryPool = [4, 8];
  let memory = hasMemoryOverride
    ? normalizeDeviceMemory(memoryOverride)
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

  // Use one resolved mark for the document, worker and native configuration.
  // Zero and invalid overrides follow the seed, matching persisted profile validation.
  const canvasId = toFiniteNumber(fpIn.canvasId) || (draw('canvas.mark', 28) % 20000) - 10000 || 1;
  const webglId = toFiniteNumber(fpIn.webglId) || (draw('webgl.mark', 32) % 20000) - 10000 || 1;
  const audioId = toFiniteNumber(fpIn.audioId) || audioMarkFromSeed(seed.toString('hex'));
  const clientRectsId = toFiniteNumber(fpIn.clientRectsId) || clientRectMarkFromSeed(seed);

  const mode = (name, allowed, fallback) => {
    const value = fpIn[name] ?? privacy[name];
    return allowed.includes(String(value || '')) ? String(value) : fallback;
  };

  const { canvas: canvasMode, webgl: webglMode, webglMeta: webglMetaMode, audio: audioMode, clientRects: clientRectsMode,
    speech: speechMode, webgpu: webgpuMode } = resolveFingerprintSurfaceModes(privacy, fpIn);
  const webrtcMode = mode('webrtc', ['real', 'proxy', 'disabled'], privacy.webrtc || 'proxy');
  // Numeric shadow of webrtc mode only (not an independent control).
  const webrtcPolicy = webrtcMode === 'disabled' ? 0 : (webrtcMode === 'proxy' ? 3 : 1);
  const mediaDevicesMode = mode('mediaDevices', ['real', 'noise', 'empty'], privacy.mediaDevices === 'real' ? 'real' : (privacy.mediaDevices === 'empty' ? 'empty' : (privacy.media === 'noise' ? 'noise' : (privacy.media === 'blocked' ? 'empty' : 'noise'))));
  const batteryMode = mode('battery', ['real', 'noise', 'blocked'], privacy.battery === 'blocked' ? 'blocked' : (privacy.battery === 'real' ? 'real' : 'noise'));
  const bluetoothMode = mode('bluetooth', ['real', 'blocked'], privacy.bluetooth === 'blocked' ? 'blocked' : 'real');
  const stability = resolveStabilityPolicy(privacy, {
    host: fpIn.stabilityHost || privacy.stabilityHost || profile.stabilityHost || '',
    mode: fpIn.stabilityMode || privacy.stabilityMode,
  });

  const { uaOverrideStr, clientHintsIn, kernelMajor, defaultKernelMajor, selectedVersion, uaProfile: resolvedUa } = resolvePersonaUa({
    profile, privacy, fpIn, draw, fingerprintVersion: version,
  });
  let uaProfile = resolvedUa;

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
    const platformVersion = clientHintsIn.platform_version ?? fpIn.platformVersion;
    devicePersona = pickPersona(uaOs, draw('device.persona', 36), {
      fingerprintVersion: version, osVersion: selectedVersion || platformVersion,
    });
    const useGating = version === 1 && fpIn.webglCapabilityGating !== false && privacy.webglCapabilityGating !== false;
    if (useGating && !isPersonaWebglCompatible(devicePersona, process.platform)) {
      devicePersona = resolveCompatiblePersona(devicePersona, process.platform);
    }
    if (version >= 3 && !mobileRequested && uaProfile.metadata && platformVersion == null
      && (!uaOverrideStr || fpIn.uaGenerated) && (!selectedVersion || uaOs === 'linux')) {
      const sampledPlatformVersion = desktopPlatformVersion(uaOs, devicePersona, draw('userAgent.platformVersion', 0), kernelMajor || defaultKernelMajor);
      if (sampledPlatformVersion !== undefined) {
        uaProfile = buildUaProfile({
          userAgent: uaProfile.userAgent, os: uaOs, chromeMajor: uaProfile.chromeMajor,
          chromeFull: uaProfile.chromeFull, ...uaProfile.clientHints, platformNav: uaProfile.platform,
          platform_version: sampledPlatformVersion, vendor: uaProfile.vendor,
        });
      }
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
      fingerprintVersion: version,
      deviceModel: clientHintsIn.deviceModel,
      model: clientHintsIn.model !== 'K' ? (clientHintsIn.model || (uaOverrideStr ? uaProfile.metadata?.model : '')) : '',
      osVersion: clientHintsIn.platform_version || clientHintsIn.platformVersion || explicitMobileVersion || (!uaOverrideStr ? selectedVersion : ''),
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
  const effectiveRenderer = String(fpIn.webglRenderer || webglPreset.renderer || '');
  const inferredGpu = version >= 3 && effectiveRenderer === webglPreset.renderer
    ? webglPreset.gpu : inferGpuFromRenderer(effectiveRenderer);
  const webglGpu = ((fpIn.webgpu && typeof fpIn.webgpu === 'object') || fpIn.gpuVendor || fpIn.gpuArchitecture)
    ? {
      vendor: String(fpIn.webgpu?.vendor || fpIn.gpuVendor || inferredGpu?.vendor || webglPreset.gpu?.vendor || ''),
      architecture: String(fpIn.webgpu?.architecture || fpIn.gpuArchitecture || inferredGpu?.architecture || webglPreset.gpu?.architecture || ''),
    }
    : (inferredGpu || webglPreset.gpu || null);

  const languages = resolvePersonaLanguages(profile);

  const { screenWidth, screenHeight, availWidth, availHeight, availLeft, availTop, screenX, screenY, dpr } = resolvePersonaScreen({
    profile, privacy, fpIn, mobileDevice, devicePersona, width, height, uaOs, devicePixelRatio,
  });

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
      fingerprintVersion: version,
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
    stableIdentity + ':device:' + seed.toString('hex').slice(0, version >= 4 ? 64 : 8),
    {
      mode: deviceNameMode,
      custom: fpIn.deviceName || privacy.deviceName || '',
      os: uaOs,
      laptop: devicePersona?.laptop,
      fingerprintVersion: version,
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
  const macValue = String(fpIn.mac || privacy.mac || '').trim().toUpperCase()
    || (version >= 4 && macMode === 'custom' ? formatLocalMacAddress(hashSeed(identitySeed + ':mac')) : '');

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
  const effectiveType = String(networkIn?.effectiveType || NETWORK_EFFECTIVE_TYPES[draw('network.effectiveType', 60) % NETWORK_EFFECTIVE_TYPES.length]);
  const slowerNetwork = version >= 2 ? SLOW_NETWORK_PRESETS.get(effectiveType) : null;
  const downlinkPool = slowerNetwork?.downlink || NETWORK_DOWNLINK_POOL;
  const rttPool = slowerNetwork?.rtt || NETWORK_RTT_POOL;
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
    effectiveType,
    downlink: toFiniteNumber(networkIn?.downlink) !== null
      ? Number(networkIn.downlink)
      : downlinkPool[draw('network.downlink', 64) % downlinkPool.length],
    rtt: toFiniteNumber(networkIn?.rtt) !== null
      ? Number(networkIn.rtt)
      : rttPool[draw('network.rtt', 68) % rttPool.length],
    ...(toFiniteNumber(networkIn?.downlinkMax)!==null?{downlinkMax:Number(networkIn.downlinkMax)}:{}),
    saveData: networkIn?.saveData===true,
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
  const { permission: geoPermission, position: geoposition } = resolveProfileGeolocation(profile);

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
    mark: webglId,
    gpu: webglMetaMode === 'real' ? null : webglGpu,
    reconcileHost: Boolean(webglReconcileHost),
    stability,
  };
  webgl.limits = webglMetaMode === 'real' ? null : webglParameterOverrides(webgl.gpu, {
    reconcileHost: webgl.reconcileHost,
    hostPlatform: process.platform,
  });
  webgl.fpPayload = buildWebglFpPayload(webgl);

  const hardwareConcurrency = useRealCores ? null : (normalizeHardwareConcurrency(fpIn.hardwareConcurrency) ?? cores);
  const deviceMemory = useRealMemory ? null : (normalizeDeviceMemory(fpIn.deviceMemory) ?? memory);
  const fingerprint = {
    ...(version >= 2 ? { generationVersion: version } : {}),
    ...((version >= 3 || !uaOverrideStr) && String(profile.osVersion || '').trim()
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
    languages,
    hardwareConcurrency,
    deviceMemory,
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
      devicePixelRatio: dpr,
    },
    webgl,
    canvas: {
      mode: canvasMode,
      mark: canvasId,
      stability,
    },
    audio: {
      mode: audioMode,
      mark: audioId,
    },
    clientRects: {
      mode: clientRectsMode,
      mark: clientRectsId,
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
      mode: webgpuMode === 'webgl' && webglMetaMode === 'real' ? 'real' : webgpuMode,
      gpu: webgl.gpu,
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
        viewport: {
          width: screenWidth,
          height: Math.min(screenHeight, Math.max(320, screenHeight - (mobileDevice.screen.height - mobileDevice.viewport.height))),
        },
        screen: { width: screenWidth, height: screenHeight },
        panel: { ...mobileDevice.panel },
        dpr,
        gpu: { vendor: mobileDevice.gpu.vendor, renderer: mobileDevice.gpu.renderer, family: mobileDevice.gpu.family },
      }
      : null,
    vendor: fpIn.vendor ?? ((mobileDevice?.os === 'ios' || uaOs === 'ios' || (fpIn.platform && /iphone|ipad|ipod/i.test(fpIn.platform))) ? 'Apple Computer, Inc.' : (mobileDevice?.vendor ?? uaProfile?.vendor ?? 'Google Inc.')),
    acceptLanguage: buildAcceptLanguageHeader(languages),
    doNotTrack: resolveDoNotTrackMode(privacy) === 'on' ? '1' : null,
    // Static noise identity vs dynamic exit-IP layer
    staticConfig: {
      hardwareConcurrency,
      deviceMemory,
      platform: fpIn.platform || uaProfile.platform || OS_PRESETS[uaOs].platformNav,
      langs: languages,
      canvasMark: canvasId,
      webglMark: webglId,
      audioFp: audioId,
      clientRectFp: clientRectsId,
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

module.exports = {
  buildFingerprint,
  fingerprintConsistencyIssues,
  assertFingerprintConsistency,
};
