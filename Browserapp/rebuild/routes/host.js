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
  return Array.from({ length: count }, () => {
    // Existing editors keep their storage identity; new previews hand their
    // UUID to create instead of hashing a second, unrelated UUID after save.
    const profile = fromRoxy({ ...p, windowName: "Preview" }, edited
      ? { id: edited.id } : {});
    const browser = e.chooseBrowser(profile, profile.engine);
    profile.fingerprintSeed = crypto.randomBytes(16).toString('hex');
    const firefox = profile.engine === 'firefox';
    const fullVersion = firefox ? null : randomUaPatchVersion(browser.version, { previousUserAgent: p.previousUserAgent });
    const options = { os: profile.os, osVersion: profile.osVersion,
      chromeMajor: Number(browser.version.split('.')[0]), chromeFull: fullVersion };
    const os = /mac/i.test(profile.os) ? 'mac' : /win/i.test(profile.os) ? 'win' : 'linux';
    const generated = firefox
      ? buildUaProfile({ os: profile.os, userAgent: firefoxUserAgent(os, browser.version) })
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
    const configured = { ...profile, kernelVersion: browser.version };
    const f = profile.engine === 'firefox'
      ? require('../../automation/firefox-fingerprint').buildFirefoxFingerprint(configured, browser.version)
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
  if (p.probe && !(p.cached && service.hostNetwork?.ip && Date.now() - service.hostNetworkTime < 60000)) {
    if (!service.hostNetworkProbe)
      service.hostNetworkProbe = require("../host-network")
        .probeHostNetwork()
        .finally(() => {
          service.hostNetworkProbe = null;
        });
    const result = await service.hostNetworkProbe;
    if (!result.ip) throw Error("网络定位未返回 IP");
    service.hostNetwork = {
      ...result,
      country_code: result.countryCode || "",
    };
    service.hostNetworkTime = Date.now();
  }

  const entries = Object.values(require("node:os").networkInterfaces())
    .flat()
    .filter((v) => v && !v.internal);
  return {
    ...service.hostNetwork,
    ip: service.hostNetwork?.ip || "",
    localAddress: entries.find((v) => v.family === "IPv4")?.address || "",
    timezone:
      service.hostNetwork?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    country_code: service.hostNetwork?.country_code || "",
    city: service.hostNetwork?.city || "",
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
  ["fingerprint:preview", fingerprintPreview, "serial"],
  ['fingerprint:sample-fields', fingerprintFields, 'parallel'],
  ["host:dictionary", hostDictionary, "parallel"],
  ["host:network", hostNetwork, "parallel"],
  ["host:mac", hostMac, "parallel"],
  ["kernels:list", kernelsList, "parallel"],
];
