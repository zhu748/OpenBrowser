"use strict";

const { fromRoxy } = require("../profile-dto");
const crypto = require('node:crypto');
const { buildUaProfile } = require('../../automation/user-agent');
const { firefoxUserAgent } = require('../../automation/kernel-versions');
const { buildFingerprint } = require('../../automation/fingerprint');
const { randomUaPatchVersion } = require('../../automation/ua-version');
const { previewIdentity } = require('../fingerprint-draft');

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
  const input = { ...p, windowName: "Preview" };
  const first = fromRoxy(input, edited ? { id: edited.id } : {});
  const browser = e.chooseBrowser(first, first.engine);
  const version = e.kernelManager?.readInstalledVersion
    ? await e.kernelManager.readInstalledVersion(browser)
    : browser.version;
  return Array.from({ length: count }, (_, index) => {
    // Each preview keeps the storage identity its eventual create will use.
    const profile = index === 0 ? first : fromRoxy(input, edited ? { id: edited.id } : {});
    profile.fingerprintSeed = crypto.randomBytes(16).toString('hex');
    const firefox = profile.engine === 'firefox';
    const fullVersion = firefox ? null : randomUaPatchVersion(version, { previousUserAgent: p.previousUserAgent });
    const options = { os: profile.os, osVersion: profile.osVersion,
      chromeMajor: Number(version.split('.')[0]), chromeFull: fullVersion };
    const os = /mac/i.test(profile.os) ? 'mac' : /win/i.test(profile.os) ? 'win' : 'linux';
    const generated = firefox
      ? buildUaProfile({ os: profile.os, userAgent: firefoxUserAgent(os, version) })
      : buildUaProfile({ ...options, reduced: false });
    // Mobile templates own the model and release; they are selected below.
    const mobile = /android|ios|iphone|ipad/i.test(profile.os);
    if (!mobile) {
      profile.userAgent = generated.userAgent;
      profile.privacy.fingerprint = { ...profile.privacy.fingerprint,
        uaGenerated: true, uaReduced: false, uaPatchRandomized: !firefox, clientHints: generated.clientHints };
    }
    // A draft describes the next saved configuration, even while the old
    // browser is running. fingerprintFor(id) deliberately returns that live
    // snapshot and must not be used to sample a proposed identity.
    const configured = { ...profile, kernelVersion: version };
    const f = profile.engine === 'firefox'
      ? require('../../automation/firefox-fingerprint').buildFirefoxFingerprint(configured, version)
      : buildFingerprint(configured);
    return {
      userAgent: f.userAgent,
      webGLManufacturer: f.webgl.vendor,
      webGLRender: f.webgl.renderer,
      deviceName: f.deviceName,
      macAddr: f.mac.value,
      hardwareConcurrent: f.hardwareConcurrency == null ? undefined : String(f.hardwareConcurrency),
      deviceMemory: f.deviceMemory == null ? undefined : String(f.deviceMemory),
      _fingerprintDraft: { ...previewIdentity(e, profile), generated: true,
        userAgent: f.userAgent, uaReduced: mobile, uaPatchRandomized: !mobile && !firefox, clientHints: f.clientHints },
      ...(p.fontType
        ? { font: f.fonts.list.join(";"), fontList: f.fonts.list }
        : {}),
      _openbrowser: f,
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
  const profile = fromRoxy({ os: p.os, windowName: 'Fingerprint fields' });
  const f = buildFingerprint({ ...profile, fingerprintSeed: crypto.randomBytes(16).toString('hex') });
  return { getwebGLNoiseValue: f.webgl.mark, getCanvasContextNoiseValue: f.canvas.mark,
    getClientRectsValue: f.clientRects, getSpeechSynthesis: f.speech.voices, getAllowFontList: f.fonts.list,
    deviceName: f.deviceName, macAddr: f.mac.value };
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
