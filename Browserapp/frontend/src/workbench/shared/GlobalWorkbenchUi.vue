<script setup>
import { o as usePrimeVue, t as PrimeToast } from './toast-CjMybmc4.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { DynamicDialog, ConfirmPopup } from './workbench-prime-dialogs.js';
import { K as ConfirmDialog } from './hook-CnJE4hRq.js';
import { t as WorkbenchToast } from './rx-toast-headless-D9U8AboF.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const { config } = usePrimeVue();
if (config.locale) {
  config.locale.selectionMessage = translate('已选择{count}项', { count: '{0}' });
  config.locale.emptyMessage = translate('暂无数据');
}
const dialogParts = { root: '_dialog_rcwb2_2' };
const checkboxParts = { root: 'items-center', box: '!w-4 !h-4' };
</script>

<template>
  <PrimeToast group="tr" />
  <ConfirmPopup group="popup" />
  <WorkbenchToast />
  <ConfirmDialog />
  <ConfirmDialog group="deleteConfirmDialog" :pt="dialogParts">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div :class="message.class">
        <span class="p-dialog-header"><span class="p-dialog-title">{{ message.header }}</span></span>
        <div class="p-dialog-content"><span class="p-confirmdialog-message">{{ message.message }}</span></div>
        <div class="p-dialog-footer">
          <div v-if="message.checkboxProps" class="flex flex-1 items-center">
            <Checkbox v-model="message.checkboxProps.value" :pt="checkboxParts" input-id="double" binary />
            <label for="double" class="text-3 select-none ma-1.5 cursor-pointer">{{ message.checkboxProps.label }}</label>
            <Icon v-if="message.checkboxProps.tooltip" v-tooltip="{ value: message.checkboxProps.tooltip, showDelay: 500, hideDelay: 300 }"
              name="base/rx_ic_info" :size="12" />
          </div>
          <Button outlined :label="$t('取消')" v-bind="message.rejectProps" @click="rejectCallback" />
          <Button severity="danger" v-bind="message.acceptProps" @click="acceptCallback" />
        </div>
      </div>
    </template>
  </ConfirmDialog>
  <DynamicDialog />
</template>
