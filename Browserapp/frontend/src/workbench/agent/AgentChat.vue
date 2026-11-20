<script setup>
import { computed } from 'vue';
import ChatWorkspace from './workbench-chat-workspace.js';
import { chatEvents, chatProps } from './workbench-chat-contract.js';

const props = defineProps({ ...chatProps, routeTitle: null });
const emit = defineEmits(chatEvents);
const prompt = defineModel('prompt', { required: true });
const listeners = Object.fromEntries(chatEvents.map(event => ['on' + event[0].toUpperCase() + event.slice(1), (...args) => emit(event, ...args)]));
const bindings = computed(() => Object.assign({}, listeners, Object.fromEntries(Object.keys(chatProps).map(key => [key, props[key]]))));
</script>

<template>
  <div class="agent-chat-route">
    <ChatWorkspace v-model:prompt="prompt" v-bind="bindings" />
  </div>
</template>
