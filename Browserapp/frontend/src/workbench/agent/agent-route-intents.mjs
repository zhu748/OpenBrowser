import { yn as windowMentions } from './utils-BIWenCnY.js';
import { G as readTemplatePrompt } from './CreateTemplateDialog-Bpq9OLTG.js';

export const prefillKey = 'prefill';
export const batchCreateIntent = 'batch-create-profiles';
const automationIntent = 'create-automation';
export const windowIdsKey = 'windowIds';
export const batchCreateRoute = `/agent-console?${prefillKey}=${batchCreateIntent}`;
const firstValue = value => Array.isArray(value) ? value[0] : value;
const uniqueIds = values => [...new Set(values.filter(Boolean))];

export const isBatchCreateIntent = value => firstValue(value) === batchCreateIntent;
export const isAutomationIntent = value => firstValue(value) === automationIntent;
export const batchCreatePrompt = (templates, locale) => readTemplatePrompt(templates.find(template => template.slug === batchCreateIntent), locale).trim();

export function createAutomationRoute(ids) {
  const query = new URLSearchParams({ [prefillKey]: automationIntent, [windowIdsKey]: uniqueIds(ids).join(',') });
  return `/agent-console?${query}`;
}

export function automationWindows(value) {
  const query = firstValue(value);
  return typeof query === 'string' ? uniqueIds(query.split(',').map(id => id.trim())) : [];
}

export async function prefillAutomation(ids, loadLabels, setPrompt) {
  const windows = uniqueIds(ids);
  await loadLabels(windows);
  return setPrompt(windowMentions(windows));
}

function localStorageOrUndefined() {
  try { return globalThis.window?.localStorage; }
  catch { return undefined; }
}

function useGuideRequest(name) {
  const key = `agent-console:${name}-guide-shown:`;
  const event = `agent-console:${name}-guide-requested`;
  let requested = false;
  let forced = false;
  const storageKey = id => id == null || id === '' ? undefined : key + encodeURIComponent(String(id));
  function request(force = false) {
    requested = true;
    forced ||= force;
    globalThis.window?.dispatchEvent(new Event(event));
  }
  function shown(id, storage = localStorageOrUndefined()) {
    const setting = storageKey(id);
    try { return Boolean(setting && storage?.getItem(setting) === '1'); }
    catch { return false; }
  }
  function remember(id, storage = localStorageOrUndefined()) {
    const setting = storageKey(id);
    try { if (setting) storage?.setItem(setting, '1'); }
    catch { /* Keep the guide usable when storage is unavailable. */ }
  }
  function clear() { requested = false; forced = false; }
  return { event, request, shown, remember, clear, requested: () => requested, forced: () => forced };
}

export const batchCreateGuide = useGuideRequest('batch-create');
export const automationGuide = useGuideRequest('create-automation');
