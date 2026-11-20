<script setup>
import { sn as useLocale } from './utils-BIWenCnY.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

const { getOfficialWebsite } = useLocale();
function download() { window.open(getOfficialWebsite('/download'), '_blank', 'noopener'); }
</script>

<template>
  <Button class="shrink-0" icon="base/rx_ic_download" size="xs" :label="$t('下载客户端')" @click="download" />
</template>
