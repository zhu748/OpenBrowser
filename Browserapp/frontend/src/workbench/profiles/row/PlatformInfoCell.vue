<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as PlatformIcon } from './platform-icon-Cvcj894X.js';
defineProps({ data: { type: Object, required: true }, readonly: Boolean });
</script>

<template>
  <div v-tooltip.top="readonly ? undefined : { value: $t('点击编辑/查看详情'), showDelay: 500 }"
    class="platform-info-cell" :class="{ 'platform-info-cell--readonly': readonly }">
    <PlatformIcon v-if="data.platformIcon" class="w-6 shrink-0" :platform-icon="data.platformIcon" :platform-icon-dark="data.platformIconDark" />
    <Icon v-else name="base/rx_ic_user_key" color="var(--colors-icon-icon-tertiary, #7C8387)" size="24" />
    <div class="flex flex-col flex-1 gap-0.5 min-w-0">
      <div class="platform-info-cell__title" :title="data.platformUrl">{{ data.platformUrl || '--' }}</div>
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="platform-info-cell__subtitle" :title="data.platformUserName">{{ data.platformUserName || '--' }}</span>
        <Icon v-if="data.platformEfa" class="text-blue shrink-0" name="base/rx_ic_2fa" :size="16" />
      </div>
    </div>
  </div>
</template>
