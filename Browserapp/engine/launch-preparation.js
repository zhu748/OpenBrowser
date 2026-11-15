'use strict';

const { ipChangePolicy } = require('../automation/profile-defaults');
const { assertResourceGateForLaunch } = require('./resource-gate');
const { mergeLaunchProfileUpdate } = require('./launch-profile');
const { profileWriteGuard } = require('./profile-write-guard');

/** @typedef {{root: string|null, profileLock: object|null, proxyForwarder: object|null,
 * kernelWindowName: string|null, browser: object|null, launchBinary: string|null,
 * child: object|null, connection: object|null, lifecycleGeneration?: number|null}} StartupResources */

/** The launch pipeline owns these handles until it transfers them to a running item.
 * @returns {StartupResources} */
function createStartupResources() {
  return { root: null, profileLock: null, proxyForwarder: null, kernelWindowName: null,
    browser: null, launchBinary: null, child: null, connection: null };
}

function reportPlatformPreflight(engine) {
  if (engine._platformPreflightDone) return;
  engine._platformPreflightDone = true;
  try {
    const { ok, warnings } = engine.platformPreflightReport();
    if (warnings.length) engine.emit({ type: 'platform-preflight', ok, warnings });
  } catch (error) {
    console.warn('[OpenBrowser] platform preflight unavailable:', error?.message || String(error));
  }
}

function assertExitNetworkPolicy(engine, previous, profile) {
  const previousExitIp = String(previous.exitIp || '').trim();
  const previousCountry = String(previous.exitCountryCode || '').trim();
  const currentExitIp = String(profile.exitIp || '').trim();
  const currentCountry = String(profile.exitCountryCode || '').trim();
  const ipChanged = previousExitIp && currentExitIp && previousExitIp !== currentExitIp;
  if (ipChanged && ipChangePolicy(profile) !== 'patch') {
    const message = `出口 IP 已变化：${previousExitIp} → ${currentExitIp}`;
    if (ipChangePolicy(profile) === 'stop')
      throw Object.assign(new Error(message + '，已按「IP 变化停止打开」策略阻断启动'), { code: 'ip-changed' });
    engine.emit({ type: 'ip-change-notice', id: profile.id, previousExitIp, currentExitIp, message });
  }
  if (profile.advanced?.stopOpenIPChange && ipChanged)
    throw Object.assign(new Error(`出口 IP 已变化：${previousExitIp} → ${currentExitIp}，已按「IP 发生变化停止打开」策略阻断启动`), { code: 'ip-changed' });
  if (profile.advanced?.stopOpenIPCountryChange && previousCountry && currentCountry && previousCountry !== currentCountry)
    throw Object.assign(new Error(`出口国家/地区已变化：${previousCountry} → ${currentCountry}，已按「IP 对应国家/地区发生改变停止打开」策略阻断启动`), { code: 'ip-country-changed' });
}

async function resolveLaunchNetwork(engine, profile, getNetwork, captureNetwork) {
  const options = { publish: false, network: getNetwork(), onNetwork: captureNetwork };
  if (!profile.advanced?.stopOpenNet) return engine.ensureExitNetworkForLocale(profile, options);
  try {
    await engine.ensureExitNetworkForLocale(profile, { ...options, force: true });
  } catch (error) {
    if (error.code === 'PROFILE_STALE_REV' || error.code === 'PROFILE_MAINTENANCE') throw error;
    throw Object.assign(new Error('网络不可用，已按「网络不通停止打开」策略停止启动：' + error.message), { code: 'network-unavailable' });
  }
  if (!String(getNetwork()?.ip || '').trim())
    throw Object.assign(new Error('网络不可用，已按「网络不通停止打开」策略停止启动'), { code: 'network-unavailable' });
}

/** Shared pre-spawn transaction. Publication rechecks the captured profile revision;
 * browser-specific launchers retain kernel selection, spawning and resource cleanup.
 * @param {object} engine
 * @param {object} profile
 * @param {{lifecycleGeneration: number|null, assertCurrent: Function, onStage: Function}} options
 * @returns {Promise<{profile: object, assertCurrent: Function}>} */
async function prepareLaunchProfile(engine, profile, { lifecycleGeneration, assertCurrent, onStage }) {
  const previous = { exitIp: profile.exitIp, exitCountryCode: profile.exitCountryCode };
  let network;
  const captureNetwork = value => { network = value; };
  const assertActive = () => {
    engine.assertStartGenerationActive(profile.id, lifecycleGeneration);
    assertCurrent();
  };
  const waitActive = async operation => {
    try { return await operation; }
    finally { assertActive(); }
  };
  const publish = candidate => {
    assertActive();
    profile = mergeLaunchProfileUpdate(engine, candidate, assertCurrent);
    if (network) engine.networkInfo.set(profile.id, network);
    assertCurrent = profileWriteGuard(engine, profile.id);
  };
  const stage = (name, percent, message) => {
    assertActive();
    onStage(name);
    engine.emitStartProgress(profile.id, name, percent, message);
    // A progress listener can synchronously stop or edit this profile.
    assertActive();
  };
  assertActive();
  const candidate = await waitActive(engine.prepareProfileProxyForStart(profile, { publish: false, onNetwork: captureNetwork }));
  publish(candidate);
  stage('resources', 8, '正在检测内存与磁盘…');
  await waitActive(assertResourceGateForLaunch({ diskRoot: engine.profileRoot(profile.id) }));
  stage('proxy', 18, '正在检测代理与出口…');
  await waitActive(resolveLaunchNetwork(engine, profile, () => network, captureNetwork));
  publish(engine.applyResolvedLocale(profile, network));
  assertExitNetworkPolicy(engine, previous, profile);
  // Persist resolved credentials and locale before either browser is spawned.
  await waitActive(engine.persist());
  return { profile, assertCurrent };
}

module.exports = { prepareLaunchProfile, createStartupResources, reportPlatformPreflight, assertExitNetworkPolicy };
