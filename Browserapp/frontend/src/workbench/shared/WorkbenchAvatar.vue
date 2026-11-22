<script>
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
function avatarInitials(name) {
  if (name == null) return undefined;
  const letters = graphemes.segment(name)[Symbol.iterator]();
  const first = letters.next().value?.segment ?? '';
  const second = letters.next().value?.segment ?? '';
  return (first + second).toLocaleUpperCase();
}
</script>

<script setup>
import { computed } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Tooltip } from './rx-tooltip-CNCSEJGC.js';

const props = defineProps({
  list: Array, max: {}, size: { default: 32 }, fontSize: { default: 16 }, radius: { default: '50%' },
  gap: { default: -4 }, compact: Boolean, avatar: {}, name: {}, color: {}, more: Boolean, tooltip: {},
});
const avatars = computed(() => {
  const items = (props.list || [props]).filter(Boolean).map(item => ({
    ...item, initials: avatarInitials(item.name),
  }));
  if (!props.max || items.length <= props.max) return { displayed: items, hidden: [] };
  return {
    displayed: [...items.slice(0, props.max), { initials: '+' + (items.length - props.max), color: '#7ECCFC', more: true }],
    hidden: items.slice(props.max),
  };
});
const size = computed(() => ({
  width: props.size + 'px', height: props.size + 'px', lineHeight: props.size + 'px',
  fontSize: props.fontSize + 'px', borderRadius: props.radius,
}));
useCssVars(() => ({ v46d0db61: props.gap + 'px' }));
</script>

<template>
  <div class="relative flex items-center cursor-default">
    <template v-for="(item, index) in avatars.displayed" :key="item.name ?? index">
      <img v-if="item.avatar" v-tooltip.top="item.tooltip" draggable="false" class="_image_omazr_5" :style="size" :src="item.avatar" alt="" />
      <component :is="item.more ? Tooltip : 'div'" v-else class="_image_omazr_5 _text_omazr_13"
        :class="{ _compact_omazr_21: compact }" :style="{ ...size, backgroundColor: item.color }" placement="right">
        <div v-tooltip.top="item.tooltip">{{ item.initials }}</div>
        <template #content>
          <div class="flex flex-col gap-2 max-h-50 overflow-y-auto _scroll_omazr_1">
            <div v-for="(hidden, hiddenIndex) in avatars.hidden" :key="hiddenIndex" class="relative flex items-center gap-1.5 cursor-default">
              <img v-if="hidden.avatar" class="_image_omazr_5" :style="size" :src="hidden.avatar" alt="" />
              <div v-else class="_image_omazr_5 _text_omazr_13" :class="{ _compact_omazr_21: compact }"
                :style="{ ...size, backgroundColor: hidden.color }">{{ hidden.initials }}</div>
              <div class="text-3 leading-4 text-white">{{ hidden.name }}</div>
            </div>
          </div>
        </template>
      </component>
    </template>
    <slot />
  </div>
</template>
