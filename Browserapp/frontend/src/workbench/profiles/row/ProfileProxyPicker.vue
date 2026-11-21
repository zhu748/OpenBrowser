<script setup>
import {
  ar as runLimited,
  h as api,
  o as readFilters,
  r as filterParams,
} from './utils-BIWenCnY.js';
import {
  computed,
  onBeforeMount,
  reactive,
  ref,
  toRaw,
  useTemplateRef,
} from './workbench-vue.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { m as proxyType, n as proxyUsage } from './proxy-D7e36h-l.js';
import {
  r as RefreshButton,
  s as setRowLoading,
  t as Table,
} from './ry-table-do6kugym.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as EmptyState } from './custom-empty-CChX4pJt.js';
import {
  a as proxyIsReady,
  m as OutboundLocation,
  o as proxyDeploying,
  t as useProxyCheck,
} from './hooks-Jw3GridD.js';
import {
  a as Search,
  i as BoundWindows,
} from './useProxyFormDrawer-r-7UykRS.js';
import { t as SelectButton } from './rx-select-button-DQtmZ0kT.js';
import {
  a as getProxyRows,
  c as Bandwidth,
  l as Expiration,
  n as buildFilters,
  o as listBoundWindows,
  t as useSearchOptions,
} from './operation-zwm3okqF.js';
import { t as Filters } from './custom-filters-D_902RzL.js';

const props = defineProps({
  windows: { type: Array, required: true },
  workspaceName: String,
  data: Object,
  onConfirm: Function,
});

let batch = computed(() => props.windows.length > 1),
  { testProxy: testProxy, batchTestShowToast: showTestResults } =
    useProxyCheck(),
  [notify, notifyError] = useToast(),
  searchOptions = useSearchOptions(),
  table = useTemplateRef('agent'),
  proxyFilters = reactive({
    list: [
      {
        name: 'proxyType',
        value: undefined,
        options: [
          { name: $t('全部'), value: undefined },
          { name: $t('导入'), value: proxyType.resource.toString() },
        ],
      },
    ],
    getValues() {
      return Object.fromEntries(
        proxyFilters.list
          .filter((e3) => e3.value)
          .map((e3) => [e3.name, e3.value]),
      );
    },
    onChange() {
      filterChanged();
    },
  }),
  filters = ref(),
  rows = ref(),
  query = ref({}),
  refreshing = ref(false),
  selected = ref(initialProxy(props.data, batch.value)),
  statuses = ref({}),
  bindings = ref({}),
  saving = ref(false),
  windowFilter = ref('all'),
  windowOptions = [
    { name: $t('全部'), value: 'all' },
    { name: $t('已绑定'), value: 'bound' },
    { name: $t('未绑定'), value: 'unbound' },
  ],
  columns = ref([
    { title: $t('出口 IP'), key: 'lastCountry', slot: 'outbound' },
    { title: $t('到期时间'), key: 'expireDate', slot: 'expireDate' },
    { title: $t('带宽'), key: 'bandwidth', slot: 'bandwidth' },
    { title: $t('已关联窗口'), key: 'bindList', slot: 'bindList' },
  ]),
  windowColumns = [
    {
      title: $t('窗口名称'),
      key: 'code',
      slot: 'windowName',
      style: 'width: 120px',
    },
    {
      title: $t('代理 IP'),
      key: 'location',
      slot: 'proxyIp',
      bodyStyle: 'vertical-align: middle',
    },
  ],
  bindingCount = computed(() => Object.keys(bindings.value).length),
  confirmDisabled = computed(() =>
    saving.value
      ? true
      : batch.value
        ? bindingCount.value === 0
        : !selected.value,
  );
