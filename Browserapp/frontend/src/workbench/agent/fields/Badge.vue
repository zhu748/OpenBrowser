<script setup>
import { computed } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

const props = defineProps({
  icon: String, label: String, type: { type: String, default: 'default' },
});
const byType = {
  skill: { icon: 'base/rx_ic_skills_store', label: 'Skill' },
  script: { icon: 'base/rx_ic_doc_code', label: 'Script' },
  prompt: { icon: 'base/rx_ic_template', label: 'Prompt' },
  window: { icon: 'base/rx_ic_browser', label: 'Window' },
};
const types = new Set(['default', 'open', 'scheduled', 'running', 'completed', ...Object.keys(byType)]);
const type = computed(() => types.has(props.type) ? props.type : 'default');
const status = computed(() => ['completed', 'default', 'running', 'scheduled'].includes(type.value));
const badgeIcon = computed(() => props.icon ?? byType[type.value]?.icon);
const badgeLabel = computed(() => props.label ?? byType[type.value]?.label ?? 'badge');
</script>

<template>
  <span class="agent-badge" :class="[`agent-badge--${type}`, { 'agent-badge--status': status }]">
    <span v-if="status" class="agent-badge__dot" aria-hidden="true"></span>
    <slot v-else name="icon">
      <Icon v-if="badgeIcon" class="agent-badge__icon" :name="badgeIcon" size="16" aria-hidden="true" />
    </slot>
    <span class="agent-badge__label"><slot>{{ badgeLabel }}</slot></span>
  </span>
</template>
