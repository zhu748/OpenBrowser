<script setup>
import { inject, reactive, ref } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as DatePicker } from './datepicker-Bd-h5Ks4.js';
import { a as Select, o as FormField } from './ScriptSchemaForm-z_48GvPJ.js';
import { S as validCron, b as buildPlan, i as HourlyMinute, x as initialSchedule } from './useTemplateTaskExecution-yGKXS9Rw.js';

const dialog = inject('dialogRef');
const actions = dialog?.value.data ?? {};
const form = reactive(initialSchedule(actions.initialValues, 'once'));
const saving = ref(false);
const error = ref('');
const frequencies = [
  { label: $t('单次执行'), value: 'once' }, { label: $t('每小时'), value: 'hourly' },
  { label: $t('每天'), value: 'daily' }, { label: $t('每周'), value: 'weekly' }, { label: $t('每月'), value: 'monthly' },
];
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => ({ label: $t(day), value: (index + 1) % 7 }));
const monthDays = Array.from({ length: 31 }, (_, index) => ({ value: index + 1, label: $t('每月 {day} 日', { day: index + 1 }) }));

async function close() {
  await actions.onCancel?.();
  dialog?.value.close();
}
async function save() {
  if (saving.value) return;
  error.value = '';
  const plan = buildPlan(form);
  if (plan.planType === 'once' && !plan.executeAt) {
    error.value = $t('请选择有效的单次执行时间');
    return;
  }
  if (plan.planType === 'cron' && (!plan.cron || !validCron(plan.cron))) {
    error.value = $t('请输入有效的五段 cron 表达式');
    return;
  }
  saving.value = true;
  try {
    if (await actions.onSave?.(plan) !== false) dialog?.value.close();
  } finally { saving.value = false; }
}
</script>

<template>
  <div class="agent-console-dialog__shell task-schedule-dialog">
    <header class="agent-console-dialog__header">
      <h2 class="agent-console-dialog__title">{{ $t('计划') }}</h2>
      <button class="agent-console-dialog__close" type="button" :aria-label="$t('关闭计划弹窗')" @click="close"></button>
    </header>
    <main class="agent-console-dialog__body task-schedule-dialog__body">
      <p class="m-0 text-3 leading-5 text-[var(--color-text-tertiary)]">{{ $t('计划任务仅由创建者账号登录的客户端执行，请保持客户端在线。') }}</p>
      <FormField :label="$t('计划')">
        <div class="task-schedule-dialog__row">
          <Select v-model="form.frequency" class="task-schedule-dialog__frequency" :options="frequencies" :disabled="saving" />
          <DatePicker v-if="form.frequency === 'once'" v-model="form.scheduleDate" class="task-schedule-dialog__datepicker task-schedule-dialog__date"
            panel-class="agent-schedule-datepicker-panel" date-format="yy-mm-dd" show-icon icon-display="input" fluid :disabled="saving" :manual-input="false">
            <template #inputicon="slot"><Icon name="base/rx_ic_chevron_down" size="12" :class="slot.class" @click.stop="slot.clickCallback($event)" /></template>
          </DatePicker>
          <HourlyMinute v-else-if="form.frequency === 'hourly'" v-model="form.hourlyMinute" class="task-schedule-dialog__datepicker task-schedule-dialog__time wide" :disabled="saving" />
          <Select v-else-if="form.frequency === 'weekly'" v-model="form.weekday" class="task-schedule-dialog__detail" overlay-class="agent-schedule-select-overlay" :options="weekdays" :disabled="saving" />
          <Select v-else-if="form.frequency === 'monthly'" v-model="form.monthlyDay" class="task-schedule-dialog__detail" overlay-class="agent-schedule-select-overlay" :options="monthDays" :disabled="saving" />
          <DatePicker v-if="form.frequency !== 'hourly'" v-model="form.scheduleTime" class="task-schedule-dialog__datepicker task-schedule-dialog__time"
            :class="{ wide: form.frequency === 'daily' }" panel-class="agent-schedule-datepicker-panel" time-only hour-format="24"
            show-icon icon-display="input" fluid :disabled="saving" :manual-input="false">
            <template #inputicon="slot"><Icon name="base/rx_ic_chevron_down" size="12" :class="slot.class" @click.stop="slot.clickCallback($event)" /></template>
          </DatePicker>
        </div>
      </FormField>
      <p v-if="error" class="task-schedule-dialog__error" role="alert">{{ error }}</p>
    </main>
    <footer class="agent-console-dialog__footer">
      <div class="agent-console-dialog__actions">
        <button class="agent-console-dialog__button" type="button" :disabled="saving" @click="close">{{ $t('取消') }}</button>
        <button class="agent-console-dialog__button dark" type="button" :disabled="saving" @click="save">{{ $t(saving ? '保存中...' : '保存') }}</button>
      </div>
    </footer>
  </div>
</template>
