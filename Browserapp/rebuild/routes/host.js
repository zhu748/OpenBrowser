"use strict";

const { fromRoxy } = require("../profile-dto");
const crypto = require('node:crypto');
const { buildUaProfile, withChromeUaVersion, normalizeUaOs, normalizeSelectedOsVersion } = require('../../automation/user-agent');
const { pickPublishedChromeVersion } = require('../../automation/ua-version');
const { firefoxUserAgent } = require('../../automation/kernel-versions');
const { buildFingerprint, assertFingerprintConsistency } = require('../../automation/fingerprint');
const { hostScreenSummary } = require('../../engine/launch-display');
const { CURRENT_FINGERPRINT_VERSION } = require('../../automation/fingerprint/generation');
const { previewIdentity, reusePreviewIdentity } = require('../fingerprint-draft');
const { formatLocalMacAddress } = require('../../shared/profile-values');

async function hostShortcut(service, p) {
  return require("../host-actions").shortcut(service, p);
}

async function hostDefaultBrowser(service, p) {
  return require("../host-actions").setDefault(service, p);
}

async function fingerprintPreview(service, p) {
  const e = service.engine;
  const count = Number(p.count ?? 1);
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw Error("Invalid fingerprint count");
  const edited = p.profileId ? e.profileForEdit(String(p.profileId)).profile : null;
  if (p.reuseDraft && count !== 1) throw Error('复用指纹预览时只能生成一条');
  const reused = p.reuseDraft ? reusePreviewIdentity(e, p.reuseDraft, edited) : null;
  // Keep the settings that an edit would inherit while rerolling the old UA and seed.
  const input = { ...p, userAgent: p.userAgent ?? '', windowName: "Preview" };
  delete input._fingerprintDraft;
  const webglMode = p.webGLInfo ?? ({ real: 0, noise: 1, custom: 2, blocked: 0 }[edited?.privacy?.webglMeta] ?? 1);
  if (!reused && webglMode === 1) {
    input.webGLManufacturer = '';
    input.webGLRender = '';
  }
  const base = { ...edited, id: reused?.id || edited?.id,
    fingerprintVersion: reused?.version ?? CURRENT_FINGERPRINT_VERSION };
  if (edited?.privacy?.fingerprint && !input.userAgent) {
    // A blank UA can still have saved hints. Clear those before sampling unless
    // this request below explicitly reuses the matching saved identity.
    base.privacy = { ...edited.privacy, fingerprint: { ...edited.privacy.fingerprint } };
    delete base.privacy.fingerprint.clientHints;
  }
  const first = fromRoxy(input, base);
  const savedHints = edited?.privacy?.fingerprint?.clientHints;
  const osFamily = normalizeUaOs(first.os);
  if (reused && reused.seed === edited?.fingerprintSeed && reused.version === edited?.fingerprintVersion
    && savedHints
    && osFamily === normalizeUaOs(edited.os)
    && normalizeSelectedOsVersion(first.osVersion) === normalizeSelectedOsVersion(edited.osVersion)) {
    // Only reuse these constraints for the saved seed. A pending reroll
    // resolves its own device and OS release from the draft seed.
    first.privacy.fingerprint = { ...first.privacy.fingerprint, clientHints: {
      architecture: savedHints.architecture,
      deviceModel: savedHints.deviceModel,
      platform_version: savedHints.platform_version ?? savedHints.platformVersion,
    } };
  }
  const browser = e.chooseBrowser(first, first.engine);
  const version = e.kernelManager?.readInstalledVersion
    ? await e.kernelManager.readInstalledVersion(browser)
    : browser.version;
  const hostScreen = hostScreenSummary();
  return Array.from({ length: count }, (_, index) => {
    // Each preview keeps the storage identity its eventual create will use.
    const profile = index === 0 ? first : fromRoxy(input, base);
    profile.fingerprintSeed = reused?.seed ?? crypto.randomBytes(16).toString('hex');
    const firefox = profile.engine === 'firefox';
    if (!firefox && profile.fingerprintVersion <= 3 && profile.privacy.macMode === 'custom' && !profile.privacy.mac)
      profile.privacy.mac = formatLocalMacAddress(crypto.randomBytes(6));
    if (firefox) {
      const os = /mac/i.test(profile.os) ? 'mac' : /win/i.test(profile.os) ? 'win' : 'linux';
      const generated = buildUaProfile({ os: profile.os, userAgent: firefoxUserAgent(os, version) });
      profile.userAgent = generated.userAgent;
      profile.privacy.fingerprint = { ...profile.privacy.fingerprint,
        uaGenerated: true, uaReduced: false, uaPatchRandomized: false, clientHints: generated.clientHints };
    }
    // A draft describes the next saved configuration, even while the old
    // browser is running. fingerprintFor(id) deliberately returns that live
    // snapshot and must not be used to sample a proposed identity.
    const configured = { ...profile, kernelVersion: version, hostScreen };
    let f = firefox
      ? require('../../automation/firefox-fingerprint').buildFirefoxFingerprint(configured, version)
      : buildFingerprint(configured);
    const randomizeUaVersion = !firefox && p.randomizeUaVersion === true;
    if (randomizeUaVersion) {
      const ua = withChromeUaVersion(f.uaProfile, pickPublishedChromeVersion(version, f.os, p.previousUserAgent));
      f = buildFingerprint({ ...configured, userAgent: ua.userAgent, privacy: { ...configured.privacy,
        fingerprint: { ...configured.privacy.fingerprint, uaGenerated: true, uaReduced: false,
          uaVersionRandomized: true, uaPatchRandomized: false, clientHints: ua.clientHints },
      } });
    }
    if (!firefox) assertFingerprintConsistency(f);
    const hardwareConcurrent = f.hardwareConcurrency == null
      ? (profile.privacy.cores === 0 ? '0' : undefined) : String(f.hardwareConcurrency);
    const deviceMemory = f.deviceMemory == null
      ? (profile.privacy.memory === 0 ? '0' : undefined) : String(f.deviceMemory);
    const generatedHardware = {
      ...(profile.privacy.cores == null && hardwareConcurrent !== undefined ? { hardwareConcurrent } : {}),
      ...(profile.privacy.memory == null && deviceMemory !== undefined ? { deviceMemory } : {}),
      ...(webglMode === 1 && !profile.privacy.fingerprint?.webglVendor && !profile.privacy.fingerprint?.webglRenderer
        ? { webGLManufacturer: f.webgl.vendor, webGLRender: f.webgl.renderer } : {}),
    };
    if (profile.fingerprintVersion >= 4) {
      const overrides = profile.privacy.fingerprint;
      const pinnedName = f.deviceNameMode === 'custom'
        && String(overrides?.deviceName || profile.privacy.deviceName || '').trim();
      if (f.deviceName && !pinnedName) generatedHardware.deviceName = f.deviceName;
      if (f.mac.value && !(overrides?.mac || profile.privacy.mac)) generatedHardware.macAddr = f.mac.value;
    }
    return {
      userAgent: f.userAgent,
      webGLManufacturer: f.webgl.vendor,
      webGLRender: f.webgl.renderer,
      ...(f.deviceName ? { deviceName: f.deviceName } : {}),
      ...(f.mac.value ? { macAddr: f.mac.value } : {}),
      hardwareConcurrent,
      deviceMemory,
      _fingerprintDraft: { ...previewIdentity(e, profile), generated: true,
        userAgent: f.userAgent, uaReduced: !randomizeUaVersion && !firefox && f.os !== 'ios',
        uaVersionRandomized: randomizeUaVersion, uaPatchRandomized: false, clientHints: f.clientHints, generatedHardware },
      ...(p.fontType
        ? { font: f.fonts.list.join(";"), fontList: f.fonts.list }
        : {}),
      ...(p.includeRuntime === false ? {} : { _openbrowser: f }),
    };
  });
}

