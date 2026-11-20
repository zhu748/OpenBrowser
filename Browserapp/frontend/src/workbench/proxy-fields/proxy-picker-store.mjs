import { computed, ref } from './workbench-vue.js';
import { i as defineStore } from './agent-BmSFI9WH.js';
import { h as api } from './utils-BIWenCnY.js';

const useProxyPickerStore = defineStore('local-proxy-picker', () => {
  const items = ref([]);
  const loading = ref(false);
  let currentRequest;
  function fetchList() {
    if (!currentRequest) {
      loading.value = true;
      currentRequest = api.proxy.userGetProxyListMergedList({ page_size: 5000 }).then(result => {
        if (result.code !== 0) throw Error(result.msg || $t('加载代理列表失败'));
        items.value = result.data.rows;
      }).finally(() => { currentRequest = undefined; loading.value = false; });
    }
    return currentRequest;
  }
  const findById = id => items.value.find(row => String(row.id) === String(id));
  async function ensureById(id) { await fetchList(); return findById(id); }
  async function pickRandom() { await fetchList(); return items.value[Math.floor(Math.random() * items.value.length)]; }
  async function refreshAfter(result) {
    if (result.code !== 0) throw Error(result.msg || $t('操作失败'));
    await currentRequest?.catch(() => {});
    await fetchList();
    return true;
  }
  return { items, pickerItems: items, pickerLoading: loading, loading, total: computed(() => items.value.length), usableItems: items,
    fetchList, fetchPickerList: fetchList, findById, ensureById, pickRandom,
    remove: async ids => refreshAfter(await api.proxy.userDelProxyModuleV2Create({ ids })),
    updateRemark: async (row, remark) => refreshAfter(await api.proxy.userMdfProxyModuleCreate({ ...row, remark })) };
});

export { useProxyPickerStore as n };
