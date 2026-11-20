<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { t as StatusBadge } from './TaskStatusBadge-fl9VE7c_.js';

const props = defineProps({ group: { type: Object, required: true } });
const emit = defineEmits(['toggle']);
const title = ref(null);
const clipped = ref(false);
let observer;
function measure() {
  const element = title.value;
  clipped.value = Boolean(element && element.scrollWidth > element.clientWidth + 1);
}
watch(() => props.group.title, () => nextTick(measure), { flush: 'post' });
onMounted(() => {
  if (title.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(title.value);
  }
  measure();
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section class="task-group" :class="{ expanded: group.expanded, idle: group.kind === 'idle' }">
    <Tooltip :content="group.title" :disabled="!clipped" content-class="task-group-title-tooltip" placement="top-start">
      <button class="task-group-trigger" type="button" @click="emit('toggle', group.id)">
        <div class="group-copy">
          <Icon name="roxy-agent/rx-ic-browser-control" class="group-icon" size="20" color="var(--color-text-primary)" />
          <div class="group-copy__text"><div ref="title" class="group-title">{{ group.kind === 'idle' ? $t('空闲中') : group.title }}</div></div>
        </div>
        <Icon :name="group.expanded ? 'base/rx_ic_chevron_down' : 'base/rx_ic_chevron_right'" class="chevron" size="16" />
      </button>
    </Tooltip>
    <div v-if="group.expanded" class="task-list">
      <article v-for="task in group.tasks" :key="task.id" class="task-card">
        <div class="task-account">
          <Icon :name="task.countryCode ? 'country-code/' + task.countryCode : 'roxy-agent/rx-ic-browser-control'" fallback="base/rx_ic_earth" class="task-flag" size="16" />
          <div class="task-user-info">
            <span class="task-name">{{ task.windowName || task.name }}</span>
            <span v-if="task.platformUserName" class="task-separator">·</span><span v-if="task.platformUserName" class="task-platform-user">{{ task.platformUserName }}</span>
          </div>
        </div>
        <div v-if="task.events?.length" class="task-current" :title="task.subtitle">{{ task.subtitle }}</div>
        <StatusBadge :status="task.status" />
      </article>
    </div>
  </section>
</template>
