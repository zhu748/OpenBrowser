<script setup>
import { resolveComponent } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
defineProps({ items: { type: Array, required: true } });
const RouterLink = resolveComponent('RouterLink');
</script>

<template>
  <nav class="agent-nav">
    <RouterLink v-for="item in items" :key="item.id" custom :to="{ name: item.route }" v-slot="{ href, isExactActive, navigate }">
      <a :href="href" class="nav-item" :class="{ active: isExactActive }" @click="navigate">
        <Icon :name="item.icon" size="18" />
        <span class="nav-label">{{ $t(item.label) }}</span>
      </a>
    </RouterLink>
  </nav>
</template>
