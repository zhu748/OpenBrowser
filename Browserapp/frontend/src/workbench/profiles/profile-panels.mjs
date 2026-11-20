import ProfileBasics from './workbench-profile-basics.js';
import FingerprintOverview from './workbench-profile-fingerprint-overview.js';

const basicFields = ['windowName', 'proxyInfoList', 'windowPlatformList', 'cookie'];

function settingsPanels(values, basic) {
  return [{
    ...basic,
    title: $t('基础设置'),
    tooltip: $t('系统已提供默认配置，无需修改即可创建；如需调整系统、内核、语言、时区、窗口大小等，可展开修改。'),
    value: values[0],
    placement: 'accordion',
  }, {
    title: $t('高级指纹设置'),
    tooltip: $t('系统已自动配置，一般无需修改；如需调整分辨率、WebRTC、WebGL、Canvas、设备等指纹参数，可展开修改。'),
    value: values[1],
    groupIndex: 2,
    placement: 'accordion',
  }, {
    title: $t('偏好设置'),
    tooltip: $t('系统已提供默认配置；如需调整书签与数据同步、启动行为、网络规则等，可展开修改,'),
    value: values[2],
    groupIndex: 3,
    placement: 'accordion',
  }];
}

function createEditorPanels() {
  return { value: [], panels: settingsPanels(['basic', 'high', 'other'],
    { groupIndex: 0, extraGroupIndexes: [1], variant: 'window', excludedFields: [...basicFields] }) };
}
function createSimplePanels() {
  return { value: [], panels: [{ value: 'window', groupIndex: 0, placement: 'outside', variant: 'window' },
    ...settingsPanels(['0', '1', '2'], { groupIndex: 1 })] };
}

export { ProfileBasics as i, createEditorPanels as n, FingerprintOverview as r, createSimplePanels as t };
