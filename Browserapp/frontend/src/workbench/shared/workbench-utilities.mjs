import { driver, deepEqual } from './workbench-vendor-utilities.js';
import { images } from './workbench-image-assets.js';
export { sortDirection as jr } from './workbench-table.js';

const type = value => Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
const isObject = value => type(value) === 'object';
const isSyncFunction = value => type(value) === 'function';
const isFunction = value => ['function', 'asyncfunction'].includes(type(value));
function isEmpty(value) {
  if (Array.isArray(value)) return !value.length;
  if (isObject(value)) return !Object.keys(value).length;
  return value === null || value === undefined || value === '';
}
function clone(value, seen = new WeakMap()) {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const key of Reflect.ownKeys(value)) result[key] = clone(value[key], seen);
  return result;
}
const fillFields = (keys, value) => Object.fromEntries(keys.map(key => [key, value]));
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
function createPoller({ intervalMs = 3000, checkOnce }) {
  let revision = 0;
  function stop() { revision++; }
  async function check(...args) {
    const active = ++revision;
    while (active === revision) {
      const result = await checkOnce(...args);
      if (active !== revision) return;
      if (result) { stop(); return result; }
      const deadline = performance.now() + intervalMs;
      while (active === revision && deadline > performance.now()) await delay(Math.min(200, deadline - performance.now()));
    }
  }
  return { checkOnce, check, stop };
}
async function runLimited(tasks, limit = 5, options = {}) {
  const { notify, onProgress, signal } = typeof options === 'function' ? { notify: options } : options ?? {};
  const results = [];
  let next = 0;
  let completed = 0;
  async function run() {
    while (!signal?.aborted && next < tasks.length) {
      const index = next++;
      try { results[index] = await tasks[index](); }
      catch (error) { results[index] = error; }
      completed++;
      notify?.(results[index]);
      onProgress?.({ completed, total: tasks.length });
    }
  }
  await Promise.all(Array.from({ length: Math.min(tasks.length, Math.max(1, Number(limit) || 1)) }, run));
  return results;
}
function debounce(callback, milliseconds, { signal, edges } = {}) {
  const leading = edges?.includes('leading');
  const trailing = !edges || edges.includes('trailing');
  let args;
  let context;
  let timer;
  function flush() {
    if (!args) return;
    const pending = args;
    const owner = context;
    args = context = undefined;
    callback.apply(owner, pending);
  }
  function cancel() { clearTimeout(timer); timer = args = context = undefined; }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = undefined; if (trailing) flush(); cancel(); }, milliseconds);
  }
  function run(...values) {
    if (signal?.aborted) return;
    const first = timer === undefined;
    context = this;
    args = values;
    schedule();
    if (first && leading) flush();
  }
  signal?.addEventListener('abort', cancel, { once: true });
  return Object.assign(run, { schedule, cancel, flush });
}
function copyText(value) {
  if (navigator.clipboard) return navigator.clipboard.writeText(value);
  const input = document.createElement('input');
  input.value = value;
  document.body.append(input);
  try { input.select(); document.execCommand('copy'); }
  finally { input.remove(); }
}
const suffix = (prefix, value) => prefix && value && `${prefix}${value}`;
function isHttpUrl(value) {
  if (!/^https?:\/\//.test(value)) return false;
  return URL.canParse(value);
}
function fileSuffix(name) {
  const parts = name.split('.');
  return parts.length <= 1 || (parts.length === 2 && parts[0] === '') ? '' : parts.at(-1);
}
function parseJson(value, fallback) {
  try { return JSON.parse(value); }
  catch { return fallback === null ? null : fallback ?? value; }
}
const sortIcon = value => ({ 0: 'base/rx_ic_chevron_2', '-1': 'base/rx_ic_chevron_2_down', 1: 'base/rx_ic_chevron_2_up' })[String(value)];
const image = name => images[name] ?? '';
function relativeTime(value) {
  if (!value) return '--';
  const elapsed = (Date.now() - new Date(value).getTime()) / 1000;
  const day = Math.floor(elapsed / 86400);
  const hour = Math.floor(elapsed / 3600);
  const minute = Math.floor(elapsed / 60);
  if (day > 7) return value.split(' ')[0].replace(/-/g, '/');
  if (day > 0) return $t('{day}天前', { day });
  if (hour > 0) return $t('{hour}小时前', { hour });
  if (minute > 0) return $t('{minute}分钟前', { minute });
  return $t('刚刚');
}
function createGuide(options) {
  return driver({ nextBtnText: $t('下一步'), doneBtnText: $t('完成'), showButtons: ['next'], overlayColor: 'var(--pattern-tour-mask-bg)',
    overlayOpacity: 1, allowClose: false, disableActiveInteraction: true, popoverClass: 'global_driver_class', ...options });
}
function saveGuideStatus(name, value) {
  const stored = parseJson(localStorage.getItem('driverStatus'), {}) ?? {};
  localStorage.setItem('driverStatus', JSON.stringify({ ...stored, [name]: value }));
}

export { suffix as Ar, isFunction as Cr, parseJson as Dr, isHttpUrl as Pr, isSyncFunction as Sr,
  runLimited as ar, clone as cr, relativeTime as fr, image as gr, debounce as hn, fileSuffix as hr,
  delay as kr, deepEqual as mn, createPoller as mr, copyText as or, createGuide as pr, fillFields as sr,
  isObject as wr, isEmpty as xr, sortIcon as yr, saveGuideStatus as Or };
