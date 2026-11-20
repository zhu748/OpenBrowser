<script setup>
import { Transition } from 'vue';
defineProps({ expanded: Boolean });
</script>

<template>
  <Transition name="agent-collapse">
    <div v-if="expanded" class="agent-collapse" :aria-hidden="!expanded" :inert="!expanded || undefined">
      <div class="agent-collapse__content"><slot></slot></div>
    </div>
  </Transition>
</template>