async function hostDictionary() {
  const { COUNTRY_TO_LOCALE } = require("../../automation/locale-from-country");
  return {
    languages: [...new Set(Object.values(COUNTRY_TO_LOCALE))].sort(),
    timezones: [...new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])],
  };
}

async function fingerprintFields(_service, p) {
  const profile = fromRoxy({ os: p.os, windowName: 'Fingerprint fields', macInfo: p.macInfo === true });
  const f = buildFingerprint({ ...profile, fingerprintSeed: crypto.randomBytes(16).toString('hex') });
  return { getwebGLNoiseValue: f.webgl.mark, getCanvasContextNoiseValue: f.canvas.mark,
    getClientRectsValue: f.clientRects, getSpeechSynthesis: f.speech.voices, getAllowFontList: f.fonts.list,
    deviceName: f.deviceName, ...(f.mac.value ? { macAddr: f.mac.value } : {}) };
}

async function hostNetwork(service, p) {
  const mode = p.mode === "local" || p.mode === "system" ? p.mode : undefined;
  let network = service.hostNetwork;
  if (p.probe && (mode || !(p.cached && network?.ip && Date.now() - service.hostNetworkTime < 60000))) {
    const key = mode || "auto";
    const probes = service.hostNetworkProbes ||= new Map();
    if (!probes.has(key)) {
      const engine = service.engine;
      const probe = require("../host-network").probeHostNetwork({
        mode,
        lookupSystemNetwork: engine.requestSystemNetwork ? () => engine.lookupSystemNetwork() : undefined,
      }).finally(() => { probes.delete(key); });
      probes.set(key, probe);
    }
    const result = await probes.get(key);
    if (!result.ip) throw Error("网络定位未返回 IP");
    network = {
      ...result,
      country_code: result.countryCode || "",
    };
    if (!mode) {
      service.hostNetwork = network;
      service.hostNetworkTime = Date.now();
    }
  }

  const entries = Object.values(require("node:os").networkInterfaces())
    .flat()
    .filter((v) => v && !v.internal);
  return {
    ...network,
    ip: network?.ip || "",
    localAddress: entries.find((v) => v.family === "IPv4")?.address || "",
    timezone:
      network?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    country_code: network?.country_code || "",
    city: network?.city || "",
  };
}

async function hostMac() {
  const row = Object.values(require("node:os").networkInterfaces())
    .flat()
    .find((v) => v && !v.internal && v.mac !== "00:00:00:00:00:00");
  if (!row) throw Error("没有可读取的本机 MAC 地址");
  return row.mac;
}

async function kernelsList(service) {
  const e = service.engine;
  const rows = [...e.kernelManager.listInstalledKernels()];
  const primary = e.kernelManager.resolveInstalled();
  if (primary?.path && !rows.some((row) => row.path === primary.path))
    rows.push({
      ...primary,
      id: "primary:" + primary.path,
      engine: primary.engine === "firefox" ? "firefox" : "chromium",
      version: primary.version,
      primary: true,
    });
  return rows;
}

module.exports = [
  ["host:shortcut", hostShortcut, "serial"],
  ["host:default-browser", hostDefaultBrowser, "serial"],
  ["fingerprint:preview", fingerprintPreview, "parallel", false],
  ['fingerprint:sample-fields', fingerprintFields, 'parallel'],
  ["host:dictionary", hostDictionary, "parallel"],
  ["host:network", hostNetwork, "parallel"],
  ["host:mac", hostMac, "parallel"],
  ["kernels:list", kernelsList, "parallel"],
];
