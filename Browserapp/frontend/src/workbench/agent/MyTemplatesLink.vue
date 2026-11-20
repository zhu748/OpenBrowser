<script setup>
import { resolveComponent } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
const RouterLink = resolveComponent('RouterLink');
</script>

<template>
  <RouterLink custom :to="{ name: 'agent-console-my-templates' }" v-slot="{ href, navigate, isActive }">
    <a :href="href" class="template-menu" :class="{ active: isActive }" @click="navigate">
      <Icon name="roxy-agent/rx-ic-templates" size="18" /><span>{{ $t('我的模板') }}</span>
    </a>
  </RouterLink>
</template>
