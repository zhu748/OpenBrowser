<script setup>
import { o as usePrimeVue, t as PrimeToast } from './toast-CjMybmc4.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { DynamicDialog, ConfirmPopup } from './workbench-prime-dialogs.js';
import { K as ConfirmDialog } from './hook-CnJE4hRq.js';
import { t as WorkbenchToast } from './rx-toast-headless-D9U8AboF.js';

const { config } = usePrimeVue();
if (config.locale) {
  config.locale.selectionMessage = translate('已选择{count}项', { count: '{0}' });
  config.locale.emptyMessage = translate('暂无数据');
}
</script>

<template>
  <PrimeToast group="tr" />
  <ConfirmPopup group="popup" />
  <WorkbenchToast />
  <ConfirmDialog />
  <DynamicDialog />
</template>
