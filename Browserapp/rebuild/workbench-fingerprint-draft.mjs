// Draft state lives on the first reactive field group, so Vue proxies and the
// parent serializer observe the same revision without adding visible controls.
const draftState = Symbol('fingerprint-draft');
const primary = groups => Array.isArray(groups?.[0]) ? groups[0] : groups;
const selection = value => ({ os: value.os, osVersion: value.osVersion,
  coreType: value.coreType, coreVersion: value.coreVersion, useLatestCore: value.useLatestCore });
const hardwareFields = ['hardwareConcurrent', 'deviceMemory'];
const deviceFields = ['deviceName', 'macAddr'];
const previewControls = [...hardwareFields, 'resolutionType', 'resolutionX', 'resolutionY',
  'deviceInfo', 'deviceNameSwitch', 'macInfo', 'position', 'isPositionBaseIp', 'latitude', 'longitude', 'precisionPos',
  'fontType', 'canvas', 'webGL', 'webGLInfo', 'webGpu', 'audioContext', 'speechVoices', 'clientRects', 'webRTC', 'doNotTrack',
  'isDisplayLanguageBaseIp', 'displayLanguage', 'language', 'isTimeZone', 'timeZone',
  'openBattery', 'openCharging', 'chargingTime', 'dischargingTime', 'level', 'openBluetooth', 'bluetoothAdapter',
  'openNetwork', 'networkType', 'networkSpeed', 'downloadSpeed', 'latency', 'maxDownloadSpeed', 'saveFlowMode'];

const previewIncomplete = '指纹预览未返回完整身份，请重试';
const nonBlank = value => typeof value === 'string' && value.trim() !== '';
const record = value => value && typeof value === 'object' && !Array.isArray(value);

function fingerprintControls(values, generated) {
  const controls = {};
  for (const key of previewControls) {
    if (Object.hasOwn(values, key)) controls[key] = values[key];
  }
  for (const key of deviceFields) {
    if (Object.hasOwn(values, key)) controls[key] = values[key] === generated?.[key] ? '' : values[key];
  }
  if (values.webGLInfo === 2) {
    controls.webGLManufacturer = values.webGLManufacturer;
    controls.webGLRender = values.webGLRender;
  }
  return controls;
}

export function fingerprintPreviewInput(values) {
  const draft = values._fingerprintDraft;
  const controls = fingerprintControls(values, draft?.generatedHardware);
  if (Object.hasOwn(values, 'font') && values.font !== draft?.generatedFonts) controls.font = values.font;
  else if (Array.isArray(values.fontList) && values.fontList.join(';') !== draft?.generatedFonts) controls.fontList = values.fontList;
  return { ...selection(values), ...controls,
    ...(values._custom_ua === true && nonBlank(values.userAgent) ? { userAgent: values.userAgent } : {}) };
}

export function profileTemplateSettings(value) {
  const { _fingerprintDraft: draft, id, dirId, windowId, rev, fingerprintSeed, fingerprintVersion, hardwarePreview, ...settings } = value;
  for (const key of [...hardwareFields, ...deviceFields, ...(settings.webGLInfo === 2 ? [] : ['webGLManufacturer', 'webGLRender'])]) {
    if (Object.hasOwn(draft?.generatedHardware || {}, key) && settings[key] === draft.generatedHardware[key]) delete settings[key];
  }
  if (draft?.generatedFonts !== undefined) {
    if (settings.font === draft.generatedFonts) delete settings.font;
    if (Array.isArray(settings.fontList) && settings.fontList.join(';') === draft.generatedFonts) delete settings.fontList;
  }
  if (draft?.generated === true && settings._custom_ua !== true && settings.userAgent === draft.userAgent) delete settings.userAgent;
  return settings;
}

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
  if (!identity) return value;
  if (!identity.generatedHardware) return { ...value, _fingerprintDraft: identity };
  const generatedHardware = { ...identity.generatedHardware };
  // A numeric selector can equal the preview by coincidence. Its value is
  // still an explicit choice when the user saves the form.
  for (const key of hardwareFields) {
    if (Object.hasOwn(value, key)) delete generatedHardware[key];
  }
  return { ...value, _fingerprintDraft: { ...identity, generatedHardware } };
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
    uaVersionRandomized: value.privacy?.fingerprint?.uaVersionRandomized,
    uaPatchRandomized: value.privacy?.fingerprint?.uaPatchRandomized,
    clientHints: value.privacy?.fingerprint?.clientHints,
    generatedHardware: Object.fromEntries(deviceFields
      .filter(key => nonBlank(value.hardwarePreview?.[key]))
      .map(key => [key, value.hardwarePreview[key]])),
  } : null);
  state.identity = saved;
}

