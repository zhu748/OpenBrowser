<script setup>
import { computed } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { i as AccordionContent, n as AccordionPanel, r as AccordionHeader, t as Accordion } from './rx-accordion-BvZbJmSm.js';
import { useExtensionText } from './extension-labels.js';

const text = useExtensionText();
const instructions = computed(() => [text.value.howToGetDesc1, text.value.howToGetDesc2]);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1">
      <Icon name="base/rx_ic_info_fill" :size="12" color="#A3A9AD" />
      <span class="tt-tertiary text-3">{{ text.googleOnly }}</span>
    </div>
    <Accordion>
      <AccordionPanel value="111" :pt="{ root: '_root_1ddg9_2' }">
        <AccordionHeader as="div" :pt="{ root: '!py-3 !px-4' }" v-slot="{ active }">
          <div class="flex items-center gap-2.5">
            <Icon :class="[{ 'rotate-90': active }, 'transition-transform duration-300']" name="base/rx_ic_play" size="10" />
            <span class="title">{{ text.howToGetTitle }}</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="w-full flex flex-col gap-2.5 pl-5">
            <div v-for="instruction in instructions" :key="instruction" class="desc">{{ instruction }}</div>
            <div class="desc">{{ ' (1) Manifest file format: ' }}<a class="link" target="_blank" href="https://developer.chrome.com/docs/extensions/reference/manifest/">https://developer.chrome.com/docs/extensions/reference/manifest/</a>{{ '(update_url) ' }}</div>
            <div class="desc">{{ ' (2) Distribute your extension: ' }}<a class="link" target="_blank" href="https://developer.chrome.com/docs/extensions/how-to/distribute/">https://developer.chrome.com/docs/extensions/how-to/distribute/</a></div>
            <div class="desc">{{ text.howToGetPracticeNote }}</div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>
