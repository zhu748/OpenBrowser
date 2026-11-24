// Draft state lives on the first reactive field group, so Vue proxies and the
// parent serializer observe the same revision without adding visible controls.
const draftState = Symbol('fingerprint-draft');
const primary = groups => Array.isArray(groups?.[0]) ? groups[0] : groups;
const selection = value => ({ os: value.os, osVersion: value.osVersion,
  coreType: value.coreType, coreVersion: value.coreVersion, useLatestCore: value.useLatestCore });

const previewIncomplete = '指纹预览未返回完整身份，请重试';
const nonBlank = value => typeof value === 'string' && value.trim() !== '';
const record = value => value && typeof value === 'object' && !Array.isArray(value);

function completePreview(row) {
  if (!record(row) || !nonBlank(row.userAgent)) return false;
  const draft = row._fingerprintDraft;
  return record(draft) && nonBlank(draft.profileId) && nonBlank(draft.seed)
    && Number.isSafeInteger(draft.version) && draft.version > 0
    && nonBlank(draft.allocation) && draft.userAgent === row.userAgent;
}

export function requireFingerprintPreviewRows(rows, count) {
  const incomplete = () => Error(globalThis.$t?.(previewIncomplete) ?? previewIncomplete);
  const expected = Number(count);
  if (!Array.isArray(rows) || expected < 1 || rows.length !== expected) throw incomplete();
  for (const row of rows) {
    if (!completePreview(row)) throw incomplete();
  }
  return rows;
}

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
  const state = stateFor(groups, true);
  if (!state) return;
  state.revision++;
  // Only a persisted edit DTO owns a profile. A copied template's preview
  // metadata must not turn a new editor into an editor for that old window.
  state.profileId = value?.windowId && value.windowId === value.id ? value.id : undefined;
  const saved = value?._fingerprintDraft || (value?.fingerprintSeed ? {
    seed: value.fingerprintSeed, version: value.fingerprintVersion,
    userAgent: value.userAgent || '', generated: value.privacy?.fingerprint?.uaGenerated === true,
    uaReduced: value.privacy?.fingerprint?.uaReduced,
    uaPatchRandomized: value.privacy?.fingerprint?.uaPatchRandomized,
    clientHints: value.privacy?.fingerprint?.clientHints,
  } : null);
  state.identity = saved;
}

export function invalidateFingerprintDraft(groups) {
  const state = stateFor(groups);
  if (state) state.revision++;
}

export async function refreshFingerprintDraft(groups, { read, apply, find, request, count = 1, preview = true,
  preserve = [], keepSeed = false }) {
  const state = stateFor(groups, true);
  const field = find(primary(groups), 'userAgent');
  // Clear a failed preview's validation message while retrying.
  if (preview && state.failed && field) {
    field.invalid = false;
    field.errorMsg = undefined;
    field.help = '';
    state.failed = false;
  }
  const values = read(groups), selected = selection(values);
  const retainedIdentity = keepSeed && state.identity?.seed ? state.identity : null;
  const revision = preview ? ++state.revision : state.revision;
  const selectedKey = JSON.stringify(selected);
  const current = () => {
    if (state.revision !== revision) return null;
    const active = read(groups);
    return JSON.stringify(selection(active)) === selectedKey ? active : null;
  };
  const mismatchedEngine = values.userAgent &&
    /Firefox\//i.test(values.userAgent) !== (selected.coreType === 'Firefox');
  if (preview && field && mismatchedEngine) field.value = '';
  try {
    const rows = await request({ ...selected, count, fontType: values.fontType,
      profileId: state.profileId,
      ...(retainedIdentity ? { reuseDraft: retainedIdentity } : {}),
      canvas: values.canvas, webGL: values.webGL, audioContext: values.audioContext,
      webGLInfo: values.webGLInfo,
      ...(preview && values.webGLInfo === 2 ? {
        webGLManufacturer: values.webGLManufacturer, webGLRender: values.webGLRender,
      } : {}),
      speechVoices: values.speechVoices, clientRects: values.clientRects, macInfo: values.macInfo,
      macAddr: values.macAddr,
      previousUserAgent: values.userAgent || '' });
    if (!preview) return requireFingerprintPreviewRows(rows, count);
    const active = current();
    if (!active) return [];
    const [row] = requireFingerprintPreviewRows(rows, count);
    const { _fingerprintDraft: identity, _openbrowser: _runtime, ...visible } = row;
    if (retainedIdentity && identity.seed !== retainedIdentity.seed) throw Error('指纹预览已失效，请刷新后重试');
    const keepCustomUa = preserve.includes('userAgent') && Boolean(active.userAgent) && !mismatchedEngine;
    if (keepCustomUa) delete visible.userAgent;
    if (active.webGLInfo === 2) { delete visible.webGLManufacturer; delete visible.webGLRender; }
    if (active.macAddr) delete visible.macAddr;
    for (const key of ['hardwareConcurrent', 'deviceMemory', 'deviceName']) {
      if (preserve.includes(key) || active[key] !== values[key]) delete visible[key];
    }
    state.identity = identity;
    apply(groups, visible);
    if (field) {
      field._custom_ua = keepCustomUa;
      field.invalid = false;
      field.errorMsg = undefined;
      field.help = '';
    }
    return rows;
  } catch (error) {
    if (!preview) throw error;
    if (current() && field) {
      field.help = error.message;
      if (!(retainedIdentity && values.userAgent && !mismatchedEngine)) {
        field.value = '';
        field.invalid = true;
        field.errorMsg = error.message;
        state.identity = null;
        state.failed = true;
      }
      globalThis.__localUiError?.(error.message);
    }
    return [];
  }
}
