<script setup>
import { computed } from 'vue';
import { t as Tabs } from './rx-tabs-Dp-8mudX.js';
import InstalledExtensions from './installed-extensions.js';
import { provideExtensionText } from './extension-labels.js';

const props = defineProps({ mode: String });
const text = provideExtensionText(() => props.mode);
const tabs = computed(() => [{ title: text.value.installedTab, value: 'installed', slot: 'installed' }]);
</script>

<template>
  <div class="flex flex-col h-full w-full extensions">
    <Tabs value="installed" class="flex-1 overflow-hidden" :tabs="tabs" head-tabs>
      <template #installed>
        <div class="w-full flex flex-col">
          <div class="flex-1 overflow-hidden">
            <InstalledExtensions />
          </div>
        </div>
      </template>
    </Tabs>
  </div>
</template>
