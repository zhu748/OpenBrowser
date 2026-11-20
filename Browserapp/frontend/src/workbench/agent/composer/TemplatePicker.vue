<script setup>
import { onBeforeUnmount, watch, TransitionGroup } from 'vue';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

const props = defineProps({ activeItem: Object, items: { type: Array, required: true }, query: String });
const emit = defineEmits(['choose', 'hover', 'navigate', 'read', 'search', 'toggleTop']);
const router = useRouter();
let markReadTimer, hoveringId;
function stopMarking(id) {
  if (id && id !== hoveringId) return;
  clearTimeout(markReadTimer);
  hoveringId = undefined;
}
function hover(item) {
  emit('hover', item);
  stopMarking();
  if (!item.unread) return;
  hoveringId = item.id;
  markReadTimer = setTimeout(() => {
    hoveringId = undefined;
    emit('read', item);
  }, 300);
}
watch(() => props.items, items => {
  if (hoveringId && !items.some(item => item.id === hoveringId && item.unread)) stopMarking();
});
onBeforeUnmount(() => stopMarking());
function chooseActive(event) {
  if (event.isComposing || event.keyCode === 229) return;
  const item = props.activeItem ?? props.items[0];
  if (item) emit('choose', item);
}
function label(item) {
  const type = item.payload.templateType;
  if (type === 'skill' || type === 'skills') return 'Skill';
  return $t(type === 'script' ? '脚本' : type === 'prompt' ? '提示词' : '模板');
}
</script>

<template>
  <div class="slash-command-popover">
    <div class="slash-command-header">
      <label class="slash-command-search" @mousedown.stop>
        <Icon name="base/rx_ic_magnify" size="16" />
        <input :value="query" :placeholder="$t('搜索模板')" type="text" @input="emit('search', $event.target.value)"
          @keydown.down.prevent="emit('navigate', 'next')" @keydown.enter.prevent="chooseActive"
          @keydown.up.prevent="emit('navigate', 'previous')">
      </label>
      <button class="slash-command-more" type="button" @click="router.push({ name: 'agent-console-template-store' })" @mousedown.prevent.stop>
        <Icon name="roxy-agent/rx-ic-templates-store" size="18" /><span>{{ $t('更多模板') }}</span>
      </button>
    </div>
    <div class="slash-command-list">
      <TransitionGroup v-if="items.length" class="slash-command-items" name="slash-command-item" tag="div">
        <div v-for="item in items" :key="item.id" class="slash-command-item" :class="{ 'slash-command-item--active': activeItem?.id === item.id }"
          @mouseenter="hover(item)" @mouseleave="stopMarking(item.id)">
          <button class="slash-command-select" type="button" @mousedown.prevent="emit('choose', item)">
            <span class="slash-command-icon-wrap">
              <Icon class="slash-command-icon" :name="item.iconName" size="16" />
              <img v-if="item.unread" class="slash-command-unread" src="/images/agent-console/template-unread-dot.svg" alt="" aria-hidden="true">
            </span>
            <span class="slash-command-copy"><span class="slash-command-title">{{ item.title }}</span><span class="slash-command-desc">{{ item.description }}</span></span>
          </button>
          <button class="slash-command-top" :class="{ 'slash-command-top--active': item.isTopped }" type="button" :disabled="item.isTopping"
            :aria-label="$t(item.isTopped ? '取消置顶' : '置顶')" :aria-pressed="item.isTopped"
            @click.stop="emit('toggleTop', item)" @mousedown.prevent.stop>
            <Icon :name="item.isTopped ? 'base/rx_ic_pin_solid' : 'base/rx_ic_pin_line'" size="16" aria-hidden="true" />
          </button>
          <span class="slash-command-type">{{ label(item) }}</span>
        </div>
      </TransitionGroup>
      <div v-else class="slash-command-empty">{{ $t('没有找到模板') }}</div>
    </div>
  </div>
</template>
