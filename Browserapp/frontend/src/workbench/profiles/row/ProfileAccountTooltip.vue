<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as PlatformIcon } from './platform-icon-Cvcj894X.js';

defineProps({ platformList: { type: Array, required: true } });
</script>

<template>
  <div class="flex flex-col gap-2 max-w-100">
    <div v-for="account in platformList" :key="account.platformUrl" class="flex gap-1.5">
      <PlatformIcon v-if="account.platformIcon" class="w-4 h-4"
        :platform-icon="account.platformIcon || account.platformIconDark" :platform-icon-dark="account.platformIconDark" />
      <Icon v-else name="base/rx_ic_user_key" color="var(--component-tooltip-text-primary)" />
      <div class="flex flex-col gap-1">
        <template v-if="platformList.length === 1">
          <div class="primary">{{ account.platformUrl }}</div>
          <div v-if="account.platformUserName" class="secondary">{{ account.platformUserName }}</div>
        </template>
        <div v-else class="primary">{{ account.platformUserName || '--' }}</div>
      </div>
    </div>
  </div>
</template>
