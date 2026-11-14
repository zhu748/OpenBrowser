import {St as e,d as t} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {i as r} from "./agent-BmSFI9WH.js";
var y = r("local-proxy-picker", () => {
  const items = e([]), loading = e(!1);
  async function fetchList() {
    loading.value = !0;
    try {
      items.value = (await globalThis.__localApi.proxy.userGetProxyListMergedList({ page_size: 5e3 })).data.rows;
    } finally {
      loading.value = !1;
    }
  }
  const findById = (id) => items.value.find((row) => String(row.id) === String(id));
  return { items, pickerItems: items, pickerLoading: loading, loading, total: t(() => items.value.length), usableItems: items, fetchList, fetchPickerList: fetchList, findById, ensureById: async (id) => (await fetchList(), findById(id)), pickRandom: async () => (await fetchList(), items.value[Math.floor(Math.random() * items.value.length)]), remove: async (ids) => (await globalThis.__localApi.proxy.userDelProxyModuleV2Create({ ids }), await fetchList(), !0), updateRemark: async (row, remark) => (await globalThis.__localApi.proxy.userMdfProxyModuleCreate({ ...row, remark }), await fetchList(), !0) };
});
export {y as n};