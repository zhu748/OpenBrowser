function createNetworkIndicator({ ref, onMounted, request }) {
  const network = ref({ city: "\u516C\u7F51IP", ip: "--" }), loading = ref(!1);
  let pending;
  function refresh(cached = !1) {
    return pending || (loading.value = !0, pending = request("host:network", { probe: !0, cached }).then((value) => {
      if (!value.ip) throw Error("\u672A\u83B7\u53D6\u516C\u7F51\u51FA\u53E3 IP");
      network.value = { city: [value.country_code, value.city].filter(Boolean).join("/") || "\u516C\u7F51IP", ip: value.ip };
    }).catch(() => {
      network.value = { city: "\u516C\u7F51IP\u672A\u83B7\u53D6\uFF0C\u70B9\u51FB\u5237\u65B0", ip: "--" };
    }).finally(() => {
      loading.value = !1, pending = null;
    }), pending);
  }
  return onMounted(() => refresh(!0)), { network, loading, refresh: () => refresh(!1) };
}
export {createNetworkIndicator as createNetworkIndicator};