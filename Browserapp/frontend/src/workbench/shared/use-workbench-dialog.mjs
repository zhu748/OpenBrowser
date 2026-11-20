import { getCurrentInstance, h, mergeProps, ref } from './workbench-vue.js';
import { a as render } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { r as events } from './rich-html-link-VdBpR3Cm.js';
import { t as Dialog } from './dialog-CrBr3eoy.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

const dialogs = new Map();
function useWorkbenchDialog() {
  const appContext = getCurrentInstance()?.appContext;
  function show(options) {
    const key = options.uniqueKey || options.header || '';
    if (key && dialogs.has(key)) return dialogs.get(key);
    const container = document.createElement('div');
    const dialogRef = ref(null);
    const visible = ref(false);
    const { handleCancel: onCancel, handleOk: onOk, okText, cancelText, slots, okProps, beforeClose,
      noAutoClose: _noAutoClose, uniqueKey: _key, ...attributes } = options;
    let closing = false;
    let saving = false;
    function hide() {
      visible.value = false;
      if (key) dialogs.delete(key);
      events.off('kickedOut', kickedOut);
    }
    async function requestClose(after) {
      if (closing || !visible.value) return false;
      closing = true;
      try {
        if (await beforeClose?.() === false) return false;
        hide();
        await after?.();
        return true;
      } finally {
        closing = false;
      }
    }
    function kickedOut() { setTimeout(() => requestClose(), 500); }
    function handleCancel() { return requestClose(onCancel); }
    async function handleOk() {
      if (saving) return;
      saving = true;
      try {
        if (await onOk?.() !== false) hide();
      } catch (error) {
        if (!(error instanceof Error && error.message === 'invalid')) throw error;
      } finally {
        saving = false;
      }
    }
    const controls = { dialogRef, hideModal: () => requestClose(), handleOk, handleCancel };
    const footer = () => h('div', { class: 'flex justify-end gap-2' }, [
      cancelText === '' ? null : h(Button, { type: 'button', label: cancelText || $t('取消'), outlined: true, severity: 'secondary', onClick: handleCancel }),
      h(Button, mergeProps({ type: 'button', label: okText || $t('保存') }, okProps, { onClick: handleOk })),
    ]);
    const content = { footer, ...Object.fromEntries(Object.entries(slots ?? {}).map(([name, slot]) => [name,
      typeof slot === 'function' ? (...args) => slot(controls, ...args) : slot,
    ])) };
    const root = h(() => h(Dialog, {
      ref: dialogRef, draggable: false, ...attributes, visible: visible.value, modal: true,
      'onUpdate:visible': value => { if (value) visible.value = true; else return handleCancel(); },
      'onAfter-hide': () => { render(null, container); container.remove(); },
    }, content));
    root.appContext = appContext;
    render(root, container);
    if (key) dialogs.set(key, controls);
    events.on('kickedOut', kickedOut);
    visible.value = true;
    return controls;
  }
  return [show];
}

export { useWorkbenchDialog as t };
