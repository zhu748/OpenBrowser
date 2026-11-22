<script setup>
import { wt as useReturnLocation } from './utils-BIWenCnY.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineProps({ title: {}, showBack: Boolean, divider: { type: Boolean, default: true } });
const router = useRouter();
const { path, query } = useReturnLocation();
function back() {
  router.back();
  router.replace({ path, query });
}
</script>

<template>
  <div class="flex views-header" :class="{ divider }">
    <div class="flex items-center flex-1 gap-2.5">
      <button v-if="showBack" type="button" class="views-header-back" :aria-label="$t('返回')" @click="back">
        <Icon name="base/rx_ic_chevron_left" :size="24" aria-hidden="true" />
      </button>
      <slot name="title"><i18n-t :keypath="title || $route.meta.title" scope="global" /></slot>
      <slot name="title-after" />
    </div>
    <slot />
  </div>
</template>
