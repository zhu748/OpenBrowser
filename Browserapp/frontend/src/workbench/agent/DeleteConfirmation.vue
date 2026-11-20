<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { agentConfirmDialog as ConfirmDialog } from './hook-CnJE4hRq.js';
</script>

<template>
  <ConfirmDialog group="agentConsoleDeleteConfirmDialog" :pt="{ root: 'agent-console-delete-confirm-dialog-root' }">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <section class="agent-console-delete-confirm-dialog" :class="message.class">
        <div class="agent-console-delete-confirm-dialog__content">
          <div class="agent-console-delete-confirm-dialog__copy"><h2>{{ message.header }}</h2><p>{{ message.message }}</p></div>
        </div>
        <footer class="agent-console-delete-confirm-dialog__footer">
          <div v-if="message.checkboxProps" class="agent-console-delete-confirm-dialog__checkbox">
            <Checkbox v-model="message.checkboxProps.value" :pt="{ root: 'items-center', box: '!w-4 !h-4' }"
              input-id="agent-console-delete-confirm-dialog-checkbox" binary />
            <label for="agent-console-delete-confirm-dialog-checkbox">{{ message.checkboxProps.label }}</label>
            <Icon v-if="message.checkboxProps.tooltip" v-tooltip="{ value: message.checkboxProps.tooltip, showDelay: 500, hideDelay: 300 }"
              name="base/rx_ic_info" :size="12" />
          </div>
          <div class="agent-console-delete-confirm-dialog__actions">
            <button class="agent-console-delete-confirm-dialog__button" type="button" :disabled="message.rejectProps?.disabled" @click="rejectCallback">
              {{ message.rejectLabel || message.rejectProps?.label || $t('取消') }}
            </button>
            <button class="agent-console-delete-confirm-dialog__button agent-console-delete-confirm-dialog__button--danger"
              type="button" :disabled="message.acceptProps?.disabled" @click="acceptCallback">
              {{ message.acceptLabel || message.acceptProps?.label || $t('确认') }}
            </button>
          </div>
        </footer>
      </section>
    </template>
  </ConfirmDialog>
</template>
