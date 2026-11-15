const draftState = /* @__PURE__ */ Symbol("fingerprint-draft");
const primary = (groups) => Array.isArray(groups?.[0]) ? groups[0] : groups;
const selection = (value) => ({
  os: value.os,
  osVersion: value.osVersion,
  coreType: value.coreType,
  coreVersion: value.coreVersion,
  useLatestCore: value.useLatestCore
});
function stateFor(groups, create = !1) {
  const group = primary(groups);
  return Array.isArray(group) ? (!group[draftState] && create && Object.defineProperty(group, draftState, { value: { revision: 0, identity: null }, configurable: !0 }), group[draftState]) : null;
}
function serializeFingerprintDraft(groups, value) {
  const identity = stateFor(groups)?.identity;
  return identity ? { ...value, _fingerprintDraft: identity } : value;
}
function restoreFingerprintDraft(groups, value) {
  const state = stateFor(groups, !0);
  if (!state) return;
  state.revision++, state.profileId = value?.windowId && value.windowId === value.id ? value.id : void 0;
  const saved = value?._fingerprintDraft || (value?.fingerprintSeed ? {
    seed: value.fingerprintSeed,
    version: value.fingerprintVersion,
    userAgent: value.userAgent || "",
    generated: value.privacy?.fingerprint?.uaGenerated === !0,
    uaReduced: value.privacy?.fingerprint?.uaReduced,
    uaPatchRandomized: value.privacy?.fingerprint?.uaPatchRandomized,
    clientHints: value.privacy?.fingerprint?.clientHints
  } : null);
  state.identity = saved;
}
function invalidateFingerprintDraft(groups) {
  const state = stateFor(groups);
  state && state.revision++;
}
async function refreshFingerprintDraft(groups, { read, apply, find, request, count = 1, preview = !0 }) {
  const state = stateFor(groups, !0), field = find(primary(groups), "userAgent");
  preview && state.failed && field && (field.invalid = !1, field.errorMsg = void 0, field.help = "", state.failed = !1);
  const values = read(groups), selected = selection(values), revision = preview ? ++state.revision : state.revision, current = () => state.revision === revision && JSON.stringify(selection(read(groups))) === JSON.stringify(selected);
  preview && field && values.userAgent && /Firefox\//i.test(values.userAgent) !== (selected.coreType === "Firefox") && (field.value = "");
  try {
    const rows = await request({
      ...selected,
      count,
      fontType: values.fontType,
      profileId: state.profileId,
      canvas: values.canvas,
      webGL: values.webGL,
      audioContext: values.audioContext,
      speechVoices: values.speechVoices,
      clientRects: values.clientRects,
      macInfo: values.macInfo,
      previousUserAgent: values.userAgent || ""
    });
    if (!preview) return rows;
    if (!current()) return [];
    const row = rows[0];
    if (!row?.userAgent || !row._fingerprintDraft) throw Error("\u6307\u7EB9\u9884\u89C8\u672A\u8FD4\u56DE\u5B8C\u6574\u8EAB\u4EFD\uFF0C\u8BF7\u91CD\u8BD5");
    const { _fingerprintDraft: identity, _openbrowser: _runtime, ...visible } = row;
    return values.webGLInfo === 2 && (delete visible.webGLManufacturer, delete visible.webGLRender), state.identity = identity, apply(groups, visible), field && (field._custom_ua = !1, field.invalid = !1, field.errorMsg = void 0, field.help = ""), rows;
  } catch (error) {
    if (!preview) throw error;
    return current() && field && (field.value = "", field.invalid = !0, field.errorMsg = error.message, field.help = error.message, state.identity = null, state.failed = !0, globalThis.__localUiError?.(error.message)), [];
  }
}
export {invalidateFingerprintDraft as invalidateFingerprintDraft,refreshFingerprintDraft as refreshFingerprintDraft,restoreFingerprintDraft as restoreFingerprintDraft,serializeFingerprintDraft as serializeFingerprintDraft};