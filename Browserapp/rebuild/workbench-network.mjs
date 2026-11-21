export function createNetworkIndicator({ ref, onMounted, request }) {
  const network = ref({ city: '公网IP', ip: '--' });
  const loading = ref(false);
  let pending;
  function refresh(cached = false) {
    if (pending) return pending;
    loading.value = true;
    pending = request('host:network', { probe: true, cached }).then(value => {
      if (!value.ip) throw Error('未获取公网出口 IP');
      network.value = { city: [value.country_code, value.city].filter(Boolean).join('/') || '公网IP', ip: value.ip,
        ...(value.routeLabel && { routeLabel: value.routeLabel }) };
    }).catch(() => {
      network.value = { city: '公网IP未获取，点击刷新', ip: '--' };
    }).finally(() => { loading.value = false; pending = null; });
    return pending;
  }
  onMounted(() => refresh(true));
  return { network, loading, refresh: () => refresh(false) };
}
