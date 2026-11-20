<script setup>
import { ref } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { t as Textarea } from './textarea-DvuriTzI.js';

const content = ref('');
defineExpose({ get formData() { return content.value; } });
</script>

<template>
  <Textarea v-model="content" rows="7" :placeholder="translate('请在此输入内容')" class="w-full text-3.5 placeholder:text-3.5" />
</template>
