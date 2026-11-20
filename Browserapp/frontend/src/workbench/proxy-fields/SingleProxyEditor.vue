<script setup>
import {
  Ar as joinText,
  Tr as parseRules,
  cr as copyData,
  m as loadDictionary,
  v as useUser,
  xr as isEmpty,
} from './utils-BIWenCnY.js';
import {
  h,
  nextTick,
  onBeforeMount,
  ref,
  useTemplateRef,
  computed,
} from './workbench-vue.js';
import { a as useConfigStore, n as useToast } from './agent-BmSFI9WH.js';
import { m as proxyTypes, r as ipTypes } from './proxy-D7e36h-l.js';
import {
  a as parseEndpoint,
  i as toFormValues,
  n as useLabels,
  r as RemarkEditor,
} from './proxy-create-mode-BCcLAAf5.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { t as useOnboarding } from './hooks-BozaoB_u.js';
import { t as useProxyTest } from './hooks-Jw3GridD.js';
import { t as Form } from './form-BQBA_XzO.js';
import { t as DeviceResultDialog } from './device-detect-result-modal-Caj_9rFr.js';
import { t as TutorialVideo } from './tutorial-video-Cb-jkf_V.js';
import {
  n as ChannelOption,
  t as channelOptions,
} from './check-channel-BUSbubqx.js';

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  showRemark: Boolean,
  mode: String,
  onConfirm: Function,
});
const styles = { host: '_host_bgufg_1', dot_eparator: '_dot_eparator_bgufg_5' };
const saving = ref(false);
let testedFields;

let labels =
    props.mode === undefined ? useLabels() : useLabels(() => props.mode),
  [notify] = useToast(),
  { getUserConfig: loadUserConfig } = useUser(),
  { userConfig: userConfig } = useConfigStore(useUser()),
  [openDialog] = useDialog(),
  { testProxy: testProxy, batchTestShowToast: showTestResults } =
    useProxyTest(),
  testResult = ref(null),
  deviceMode = computed(() => labels.value.mode === 'device'),
  {
    onboardingTaskStatus: onboarding,
    closeGuideTipsAndUpdateTaskStatus: dismissTutorial,
  } = useOnboarding(),
  form = useTemplateRef('form'),
  successAlert = useTemplateRef('alert'),
  testing = ref(false),
  testedSuccessfully = ref(false),
  draft = ref(copyData(props.data));
