import { computed, inject, provide } from './workbench-vue.js';
import { kt as toValue } from './runtime-core.esm-bundler-CBj16o9G.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';
export { parseProxyAddress as a, proxyAddressFields as i } from './workbench-proxy-address.js';
export { default as r } from './workbench-proxy-remark.js';

const proxy = { entity: $t("代理 IP"),
  pageTitle: $t("添加代理 IP"),
  entityType: $t("代理 IP 类型"),
  entityInfo: $t("代理 IP 信息"),
  smartRecognize: $t("智能识别（支持动态/静态代理 IP）"),
  testAction: $t("测试代理 IP"),
  refreshAction: $t("刷新代理 IP"),
  duplicateTitleAll: $t("代理 IP 已存在"),
  duplicateTitlePartial: $t("部分代理 IP 已存在"),
  duplicateDesc: $t("以下代理 IP 已存在于当前代理 IP 存储库中，因此不会被添加。"),
  tutorialTitle: $t("代理 IP 教程"),
  tutorialDesc: $t("了解如何导入和配置代理 IP"),
  remarkTitle: $t("请为代理 IP 添加备注"),
  inputRequired: $t("请先输入代理 IP 信息"),
  inputPlaceholder: $t("请在此处输入代理 IP 信息"),
  duplicateTip: $t("当输入重复代理 IP 信息时不做添加"),
  importRules: $t("导入规则（支持动态/静态代理 IP）"),
  parsedTitle: $t("已解析代理 IP"),
  clearAction: $t("清空代理 IP"),
  clearHeader: $t("清空代理 IP"),
  clearMessage: $t("您确认清空所有代理 IP 吗?"),
  emptyList: $t("暂无代理 IP"),
  deleteFailHeader: $t("删除失败代理 IP"),
  protocolColumnTitle: $t("代理 IP 类型"),
  host: $t("代理 IP 主机"),
  port: $t("代理 IP 端口"),
  username: $t("代理 IP 用户名"),
  password: $t("代理 IP 密码"),
  usernamePlaceholder: $t("请输入代理 IP 账号"),
  passwordPlaceholder: $t("请输入代理 IP 密码"),
  refreshUrl: $t("刷新 URL"),
  refreshUrlPlaceholder: $t("动态代理 IP 专用，静态代理 IP 无需填写"),
  refreshUrlTooltip: $t("如代理 IP 服务商未提供刷新 URL，则无需配置。填写后可点击右侧刷新按钮请求更换当前出口 IP。"),
  ipDetect: $t("代理 IP 检测"),
  successRouteName: "agent-list",
  emptyTable: $t("暂未添加代理 IP"),
  batchHelpLine: $t("一行一个代理 IP，一次最多添加 500 个；") };
const device = { entity: $t("设备"),
  pageTitle: $t("添加设备"),
  entityType: $t("设备类型"),
  entityInfo: $t("设备信息"),
  smartRecognize: $t("智能识别（支持动态/静态设备）"),
  testAction: $t("测试设备"),
  refreshAction: $t("刷新设备"),
  duplicateTitleAll: $t("设备已存在"),
  duplicateTitlePartial: $t("部分设备已存在"),
  duplicateDesc: $t("以下设备已存在于当前设备库中，因此不会被添加。"),
  tutorialTitle: $t("设备教程"),
  tutorialDesc: $t("了解如何导入和配置设备"),
  remarkTitle: $t("请为设备添加备注"),
  inputRequired: $t("请先输入设备信息"),
  inputPlaceholder: $t("请在此处输入设备信息"),
  duplicateTip: $t("当输入重复设备信息时不做添加"),
  importRules: $t("导入规则（支持动态/静态设备）"),
  parsedTitle: $t("已解析设备"),
  clearAction: $t("清空设备"),
  clearHeader: $t("清空设备"),
  clearMessage: $t("您确认清空所有设备吗?"),
  emptyList: $t("暂无设备"),
  deleteFailHeader: $t("删除失败设备"),
  protocolColumnTitle: $t("设备类型"),
  host: $t("主机"),
  port: $t("端口"),
  username: $t("用户名"),
  password: $t("密码"),
  usernamePlaceholder: $t("请输入用户名"),
  passwordPlaceholder: $t("请输入密码"),
  refreshUrl: $t("刷新 URL"),
  refreshUrlPlaceholder: $t("请输入刷新 URL"),
  refreshUrlTooltip: $t("请在填写后点击图标进行测试。"),
  ipDetect: $t("IP 检测"),
  successRouteName: "ecommerce-device-list",
  emptyTable: $t("暂未添加设备"),
  batchHelpLine: $t("一行一个设备，一次最多添加 500 个；") };

const labelsKey = Symbol('proxyCreateLabels');
function getLabels(mode) {
  const isDevice = mode === 'device';
  return { mode, ...(isDevice ? device : proxy),
    formatMissSaveMessage: miss => $t(isDevice ? '第 [{miss}] 条设备缺少信息，将不会被保存。' : '第 [{miss}] 条代理 IP 缺少信息，将不会被保存。', { miss }),
    formatMissConfirmMessage: miss => $t(isDevice ? '第 [{miss}] 条设备缺少信息，将不会被保存，请确认是否继续' : '第 [{miss}] 条代理 IP 缺少信息，将不会被保存，请确认是否继续', { miss }),
    formatDeleteFailMessage: count => $t(isDevice ? '您确认删除所有测速失败的设备吗?共 {count} 个' : '您确认删除所有测速失败的代理 IP 吗?共 {count} 个', { count }),
    formatParseSuccess: (count, filterCount) => $t(isDevice ? '已解析 {count} 设备。{filterCount} 重复设备已过滤。' : '已解析 {count} 代理 IP。{filterCount} 重复代理 IP 已过滤。', { count, filterCount }),
  };
}
function useLabels(mode) {
  if (mode !== undefined) {
    const current = computed(() => getLabels(toValue(mode)));
    provide(labelsKey, current);
    return current;
  }
  const { isEcommerce } = useRouteContext();
  return inject(labelsKey, () => computed(() => getLabels(isEcommerce.value ? 'device' : 'proxy')), true);
}

export { useLabels as n, getLabels as t };
