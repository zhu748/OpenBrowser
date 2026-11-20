<script setup>
import {
  Tr as parseProxy,
  ar as runLimited,
  h as api,
  kr as delay,
  m as loadDictionary,
  v as useUser,
} from './utils-BIWenCnY.js';
import {
  computed,
  onBeforeMount,
  reactive,
  ref,
  toRaw,
  watch,
} from './workbench-vue.js';
import { a as useConfigStore, n as useToast } from './agent-BmSFI9WH.js';
import {
  m as proxyType,
  o as proxyStatus,
  r as ipTypes,
} from './proxy-D7e36h-l.js';
import { n as useLabels } from './proxy-create-mode-BCcLAAf5.js';
import {
  c as runWithRowLoading,
  s as setRowLoading,
} from './ry-table-do6kugym.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as EmptyState } from './custom-empty-CChX4pJt.js';
import { m as OutboundLocation, t as useProxyTest } from './hooks-Jw3GridD.js';
import {
  n as ChannelOption,
  t as channelOptions,
} from './check-channel-BUSbubqx.js';
import { t as Table } from './table-BJcS2I0Z.js';
import { n as createColumns } from './useProxyModuleCreate-DnWsQ0mq.js';
import {
  n as ShadowDots,
  t as ParseTextarea,
} from './parse-textarea-Dia3ayaD.js';
import ProxyImportHelp from './workbench-proxy-import-help.js';

const props = defineProps({ onConfirm: Function });
const saving = ref(false);

let labels = useLabels(),
  deviceMode = computed(() => labels.value.mode === 'device'),
  confirm = useConfirm(),
  { getUserConfig: loadUserConfig } = useUser(),
  { userConfig: userConfig } = useConfigStore(useUser()),
  { testProxy: testProxy, batchTestShowToast: showTestResults } =
    useProxyTest(),
  [notify, showError] = useToast(),
  rawInput = ref(''),
  rows = ref([]),
  deduplicate = ref(true),
  showParsed = ref(false),
  showWarnings = ref(false),
  duplicates = ref(0),
  statuses = ref({}),
  working = ref(false),
  importHistory = new Map(),
  checkingHistory = false,
  protocols = ref(),
  protocol = ref(),
  ipTypeOptions = ref(),
  ipType = ref(),
  columns = computed(() => createColumns(labels.value)),
  channel = reactive({
    value: undefined,
    props: {
      name: 'checkChannel',
      options: undefined,
      filter: false,
      size: 'xxs',
      icon: 'base/rx_ic_network',
      iconColor: 'var(--colors-icon-icon-secondary)',
    },
    onChange() {
      rows.value.forEach((e2) => {
        ((e2.checkChannel = channel.value?.value),
          (e2.checkChannelValue = channel.value?.label));
      });
    },
  }),
  deleteFailedDisabled = computed(
    () =>
      working.value ||
      !(
        rows.value.length &&
        rows.value.some((e2) => e2.checkStatus === proxyStatus.failure)
      ),
  ),
  hasBusyRows = computed(
    () =>
      working.value ||
      rows.value.some(
        (e2) => e2.loadingOperationMap?.test || e2.historyChecking,
      ),
  ),
  saveDisabled = computed(() => !rows.value?.length || hasBusyRows.value),
  riskyCount = computed(
    () => rows.value.filter((e2) => e2.hasImportRecord).length,
  ),
  warningText = computed(() =>
    $t(
      '有 {count} 条设备命中平台半年内历史库，继续导入可能造成账号关联风险。',
      { count: riskyCount.value },
    ),
  ),
  notificationHeight = computed(() => {
    let e2 = 0;
    return (
      showParsed.value && (e2 += 52),
      showWarnings.value && (e2 += 52),
      showParsed.value && showWarnings.value && (e2 += 10),
      `${e2}px`
    );
  }),
  missingRows = computed(() => {
    let e2 = rows.value.map((e3) => ({
      ...e3,
      checkStatus: e3.checkStatus ?? proxyStatus.failure,
    }));
    if (!e2.some((e3) => e3._missIndex)) return '';
    let { miss: t2 } = e2.reduce(
      (e3, t3) => (t3._missIndex ? e3.miss.push(t3) : e3.success.push(t3), e3),
      { success: [], miss: [] },
    );
    return labels.value.formatMissSaveMessage(
      t2.map((e3) => e3._missIndex).join(', '),
    );
  });
