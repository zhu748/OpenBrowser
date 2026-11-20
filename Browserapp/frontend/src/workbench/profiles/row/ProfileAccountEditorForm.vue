<script setup>
import { onBeforeMount, ref, useTemplateRef, watch } from './workbench-vue.js';
import { cr as clone, h as api, xr as isEmpty } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useFeedback } from './agent-BmSFI9WH.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Form } from './form-BQBA_XzO.js';
import { u as parseAccount } from './utils-CnUy4XUk.js';
import PlatformUrlFormField from './workbench-platform-url-field.js';
import { accountLabels, platformAbbreviations, toUrlOptions } from './workbench-platform-account-fields.js';

const props = defineProps({
  data: { type: Object, default: () => ({}) }, showRemark: { type: Boolean, default: true },
  showCreateMore: { type: Boolean, default: true }, onConfirm: Function,
});
const emit = defineEmits(['close']);
const { realTheme } = storeToRefs(useTheme());
const [, report] = useFeedback();
const form = useTemplateRef('tsform');
const abbreviations = ref([]);
const pending = ref(false);
const addAnother = ref(false);
let iconRevision = 0;
function originalIcons() {
  return { platformIcon: props.data.platformIcon || '', platformIconDark: props.data.platformIconDark || '', fromUser: false };
}
const icons = ref(originalIcons());
const example = `${$t('账号')}:${$t('密码')}:2FA${props.showRemark ? '{' + $t('备注') + '}' : ''}`;
function syncLabels(url = String(form.value?.getFieldState('platformUrl')?.value ?? props.data.platformUrl ?? '')) {
  const { account, password } = accountLabels({
    platformUrl: url, platformAbbr: url === String(props.data.platformUrl ?? '') ? props.data.platformAbbr : undefined,
  }, abbreviations.value);
  form.value?.setInputsProps({ platformUserName: { label: account }, platformPassword: { label: password } });
}
function parse(event) {
  const result = parseAccount(event.target.value);
  if (isEmpty(Object.values(result).filter(Boolean))) return;
  form.value?.setValues({
    platformUserName: result.username ?? '', platformPassword: result.password ?? '',
    platformEfa: result.twoFactor ?? '', platformRemarks: result.remark ?? '', intelligent: '',
  });
}
const fields = ref([
  {
    type: 'textarea', name: 'intelligent', label: $t('智能识别'), props: { placeholder: example, rows: 2, onBlur: parse },
    resolver: schema => schema.string().refine(value => isEmpty(value) || !isEmpty(Object.values(parseAccount(value)).filter(Boolean)),
      { message: $t('解析错误,请检查格式：{text}', { text: example }) }),
  },
  { separator: true },
  {
    name: 'platformUrl', label: $t('平台'), value: props.data.platformUrl, render: PlatformUrlFormField,
    props: {
      placeholder: $t('请输入或选择平台网址'), darkMode: realTheme.value === 'dark', icon: icons.value.platformIcon,
      iconDark: icons.value.platformIconDark, syncKey: iconRevision, options: [],
      onIcons: value => { icons.value = value; }, onUrlChange: syncLabels,
    },
    resolver: schema => schema.string().url($t('请输入正确的平台网址')),
  },
  { type: 'text', name: 'platformUserName', label: $t('平台登录账号'), value: props.data.platformUserName, props: { placeholder: $t('请输入账号') } },
  { type: 'password', name: 'platformPassword', label: $t('平台登录密码'), value: props.data.platformPassword, props: { placeholder: $t('请输入密码') } },
  {
    type: 'text', name: 'platformEfa', label: $t('2FA 密钥'), value: props.data.platformEfa, props: { placeholder: $t('请输入 2FA 密钥') },
    tooltip: $t('仅当平台账号已开启双重验证时填写，填写后可用于自动生成验证码。'),
  },
  ...(props.showRemark ? [{
    type: 'textarea', name: 'platformRemarks', label: $t('备注'), value: props.data.platformRemarks,
    props: { placeholder: $t('请输入备注'), rows: 3 },
  }] : []),
]);
watch(realTheme, theme => form.value?.setInputsProps({ platformUrl: { darkMode: theme === 'dark' } }));
onBeforeMount(async () => {
  try {
    const { data } = await api.platform.userGetPlatformInfoList({});
    abbreviations.value = platformAbbreviations(data?.rows);
    form.value?.setInputsProps({ platformUrl: { options: toUrlOptions(data?.rows) } });
    syncLabels();
  } catch (error) {
    report(-1, error.message);
  }
});
function submit(again) {
  if (pending.value) return;
  addAnother.value = again;
  form.value?.submit();
}
async function save({ intelligent, platformUserName, platformPassword, ...fields }) {
  if (pending.value) return;
  pending.value = true;
  try {
    const result = await props.onConfirm?.({
      ...clone(props.data), platformUserName: platformUserName?.trim(), platformPassword: platformPassword?.trim(), ...fields,
      platformIcon: icons.value.platformIcon, platformIconDark: icons.value.platformIconDark,
    });
    if (result === false) return;
    form.value?.reset();
    icons.value = originalIcons();
    form.value?.setInputsProps({ platformUrl: {
      icon: icons.value.platformIcon, iconDark: icons.value.platformIconDark, syncKey: ++iconRevision,
    } });
    syncLabels(String(props.data.platformUrl ?? ''));
    if (!addAnother.value) emit('close');
  } catch (error) {
    report(-1, error.message);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col h-full min-w-96 px-4 pt-4">
    <div class="flex-1 overflow-y-auto scrollbar">
      <Form id="account" ref="tsform" :validate-on-value-update="false" validate-on-blur :inputs="fields" @submit="save" />
    </div>
    <div class="flex flex-row-reverse justify-between gap-3 pt-4 pb-5">
      <Button :label="$t('保存')" :loading="pending" @click="submit(false)" />
      <Button v-if="!data.id && !data._tempId && showCreateMore" :label="$t('保存 & 继续添加')"
        severity="secondary" outlined :loading="pending" @click="submit(true)" />
    </div>
  </div>
</template>
