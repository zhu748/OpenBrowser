<script setup>
import { computed } from './workbench-vue.js';
import { r as types } from './proxy-D7e36h-l.js';
import { n as useLabels } from './proxy-create-mode-BCcLAAf5.js';

const props = defineProps({ ipType: String });
const labels = useLabels();
const deviceMode = computed(() => labels.value.mode === 'device');
const credentials = computed(() => $t(deviceMode.value ? '用户名:密码' : '代理 IP 用户名:代理 IP 密码'));
const examples = [
  { notes: true },
  { after: true },
  { after: true, notes: true, refresh: true },
  { after: true, ipv6: true, notes: true, refresh: true },
  { before: true },
  { before: true, notes: true, refresh: true },
  { before: true, ipv6: true, notes: true, refresh: true },
];
const rows = computed(() => props.ipType === types.IPV4 ? examples.filter(row => !row.ipv6) : examples);
</script>

<template>
  <div class="break-keep-all example">
    <div>{{ $t(deviceMode ? '示例（备注为选填）' : '示例（动态代理 IP 刷新 URL 与备注为选填）') + ': ' }}</div>
    <div v-for="(row, index) in rows" :key="index">
      <template v-if="row.ipv6">{{ row.before ? credentials + '@' : '' }}<span class="text-orange">[fe80::1:9dc0:f1ab:90a3]</span>{{ ':8000' + (row.after ? ':' + credentials : '') }}</template>
      <template v-else>{{ (row.before ? credentials + '@' : '') + '192.168.0.1:8000' + (row.after ? ':' + credentials : '') }}</template>
      <span v-if="row.refresh && !deviceMode" class="text-green whitespace-nowrap">{{ '[' + $t('动态代理 IP 刷新 URL') + ']' }}</span><span v-if="row.notes" class="text-blue whitespace-nowrap">{{ '{' + $t('备注') + '}' }}</span>
    </div>
    <br>
    <div class="help"><span v-if="ipType === types.IPV6">1. </span>{{ labels.batchHelpLine }}</div>
    <div v-if="ipType === types.IPV6" class="help">{{ $t(deviceMode ? '2. IPV6 的主机需填写在 [ ] 内；' : '2. IPV6 的代理 IP 主机需填写在 [ ] 内；') }}</div>
  </div>
</template>
