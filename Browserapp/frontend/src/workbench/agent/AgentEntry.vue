<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { gt as trace, gr as artwork, ht as traceOperation, ri as supportsAgent } from './utils-BIWenCnY.js';
import { o as useLocale } from './locales-BfKu2SD4.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { agentShellRuntime } from './hook-CnJE4hRq.js';
import AgentShell from './workbench-agent-shell.js';

const { Brand } = agentShellRuntime;
const ready = ref(!globalThis.isElectron || Boolean(globalThis.$appVersion));
const theme = useTheme();
const { locale } = useLocale();
const supported = computed(() => !globalThis.isElectron || ready.value && supportsAgent());
const chinese = computed(() => locale.value.toLowerCase().startsWith('zh'));
const dark = computed(() => theme.realTheme === 'dark');
const variant = computed(() => dark.value ? 'dark' : 'light');
const mesh = computed(() => artwork('agent/version-guard/mesh-' + variant.value + '.svg'));
const showcase = computed(() => artwork('agent/version-guard/showcase-' + (chinese.value ? 'zh' : 'en') + '-' + variant.value + '.svg'));
const minimumVersion = '4.0.2';
trace('agent-page:setup:start');
onMounted(() => {
  document.body.classList.add('agent-console-window');
  trace('agent-page:mounted');
});
onUnmounted(() => document.body.classList.remove('agent-console-window'));
async function resolveVersion() {
  if (!globalThis.isElectron) return;
  try {
    const complete = traceOperation('agent-page:resolveAppVersion');
    const version = globalThis.$appVersion || await globalThis.electronAPI.send('app:getAppVersion');
    globalThis.$appVersion = version;
    complete({ version });
  } catch (error) {
    console.warn('[agent-console] Failed to resolve app version:', error);
  } finally {
    ready.value = true;
    trace('agent-page:appVersionResolved', { supported: supportsAgent() });
  }
}
void resolveVersion();
</script>

<template>
  <AgentShell v-if="supported" />
  <main v-else-if="ready" class="agent-console-version-guard" :class="{ 'agent-console-version-guard--dark': dark }">
    <img class="agent-console-version-guard__mesh" :src="mesh" alt="" aria-hidden="true">
    <Brand class="agent-console-version-guard__brand" />
    <section class="agent-console-version-guard__hero">
      <h1><template v-if="chinese"><span class="agent-console-version-guard__title-latin">AI Agent&nbsp;</span><span>焕新升级</span></template><template v-else>AI Agent New Upgrade</template></h1>
      <p>{{ chinese ? '更新 Roxy 浏览器至最新版本体验' : 'Update Roxy Browser to the latest version' }}</p>
      <span class="agent-console-version-guard__sr-only">{{ $t('当前版本不支持 AI Agent，请更新到 v{version} 或更高版本。', { version: minimumVersion }) }}</span>
    </section>
    <img class="agent-console-version-guard__showcase" :src="showcase" alt="" aria-hidden="true">
  </main>
</template>
