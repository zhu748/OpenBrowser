<script setup>
import { Ar as joinWhenPresent } from './utils-BIWenCnY.js';
import { t as Divider } from './divider-BXJIHZjP.js';
defineProps({ data: { type: Object, required: true } });
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="proxy-host">
      <template v-if="data.isEncryptProxy"> -- </template>
      <template v-else>
        <span>{{ data.host }}</span><span>{{ joinWhenPresent(':', data.port) }}</span>
        <span>{{ joinWhenPresent(':', data.proxyUserName) }}</span><span>{{ joinWhenPresent(':', data.proxyPassword) }}</span>
      </template>
    </div>
    <div class="flex items-center gap-1.5 ip-type">
      <span>{{ data.ipType }}</span>
      <template v-if="data.protocol">
        <Divider class="!ma-0" layout="vertical" />
        <span>{{ data.protocol.toLocaleLowerCase() }}</span>
      </template>
    </div>
  </div>
</template>
