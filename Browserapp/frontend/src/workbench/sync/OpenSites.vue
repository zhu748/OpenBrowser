<script setup>
import { ref } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { t as Textarea } from './textarea-DvuriTzI.js';
import { t as Dialog } from './base-dialog-Bet1oNF8.js';

const form = ref({ urls: '', replaceCurrentTab: false });
const desktop = globalThis.electronAPI;
let submitting = false;
const placeholder = '输入网址，多个网址通过换行区分: \nhttps://www.amazon.com \nhttps://www.facebook.com';

function close() {
  return desktop.send('syncControl:closeOpenSitesDialog');
}

async function openSites() {
  if (submitting) return;
  const urls = form.value.urls.split('\n').map(line => line.trim()).filter(Boolean).map(address => {
    try { return new URL(address).href; }
    catch { return 'http://' + address; }
  });
  submitting = true;
  try {
    await desktop.send('syncControl:openSites', { urls, replaceCurrentTab: form.value.replaceCurrentTab });
  } catch (error) {
    globalThis.__localUiError(error.message);
  } finally { submitting = false; }
}
</script>

<template>
  <Dialog :header="translate('打开网址')" @hide="close">
    <div class="open-sites">
      <Textarea v-model="form.urls" rows="8" :placeholder="translate(placeholder)" class="w-full" />
    </div>
    <div class="footer">
      <div class="flex items-center gap-2">
        <Checkbox v-model="form.replaceCurrentTab" input-id="ingredient1" binary size="small" />
        <label for="ingredient1">{{ translate('网址从当前标签页开始打开') }}</label>
      </div>
      <Button class="apply-button" @click="openSites">{{ translate('打开') }}</Button>
    </div>
  </Dialog>
</template>
