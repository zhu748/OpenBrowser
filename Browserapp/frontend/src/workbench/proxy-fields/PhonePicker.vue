<script setup>
import { computed, onBeforeMount, ref, useTemplateRef } from './workbench-vue.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as SearchInput } from './m-input-text-JVbCgVJP.js';
import { t as EmptyState } from './custom-empty-CChX4pJt.js';
import { t as useUi } from './ui-DTZutfuE.js';
import { t as normalizeId } from './id-Bjy_bMW8.js';
import { t as formatError } from './actionMessage-f0W4sNUi.js';
import { _ as displayName } from './phoneDisplay-DDMDXeMy.js';
import { t as Table } from './ry-table-B9vARMiu.js';
import { i as syncBindings, n as listPhones, t as listBoundPhones } from './relatedPhones-BgFrJS53.js';

const props = defineProps({ proxyId: {} });
const emit = defineEmits(['confirm', 'close']);
const [, showError] = useFeedback();
const ui = useUi();
const table = useTemplateRef('phoneSelect');
const selection = ref([]);
const previouslyBound = ref([]);
const search = ref('');
const filtering = ref(false);
const saving = ref(false);
const columns = computed(() => [
  { title: $t('名称'), key: 'name', slot: 'name', style: { minWidth: '160px' } },
  { title: $t('ID'), key: 'id', style: { minWidth: '100px' } },
  { title: $t('分组'), key: 'group', slot: 'group', style: { minWidth: '120px' } },
  { title: $t('备注'), key: 'remark', style: { minWidth: '140px' } },
]);
let interacted = false;
onBeforeMount(async () => {
  try {
    const proxyId = normalizeId(props.proxyId);
    previouslyBound.value = proxyId ? await listBoundPhones(proxyId) : [];
    if (!interacted) selection.value = [...previouslyBound.value];
  } catch (error) {
    showError(-1, formatError(error, $t('加载云手机列表失败')));
  }
});
async function load({ page_index, page_size }) {
  const serialName = search.value.trim();
  filtering.value = Boolean(serialName);
  try {
    const { items, total } = await listPhones({ page: Number(page_index) || 1, pageSize: Number(page_size) || 20, ...(serialName && { serialName }) });
    return { data: { rows: items, total } };
  } catch (error) {
    showError(-1, formatError(error, $t('加载云手机列表失败')));
    return { data: { rows: [], total: 0 } };
  }
}
const refresh = () => table.value?.refresh({}, true);
function setSelection(rows) {
  interacted = true;
  selection.value = rows;
}
async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    const { ok, errors } = await syncBindings({ proxyId: props.proxyId, selected: selection.value, previouslyBound: previouslyBound.value });
    if (!ok) {
      ui.toast(-1, formatError(errors[0], $t('代理 IP 绑定失败')));
      return;
    }
    ui.toast(0, $t('代理 IP 绑定已更新'));
    emit('confirm');
    emit('close');
  } catch (error) {
    ui.toast(-1, formatError(error, $t('代理 IP 绑定失败')));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="phone-select">
    <div class="phone-select__body">
      <SearchInput v-model="search" size="sm" pre-icon="base/rx_ic_magnify" :field-props="{ class: '!w-60 shrink-0' }"
        :placeholder="$t('搜索')" @pre-icon-click="refresh" @keyup.enter="refresh" />
      <div class="phone-select__table">
        <Table ref="phoneSelect" :columns="columns" :selection="selection" @update:selection="setSelection"
          cache-key="cloud-phone-proxy-phone-select" data-key="id" selection-mode="multiple" :clear-selection-on-request="false"
          :multiple-operation="false" :table-request="load" :show-table-header="false" :show-display="false" :show-reload="false"
          :show-actions="false" :context-menu="false" class="phone-select-table">
          <template #table-empty>
            <EmptyState icon="rx_illustration_filter.svg" :title="filtering ? $t('暂无查询结果') : $t('暂无云手机')"
              :desc="filtering ? $t('当前条件下没有匹配的结果，请尝试更换其他筛选条件。') : undefined" />
          </template>
          <template #name="{ data }"><span class="ellipsis-1">{{ displayName(data) }}</span></template>
          <template #group="{ data }"><span class="ellipsis-1">{{ data.group?.name || '--' }}</span></template>
        </Table>
      </div>
    </div>
    <div class="phone-select__footer">
      <Button size="md" severity="secondary" outlined :label="$t('取消')" @click.stop="emit('close')" />
      <Button size="md" :loading="saving" :label="$t('确认并保存')" @click.stop="save" />
    </div>
  </div>
</template>
