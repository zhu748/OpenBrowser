<script setup>
import {
  Tr as parseProxyRules,
  cr as clone,
  m as loadDictionary,
  v as useUser,
  xr as isEmpty,
} from './utils-BIWenCnY.js';
import {
  toRaw,
  nextTick,
  onBeforeMount,
  ref,
  useTemplateRef,
  h,
} from './workbench-vue.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { m as proxyTypes, r as ipTypes } from './proxy-D7e36h-l.js';
import {
  a as parseUrl,
  i as proxyUrlValues,
} from './proxy-create-mode-BCcLAAf5.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
import { t as useProxyTest } from './hooks-Jw3GridD.js';
import {
  n as CheckChannelOption,
  t as checkChannelOptions,
} from './check-channel-BUSbubqx.js';
import { t as Form } from './form-BQBA_XzO.js';
const model = defineModel({ default: null });
const classes = { host: '_host_1tjmp_1', port: '_port_1tjmp_5' };

let [notify] = useToast(),
  { getUserConfig: loadUserConfig } = useUser(),
  { testProxy: testProxy, batchTestShowToast: showTestResult } = useProxyTest(),
  form = useTemplateRef('form'),
  root = useTemplateRef('root'),
  checking = ref(false),
  initial = model.value ?? {};
function normalizeProtocol(e2) {
  let t2 = e2?.toString?.()?.split('/')[0]?.trim();
  return !t2 || t2.toLowerCase() === 'noproxy' ? '' : t2.toLocaleUpperCase();
}
function onFormChange() {
  nextTick(() => updateModel());
}
function applyUrl(e2) {
  let t2 = parseUrl(e2);
  if (!t2) return false;
  form.value?.setValues(proxyUrlValues(t2));
  let n3 = form.value?.getFieldState('checkChannel')?.value;
  return (loadChannels(t2.ipType, n3), onFormChange(), true);
}
function pasteHost(e2) {
  applyUrl(e2.clipboardData?.getData('text') ?? '') && e2.preventDefault();
}
function inputHost(e2) {
  (applyUrl(e2.target.value), onFormChange());
}
function readRules(t2) {
  let n3 = parseProxyRules(t2.target.value);
  if (isEmpty(Object.values(n3).filter(Boolean))) return;
  let {
      protocol: r2,
      host: i2,
      port: o3,
      proxyUserName: s2,
      proxyPassword: c2,
      refreshUrl: l3,
    } = n3,
    u2 = i2?.startsWith('[') ? ipTypes.IPV6 : ipTypes.IPV4;
  (form.value?.setValues({
    ipType: u2,
    host: i2?.replace(/\[|\]/g, ''),
    port: o3,
    proxyUserName: s2,
    proxyPassword: c2,
    ...(r2 ? { proxyCategory: r2.toLocaleUpperCase() } : {}),
    refreshUrl: l3,
    proxyRules: '',
  }),
    loadChannels(u2),
    onFormChange());
}
async function changeIpType(e2) {
  (await loadChannels(e2, form.value?.getFieldState('checkChannel')?.value),
    onFormChange());
}
async function getChannelConfig(e2, t2) {
  let [n3, i2] = await Promise.all([loadUserConfig(), loadDictionary()]),
    a2 = e2 === ipTypes.IPV6,
    o3 = checkChannelOptions(i2[a2 ? 'ipv6-query-channels' : 'checkChannel']),
    s2 = o3.find((e3) => e3.value === t2),
    c2 = s2 ? t2 : o3[0]?.value;
  return (
    !a2 && !s2 && (c2 = n3?.ipChecker || c2),
    { checkChannel: c2, options: o3, dictMap: i2 }
  );
}
async function loadChannels(e2, t2) {
  let { checkChannel: n3, options: r2 } = await getChannelConfig(e2, t2);
  form.value?.setInputsProps({ checkChannel: { value: n3, options: r2 } });
}
let fields = [
  {
    type: 'textarea',
    label: $t('智能识别'),
    name: 'proxyRules',
    props: {
      placeholder: $t(
        `192.168.0.1:8000:代理 IP 用户名:代理 IP 密码[动态代理 IP 刷新 URL]
代理 IP 用户名:代理 IP 密码{at}192.168.0.1:8000[动态代理 IP 刷新 URL]`,
        { at: '@', notes: `{${$t('备注')}}` },
      ),
      rows: 3,
      onBlur: readRules,
    },
    resolver: (t2) =>
      t2
        .string()
        .refine(
          (t3) =>
            isEmpty(t3)
              ? true
              : !isEmpty(Object.values(parseProxyRules(t3)).filter(Boolean)),
          { message: $t('解析错误,请检查格式') },
        ),
  },
  {
    type: 'radio',
    label: $t('代理 IP 类型'),
    name: 'ipType',
    value: initial.ipType ?? null,
    props: { name: 'ipType', onValueChange: changeIpType },
  },
  {
    type: 'group',
    label: $t('代理 IP 信息'),
    items: [
      {
        type: 'select',
        name: 'proxyCategory',
        itemClass: 'w-26',
        value:
          normalizeProtocol(initial.proxyCategory || initial.protocol) || null,
        props: { optionValue: 'value', onChange: onFormChange },
      },
      {
        type: 'text',
        name: 'host',
        itemClass: `flex-1 ${classes.host}`,
        value: initial.host ?? null,
        required: true,
        props: {
          placeholder: $t('代理 IP 主机'),
          onInput: onFormChange,
          onPaste: pasteHost,
          onBlur: inputHost,
        },
      },
      {
        type: 'text',
        name: 'port',
        itemClass: `flex-1 ${classes.port}`,
        value: initial.port?.toString?.()?.split?.('/')?.[0] ?? null,
        props: {
          placeholder: $t('代理 IP 端口'),
          useGrouping: false,
          onInput: onFormChange,
          onBlur: onFormChange,
        },
        slots: {
          preIcon: () => h('span', { class: 'text-3 leading-none' }, ':'),
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
    label: $t('代理 IP 用户名'),
    value: initial.proxyUserName ?? '',
    props: {
      placeholder: $t('请输入代理 IP 账号'),
      onInput: onFormChange,
      onBlur: onFormChange,
    },
  },
  {
    type: 'text',
    name: 'proxyPassword',
    label: $t('代理 IP 密码'),
    value: initial.proxyPassword ?? '',
    props: {
      placeholder: $t('请输入代理 IP 密码'),
      onInput: onFormChange,
      onBlur: onFormChange,
    },
  },
  {
    type: 'text',
    name: 'refreshUrl',
    label: $t('刷新 URL'),
    tooltip: $t(
      '如代理 IP 服务商未提供刷新 URL，则无需配置。填写后可点击右侧刷新按钮请求更换当前出口 IP。',
    ),
    value: initial.refreshUrl ?? '',
    props: {
      placeholder: $t('动态代理 IP 专用，静态代理 IP 无需填写'),
      icon: 'base/rx_ic_refresh',
      onInput: onFormChange,
      onBlur: onFormChange,
      onIconClick: async () => {
        let e2 = form.value?.getFieldState('refreshUrl')?.value;
        if (e2) {
          let t2 = await globalThis.electronAPI.send('proxy:refreshUrl', e2);
          notify(t2 ? 0 : -1, e2);
        }
      },
    },
  },
  {
    label: $t('代理 IP 检测'),
    name: 'checkChannel',
    tooltip: $t(
      '用于查询代理 IP 的出口位置及网络信息。如检测结果异常或不准确，可切换其他查询渠道后重新测试。',
    ),
    value: initial.checkChannel ?? null,
    props: { fluid: true, optionValue: 'value', onChange: onFormChange },
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
              h(CheckChannelOption, { option: e3 }, null),
          }),
          h(
            Button,
            {
              class: 'flex-shrink-0',
              severity: 'secondary',
              variant: 'outlined',
              icon: 'base/rx_ic_speed_test',
              disabled: checking.value,
              label: $t('测试代理 IP'),
              onClick: checkProxy,
            },
            null,
          ),
        ],
      ),
  },
];
onBeforeMount(() => {
  initialize();
});
async function initialize() {
  (await nextTick(), await fillForm(model.value ?? {}), updateModel());
}
async function fillForm(e2) {
  let {
      checkChannel: t2,
      options: n3,
      dictMap: r2,
    } = await getChannelConfig(e2.ipType || ipTypes.IPV4, e2.checkChannel),
    i2 =
      normalizeProtocol(e2.proxyCategory || e2.protocol) ||
      r2.protocol?.[0]?.value;
  (form.value?.setInputsProps({
    ipType: { value: e2.ipType || r2.ipType?.[0]?.value, options: r2.ipType },
    proxyCategory: { value: i2, options: r2.protocol },
    checkChannel: { value: t2, options: n3 },
  }),
    form.value?.setValues({
      ipType: e2.ipType || r2.ipType?.[0]?.value,
      proxyCategory: i2,
      checkChannel: t2,
      host: e2.host ?? '',
      port: e2.port?.toString?.()?.split?.('/')?.[0] ?? '',
      proxyUserName: e2.proxyUserName ?? '',
      proxyPassword: e2.proxyPassword ?? '',
      refreshUrl: e2.refreshUrl ?? '',
      proxyRules: '',
    }));
}
function readFields() {
  let {
    host: e2,
    port: t2,
    proxyUserName: n3,
    proxyPassword: r2,
    proxyRules: i2,
    ...a2
  } = form.value?.getValues() ?? {};
  return {
    host: e2?.trim(),
    port: t2?.toString?.()?.trim(),
    proxyUserName: n3?.trim(),
    proxyPassword: r2?.trim(),
    ...a2,
  };
}
function updateModel() {
  if (!form.value) return;
  let e2 = readFields(),
    t2 = normalizeProtocol(e2.proxyCategory),
    { id: n3, moduleId: r2, ...i2 } = model.value ?? {};
  model.value = {
    ...i2,
    ...e2,
    _tempId: model.value?._tempId ?? Date.now().toString(32),
    id: undefined,
    moduleId: 0,
    proxyCategory: t2,
    protocol: t2,
    proxyMethod: 'custom',
  };
}
async function applyExternalItem(e2) {
  ((model.value = e2), await fillForm(e2), updateModel());
}
function locateMissingProxy() {
  let e2 = form.value?.getValues() ?? {},
    t2 = !String(e2.host ?? '').trim(),
    n3 = !String(e2.port ?? '').trim();
  (form.value?.setInputsProps({ host: { invalid: t2 }, port: { invalid: n3 } }),
    nextTick(() => {
      let e3 = !t2 && n3 ? classes.port : classes.host,
        r2 = root.value?.querySelector(`.${e3} input`);
      r2 instanceof HTMLInputElement &&
        (r2.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        r2.focus({ preventScroll: true }));
    }));
}
function clearMissingProxy() {
  form.value?.setInputsProps({
    host: { invalid: false },
    port: { invalid: false },
  });
}
defineExpose({
  applyExternalItem: applyExternalItem,
  checkProxy: checkProxy,
  locateMissingProxy: locateMissingProxy,
  clearMissingProxy: clearMissingProxy,
});
async function checkProxy() {
  if (!globalThis.isElectron)
    return globalThis.electronAPI.send('proxy:detect', {});
  if (checking.value) return;
  checking.value = true;
  try {
    await form.value?.instance.validate();
    if (!form.value?.instance.valid) return;
    updateModel();
    let e2 = readFields(),
      n3 =
        typeof model.value?.lastCountry == 'string'
          ? model.value.lastCountry.trim()
          : '',
      r2 = await testProxy({
        ...clone(e2),
        apiCheck: false,
        isDirect: false,
        proxyType:
          model.value?.proxyType ??
          model.value?.buyProxyType ??
          proxyTypes.resource,
        ...(n3 ? { lastCountry: n3 } : {}),
      });
    (showTestResult([{ ...r2, proxyType: proxyTypes.resource }], {
      reCheck: () => checkProxy(),
    }),
      (model.value &&= { ...toRaw(model.value), ...r2 }));
  } catch (error) {
    notify(-1, error.message);
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <div ref="root" class="contents">
    <Form ref="form" class="!gap-3" position="left" :inputs="fields" />
  </div>
</template>
