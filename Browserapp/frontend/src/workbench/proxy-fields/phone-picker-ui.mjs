import { ref } from './workbench-vue.js';
import { i as defineStore, n as useFeedback } from './agent-BmSFI9WH.js';

const usePhonePickerUi = defineStore('cloud-phone-ui', () => {
  const [notify] = useFeedback();
  const modalOpen = ref(false);
  const modalOptions = ref({ title: '' });
  const modalBodyKey = ref('');
  const modalPayload = ref({});
  let onConfirm;

  function toast(status, message, options) {
    const props = typeof options === 'number' ? { life: options } : options;
    if (typeof message === 'string' && message.trim() && props?.summary == null) {
      const [summary, ...detail] = message.split('\n');
      notify(status, detail.join('\n').trim(), { ...props, summary });
    } else notify(status, message, props);
  }
  function openModal(key, options, payload = {}, confirm) {
    modalBodyKey.value = key;
    modalOptions.value = options;
    modalPayload.value = payload;
    onConfirm = confirm;
    modalOpen.value = true;
  }
  function closeModal() {
    modalOpen.value = false;
    modalBodyKey.value = '';
    onConfirm = undefined;
  }
  const bindModalOk = action => { onConfirm = action; };
  async function confirmModal() {
    if (onConfirm) await onConfirm();
    else closeModal();
  }
  return { toast, modalOpen, modalOptions, modalBodyKey, modalPayload, openModal, closeModal, confirmModal, bindModalOk };
});

export { usePhonePickerUi as t };
