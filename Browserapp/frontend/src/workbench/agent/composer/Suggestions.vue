<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch, Teleport } from 'vue';
import { t as align } from './dist-web-BSWtPfDO.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
import { n as motion } from './motion-BwnyBP9B.js';
import { t as AnimatePresence } from './AnimatePresence-d-29l3Fb.js';
import WindowPicker from './workbench-agent-window-picker.js';
import TemplatePicker from './workbench-agent-template-picker.js';

const props = defineProps({
  allSelected: Boolean, anchor: null, hasMore: Boolean, loadError: String, loadingMore: Boolean, projectOptions: Array,
  selectedCount: Number, selectedIds: Set, selectedProjectId: String, selectAllLoading: Boolean, state: { type: Object, required: true },
});
const emit = defineEmits(['cancel', 'choose', 'confirm', 'dismiss', 'hover', 'loadMore', 'navigate', 'projectChange', 'read', 'retry', 'search', 'toggleAll', 'toggleTop']);
const popover = ref(null);
const width = ref(800);
const maxHeight = ref(320);
const highlighted = computed(() => props.state.items[props.state.activeIndex]);
const hidden = { opacity: 0, y: 8, scale: 0.99 };
const visible = { opacity: 1, y: 0, scale: 1 };
const transition = { duration: 0.16, ease: [0.16, 1, 0.3, 1] };
let observer;
function position() {
  if (!props.state.open || !popover.value || !props.anchor) return;
  const anchor = props.anchor.getBoundingClientRect();
  width.value = anchor.width;
  maxHeight.value = Math.max(220, Math.min(420, anchor.top - 24));
  requestAnimationFrame(() => {
    if (!popover.value || !props.anchor) return;
    align(popover.value, props.anchor, { points: ['bl', 'tl'], offset: [0, -12], targetOffset: [0, 0],
      overflow: { adjustX: true, adjustY: false }, useCssTransform: true, ignoreShake: true });
  });
}
function schedulePosition() {
  nextTick(position);
}
function dismissOutside(event) {
  if (!props.state.open || event.composedPath().includes(popover.value)) return;
  if (event.target instanceof Element && event.target.closest('[data-composer-suggestion-trigger], .agent-select-overlay')) return;
  emit('dismiss');
}
watch(() => [props.state.open, props.state.kind, props.state.items.length, props.selectedCount, props.anchor], schedulePosition, { flush: 'post' });
watch(popover, element => {
  observer?.disconnect();
  if (!element || typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(position);
  observer.observe(element);
}, { flush: 'post' });
onMounted(() => {
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('scroll', schedulePosition, true);
  document.addEventListener('pointerdown', dismissOutside, true);
  document.addEventListener('focusin', dismissOutside, true);
  schedulePosition();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', schedulePosition);
  window.removeEventListener('scroll', schedulePosition, true);
  document.removeEventListener('pointerdown', dismissOutside, true);
  document.removeEventListener('focusin', dismissOutside, true);
  observer?.disconnect();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="state.open" ref="popover" class="agent-composer-suggestions" :class="'agent-composer-suggestions--' + state.kind"
      :style="{ width: width + 'px', maxHeight: maxHeight + 'px' }">
      <AnimatePresence mode="wait">
        <component :is="motion.div" :key="state.kind" class="agent-composer-suggestions__motion"
          :initial="hidden" :animate="visible" :exit="hidden" :transition="transition">
          <div v-if="state.loading && state.kind === 'slash'" class="slash-suggestion-skeleton" aria-busy="true" :aria-label="$t('加载中...')">
            <div class="slash-suggestion-skeleton__header" aria-hidden="true">
              <Skeleton width="100%" height="34px" border-radius="8px" /><Skeleton width="92px" height="34px" border-radius="10px" />
            </div>
            <div class="slash-suggestion-skeleton__list" aria-hidden="true">
              <div v-for="index in 5" :key="index" class="slash-suggestion-skeleton__row">
                <Skeleton width="16px" height="16px" border-radius="4px" /><Skeleton width="30%" height="16px" border-radius="4px" />
                <Skeleton width="42%" height="14px" border-radius="4px" /><Skeleton width="44px" height="16px" border-radius="4px" />
              </div>
            </div>
          </div>
          <div v-else-if="state.loading" class="suggestion-state">{{ $t('加载中...') }}</div>
          <WindowPicker v-else-if="state.kind === 'mention'" :active-item="highlighted" :all-selected="allSelected" :has-more="hasMore"
            :items="state.items" :load-error="loadError" :loading-more="loadingMore" :project-options="projectOptions" :query="state.query"
            :selected-count="selectedCount" :selected-ids="selectedIds" :selected-project-id="selectedProjectId" :select-all-loading="selectAllLoading"
            @cancel="emit('cancel')" @choose="emit('choose', $event)" @confirm="emit('confirm')" @hover="emit('hover', $event)"
            @load-more="emit('loadMore')" @project-change="emit('projectChange', $event)" @retry="emit('retry')"
            @search="emit('search', $event)" @toggle-all="emit('toggleAll')" />
          <TemplatePicker v-else-if="state.kind === 'slash'" :active-item="highlighted" :items="state.items" :query="state.query"
            @choose="emit('choose', $event)" @hover="emit('hover', $event)" @navigate="emit('navigate', $event)"
            @read="emit('read', $event)" @search="emit('search', $event)" @toggle-top="emit('toggleTop', $event)" />
          <div v-else-if="!state.items.length" class="suggestion-state">{{ $t('没有找到结果') }} "{{ state.query }}"</div>
        </component>
      </AnimatePresence>
    </div>
  </Teleport>
</template>