export function invalidateFingerprintDraft(groups) {
  const state = stateFor(groups);
  if (state) state.revision++;
}

export function markFingerprintFieldExplicit(groups, key) {
  const state = stateFor(groups);
  if (!Object.hasOwn(state?.identity?.generatedHardware || {}, key)) return;
  const generatedHardware = { ...state.identity.generatedHardware };
  delete generatedHardware[key];
  state.identity = { ...state.identity, generatedHardware };
}

export async function refreshFingerprintDraft(groups, { read, apply, find, request, count = 1, preview = true,
  updateHardware,
  preserve = [], keepSeed = false, randomizeUaVersion = false }) {
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
    const controlsFor = values => fingerprintControls(values, state.identity?.generatedHardware);
    const requestPreview = controls => request({ ...selected, count,
      profileId: state.profileId,
      ...(retainedIdentity ? { reuseDraft: retainedIdentity } : {}),
      ...(randomizeUaVersion ? { randomizeUaVersion, previousUserAgent: values.userAgent }
        : (preserve.includes('userAgent') && !mismatchedEngine ? { userAgent: values.userAgent } : {})),
      ...controls });
    let controls = controlsFor(values);
    let rows, active;
    for (;;) {
      let failure, failed = false;
      try {
        rows = await requestPreview(controls);
      } catch (error) {
        failed = true;
        failure = error;
      }
      if (!preview) {
        if (keepSeed && (!current() || state.identity?.seed !== retainedIdentity?.seed)) return [];
        if (failed) throw failure;
        return requireFingerprintPreviewRows(rows, count);
      }
      active = current();
      if (!active) return [];
      const latestControls = controlsFor(active);
      if (JSON.stringify(latestControls) === JSON.stringify(controls)) {
        if (failed) throw failure;
        break;
      }
      // Rebuild for newer form choices before publishing a seed or hardware
      // projection. Detached batch requests keep their original snapshot.
      controls = latestControls;
    }
    const [row] = requireFingerprintPreviewRows(rows, count);
    const { _fingerprintDraft: identity, _openbrowser: _runtime, ...visible } = row;
    if (retainedIdentity && identity.seed !== retainedIdentity.seed) throw Error('指纹预览已失效，请刷新后重试');
    const keepCustomUa = preserve.includes('userAgent') && Boolean(active.userAgent) && !mismatchedEngine;
    if (keepCustomUa) delete visible.userAgent;
    if (active.webGLInfo !== 1) { delete visible.webGLManufacturer; delete visible.webGLRender; }
    delete visible.hardwareConcurrent;
    delete visible.deviceMemory;
    if (identity.generatedFonts) { delete visible.font; delete visible.fontList; }
    const previousGenerated = state.identity?.generatedHardware || {};
    const generatedHardware = { ...identity.generatedHardware };
    for (const key of deviceFields) {
      const auto = Object.hasOwn(previousGenerated, key) && active[key] === previousGenerated[key];
      if (keepSeed || preserve.includes(key) || active[key] !== values[key] || (nonBlank(active[key]) && !auto))
        delete visible[key];
      // A hidden field or a UA-only preview can leave a displayed value untouched.
      // Its provenance belongs to that displayed value, even if the server sampled another.
      if (!nonBlank(visible[key])) {
        delete generatedHardware[key];
        if (auto || (active[key] === undefined && Object.hasOwn(previousGenerated, key)))
          generatedHardware[key] = previousGenerated[key];
      }
    }
    state.identity = { ...identity, generatedHardware };
    apply(groups, visible);
    updateHardware?.(row);
    if (field) {
      field._custom_ua = keepCustomUa;
      field.invalid = false;
      field.errorMsg = undefined;
      field.help = '';
    }
    // The editor also merges this result into its save state. Use the same
    // accepted fields and provenance for both the display and the save.
    return [{ ...visible, _fingerprintDraft: state.identity }, ...rows.slice(1)];
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
