<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import TaskGroup from './workbench-agent-task-group.js';

defineProps({ groups: { type: Array, required: true }, maxWidth: Number, minWidth: Number, monitorWidth: Number, runningCount: Number });
const emit = defineEmits(['close', 'resizeStart', 'resizeStep', 'toggleGroup']);
</script>

<template>
  <div class="task-monitor-shell">
    <div class="task-monitor-resize-handle" role="separator" aria-orientation="vertical" :aria-label="$t('调整窗口监控宽度')"
      :aria-valuemax="maxWidth" :aria-valuemin="minWidth" :aria-valuenow="monitorWidth" tabindex="0"
      @keydown.left.prevent="emit('resizeStep', 16)" @keydown.right.prevent="emit('resizeStep', -16)" @pointerdown="emit('resizeStart', $event)"></div>
    <aside class="task-monitor">
      <header class="monitor-header">
        <div class="monitor-copy"><h2>{{ $t('窗口监控') }}</h2></div>
        <button class="monitor-action" type="button" :title="$t('关闭窗口监控')" :aria-label="$t('关闭窗口监控')" @click="emit('close')">
          <Icon name="base/rx_ic_chevron_right" size="20" color="var(--color-text-primary)" />
        </button>
      </header>
      <div v-if="groups.length" class="task-groups">
        <TaskGroup v-for="group in groups" :key="group.id" :group="group" @toggle="emit('toggleGroup', $event)" />
      </div>
      <div v-else class="task-monitor__empty"><p>{{ $t('没有已打开的浏览器') }}</p></div>
    </aside>
  </div>
</template>
