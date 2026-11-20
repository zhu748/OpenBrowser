<script setup>
import { computed } from './workbench-vue.js';
import { Ar as addSuffix, fr as formatTime } from './utils-BIWenCnY.js';
import { o as Check, s as Expiry } from './proxy-D7e36h-l.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Divider } from './divider-BXJIHZjP.js';

const props = defineProps({ country: { default: '' }, city: { default: '' }, lastIp: { default: '' }, time: { default: '' },
  status: { default: Check.none }, isLoading: Boolean, badgeDesc: {}, expireStatus: {} });
const expired = computed(() => props.expireStatus === Expiry.expired && !props.isLoading && props.status !== Check.failure);
const description = computed(() => {
  const foreground = 'var(--colors-text-text-primary)';
  const earth = 'base/rx_ic_earth';
  const normal = 'var(--colors-icon-icon-tertiary)';
  if (props.isLoading) return { icon: earth, title: $t('测试中...'), color: foreground, iconColor: normal };
  if (props.status === Check.failure) return { icon: earth, title: $t('测试失败'), color: 'var(--colors-text-text-error)', iconColor: 'var(--colors-icon-icon-error)' };
  const success = props.status === Check.success;
  return { icon: `country-code/${props.country}`, title: (props.country || '--') + addSuffix('/', props.city),
    color: success ? 'var(--colors-text-text-success)' : foreground, iconColor: success ? normal : 'var(--colors-icon-icon-note)' };
});
</script>

<template>
  <div class="flex gap-2 items-center min-w-50 leading-4">
    <div class="icon" :class="{ grayscale: expired }">
      <Icon class="block" :name="description.icon" fallback="base/rx_ic_earth" :color="description.iconColor" size="24" />
    </div>
    <div class="flex flex-col flex-1 gap-1">
      <div class="flex items-center gap-1.5" :style="{ color: description.color }">
        <span class="text-3 font-500">{{ description.title }}</span>
        <span v-if="badgeDesc" class="py-0.5 px-2 rounded-full direct">{{ badgeDesc }}</span>
      </div>
      <div class="flex items-center gap-1.5 tt-tertiary text-3">
        <span>{{ lastIp || '--' }}</span><Divider class="!ma-0" layout="vertical" /><span>{{ formatTime(time) }}</span>
      </div>
    </div>
  </div>
</template>
