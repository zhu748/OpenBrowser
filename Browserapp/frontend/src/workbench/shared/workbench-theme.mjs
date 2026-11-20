import { computed, ref, watch } from './workbench-vue.js';
import { di as isMainWindow, h as api, hn as debounce, v as useSettings, zt as channelName } from './utils-BIWenCnY.js';
import { i as defineStore } from './agent-BmSFI9WH.js';
import { r as installTokens, t as primitives } from './_Primitives_tokens-N0m8cQDB.js';

const themes = new Set(['system', 'light', 'dark']);
function themeOptions() {
  return [
    { label: $t('跟随系统'), value: 'system', icon: 'base/rx_ic_laptop' },
    { label: $t('浅色模式'), value: 'light', icon: 'base/rx_ic_sun' },
    { label: $t('深色模式'), value: 'dark', icon: 'base/rx_ic_moon' },
  ];
}
const channel = new BroadcastChannel(channelName);
const useTheme = defineStore('theme', () => {
  const settings = useSettings();
  const theme = ref('system');
  const realTheme = ref('light');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const isDarkTheme = computed(() => realTheme.value === 'dark');
  async function setTheme(value) {
    if (!themes.has(value) || value === theme.value) return;
    if (settings.token) api.base.userSetUserConfigCreate({ colorScheme: value });
    theme.value = value;
  }
  const apply = debounce(() => {
    realTheme.value = theme.value === 'system' ? (system.matches ? 'dark' : 'light') : theme.value;
    document.documentElement.dataset.theme = realTheme.value;
    document.documentElement.classList.toggle('app-dark', isDarkTheme.value);
    installTokens({ primitive: primitives[realTheme.value] });
    channel.postMessage({ theme: theme.value });
    if (isMainWindow) globalThis.electronAPI.send('app:setSystemTheme', theme.value);
  }, 0);
  watch(() => settings.userConfig?.colorScheme, setTheme);
  system.addEventListener('change', apply);
  watch(theme, apply, { immediate: true });
  channel.onmessage = debounce(({ data }) => {
    if (themes.has(data?.theme) && theme.value !== data.theme) theme.value = data.theme;
  }, 60);
  return { theme, realTheme, isDarkTheme, setTheme };
}, { persist: true });

export { useTheme as n, themeOptions as t };