(watch(ipType, async (e2) => {
  let t2 = await loadDictionary(),
    n2 = e2 === ipTypes.IPV6 ? 'ipv6-query-channels' : 'checkChannel',
    r2 = channelOptions(t2[n2]);
  ((channel.props.options = r2),
    (channel.value =
      r2.find((e3) => e3.value === userConfig.value.ipChecker) || r2[0]));
}),
  onBeforeMount(async () => {
    let [e2, t2] = await Promise.all([loadDictionary(), loadUserConfig()]),
      n2 = channelOptions(e2.checkChannel);
    ((channel.value = n2.find((e3) => e3.value === t2.ipChecker) || n2[0]),
      (channel.props.options = n2),
      (protocols.value = e2.protocol),
      (protocol.value = e2.protocol[0].value),
      (ipTypeOptions.value = e2.ipType),
      (ipType.value = e2.ipType[0].value));
  }));
function parseRow(input, index) {
  const parsed = parseProxy(input);
  const scheme = parsed.protocol || protocol.value;
  const port = Number(parsed.port);
  const missing = [
    ['protocol', scheme],
    ['host', parsed.host],
    ['port', Number.isInteger(port) && port >= 1 && port <= 65535],
  ].filter(([, valid]) => !valid);
  return {
    checkChannel: channel.value?.value,
    checkChannelValue: channel.value?.label,
    ipType: parsed.host?.startsWith('[') ? ipTypes.IPV6 : ipType.value,
    protocol: scheme?.toLocaleUpperCase(),
    host: parsed.host?.replace(/\[|\]/g, ''),
    port: parsed.port,
    proxyUserName: parsed.proxyUserName,
    proxyPassword: parsed.proxyPassword,
    ...(deviceMode.value ? {} : { refreshUrl: parsed.refreshUrl }),
    remark: parsed.remark,
    _missField: missing,
    _missIndex: missing.length ? index + 1 : 0,
    _id: index,
    checkStatus: missing.length ? proxyStatus.failure : undefined,
    hasImportRecord: undefined,
    historyChecking: false,
  };
}