function initialProxy(e3, t3) {
  if (t3) return;
  let n2 = toRaw(e3);
  if (n2?.id != null && n2.id !== 0) return n2;
}
onBeforeMount(async () => {
  try {
    filters.value = await buildFilters();
  } catch (e3) {
    console.error('[Profile:proxy-pick] load proxy filters failed', e3);
  }
});
function filterChanged(e3 = {}, t3 = false) {
  let n2 = { ...e3, ...filterParams(readFilters(filters.value)) };
  ((query.value = n2), table.value?.refresh(n2, t3));
}
async function refresh() {
  if (!refreshing.value) {
    refreshing.value = true;
    try {
      await table.value?.refresh(query.value, false);
    } finally {
      refreshing.value = false;
    }
  }
}
async function loadRows(e3) {
  let n2 = await getProxyRows({
    ...proxyFilters.getValues(),
    ...e3,
    type: proxyUsage.UseDeploy,
  });
  if (
    n2.code === 0 &&
    ((rows.value = n2.data.rows), !batch.value && selected.value?.id != null)
  ) {
    let e4 = n2.data.rows.find(
      (e5) => String(e5.id) === String(selected.value.id),
    );
    e4 && (selected.value = e4);
  }
  return n2;
}
function search(e3) {
  let { key: t3, value: n2 } = e3 || {};
  filterChanged({ queryKey: n2 && (t3 || 'fuzzy'), queryValue: n2 }, true);
}
async function checkAll() {
  rows.value?.length
    ? await checkRows(rows.value)
    : notifyError(-1, $t('暂无代理 IP'));
}
async function checkRows(e3) {
  let t3 = e3.map(
      (e4) => (
        setRowLoading(e4, 'test', true),
        async () => {
          try {
            const result = await testProxy({
              ...toRaw(e4),
              apiCheck: e4.proxyType === proxyType.buy,
            });
            if (!result.stale) {
              Object.assign(e4, { ...result, _checkRes: toRaw(result) });
              statuses.value[e4.id] = result.checkStatus;
            }
            return { ...result, id: e4.id, proxyType: e4.proxyType };
          } finally {
            setRowLoading(e4, 'test', false);
          }
        }
      ),
    ),
    r3 = await runLimited(t3, 5);
  showTestResults(r3, { reCheck: () => checkRows(e3) });
  return r3;
}
async function refreshDeployingProxy(e3) {
  if (!e3.id) return false;
  try {
    let { code: t3, data: n2 } = await api.proxy.userGetProxyDetailMergedList({
      id: String(e3.id),
    });
    return t3 !== 0 || !n2
      ? false
      : (Object.assign(e3, n2, { id: e3.id }),
        !proxyDeploying(e3.orderStatus) && proxyIsReady(e3));
  } catch (e4) {
    return (
      console.error('[Profile:proxy-pick] refresh deploying proxy failed', e4),
      false
    );
  }
}
function bindWindow(e3) {
  selected.value &&
    e3.id != null &&
    !isCurrentProxy(e3) &&
    (bindings.value = {
      ...bindings.value,
      [e3.id]: { ...toRaw(selected.value) },
    });
}
function unbindWindow(e3) {
  if (e3.id == null || bindings.value[e3.id] == null) return;
  let t3 = { ...bindings.value };
  (delete t3[e3.id], (bindings.value = t3));
}
function hasBinding(e3) {
  return e3.id != null && bindings.value[e3.id] != null;
}
function hasWindowProxy(e3) {
  return !!e3 && e3.proxyCategory !== 'noproxy';
}
function isCurrentProxy(e3) {
  let t3 = selected.value?.id;
  if (t3 == null || Number(t3) === 0) return false;
  let n2 = e3.moduleId;
  return n2 == null || Number(n2) === 0 ? false : Number(n2) === Number(t3);
}
function formatWindowCode(t3) {
  let n2 = t3.windowSortNum == null ? '' : String(t3.windowSortNum),
    r3 = String(t3.maxWindowSort || 0).length,
    i3 = r3 > n2.length ? n2.padStart(r3, '0') : n2;
  return props.workspaceName ? `${props.workspaceName}-${i3}` : i3;
}
function formatWindowName(e3) {
  return (
    (typeof e3.windowName == 'string' ? e3.windowName.trim() : '') ||
    $t('未命名窗口')
  );
}
function proxyLocation(e3) {
  if (!e3 || e3.proxyCategory === 'noproxy') return null;
  let t3 = typeof e3.lastCountry == 'string' ? e3.lastCountry.trim() : '';
  return {
    country: t3,
    label: [t3, typeof e3.lastCity == 'string' ? e3.lastCity.trim() : '']
      .filter(Boolean)
      .join('/'),
  };
}
let windowRows = computed(() =>
  props.windows.flatMap((e3) => {
    let t3 = hasWindowProxy(e3);
    if (
      (windowFilter.value === 'bound' && !t3) ||
      (windowFilter.value === 'unbound' && t3)
    )
      return [];
    let n2 = hasBinding(e3);
    return [
      {
        id: e3.id,
        row: e3,
        bound: n2,
        bindDisabled: isCurrentProxy(e3),
        current: proxyLocation(e3),
        next: n2 ? proxyLocation(bindings.value[e3.id]) : null,
        code: formatWindowCode(e3),
        name: formatWindowName(e3),
      },
    ];
  }),
);
async function getUsableProxy(e3) {
  return proxyDeploying(e3.orderStatus)
    ? (await refreshDeployingProxy(e3))
      ? e3
      : undefined
    : e3;
}
async function submit() {
  if (!(saving.value || confirmDisabled.value)) {
    saving.value = true;
    try {
      if (batch.value) {
        let t3 = [],
          n3 = false;
        for (let r4 of props.windows) {
          let e3 = r4.id == null ? undefined : bindings.value[r4.id];
          if (!e3) continue;
          let i4 = await getUsableProxy(e3);
          i4 ? t3.push({ window: r4, proxy: i4 }) : (n3 = true);
        }
        if (
          (n3 &&
            notify(
              0,
              $t(
                '当前代理 IP 还在部署中，暂时无法使用。建议更换其它可用的代理 IP 或稍后重新测试当前代理 IP。',
              ),
            ),
          !t3.length)
        )
          return;
        await props.onConfirm?.(t3);
        return;
      }
      let n2 = selected.value;
      if (!n2) return;
      let r3 = await getUsableProxy(n2);
      if (!r3) {
        notify(
          0,
          $t(
            '当前代理 IP 还在部署中，暂时无法使用。建议更换其它可用的代理 IP 或稍后重新测试当前代理 IP。',
          ),
        );
        return;
      }
      let { loadingOperationMap: i3, _disabled: a2, ...o3 } = toRaw(r3);
      await props.onConfirm(o3);
    } finally {
      saving.value = false;
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full px-4 py-4 gap-3 min-h-0">
    <Alert
      v-if="batch"
      class="!w-full shrink-0"
      type="info"
      :closable="false"
      :title="
        $t(
          '一个窗口只能绑定一个代理 IP，一个代理 IP 可以绑定多个窗口。请先在左侧选择代理 IP，再点击窗口旁的绑定，最后确认。',
        )
      "
    />
    <div class="flex flex-1 gap-4 min-h-0">
      <section
        class="flex flex-col flex-1 min-w-0 min-h-0 gap-2"
        :class="{ 'border-r border-[var(--colors-border-divider)]': batch }"
      >
        <div class="flex flex-col gap-2 shrink-0">
          <div v-if="batch" class="flex items-center gap-2">
            <span
              class="flex items-center justify-center size-5 rounded-full bg-[var(--colors-background-bg-brand)] text-white text-3 font-600"
              >1</span
            >
            <span class="text-3.5 font-600 leading-4.5">{{
              $t('选择代理 IP')
            }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 items-center justify-between">
            <div class="flex items-center gap-1.5 flex-wrap">
              <Search
                :options="searchOptions"
                :search="search"
                :clear="search"
              />
              <SelectButton
                v-for="filter in proxyFilters.list"
                :key="filter.name"
                v-model="filter.value"
                :options="filter.options"
                size="sm"
                option-label="name"
                option-value="value"
                data-key="value"
                @change="proxyFilters.onChange"
              />
              <Filters
                :enabled-filter-save="false"
                :filters-menu="filters"
                @filter-change="filterChanged"
              />
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <Button
                outlined
                severity="secondary"
                size="xxs"
                icon="base/rx_ic_speed_test"
                :label="$t('测试全部')"
                @click.stop="checkAll"
              />
              <RefreshButton :loading="refreshing" @click="refresh" />
            </div>
          </div>
        </div>
        <div class="flex-ovh-1">
          <Table
            ref="agent"
            v-model:selection="selected"
            v-model:columns="columns"
            cache-key="proxy-pick-drawer"
            :table-request="loadRows"
            selection-mode="single"
            :clear-selection-on-request="false"
            :show-display="false"
            :show-gridlines="false"
            :context-menu="false"
            :multiple-operation="false"
            :show-actions="false"
            :show-table-header="false"
            :virtual-scroller-options="{ itemSize: 60 }"
          >
            <template #table-empty
              ><EmptyState
                icon="rx_illustration_star.svg"
                :title="$t('暂无代理 IP')"
            /></template>
            <template #outbound="{ data: row }">
              <OutboundLocation
                class="select-none"
                :country="row.lastCountry"
                :city="row.lastCity"
                :last-ip="row.lastIp"
                :time="row.checkTime"
                :status="statuses[row.id]"
                :badge-desc="row.badgeTypeDesc"
                :is-loading="row.loadingOperationMap?.test"
                :expire-status="row.proxyExpireStatus"
              />
            </template>
            <template #expireDate="{ data: row }"
              ><Expiration :data="row"
            /></template>
            <template #bandwidth="{ data: row }"
              ><Bandwidth :data="row"
            /></template>
            <template #bindList="{ data: row }"
              ><BoundWindows :list="listBoundWindows(row)"
            /></template>
          </Table>
        </div>
      </section>
      <section
        v-if="batch"
        class="flex flex-col w-120 shrink-0 min-w-0 min-h-0 gap-2"
      >
        <div class="flex flex-col gap-2 shrink-0">
          <div class="flex items-center gap-2">
            <span
              class="flex items-center justify-center size-5 rounded-full bg-[var(--colors-background-bg-brand)] text-white text-3 font-600"
              >2</span
            >
            <span class="text-3.5 font-600 leading-4.5">{{
              $t('绑定到窗口')
            }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 items-center">
            <SelectButton
              v-model="windowFilter"
              :options="windowOptions"
              size="sm"
              option-label="name"
              option-value="value"
              data-key="value"
            />
          </div>
        </div>
        <div class="flex-ovh-1">
          <Table
            :columns="windowColumns"
            :data-list="windowRows"
            :immediate="false"
            :paginator="false"
            :show-table-header="false"
            :show-display="false"
            :show-actions-menu="false"
            :context-menu="false"
            :multiple-operation="false"
          >
            <template #windowName="{ data: row }">
              <div class="flex h-full flex-col justify-center min-w-0">
                <div class="text-3 font-600 leading-4 truncate">
                  {{ row.code }}
                </div>
                <div class="text-3 tt-tertiary leading-4 truncate">
                  {{ row.name }}
                </div>
              </div>
            </template>
            <template #proxyIp="{ data: row }">
              <div class="flex h-full items-center gap-1.5 min-w-0">
                <template
                  v-for="(location, side) in [
                    row.current,
                    ...(row.bound ? [row.next] : []),
                  ]"
                  :key="side"
                >
                  <Icon
                    v-if="side"
                    class="shrink-0"
                    name="base/rx_ic_play"
                    size="10"
                    color="var(--colors-icon-icon-brand)"
                  />
                  <div
                    v-if="location?.country"
                    class="inline-flex items-center gap-1 min-w-0"
                  >
                    <div
                      class="size-4 shrink-0 overflow-hidden rounded-full border-0.5 border-[var(--colors-border-border-subtle)]"
                    >
                      <Icon
                        class="block"
                        size="16"
                        fallback="base/rx_ic_earth"
                        :name="`country-code/${location.country}`"
                      />
                    </div>
                    <span class="truncate text-3 font-500">{{
                      location.label
                    }}</span>
                  </div>
                  <div
                    v-else-if="location || side"
                    class="inline-flex items-center gap-1 min-w-0"
                  >
                    <Icon
                      class="shrink-0"
                      name="base/rx_ic_earth"
                      size="16"
                      color="var(--colors-icon-icon-tertiary)"
                    />
                    <span
                      class="truncate text-3"
                      :class="location?.label ? 'font-500' : 'tt-tertiary'"
                      >{{ location?.label || '--' }}</span
                    >
                  </div>
                  <span v-else class="tt-tertiary text-3">--</span>
                </template>
              </div>
            </template>
            <template #actions="{ data: row }">
              <Button
                v-if="row.bound"
                outlined
                severity="secondary"
                size="xxs"
                :label="$t('解绑')"
                @click="unbindWindow(row.row)"
              />
              <Button
                v-else
                outlined
                size="xxs"
                :label="$t('绑定')"
                :disabled="!selected || row.bindDisabled"
                @click="bindWindow(row.row)"
              />
            </template>
          </Table>
        </div>
      </section>
    </div>
    <div
      class="flex items-center justify-between gap-3 shrink-0 border-t border-[var(--colors-border-divider)]"
    >
      <div v-if="batch" class="text-3 tt-secondary">
        {{
          $t(
            '已配置 {configured}/{total} 个窗口；未配置的窗口将保留原代理 IP。',
            { configured: bindingCount, total: windows.length },
          )
        }}
      </div>
      <div v-else></div>
      <Button
        :label="$t('确认')"
        :disabled="confirmDisabled"
        :loading="saving"
        @click="submit"
      />
    </div>
  </div>
</template>
