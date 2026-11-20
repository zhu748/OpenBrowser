<script setup>
import { ui as isMac } from './utils-BIWenCnY.js';
import { o as useEventListener } from './dist-NctnpPRe.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const shortcut = isMac ? '⌘ + R' : 'Ctrl + R';
function reload() { window.location.reload(); }
useEventListener(window, 'keydown', event => {
  if (event.repeat || event.altKey || event.shiftKey) return;
  if ((event.key.toLowerCase() === 'r' || event.code === 'KeyR') && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    reload();
  }
});
</script>

<template>
  <Button v-tooltip.left="{ value: $t('刷新界面。若一直白屏，请按 {shortcut} 再刷新一次。', { shortcut }), pt: { root: '!max-w-96' } }"
    class="shrink-0" severity="secondary" variant="outlined" icon="base/rx_ic_refresh" :aria-label="$t('刷新界面')" size="xs" @click="reload" />
</template>
