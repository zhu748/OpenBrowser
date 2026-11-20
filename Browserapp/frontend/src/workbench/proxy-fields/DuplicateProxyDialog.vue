<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Table } from './table-BJcS2I0Z.js';

defineProps({ title: {}, labels: Object, columns: Array, dataList: Array, isAllExist: Boolean, okText: {}, saving: Boolean });
const emit = defineEmits(['close', 'cancel', 'confirm']);
const regions = { header: false, paginator: false, actions: false };
</script>

<template>
  <div class="duplicate-proxies-modal !w-[960px] flex flex-col gap-6 pa-6 pt-4 rounded-2">
    <div class="duplicate-proxies-modal__header h-9 flex items-center justify-between">
      <div class="text-4 font-600 leading-normal text-[var(--colors-text-text-primary)]">{{ title }}</div>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" color="var(--colors-icon-icon-secondary)" @click="emit('close')" />
    </div>
    <div class="flex flex-col gap-6">
      <p class="text-[var(--colors-text-text-error)] text-14px font-400 leading-14px">{{ labels.duplicateDesc }}</p>
      <Table :columns="columns" :data-list="dataList" :regions="regions" />
      <div class="flex gap-10px justify-end">
        <Button v-if="!isAllExist" severity="secondary" outlined :label="$t('取消')" @click="emit('cancel')" />
        <Button :label="okText" :loading="saving" @click="emit('confirm')" />
      </div>
    </div>
  </div>
</template>
