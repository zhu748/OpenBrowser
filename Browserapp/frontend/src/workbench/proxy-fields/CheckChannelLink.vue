<script setup>
import { computed } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
const props = defineProps({ option: Object });
const link = computed(() => {
  if (!props.option?.external || !props.option.value) return '';
  try {
    const { origin, protocol } = new URL(props.option.value);
    return protocol === 'https:' || protocol === 'http:' ? origin : '';
  } catch {
    return '';
  }
});
</script>

<template>
  <a v-if="link" :href="link" target="_blank" rel="noopener" class="mx-auto mr-0 flex items-center gap-1" @mousedown.stop @click.stop>
    <span class="text-3 leading-none">{{ $t('官网') }}</span><Icon name="base/rx_ic_outlink" size="14" />
  </a>
</template>
