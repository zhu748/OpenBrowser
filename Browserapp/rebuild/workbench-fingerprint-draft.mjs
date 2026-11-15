// Draft state lives on the first reactive field group, so Vue proxies and the
// parent serializer observe the same revision without adding visible controls.
const draftState = Symbol('fingerprint-draft');
const primary = groups => Array.isArray(groups?.[0]) ? groups[0] : groups;
const selection = value => ({ os: value.os, osVersion: value.osVersion,
  coreType: value.coreType, coreVersion: value.coreVersion, useLatestCore: value.useLatestCore });

function stateFor(groups, create = false) {
  const group = primary(groups);
  if (!Array.isArray(group)) return null;
  if (!group[draftState] && create)
    Object.defineProperty(group, draftState, { value: { revision: 0, identity: null }, configurable: true });
  return group[draftState];
}

export function serializeFingerprintDraft(groups, value) {
  const identity = stateFor(groups)?.identity;
  return identity ? { ...value, _fingerprintDraft: identity } : value;
}

export function restoreFingerprintDraft(groups, value) {
  const saved = value?._fingerprintDraft || (value?.fingerprintSeed ? {
    seed: value.fingerprintSeed, version: value.fingerprintVersion,
    userAgent: value.userAgent || '', generated: value.privacy?.fingerprint?.uaGenerated === true,
    uaReduced: value.privacy?.fingerprint?.uaReduced,
    clientHints: value.privacy?.fingerprint?.clientHints,
  } : null);
  if (saved) stateFor(groups, true).identity = saved;
}

export function invalidateFingerprintDraft(groups) {
  const state = stateFor(groups);
  if (state) state.revision++;
}

export async function refreshFingerprintDraft(groups, { read, apply, find, request, count = 1, preview = true }) {
  const state = stateFor(groups, true);
  const field = find(primary(groups), 'userAgent');
  // A failed generated preview must remain retryable; the archived serializer
  // rejects invalid fields before it can read the newly selected kernel.
  if (preview && state.failed && field) {
    field.invalid = false;
    field.errorMsg = undefined;
    field.help = '';
    state.failed = false;
  }
  const values = read(groups), selected = selection(values);
  const revision = preview ? ++state.revision : state.revision;
  const current = () => state.revision === revision && JSON.stringify(selection(read(groups))) === JSON.stringify(selected);
  if (preview && field && values.userAgent &&
      /Firefox\//i.test(values.userAgent) !== (selected.coreType === 'Firefox')) field.value = '';
  try {
    const rows = await request({ ...selected, count, fontType: values.fontType,
      canvas: values.canvas, webGL: values.webGL, audioContext: values.audioContext,
      speechVoices: values.speechVoices, clientRects: values.clientRects, macInfo: values.macInfo,
      previousUserAgent: values.userAgent || '' });
    if (!preview) return rows;
    if (!current()) return [];
    const row = rows[0];
    if (!row?.userAgent || !row._fingerprintDraft) throw Error('指纹预览未返回完整身份，请重试');
    const { _fingerprintDraft: identity, _openbrowser: _runtime, ...visible } = row;
    if (values.webGLInfo === 2) { delete visible.webGLManufacturer; delete visible.webGLRender; }
    state.identity = identity;
    apply(groups, visible);
    if (field) { field._custom_ua = false; field.invalid = false; field.errorMsg = undefined; field.help = ''; }
    return rows;
  } catch (error) {
    if (!preview) throw error;
    if (current() && field) {
      field.value = '';
      field.invalid = true;
      field.errorMsg = error.message;
      field.help = error.message;
      state.identity = null;
      state.failed = true;
      globalThis.__localUiError?.(error.message);
    }
    return [];
  }
}
