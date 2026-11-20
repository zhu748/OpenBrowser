import { t as compareVersions } from './compareVersions-Cu5hvtUP.js';

const menuCollapsed = 'menuCollapsed';
const themeChannel = 'switchTheme';
const isWindows = navigator.platform.includes('Win');
const isMac = navigator.userAgentData?.platform ? /mac\s?os/i.test(navigator.userAgentData.platform) : /Macintosh|Mac OS X/.test(navigator.userAgent);
const isMainWindow = await globalThis.electronAPI?.send('app:isMainWindow') ?? true;
let startupTimer;
function finishLoading() {
  document.querySelector('#page-loading')?.style.setProperty('display', 'none');
  clearTimeout(startupTimer);
}
if (isMainWindow) {
  document.querySelector('#page-loading')?.style.setProperty('display', 'flex');
  startupTimer = setTimeout(() => {
    const loading = document.querySelector('#page-loading');
    if (loading) loading.textContent = '工作台启动超时，请重新打开窗口。';
  }, 60_000);
} else finishLoading();
const operators = { '>': [1], '>=': [0, 1], '=': [0], '<=': [-1, 0], '<': [-1], '!=': [-1, 1] };
function compare(left, right, operator) {
  if (typeof operator !== 'string') throw TypeError(`Invalid operator type, expected string but got ${typeof operator}`);
  if (!Object.hasOwn(operators, operator)) throw Error(`Invalid operator, expected one of ${Object.keys(operators).join('|')}`);
  return operators[operator].includes(compareVersions(left, right));
}
const supports = version => !globalThis.isElectron || (!!version && compare(globalThis.$rendererAbiVersion, version, '>='));
const supportsProxyExport = () => supports('3.8.8');
const supportsAgentMarkdown = () => supports('4.0.0');
const supportsAgent = () => supports('4.0.2');
const supportsLaunchOptions = () => supports('4.0.9');
const supportsLatestLaunch = () => supports('4.1.0');
function isSmallTouchScreen() {
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent || '') ||
    (window.matchMedia('(max-width: 768px)').matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
}
function hostPlatform() {
  if (navigator.userAgentData) return navigator.userAgentData.platform;
  return ['Windows', 'Mac', 'Android', 'iPhone', 'iPad', 'iPod', 'Linux'].find(platform => navigator.userAgent.includes(platform))?.replace(/^Mac$/, 'macOS') || 'Windows';
}
function unsupportedKernel(os, osVersion, engine, version) {
  return String(os ?? '').trim().toLowerCase() === 'mac' && Number.parseInt(osVersion, 10) < 22 &&
    (String(engine ?? '').trim().toLowerCase() || 'chrome') === 'chrome' && Number.parseInt(version, 10) >= 151;
}
function trace(message, details) {
  const elapsed = Math.round(performance.now() - (globalThis.__roxyPerfStart ??= performance.now()));
  console.log(`[perf][agent-load][+${elapsed}ms] ${message}`, ...(details ? [details] : []));
}
function traceOperation(message, details) {
  const start = performance.now();
  trace(`${message}:start`, details);
  return data => trace(`${message}:end`, { duration: `${Math.round(performance.now() - start)}ms`, ...data });
}
export { menuCollapsed as xi, themeChannel as zt, isWindows as pi, isMac as ui, isMainWindow as di, finishLoading as ci,
  compare as gi, supportsProxyExport as ti, supportsAgentMarkdown as ni, supportsAgent as ri, supportsLaunchOptions as ai,
  supportsLatestLaunch as oi, isSmallTouchScreen as fi, hostPlatform as br, unsupportedKernel as En, trace as gt, traceOperation as ht };
