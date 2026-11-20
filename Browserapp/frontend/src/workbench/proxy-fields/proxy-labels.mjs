import { computed } from './workbench-vue.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';

function proxyLabels(isDevice) {
  return isDevice ? {
    entity: $t('设备'), entityTypeColumn: $t('设备类型'), entityInfoColumn: $t('设备信息'),
    concurrentTestingLabel: $t('个设备正在测试中'), testFailedCheckConfig: $t('设备检测失败，请检查设备配置'),
  } : {
    entity: $t('代理 IP'), entityTypeColumn: $t('代理 IP 类型'), entityInfoColumn: $t('代理 IP 信息'),
    concurrentTestingLabel: $t('个代理 IP 正在测试中'), testFailedCheckConfig: $t('代理 IP 检测失败，请检查代理 IP 配置'),
  };
}

function useProxyLabels() {
  const { isEcommerce } = useRouteContext();
  return computed(() => proxyLabels(isEcommerce.value));
}

export { useProxyLabels as n, proxyLabels as t };
