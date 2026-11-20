import { computed, h } from './workbench-vue.js';
import { sn as useTutorialAssets, v as useConfig } from './utils-BIWenCnY.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import GuideDialog from './workbench-guide-dialog.js';

let pending = Promise.resolve();
function useOnboarding() {
  const [showDialog] = useDialog();
  const settings = useConfig();
  const { getVideoSource } = useTutorialAssets();
  const onboardingTaskStatus = computed(() => settings.userInfo.onboardingTaskStatus);
  function updateOnboardingTaskStatus(changes) {
    const task = pending.then(async () => {
      const saved = await globalThis.__localRequest('settings:get');
      const onboardingTaskStatus = { ...saved.onboardingTaskStatus, ...changes };
      await globalThis.__localRequest('settings:set', { onboardingTaskStatus });
      Object.assign(settings.userInfo, { onboardingTaskStatus });
    });
    pending = task.catch(() => {});
    return task;
  }
  function closeGuideTipsAndUpdateTaskStatus(key) {
    showDialog({
      showHeader: false, modal: true, blockScroll: true,
      handleCancel: () => updateOnboardingTaskStatus({ [key]: true }),
      slots: { container: ({ handleCancel }) => h(GuideDialog, {
        title: $t('教程提示'),
        desc: $t('当您对 Roxy浏览器的产品功能不熟悉或希望学习更多技巧时，可以随时通过右下方蓝色按钮找到"教程"入口。'),
        video: getVideoSource('tour-hide-guide.mp4'), onClose: handleCancel, onConfirm: handleCancel,
      }) },
    });
  }
  return { onboardingTaskStatus, updateOnboardingTaskStatus, closeGuideTipsAndUpdateTaskStatus };
}

export { GuideDialog as n, useOnboarding as t };
