import { computed, inject, provide, ref, watch } from './workbench-vue.js';
import { r as allocateWindowName } from './utils-CnUy4XUk.js';
import { n as arrangeName, r as listPlatformNames } from './quick-kroUOSn_.js';

import ProfileForm from './workbench-profile-form.js';
import Cookies from './workbench-profile-cookies.js';
import InputItem from './workbench-profile-input-item.js';
import PasswordField from './workbench-profile-password-field.js';
import ProxyAssignments from './workbench-profile-proxy-assignments.js';
import AccountAssignments from './workbench-profile-account-assignments.js';
import WindowPosition from './workbench-profile-window-position.js';
import Urls from './workbench-profile-urls.js';

const formContext = Symbol('profile form');
function provideProfileForm(state) {
  provide(formContext, state);
}
function useProfileForm() {
  return inject(formContext);
}
function useNameAutofill({ enabled, getNameInput, getAccounts, getProxyList, serialOnly = false }) {
  let serial, catalogs;
  let revision = 0;
  watch(() => enabled() ? getNameInput() : undefined, (field, previous) => {
    if (field !== previous) serial = undefined;
    refresh();
  }, { immediate: true });
  watch(() => enabled() && !serialOnly ? [getProxyList(), getAccounts()] : undefined, refresh, { deep: true });

  async function refresh() {
    if (!enabled()) return;
    const field = getNameInput();
    if (!field || field.dirId) return;
    const sequence = ++revision;
    if (serialOnly) field.suggestedWindowName = '';
    try {
      serial ??= allocateWindowName();
      if (!serialOnly) catalogs ??= listPlatformNames();
      const [code, platforms] = await Promise.all([serial, catalogs ?? []]);
      if (sequence !== revision || getNameInput() !== field || !enabled() || field.dirId || !code) return;
      const name = serialOnly ? code : arrangeName(code, { accounts: getAccounts(), proxyList: getProxyList() }, platforms);
      field.placeholder = name;
      field.suggestedWindowName = name;
    } catch (error) {
      if (sequence !== revision) return;
      serial = undefined;
      catalogs = undefined;
      console.warn('Failed to suggest a window name', error);
    }
  }
}

function useAsyncGate() {
  const pending = ref(0);
  const isReady = computed(() => pending.value === 0);
  async function run(operation) {
    pending.value++;
    try { return await operation(); }
    finally { pending.value--; }
  }
  function waitUntilReady() {
    if (isReady.value) return Promise.resolve();
    return new Promise(resolve => {
      const stop = watch(isReady, ready => {
        if (!ready) return;
        stop();
        resolve();
      });
    });
  }
  return { pending, isReady, run, waitUntilReady };
}

export {
  provideProfileForm as a, Cookies as i, ProfileForm as n, useProfileForm as o,
  useNameAutofill as s, useAsyncGate as t, InputItem as ProfileInputItem, PasswordField,
  ProxyAssignments as ProfileProxyField, AccountAssignments as ProfileAccountsField,
  WindowPosition as ProfilePositionField, Urls as ProfileUrlsField,
};
