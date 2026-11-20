<script setup>
import { computed, useId } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import AgentTooltip from './workbench-agent-tooltip.js';
import { useProfileMonitor } from './workbench-profile-monitor-context.js';

defineProps({ variant: { type: String, default: 'pill' } });
const { open, available, runningTaskCount, toggle } = useProfileMonitor();
const visible = computed(() => available.value && !open.value);
const activityId = 'task-monitor-activity-' + useId().replace(/[^\w-]/g, '');
const activityStroke = 'url(#' + activityId + ')';
const iconColor = 'var(--color-fg-primary, var(--color-text-primary))';
const stops = [
  ['0%', '#1570ef'], ['18%', '#84caff'], ['38%', '#7a5af8'],
  ['60%', '#ee46bc'], ['78%', '#fcceee'], ['100%', '#1570ef'],
];
</script>

<template>
  <div v-if="visible" class="task-monitor-toggle"
    :class="[`task-monitor-toggle--${variant}`, { 'is-running': runningTaskCount > 0 }]">
    <AgentTooltip v-if="variant === 'icon'" :content="$t('窗口监控')" placement="bottom" :offset="8">
      <button type="button" class="task-monitor-toggle__button" :class="{ active: open }"
        :aria-label="$t('窗口监控')" @click.stop="toggle">
        <Icon name="roxy-agent/rx-ic-task-monitor" :color="iconColor" />
        <svg v-if="runningTaskCount > 0" class="task-monitor-toggle__activity" aria-hidden="true">
          <defs>
            <linearGradient :id="activityId" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
              <stop v-for="[offset, color] in stops" :key="offset" :offset="offset" :stop-color="color" />
              <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5"
                dur="2.4s" repeatCount="indefinite" />
            </linearGradient>
          </defs>
          <rect :stroke="activityStroke" class="task-monitor-toggle__activity-path" pathLength="100" />
        </svg>
      </button>
    </AgentTooltip>
    <button v-else type="button" class="task-monitor-toggle__button" :class="{ active: open }"
      :aria-label="$t('窗口监控')" @click.stop="toggle">
      <Icon name="roxy-agent/rx-ic-task-monitor" :color="iconColor" />
      <span>{{ $t('窗口监控') }}</span>
      <svg v-if="runningTaskCount > 0" class="task-monitor-toggle__activity" aria-hidden="true">
        <defs>
          <linearGradient :id="activityId" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
            <stop v-for="[offset, color] in stops" :key="offset" :offset="offset" :stop-color="color" />
            <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5"
              dur="2.4s" repeatCount="indefinite" />
          </linearGradient>
        </defs>
        <rect :stroke="activityStroke" class="task-monitor-toggle__activity-path" pathLength="100" />
      </svg>
    </button>
  </div>
</template>
