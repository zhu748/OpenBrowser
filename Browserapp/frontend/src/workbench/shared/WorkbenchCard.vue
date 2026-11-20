<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
defineProps({ closable: { type: Boolean, default: true } });
defineEmits(['close']);
</script>

<template>
  <div class="rx-card">
    <Icon v-if="closable" class="cursor-pointer rx-card-close" name="base/rx_ic_delete_fill" @click.stop="$emit('close')" />
    <slot />
  </div>
</template>
