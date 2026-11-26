<script setup>
import { computed, onBeforeMount, ref, toRaw } from 'vue';
import { a as findField, h as requests, s as readFields, v as useConfig, vt as cache, wt as useReturnRoute, yt as useCache } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as useProxyTools } from './hooks-Jw3GridD.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import { a as normalizeLabel } from './use-tag-menu-DZnIrtE9.js';
import { a as provideProfileForm, n as ProfileForm, t as useAsyncGate } from './useAsyncGate-D7VA7DLY.js';
import { i as WindowInputs, n as createAccordions, r as Fingerprint } from './createDefaultAccordions-CO1KkbkO.js';
import { t as resolveProxy } from './api-extract-BlmYcIz7.js';
import { a as formatProxy, o as serializeProfile, r as loadProfile, t as shuffleFingerprint } from './form-inputs-CnnG6T0O.js';
import { t as ProfileMetadata } from './mate-group-CBm6kY0g.js';

const router = useRouter();
const route = useRoute();
const config = useConfig();
const { userConfig } = storeToRefs(config);
const { testProxy } = useProxyTools();
const [showSuccess, showStatus] = useNotice();
const { path: returnPath, query: returnQuery } = useReturnRoute();
const { invalidateCache } = useCache();
const gate = useAsyncGate();

provideProfileForm({ isBatch: ref(false), createCount: ref(0) });
const accordions = ref(createAccordions());
const inputs = ref();
const fingerprint = ref();
const metadata = ref();
const collapsed = ref(false);
const saving = ref(false);
const loaded = ref(false);
let original;
let originalCookieText;
const canSave = computed(() => loaded.value && gate.isReady.value && !saving.value);
const basicInputs = computed(() => inputs.value?.[0] ?? []);

onBeforeMount(async () => {
  try {
    const { code, data, msg } = await requests.window.userGetWindowInfoV2List({
      windowIds: route.query.id, isDelete: 0, page_index: 1, page_size: 1, hardwarePreview: true,
    });
    if (code !== 0) {
      showStatus(code, msg);
      return;
    }
    const profile = data?.rows?.[0];
    if (!profile) {
      showStatus(-1, $t('窗口/数据不存在，请刷新页面后重试'));
      return;
    }
    original = profile;
    const [formInputs, formFingerprint] = await loadProfile(profile, showSuccess, gate);
    inputs.value = formInputs;
    originalCookieText = findField(formInputs[0], 'cookie')?.value;
    fingerprint.value = formFingerprint;
    for (const key of ['platformUrl', 'platformUserName', 'platformPassword']) fingerprint.value[key] = '';
    metadata.value = {
      projectName: profile.projectName,
      projectId: profile.projectId == null || profile.projectId === '' ? undefined : String(profile.projectId),
      labelIds: (profile.labelIds || []).map(label => normalizeLabel(label)),
      windowRemark: profile.windowRemark,
    };
    loaded.value = true;
  } catch (error) {
    showStatus(-1, error.message);
  }
});

async function refreshFingerprint() {
  try {
    const [updated] = await gate.run(() => shuffleFingerprint(inputs.value, { randomizeUaVersion: true }));
    if (!updated) return;
    Object.assign(fingerprint.value, updated);
    showSuccess(0, $t('指纹刷新成功'));
  } catch (error) {
    showStatus(-1, error.message);
  }
}

function invalidateProfiles() {
  const projects = new Set(['', metadata.value?.projectId, original?.projectId].filter(id => id != null).map(String));
  for (const projectId of projects) invalidateCache(cache.BROWSER_LIST, { projectId });
  invalidateCache(cache.ACCOUNT_LIST);
}

async function save() {
  if (!canSave.value || !inputs.value) return;
  saving.value = true;
  try {
    await gate.waitUntilReady();
    const values = { ...fingerprint.value, ...readFields(inputs.value, toRaw(metadata.value)) };
    if (findField(basicInputs.value, 'cookie')?.value === originalCookieText) delete values.cookie;
    const checked = await resolveProxy(values, { checkChannel: userConfig.value.ipChecker, isDirect: false, testProxy });
    if (checked !== values) {
      const proxyField = findField(basicInputs.value, 'proxyInfoList');
      if (proxyField) proxyField.value = formatProxy(checked);
    }
    const { code, msg } = await requests.window.userMdfWindowInfoSingleV2Create(serializeProfile(checked));
    showStatus(code, msg);
    if (code === 0) {
      config.mixpanelTrack('profile_edit');
      invalidateProfiles();
      await router.replace(returnPath === '/browser/edit' ? { path: '/browser' } : { path: returnPath, query: returnQuery });
    }
  } catch (error) {
    showStatus(-1, error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="relative flex min-h-0 flex-col h-full">
    <Header show-back :title="$t('编辑窗口')" />
    <div class="profile-editor-viewport flex flex-1 min-h-0 overflow-hidden">
      <div class="profile-editor-layout w-full h-full flex min-h-0 ma-auto" :class="collapsed ? 'max-w-192' : 'max-w-285'">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <ProfileForm class="min-h-0 min-w-0 flex-1" :accordions="accordions" :inputs-group="inputs">
            <template #before><WindowInputs :window-inputs="basicInputs" /></template>
          </ProfileForm>
          <div class="footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16">
            <ProfileMetadata v-model="metadata" class="flex-1" is-edit />
            <Button v-tooltip.top="canSave ? '' : $t('正在同步指纹，请稍后')" severity="primary" :label="$t('保存')"
              :disabled="!canSave" :loading="saving" @click="save" />
          </div>
        </div>
        <Fingerprint v-model:collapsed="collapsed" :inputs-group="inputs" is-edit @shuffle="refreshFingerprint" />
      </div>
    </div>
  </div>
</template>
