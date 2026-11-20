import {
  a as findField, h as api, r as filterValues, s as readFields, v as useUser,
  xr as isEmpty,
} from './utils-BIWenCnY.js';
import { computed, ref, toRaw } from './workbench-vue.js';
import { a as useUserConfig, n as useNotifications } from './agent-BmSFI9WH.js';
import { t as useProxyTest } from './hooks-Jw3GridD.js';
import { i as suggestedWindowName } from './quick-kroUOSn_.js';
import { o as hasWindowName } from './utils-CnUy4XUk.js';
import { t as useAsyncGate } from './useAsyncGate-D7VA7DLY.js';
import { t as validateProxy } from './api-extract-BlmYcIz7.js';
import {
  toProxyFields, updateMobileFields, serializeProfileInput, initializeProfileInputs,
  refreshProfileFingerprint,
} from './form-inputs-CnnG6T0O.js';

function useWindowCreate(options = {}) {
  const [notify, showResult] = useNotifications();
  const { userConfig } = useUserConfig(useUser());
  const { testProxy } = useProxyTest();
  const mainSetting = ref([]);
  const extraSettings = ref([]);
  const original = ref({});
  const loading = ref(false);
  const formGate = useAsyncGate();
  const inputsGroup = computed(() => [mainSetting.value, ...extraSettings.value]);
  const hasConcreteKernel = () => mainSetting.value
    .flatMap(field => field.items ?? [field])
    .find(field => field.name === 'coreVersion')?.options
    ?.some(option => option.value && option.value !== '__useLatestCore__');
  const canSubmit = computed(() => formGate.isReady.value && !loading.value && !!hasConcreteKernel());
  const state = { mainSetting, extraSettings, original, inputsGroup };

  async function initialize(profile = {}, { refreshFingerprint = true } = {}) {
    await formGate.run(async () => {
      const [[main, basic, fingerprint, preferences], saved] =
        await initializeProfileInputs(profile, notify, formGate);
      mainSetting.value = main;
      extraSettings.value = [basic, fingerprint, preferences];
      original.value = saved;
      await options.onInputsInitialized?.(state);
      syncMobileVisibility();
      if (refreshFingerprint && hasConcreteKernel()) await updateFingerprint();
      await options.onInitialized?.(state);
    });
  }

  function syncMobileVisibility(visible) {
    const configured = visible ?? options.resolveMobileVisible?.(state);
    const os = findField(mainSetting.value, 'os')?.value?.value;
    updateMobileFields(extraSettings.value, configured ?? ['Android', 'IOS'].includes(os));
  }

  async function updateFingerprint(inputs) {
    const fields = (Array.isArray(inputs) ? inputs : undefined)
      ?? options.getFingerprintInputs?.(state)
      ?? inputsGroup.value;
    const [fingerprint] = await formGate.run(() => refreshProfileFingerprint(fields));
    Object.assign(original.value, fingerprint);
  }

  async function shuffleFingerprint(inputs) {
    await updateFingerprint(inputs);
    notify(0, $t('指纹刷新成功'));
  }

  function buildCreateParams({
    inputs = inputsGroup.value, metadata = {}, createCount = 1, additionalParams = {},
  } = {}) {
    const properties = filterValues(toRaw(metadata), value => !isEmpty(value));
    return { createCount, ...original.value, ...readFields(inputs, properties), ...additionalParams };
  }

  async function validateAndUpdateProxy(params) {
    const validated = await validateProxy(params, {
      checkChannel: userConfig.value.ipChecker, isDirect: false, testProxy,
    });
    if (validated !== params) {
      const field = findField(mainSetting.value, 'proxyInfoList');
      if (field) field.value = toProxyFields(validated);
    }
    return validated;
  }

  async function prepareCreateParams(options = {}) {
    return validateAndUpdateProxy(buildCreateParams(options));
  }

  async function executeSingleCreate({
    params, buildParams, beforeSubmit, collectAdditionalParams, onSuccess, onFailure,
  } = {}) {
    await formGate.waitUntilReady();
    if (loading.value) return;
    loading.value = true;
    try {
      if (await beforeSubmit?.() === false) return;
      const base = params ?? await buildParams?.() ?? buildCreateParams();
      const additional = await collectAdditionalParams?.(base) ?? {};
      const validated = await validateAndUpdateProxy({ ...base, ...additional });
      const payload = serializeProfileInput(validated);
      if (!hasWindowName(payload.windowName)) {
        const name = suggestedWindowName(findField(mainSetting.value, 'windowName'));
        if (name) payload.windowName = name;
      }
      const result = await api.window.userAddWindowInfoV2Create(payload);
      showResult(result.code, result.msg);
      if (result.code === 0) await onSuccess?.(result.data, payload);
      else await onFailure?.(result, payload);
      return result;
    } finally {
      loading.value = false;
    }
  }

  return {
    ...state, loading, formGate, canSubmit, initialize, syncMobileVisibility, updateFingerprint,
    shuffleFingerprint, buildCreateParams, prepareCreateParams, executeSingleCreate,
  };
}

export { useWindowCreate as t };
