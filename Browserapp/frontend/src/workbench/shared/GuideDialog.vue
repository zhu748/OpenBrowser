<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

defineProps({ title: {}, desc: [String, Function], video: {}, image: {} });
const emit = defineEmits(['close', 'confirm']);
</script>

<template>
  <div class="w-120 inline-flex flex-col pa-6 pt-4 gap-4">
    <div class="flex justify-between items-center">
      <span class="header">{{ title }}</span>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" color="var(--colors-icon-icon-secondary)" @click="emit('close')" />
    </div>
    <video v-if="video" class="block w-full rounded-md" autoplay muted loop playsinline><source :src="video" type="video/webm" /></video>
    <img v-if="image" class="block w-full rounded-md" :src="image" alt="" />
    <div class="flex flex-col gap-6">
      <div v-if="typeof desc === 'string'" class="_text_1futz_2">{{ desc }}</div>
      <component :is="desc" v-else class="_text_1futz_2" />
    </div>
    <Button class="self-end" size="md" :label="$t('了解')" @click="emit('confirm')" />
  </div>
</template>
