<script setup>
import { onMounted, ref } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { t as Dialog } from './base-dialog-Bet1oNF8.js';
import SyncWindowTable from './window-list-C-MAmr_C.js';

const primary = ref();
const desktop = globalThis.electronAPI;
onMounted(async () => {
  try { primary.value = await desktop.send('syncControl:getMainControlDirId'); }
  catch (error) { globalThis.__localUiError(error.message); }
});

function close() {
  return desktop.send('syncControl:closeSyncingWindowListDialog');
}
</script>

<template>
  <Dialog :header="translate('同步窗口列表')" @hide="close">
    <SyncWindowTable v-if="primary" show-type="syncing" :show-table-header="false" :main-control-window-dir-id="primary" />
  </Dialog>
</template>
