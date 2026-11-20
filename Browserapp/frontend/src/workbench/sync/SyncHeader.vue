<script setup>
import { t as translate } from './locales-BfKu2SD4.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

function close() {
  return globalThis.electronAPI.send('syncControl:close');
}
</script>

<template>
  <div class="header">
    <div class="title">
      <span class="production-name">{{ translate('Roxy浏览器') }}</span>
      <span class="sub-title">{{ translate('窗口同步') }}</span>
    </div>
    <div class="actions">
      <Button class="close no-drag" text severity="secondary" icon="base/rx_ic_delete" size="xxs" @click="close" />
    </div>
  </div>
</template>
