<script setup>
defineProps({ label: String });
</script>

<template>
  <section class="agent-form-field">
    <label v-if="label" class="agent-form-field__label">{{ label }}</label>
    <slot name="label" />
    <slot />
  </section>
</template>
