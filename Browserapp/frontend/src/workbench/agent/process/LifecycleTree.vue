<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { processTimelineRuntime } from './hook-CnJE4hRq.js';
import Collapse from './workbench-agent-collapse.js';
import EventList from './workbench-agent-process-event-list.js';

const props = defineProps({ event: { type: Object, required: true } });
const { splitProcessSteps } = processTimelineRuntime;
const expanded = ref(props.event.expanded === true);
const body = ref(null);
const content = ref(null);
const scroll = reactive({ scrollable: false, canScrollUp: false, canScrollDown: false });
const hasDetails = computed(() => Boolean(props.event.events.length || props.event.children.length || props.event.report || props.event.error));
const sections = computed(() => splitProcessSteps(props.event.events, props.event.agentPath));
const lastEventSection = computed(() => sections.value.filter(section => section.type === 'events').at(-1)?.id);
const running = computed(() => ['starting', 'running'].includes(props.event.lifecycleStatus));
const label = computed(() => {
  const params = { name: props.event.agentName };
  switch (props.event.lifecycleStatus) {
    case 'completed': return $t('已创建智能体 {name}', params);
    case 'failed': return $t('创建智能体 {name} 失败', params);
    case 'cancelled': return $t('创建智能体 {name} 已取消', params);
    default: return $t('创建智能体 {name}', params);
  }
});
let observer;
function measure() {
  const element = body.value;
  if (!element) return;
  const limit = element.scrollHeight - element.clientHeight;
  scroll.scrollable = limit > 1;
  scroll.canScrollUp = scroll.scrollable && element.scrollTop > 1;
  scroll.canScrollDown = scroll.scrollable && element.scrollTop < limit - 1;
}
watch([body, content], () => {
  observer?.disconnect();
  const targets = [body.value, content.value].filter(Boolean);
  if (targets.length && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    for (const element of targets) observer.observe(element);
  }
  measure();
}, { flush: 'post' });
watch(() => props.event.renderRevision, async (revision, previous) => {
  await nextTick();
  if (expanded.value && previous !== undefined && revision !== previous && body.value) body.value.scrollTop = body.value.scrollHeight;
  measure();
}, { flush: 'post' });
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section class="agent-node">
    <button class="agent-node__header" type="button" :disabled="!hasDetails" @click="expanded = !expanded">
      <Icon name="roxy-agent/rx-ic-tool" size="16" />
      <span class="agent-node__identity"><strong>{{ label }}</strong></span>
      <Icon v-if="hasDetails" name="base/rx_ic_chevron_down" size="12" :class="{ collapsed: !expanded }" />
    </button>
    <Collapse :expanded="expanded && hasDetails">
      <div ref="body" class="agent-node__body" :class="{ 'agent-node__body--scrollable': scroll.scrollable,
        'scroll-mask--top': scroll.canScrollUp, 'scroll-mask--bottom': scroll.canScrollDown }"
        style="--agent-group-max-height: 308px" @scroll.passive="measure">
        <div ref="content" class="agent-node__content">
          <template v-for="section in sections" :key="section.id">
            <EventList v-if="section.type === 'events'" :events="section.events" :running="running && section.id === lastEventSection" :scope="section.id" compact />
            <LifecycleTree v-else :event="section.event" />
          </template>
          <p v-if="event.error" class="agent-node__result agent-node__result--error">{{ event.error }}</p>
          <p v-else-if="event.report && !event.events.length" class="agent-node__result">{{ event.report }}</p>
          <div v-if="event.children.length" class="agent-node__children">
            <LifecycleTree v-for="child in event.children" :key="child.agentPath" :event="child" />
          </div>
        </div>
      </div>
    </Collapse>
  </section>
</template>
