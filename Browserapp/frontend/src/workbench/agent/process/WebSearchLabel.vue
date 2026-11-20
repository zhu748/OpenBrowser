<script setup>
import { computed, ref, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { Q as fallbackIcon } from './CreateTemplateDialog-Bpq9OLTG.js';
import { processEventRuntime } from './hook-CnJE4hRq.js';
const props = defineProps({ event: { type: Object, required: true }, highlight: Boolean });
const { parseSearch, toolLabel } = processEventRuntime;
const search = computed(() => parseSearch(props.event.input));
const label = computed(() => toolLabel(props.event.toolName, props.event.status, props.event.input, { finished: props.event.finished }));
const visited = computed(() => ['open_page', 'find_in_page'].includes(search.value?.action) ? search.value : null);
const segments = computed(() => {
  if (!visited.value) return null;
  const index = label.value.indexOf(visited.value.url);
  if (index < 0) return null;
  return { before: label.value.slice(0, index), after: label.value.slice(index + visited.value.url.length) };
});
const loaded = ref(false);
const failed = ref(false);
watch(() => visited.value?.faviconUrl, () => {
  loaded.value = false;
  failed.value = false;
});
</script>

<template>
  <span v-if="visited && segments" class="web-search-label" :class="{ 'process-running-text': highlight }">{{ segments.before }}<span class="web-search-url">
    <span v-if="visited.faviconUrl" class="web-search-favicon-slot">
      <Icon class="web-search-favicon web-search-favicon--fallback" :class="{ 'web-search-favicon--hidden': loaded }"
        :name="fallbackIcon" size="14" color="var(--color-text-tertiary)" aria-hidden="true" />
      <img v-if="!failed" class="web-search-favicon" :class="{ 'web-search-favicon--loaded': loaded }" :src="visited.faviconUrl"
        alt="" decoding="async" referrerpolicy="no-referrer" @error="failed = true" @load="loaded = true">
    </span><span class="web-search-url__text">{{ visited.url }}</span>
  </span>{{ segments.after }}</span>
  <span v-else :class="{ 'process-running-text': highlight }">{{ label }}</span>
</template>
