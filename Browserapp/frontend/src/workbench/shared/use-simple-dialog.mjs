import { h } from './workbench-vue.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import SimpleDialog from './workbench-simple-dialog.js';

function useSimpleDialog() {
  const [open] = useDialog();
  function showSimpleDialog({ onHide, slots, ...props }) {
    open({
      showHeader: false, modal: true, blockScroll: true,
      slots: { container: ({ handleCancel }) => h(SimpleDialog, { ...props, onClose: handleCancel }, slots) },
      handleCancel: onHide,
    });
  }
  return { showSimpleDialog };
}

export { useSimpleDialog as t };
