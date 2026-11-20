<script setup>
import { v as useUser } from './utils-BIWenCnY.js';
import { a as storeToRefs } from './agent-BmSFI9WH.js';
import { r as events } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';

const emit = defineEmits(['close']);
const { userConfig } = storeToRefs(useUser());
const labels = useProfileLabels();
function settings() {
  events.emit('openSettings', { settingsKey: 'preferences', anchorPoint: 'diskSettings' });
  emit('close');
}
</script>

<template>
  <div class="flex flex-col pa-6 pt-4 gap-4 select-none popup">
    <div class="relative flex items-center h-9">
      <span class="header">{{ $t('磁盘空间不足') }}</span>
      <Icon class="absolute right-0 cursor-pointer" size="20" name="base/rx_ic_delete"
        color="var(--colors-icon-icon-secondary)" @click="emit('close')" />
    </div>
    <i18n-t class="help" tag="div" :keypath="labels.cannotOpenDisk" scope="global">
      <template #bold><span class="help-bold">{{ userConfig.diskLimit }}GB</span></template>
    </i18n-t>
    <div class="flex justify-end gap-2">
      <Button outlined severity="secondary" size="md" :label="$t('取消')" @click="emit('close')" />
      <Button size="md" :label="$t('打开设置')" @click="settings" />
    </div>
  </div>
</template>
