import { nextTick, onBeforeMount, onBeforeUnmount, ref } from './workbench-vue.js';
import { pr as createGuide } from './utils-BIWenCnY.js';
import { r as events } from './rich-html-link-VdBpR3Cm.js';
import { i as highlight, t as clearHighlight } from './useDomSpotlight-CA279FOk.js';

export function useProfileLaunchGuide({ tableRef, enabled, onComplete }) {
  const driverObj = ref();
  function driverNext() {
    if (!driverObj.value) return;
    driverObj.value = undefined;
    events.emit('asideMenuGuide');
  }
  async function start() {
    await tableRef.value?.refresh({}, true);
    await nextTick();
    driverObj.value = createGuide({
      showProgress: false, disableActiveInteraction: false, allowClose: true, overlayClickBehavior: 'close',
      showButtons: ['close'], stagePadding: 0, popoverOffset: 20,
      onDestroyed() {
        clearHighlight();
        onComplete?.();
      },
      steps: [{
        element: '#OPEN_0',
        popover: { description: $t('点击「打开」以启动浏览器。'), side: 'right', align: 'center' },
        async onHighlightStarted() {
          await nextTick();
          requestAnimationFrame(() => highlight('#OPEN_0'));
        },
        onDeselected: clearHighlight,
      }],
    });
    driverObj.value.drive();
  }
  onBeforeMount(() => { if (enabled()) events.on('firstRegisterGuide', start); });
  onBeforeUnmount(() => events.off('firstRegisterGuide', start));
  return { driverObj, driverNext };
}
