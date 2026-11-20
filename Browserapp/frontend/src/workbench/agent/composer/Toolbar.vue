<script setup>
import { computed } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { M as useApproval } from './CreateTemplateDialog-Bpq9OLTG.js';

const emit = defineEmits(['select']);
const { accessMode, fullAccess } = useApproval();
const modes = computed(() => [
  { value: 'ask', icon: 'roxy-agent/rx-ic-ask', label: $t('请求批准'), description: $t('执行不可逆操作前，均需获得您的确认') },
  { value: 'full', icon: 'roxy-agent/rx-ic-allow', label: $t('完全访问权限'), description: $t('无需确认直接执行所有操作') },
]);
const active = computed(() => modes.value.find(mode => mode.value === accessMode.value) ?? modes.value[0]);
function choose(value, close) {
  accessMode.value = value;
  close();
}
</script>

<template>
  <div class="composer-toolbar">
    <Tooltip :content="$t('点击选择窗口，也可输入 “{at}” 选择', { at: '@' })" placement="top" :offset="8">
      <button data-agent-select-window data-composer-suggestion-trigger class="toolbar-action" type="button" aria-label="Select window" @click="emit('select', '@')">
        <Icon class="toolbar-action__icon" name="roxy-agent/rx-ic-at" size="16" color="currentColor" /><span>{{ $t('选窗口') }}</span>
      </button>
    </Tooltip>
    <Tooltip :content="$t('点击选择任务模板，也可输入 “/” 选择')" placement="top" :offset="8">
      <button data-agent-select-template data-composer-suggestion-trigger class="toolbar-action" type="button" aria-label="Call skills" @click="emit('select', '/')">
        <Icon class="toolbar-action__icon" name="roxy-agent/rx-ic-slash" size="16" color="currentColor" /><span>{{ $t('选模板') }}</span>
      </button>
    </Tooltip>
    <Tooltip :content="$t('点击上传文件，也可直接拖拽上传')" placement="top" :offset="8">
      <button class="toolbar-action" type="button" aria-label="Attach file" @click="emit('select', 'attach')">
        <Icon class="toolbar-action__icon" name="roxy-agent/rx-ic-attachment" size="16" color="currentColor" /><span>{{ $t('传文件') }}</span>
      </button>
    </Tooltip>
    <Tooltip trigger="click" placement="top-start" :offset="12" :show-arrow="false" content-class="approval-popover">
      <template #content="{ close }">
        <div class="approval-popover__header">{{ $t('选择 Agent 的操作权限：批准后执行，或无需确认直接执行。') }}</div>
        <div class="approval-popover__body">
          <button v-for="mode in modes" :key="mode.value" type="button" class="approval-option"
            :class="{ 'approval-option--selected': mode.value === accessMode }" @click="choose(mode.value, close)">
            <div class="approval-option__main">
              <Icon :name="mode.icon" size="18" color="currentColor" class="approval-option__icon" />
              <div class="approval-option__text"><span class="approval-option__title">{{ mode.label }}</span><span class="approval-option__desc">{{ mode.description }}</span></div>
            </div>
            <Icon v-if="mode.value === accessMode" name="base/rx_ic_check" size="16" color="currentColor" />
          </button>
        </div>
      </template>
      <button class="approval-mode" :class="{ 'approval-mode--full': fullAccess }" type="button" :aria-label="active.label">
        <Icon class="toolbar-action__icon" :name="active.icon" size="16" color="currentColor" /><span class="approval-mode__label">{{ active.label }}</span>
      </button>
    </Tooltip>
  </div>
</template>
