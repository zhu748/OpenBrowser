import { ref } from './workbench-vue.js';
import { kn as profileIds } from './utils-BIWenCnY.js';

const labels = new Map();
export const labelsRevision = ref(0);
export function mentionName(value = '') {
  const label = value.trim().replace(/^@+/, '');
  return label ? `@${label}` : '';
}

export function updateProfileLabels(updates) {
  let changed = false;
  for (const { id, label } of updates) {
    const name = mentionName(label);
    if (!id || !name || labels.get(id) === name) continue;
    labels.set(id, name);
    changed = true;
  }
  if (changed) labelsRevision.value += 1;
}

export const windowNames = ids => ids.map(id => labels.get(id) || '');
export const referencedProfileIds = ids => ids.filter(id => !labels.has(id) || labels.get(id) === mentionName(id));
export const parsePromptTokens = prompt => profileIds(prompt);

export function payloadAttributes(payload) {
  if (!payload.profileLabels) return [];
  try {
    const names = JSON.parse(payload.profileLabels);
    return Array.isArray(names) ? names.filter(name => typeof name === 'string').map(mentionName) : [];
  } catch { return []; }
}

export function ensureTokenTooltipElements(names, count = names.length, fallback = []) {
  const visible = Array.from({ length: Math.min(count, Math.max(names.length, fallback.length)) }, (_, index) => names[index] || fallback[index] || '');
  const leading = visible.map(mentionName).filter(Boolean).slice(0, 3).join(' · ');
  return leading && count > 3 ? `${leading} ${$t('等 {count} 个', { count })}` : leading;
}

export async function loadProfileLabels(prompt, load) {
  const missing = referencedProfileIds(parsePromptTokens(prompt));
  if (!missing.length) return;
  updateProfileLabels(await load(missing));
  const unresolved = referencedProfileIds(missing);
  if (unresolved.length) throw Error(`Failed to resolve Agent profile labels: ${unresolved.join(',')}`);
}