function parseHost(e2) {
  let t2 = parseEndpoint(e2);
  return t2
    ? (form.value?.setValues(
        toFormValues(t2, { includeRefreshUrl: !deviceMode.value }),
      ),
      t2.remark !== undefined && (draft.value.remark = t2.remark),
      true)
    : false;
}
function onPaste(e2) {
  parseHost(e2.clipboardData?.getData('text') ?? '') && e2.preventDefault();
}
function onHostBlur(e2) {
  parseHost(e2.target.value);
}
let fields = computed(() => [
  {
    type: 'textarea',
    label: labels.value.smartRecognize,
    name: 'proxyRules',
    props: {
      placeholder: deviceMode.value
        ? $t(
            `示例（备注为选填）:
192.168.0.1:8000:用户名:密码{notes}
用户名:密码{at}192.168.0.1:8000{notes}`,
            { at: '@', notes: `{${$t('备注')}}` },
          )
        : $t(
            `示例（动态代理 IP 刷新 URL 与备注为选填）:
192.168.0.1:8000:代理 IP 用户名:代理 IP 密码[动态代理 IP 刷新 URL]{notes}
代理 IP 用户名:代理 IP 密码{at}192.168.0.1:8000[动态代理 IP 刷新 URL]{notes}`,
            { at: '@', notes: `{${$t('备注')}}` },
          ),
      rows: 3,
      size: 'md',
      onBlur: (e2) => {
        let n2 = parseRules(e2.target.value);
        if (isEmpty(Object.values(n2).filter(Boolean))) return;
        let {
            protocol: r3,
            host: i2,
            port: a2,
            proxyUserName: s3,
            proxyPassword: c2,
            refreshUrl: l2,
            remark: u2,
          } = n2,
          d2 = i2?.startsWith('[') ? ipTypes.IPV6 : ipTypes.IPV4;
        (form.value?.setValues({
          ipType: d2,
          host: i2?.replace(/\[|\]/g, ''),
          port: a2,
          proxyUserName: s3,
          proxyPassword: c2,
          ...(r3 ? { proxyCategory: r3.toLocaleUpperCase() } : {}),
          ...(deviceMode.value ? {} : { refreshUrl: l2 }),
          proxyRules: '',
        }),
          (draft.value.remark = u2));
      },
    },
    resolver: (e2) =>
      e2
        .string()
        .refine(
          (e3) =>
            isEmpty(e3)
              ? true
              : !isEmpty(Object.values(parseRules(e3)).filter(Boolean)),
          { message: $t('解析错误,请检查格式') },
        ),
  },
  { separator: true },
  {
    type: 'radio',
    label: labels.value.entityType,
    name: 'ipType',
    props: {
      name: 'ipType',
      size: 'md',
      onValueChange: async (e2) => {
        let t2 = await loadDictionary(),
          n2 = e2 === ipTypes.IPV6 ? 'ipv6-query-channels' : 'checkChannel',
          a2 = channelOptions(t2[n2]),
          o2 = a2.find((e3) => e3.value === props.data.checkChannel),
          s3 = o2 ? props.data.checkChannel : a2[0]?.value;
        e2 === ipTypes.IPV6
          ? form.value?.setInputsProps({
              checkChannel: { value: s3, options: a2 },
            })
          : form.value?.setInputsProps({
              checkChannel: {
                value: o2 ? s3 : userConfig.value.ipChecker || s3,
                options: a2,
              },
            });
      },
    },
  },
  {
    type: 'group',
    label: labels.value.entityInfo,
    items: [
      {
        type: 'select',
        name: 'proxyCategory',
        itemClass: 'flex-1.75/5',
        props: { optionValue: 'value', size: 'md' },
      },
      {
        type: 'text',
        name: 'host',
        itemClass: `flex-1.75/5 ${styles.host}`,
        value: props.data.host ?? null,
        required: true,
        props: {
          placeholder: labels.value.host,
          size: 'md',
          onPaste: onPaste,
          onBlur: onHostBlur,
        },
      },
      {
        itemClass: `justify-center ${styles.dot_eparator}`,
        render: () => h('span', null, ':'),
      },
      {
        type: 'text',
        name: 'port',
        itemClass: 'flex-1.5/5',
        value: props.data.port?.split?.('/')?.[0] ?? null,
        props: {
          placeholder: labels.value.port,
          size: 'md',
          useGrouping: false,
        },
        resolver: (e2) =>
          e2
            .string()
            .refine(
              (e3) =>
                Number.isInteger(Number(e3)) &&
                Number(e3) >= 1 &&
                Number(e3) <= 65535,
              { message: $t('端口范围 1~65535') },
            ),
      },
    ],
  },
  {
    type: 'text',
    name: 'proxyUserName',
    label: labels.value.username,
    value: props.data.proxyUserName ?? '',
    props: { placeholder: labels.value.usernamePlaceholder, size: 'md' },
  },
  {
    type: 'text',
    name: 'proxyPassword',
    label: labels.value.password,
    value: props.data.proxyPassword ?? '',
    props: { placeholder: labels.value.passwordPlaceholder, size: 'md' },
  },
  ...(deviceMode.value
    ? []
    : [
        {
          type: 'text',
          name: 'refreshUrl',
          label: labels.value.refreshUrl,
          tooltip: labels.value.refreshUrlTooltip,
          value: props.data.refreshUrl ?? '',
          props: {
            placeholder: labels.value.refreshUrlPlaceholder,
            icon: 'base/rx_ic_refresh',
            size: 'md',
            onIconClick: async () => {
              let e2 = form.value?.getFieldState('refreshUrl')?.value;
              if (e2) {
                let t2 = await globalThis.electronAPI.send(
                  'proxy:refreshUrl',
                  e2,
                );
                notify(t2 ? 0 : -1, e2);
              }
            },
          },
        },
      ]),
  { separator: true },
  {
    label: labels.value.ipDetect,
    name: 'checkChannel',
    tooltip: $t('若 IP 检测结果有误，请尝试切换下方查询渠道并重试。'),
    props: { size: 'md', fluid: true, optionValue: 'value' },
    render: (e2) =>
      h(
        'div',
        {
          class:
            'w-full flex justify-between items-center gap-1.5 overflow-hidden',
        },
        [
          h(Select, e2, {
            'option-extra': ({ option: e3 }) =>
              h(ChannelOption, { option: e3 }, null),
          }),
          h(
            Button,
            {
              class: 'flex-shrink-0',
              size: 'md',
              severity: 'secondary',
              variant: 'outlined',
              icon: 'base/rx_ic_speed_test',
              disabled: testing.value,
              label: labels.value.testAction,
              onClick: test,
            },
            null,
          ),
        ],
      ),
  },
]);
onBeforeMount(() => {
  initialize();
});
async function initialize() {
  let [e2, t2] = await Promise.all([loadUserConfig(), loadDictionary()]),
    n2 = props.data.ipType === ipTypes.IPV6,
    a2 = n2 ? 'ipv6-query-channels' : 'checkChannel',
    o2 = t2[a2]?.find((e3) => e3.value === props.data.checkChannel)
      ? props.data.checkChannel
      : t2[a2]?.[0]?.value;
  o2 = n2 ? o2 : props.data.checkChannel || e2?.ipChecker || o2;
  let s3 = (props.data.proxyCategory || props.data.protocol)?.split('/')[0],
    c2 = channelOptions(t2[a2]);
  form.value?.setInputsProps({
    ipType: {
      value: props.data.ipType || t2.ipType[0]?.value,
      options: t2.ipType,
    },
    proxyCategory: {
      value:
        !s3 || s3 === 'noproxy'
          ? t2.protocol[0]?.value
          : s3?.toLocaleUpperCase(),
      options: t2.protocol,
    },
    checkChannel: { value: o2, options: c2 },
  });
}
function readFields() {
  let {
    host: e2,
    port: t2,
    proxyUserName: n2,
    proxyPassword: r3,
    ...i2
  } = form.value?.getValues() ?? {};
  return {
    host: e2?.trim(),
    port: t2?.trim(),
    proxyUserName: n2?.trim(),
    proxyPassword: r3?.trim(),
    ...i2,
  };
}
async function test() {
  if (testing.value) return;
  if (!globalThis.isElectron)
    return globalThis.electronAPI.send('proxy:detect', {});
  await form.value?.instance.validate();
  if (!form.value?.instance.valid) return;
  const fields = readFields();
  testing.value = true;
  testedSuccessfully.value = false;
  testResult.value = null;
  try {
    const lastCountry = String(draft.value.lastCountry ?? '').trim();
    const result = await testProxy({
      ...fields,
      isDirect: false,
      proxyType:
        props.data.proxyType ?? props.data.buyProxyType ?? proxyTypes.resource,
      ...(lastCountry ? { lastCountry } : {}),
    });
    showTestResults([{ ...result, proxyType: proxyTypes.resource }]);
    if (JSON.stringify(fields) !== JSON.stringify(readFields())) return;
    testResult.value = result;
    draft.value = { ...draft.value, ...result };
    testedFields = JSON.stringify(fields);
    if (!result.error) {
      testedSuccessfully.value = true;
      await nextTick();
      successAlert.value?.$el?.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    notify(-1, error.message);
  } finally {
    testing.value = false;
  }
}
function setRemark(e2) {
  draft.value.remark = e2;
}
function buildResult(e2, t2) {
  return { ...draft.value, ...e2, ...(t2 ?? {}), protocol: e2.proxyCategory };
}
function showDeviceResult(e2) {
  openDialog({
    showHeader: false,
    modal: true,
    blockScroll: true,
    slots: {
      container: ({ hideModal: t2 }) =>
        h(DeviceResultDialog, {
          formData: e2,
          isDirect: false,
          onClose: t2,
          onConfirm: async (n2) => {
            if ((await props.onConfirm?.(buildResult(e2, n2))) !== false) t2();
          },
        }),
    },
  });
}
async function submit() {
  if (saving.value || testing.value) return;
  saving.value = true;
  try {
    await form.value?.instance.validate();
    if (!form.value?.instance.valid) return;
    const values = readFields();
    if (deviceMode.value) return showDeviceResult(values);
    if (!testedSuccessfully.value || testedFields !== JSON.stringify(values))
      await test();
    if (form.value?.instance.valid)
      await props.onConfirm?.(buildResult(readFields()));
  } catch (error) {
    notify(-1, error.message);
  } finally {
    saving.value = false;
  }
}
defineExpose({ submit });
</script>

<template>
  <div
    class="flex flex-col gap-4 min-w-96 h-full min-h-0 overflow-hidden pa-4 pb-5"
  >
    <TutorialVideo
      v-if="!deviceMode && !onboarding?.createProxyVideoEntryStatus"
      class="shrink-0"
      video-type="proxy_management"
      :autoplay="false"
    >
      <template #default="{ onPlay }">
        <div
          class="flex items-center justify-start pa-3 gap-2.5 rounded-xl video"
          @click="onPlay"
        >
          <div class="flex items-center pa-2 rounded-md video-icon">
            <Icon
              name="base/rx_ic_play"
              color="var(--pattern-tutorial-video-bg-icon)"
            />
          </div>
          <div class="flex-1 cursor-pointer">
            <div class="flex justify-between items-center">
              <span class="video-title">{{ labels.tutorialTitle }}</span>
              <Icon
                class="cursor-pointer"
                name="base/rx_ic_delete"
                color="var(--colors-icon-icon-tertiary)"
                @click.stop="dismissTutorial('createProxyVideoEntryStatus')"
              />
            </div>
            <div class="video-desc">{{ labels.tutorialDesc }}</div>
          </div>
        </div>
      </template>
    </TutorialVideo>
    <div
      class="flex-1 min-h-0 flex flex-col gap-4 pb-2 overflow-y-auto scrollbar"
    >
      <Form v-if="fields" ref="form" :inputs="fields" />
      <Alert
        ref="alert"
        v-model:visible="testedSuccessfully"
        class="shrink-0 !w-full"
        type="success"
        :title="$t('测试成功')"
      >
        <template #content>
          <i18n-t
            class="whitespace-pre-wrap"
            tag="div"
            scope="global"
            :keypath="
              $t(`位置: {location}\nIP: {ip}\n时区: {timezone}`, {
                location:
                  (testResult?.lastCountry ?? '') +
                  joinText('/', testResult?.lastCity),
                ip: testResult?.lastIp,
                timezone: testResult?.timezone,
              })
            "
          />
        </template>
      </Alert>
    </div>
    <div class="shrink-0">
      <slot name="footer" :submit="submit">
        <div class="inline-flex flex-row-reverse justify-between w-full">
          <Button
            size="sm"
            :label="$t('保存')"
            :loading="saving"
            :disabled="testing"
            @click="submit"
          />
          <RemarkEditor
            v-if="showRemark"
            :title="labels.remarkTitle"
            :label="$t('备注')"
            mode="button"
            :value="draft.remark"
            :on-confirm="setRemark"
          />
        </div>
      </slot>
    </div>
  </div>
</template>