async function parseRows() {
  if (working.value) return;
  const lines = rawInput.value.split('\n').map(line => line.replace(/\s/g, '').replace(/：/g, ':')).filter(Boolean);
  if (!lines.length) return showError(-1, labels.value.inputRequired);
  const input = deduplicate.value ? [...new Set(lines)] : lines;
  rows.value = input.map(parseRow);
  duplicates.value = lines.length - input.length;
  statuses.value = {};
  showParsed.value = true;
  showWarnings.value = false;
  importHistory.clear();
  checkingHistory = false;
  working.value = true;
  try {
    await Promise.all([testAll(), deviceMode.value && checkImportHistory(rows.value)]);
  } catch (error) {
    showError(-1, error.message);
  } finally {
    working.value = false;
  }
}
function hideParsed() {
  delay(300).then(() => {
    showParsed.value = false;
  });
}
function hideWarnings() {
  delay(300).then(() => {
    showWarnings.value = false;
  });
}
let regions = { header: false, paginator: false, actions: 'quick' };
function rowBusy(e2) {
  return !!e2.loadingOperationMap?.test || !!e2.historyChecking;
}
function rowActions(e2) {
  let t2 = e2.row;
  if (!t2) return [];
  let n2 = rowBusy(t2);
  return [
    ...(deviceMode.value
      ? []
      : [
          {
            key: 'refresh',
            label: labels.value.refreshAction,
            icon: 'base/rx_ic_refresh',
            quick: true,
            disabled: !t2.refreshUrl,
            disabledTooltip: $t('未配置动态代理 IP 刷新 URL'),
            command: () => refreshRow(t2, 'refresh'),
          },
        ]),
    {
      key: 'test',
      label: labels.value.testAction,
      icon: 'base/rx_ic_speed_test',
      quick: true,
      command: () =>
        t2._missIndex
          ? undefined
          : globalThis.isElectron
            ? testRows(t2, 'test')
            : globalThis.electronAPI.send('proxy:detect', {}),
    },
    {
      key: 'delete',
      label: $t('删除'),
      icon: 'base/rx_ic_bin_1',
      quick: true,
      disabled: n2,
      disabledTooltip: n2 ? $t('检测中') : undefined,
      command: () => deleteRow(t2),
    },
  ];
}
async function refreshRow(e2, t2) {
  let n2 = await runWithRowLoading(e2, t2, () =>
    globalThis.electronAPI.send('proxy:refreshUrl', e2.refreshUrl),
  );
  notify(n2 ? 0 : -1, e2.refreshUrl);
}
async function testRows(e2, n2) {
  let r2 = new Map(),
    i2 = [].concat(e2).map((e3, t2) => {
      setRowLoading(e3, n2, true);
      let i3 = async () => {
        let a3 = await testProxy({
          ...toRaw(e3),
          protocol: e3.protocol || 'HTTP',
          isDirect: false,
        });
        return (
          a3.checkStatus === proxyStatus.failure && !e3._secondCheck
            ? (Reflect.set(e3, '_secondCheck', true), r2.set(t2, i3))
            : (Reflect.deleteProperty(e3, '_secondCheck'),
              Object.assign(e3, a3),
              (statuses.value[e3._id] = a3.checkStatus),
              applyHistory(e3),
              setRowLoading(e3, n2, false)),
          a3
        );
      };
      return i3;
    }),
    a2 = await runLimited(i2, 5);
  if (r2.size > 0) {
    let e3 = await runLimited([...r2.values()], 5);
    (r2.keys().forEach((t2, n3) => (a2[t2] = e3[n3])), r2.clear());
  }
  showTestResults(
    a2
      .filter(Boolean)
      .map((e3) => ({ ...e3, proxyType: e3.proxyType ?? proxyType.resource })),
  );
}
function clearRows() {
  confirm.require({
    header: labels.value.clearHeader,
    message: labels.value.clearMessage,
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: () => {
      ((rows.value = []),
        (showParsed.value = false),
        (showWarnings.value = false));
    },
  });
}
function refreshWarnings() {
  showWarnings.value = deviceMode.value && riskyCount.value > 0;
}
function applyHistory(e2) {
  deviceMode.value &&
    !e2._missIndex &&
    e2.host &&
    e2.port &&
    e2.checkStatus !== undefined &&
    (checkingHistory
      ? (e2.historyChecking = true)
      : ((e2.hasImportRecord = importHistory.get(String(e2._id)) ?? true),
        (e2.historyChecking = false),
        refreshWarnings()));
}
async function checkImportHistory(e2) {
  let t2 = e2.filter((e3) => !e3._missIndex && e3.host && e3.port);
  if (t2.length) {
    (importHistory.clear(), (checkingHistory = true));
    try {
      let { code: e3, data: r2 } =
        await api.proxy.userBatchCheckProxyImportCreate({
          items: t2.map((e4) => ({
            tempId: String(e4._id),
            host: e4.host,
            port: e4.port,
            proxyUserName: e4.proxyUserName,
            proxyPassword: e4.proxyPassword,
          })),
        });
      e3 !== 0 || !r2.items
        ? t2.forEach((e4) => importHistory.set(String(e4._id), true))
        : r2.items.forEach((e4) => {
            importHistory.set(e4.tempId, !!e4.hasImportRecord);
          });
    } finally {
      ((checkingHistory = false), t2.forEach((e3) => applyHistory(e3)));
    }
  }
}
async function testAll() {
  if (!rows.value?.length) showError(-1, labels.value.emptyList);
  else {
    if (!globalThis.isElectron)
      return globalThis.electronAPI.send('proxy:detect', {});
    const valid = rows.value.filter((row) => !row._missIndex);
    if (valid.length) await testRows(valid, 'test');
  }
}
function deleteRow(e2) {
  rowBusy(e2) ||
    ((rows.value = rows.value.filter((t2) => t2._id !== e2._id)),
    delete statuses.value[e2._id],
    rows.value.length
      ? riskyCount.value === 0 && (showWarnings.value = false)
      : ((showParsed.value = false), (showWarnings.value = false)));
}
async function retestAll() {
  if (!working.value) {
    working.value = true;
    try {
      await testAll();
    } finally {
      working.value = false;
    }
  }
}
function deleteFailed() {
  let e2 = rows.value.filter((e3) => e3.checkStatus !== proxyStatus.failure);
  confirm.require({
    header: labels.value.deleteFailHeader,
    message: labels.value.formatDeleteFailMessage(
      rows.value.length - e2.length,
    ),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' },
    accept: () => {
      ((rows.value = e2),
        riskyCount.value === 0 && (showWarnings.value = false));
    },
  });
}
async function save() {
  if (saveDisabled.value || saving.value) return;
  saving.value = true;
  try {
    let e2 = rows.value.map((e3) => ({
      ...e3,
      checkStatus: e3.checkStatus ?? proxyStatus.failure,
    }));
    if (!e2.some((e3) => e3._missIndex)) {
      await props.onConfirm?.(e2);
      return;
    }
    let { promise: t2, resolve: n2 } = Promise.withResolvers(),
      { success: r2, miss: i2 } = e2.reduce(
        (e3, t3) => (
          t3._missIndex ? e3.miss.push(t3) : e3.success.push(t3),
          e3
        ),
        { success: [], miss: [] },
      );
    confirm.require({
      header: $t('警告'),
      message: labels.value.formatMissConfirmMessage(
        i2.map((e3) => e3._missIndex).join(', '),
      ),
      rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
      acceptProps: { label: $t('确认'), severity: 'info' },
      accept: async () => {
        try {
          if (r2.length) await props.onConfirm?.(r2);
        } finally {
          n2();
        }
      },
      reject: n2,
      onHide: n2,
    });
    await t2;
  } catch (error) {
    showError(-1, error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex-1 overflow-auto flex-col proxies-content">
    <div class="parse-input w-full">
      <div class="flex flex-col gap-1.5 xl:w-60%">
        <div
          class="panel-title flex justify-between items-start xl:items-center flex-col xl:flex-row gap-1"
        >
          <div>{{ labels.entityInfo }}</div>
          <div class="flex gap-1.5">
            <Select
              v-model="ipType"
              class="flex-1"
              :options="ipTypeOptions"
              option-value="value"
              size="xs"
            />
            <Select
              v-model="protocol"
              class="!w-30"
              :options="protocols"
              option-value="value"
              size="xs"
            />
          </div>
        </div>
        <div class="information min-w-423px">
          <ParseTextarea
            v-model="rawInput"
            :placeholder="labels.inputPlaceholder"
          />
          <div class="flex justify-between information-actions">
            <div class="flex items-center gap-2.5">
              <div>
                <Select
                  v-model="channel.value"
                  class="!w-32"
                  overlay-auto-width
                  v-bind="channel.props"
                  @change="channel.onChange"
                >
                  <template #option-extra="{ option }"
                    ><ChannelOption :option="option"
                  /></template>
                </Select>
              </div>
              <div class="flex items-center gap-1.5">
                <Checkbox
                  v-model="deduplicate"
                  :pt="{ root: 'items-center', box: '!w-4 !h-4' }"
                  input-id="wrap"
                  binary
                />
                <label
                  for="wrap"
                  class="text-3 select-none cursor-pointer text-[var(--colors-text-text-secondary)]"
                  >{{ $t('自动去重') }}</label
                >
                <Icon
                  v-tooltip="{
                    value: labels.duplicateTip,
                    showDelay: 500,
                    hideDelay: 300,
                  }"
                  name="base/rx_ic_info"
                  color="var(--colors-icon-icon-note)"
                  :size="12"
                />
              </div>
            </div>
            <Button
              outlined
              severity="secondary"
              size="xxs"
              :label="$t('解析并测试')"
              icon="base/rx_ic_play"
              :disabled="working"
              @click.stop="parseRows"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1.5 w-40%">
        <div class="panel-title h-30px flex items-center">
          {{ labels.importRules }}
        </div>
        <div class="rules flex-1 min-w-335px">
          <ProxyImportHelp :ip-type="ipType" class="relative z-10" />
          <ShadowDots class="z-9" />
        </div>
      </div>
    </div>
    <div class="flex flex-col flex-1">
      <div class="flex items-center justify-between pt-6 pb-3 table-toolbar">
        <div class="panel-title">{{ labels.parsedTitle }}</div>
        <div class="flex gap-2">
          <Button
            text
            severity="secondary"
            size="xxs"
            :label="labels.clearAction"
            icon="base/rx_ic_bin_1"
            :disabled="!rows.length || hasBusyRows"
            @click.stop="clearRows"
          />
          <Button
            text
            severity="secondary"
            size="xxs"
            :label="$t('删除失败')"
            icon="base/rx_ic_internet_error"
            :disabled="deleteFailedDisabled"
            @click.stop="deleteFailed"
          />
          <Button
            outlined
            severity="secondary"
            size="xxs"
            :label="$t('测试全部')"
            icon="base/rx_ic_speed_test"
            :disabled="!rows.length || working"
            @click.stop="retestAll"
          />
        </div>
      </div>
      <div class="parse-result-message">
        <Alert
          v-model:visible="showParsed"
          type="success"
          class="w-full"
          :content="
            labels.formatParseSuccess(rows.length, duplicates) + missingRows
          "
          closable
          @close="hideParsed"
        />
        <div
          v-if="showParsed"
          class="h-[10px] w-full bg-[var(--colors-background-bg-page)]"
        ></div>
        <Alert
          v-if="deviceMode"
          v-model:visible="showWarnings"
          type="warn"
          class="w-full"
          :content="warningText"
          closable
          @close="hideWarnings"
        />
        <div
          v-if="showWarnings"
          class="h-[10px] w-full bg-[var(--colors-background-bg-page)]"
        ></div>
      </div>
      <div class="flex-1 overflow-x-auto">
        <Table
          class="h-full"
          data-key="_id"
          :style="{ '--message-h': notificationHeight }"
          :columns="columns"
          :data-list="rows"
          :model="rowActions"
          :regions="regions"
        >
          <template #empty
            ><EmptyState
              icon="rx_illustration_star.svg"
              :title="labels.emptyTable"
              class="min-h-258px"
          /></template>
          <template #outbound="{ data: row }">
            <OutboundLocation
              :country="row.lastCountry"
              :city="row.lastCity"
              :last-ip="row.lastIp"
              :time="row.checkTime"
              :status="statuses[row._id] ?? row.checkStatus"
              :is-loading="row.loadingOperationMap?.test"
            />
          </template>
          <template #riskRating="{ data: row }">
            <div
              v-if="row.historyChecking"
              class="text-3 font-500 leading-4 tt-secondary"
            >
              {{ $t('检测中') }}
            </div>
            <template v-else-if="row.hasImportRecord === undefined">
              --
            </template>
            <div
              v-else-if="row.hasImportRecord"
              class="text-3 font-500 leading-4 tt-warning"
            >
              {{ $t('关联风险') }}
            </div>
            <div v-else class="text-3 font-500 leading-4 tt-success">
              {{ $t('安全') }}
            </div>
          </template>
        </Table>
      </div>
    </div>
    <div class="flex justify-end footer">
      <Button
        :label="$t('保存')"
        :disabled="saveDisabled"
        :loading="saving"
        @click.stop="save"
      />
    </div>
  </div>
</template>
