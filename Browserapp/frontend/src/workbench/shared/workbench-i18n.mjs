import { createI18n } from './workbench-vue-i18n.js';

const languagePacks = {
  en: () => import('./en-D33DiJcZ.js'),
  ru: () => import('./ru-Bo9bnzty.js'),
  'zh-CN': () => import('./zh-CN-CKEkLKpn.js'),
};

const i18n = createI18n({ globalInjection: true, fallbackLocale: 'en', legacy: false, locale: '', messages: {},
  missingWarn: false, fallbackWarn: false, messageResolver: (messages, key) => messages[key] || key });

function activate(language) {
  i18n.global.locale.value = language;
  globalThis.document?.documentElement?.setAttribute('lang', language);
}

async function installMessages({ defaultLocale, missingWarn, loadMessages = async () => ({}) } = {}) {
  if (defaultLocale && i18n.global.locale.value !== defaultLocale) {
    const { default: messages } = await (languagePacks[defaultLocale]?.() ?? {});
    if (messages) i18n.global.setLocaleMessage(defaultLocale, messages);
    i18n.global.mergeLocaleMessage(defaultLocale, await loadMessages(defaultLocale));
  }
  if (defaultLocale) activate(defaultLocale);
  i18n.global.setMissingHandler((locale, key) => {
    if (missingWarn && key.includes('.')) console.warn(`[intlify] Not found '${key}' key in '${locale}' locale messages.`);
  });
}

const preferred = navigator.language;
const browserLocale = preferred === 'zh-CN' ? preferred : preferred.split('-')[0];
const translate = i18n.global.t;
globalThis.$t = translate;

export { installMessages as i, browserLocale as n, i18n as r, translate as t };
export { I18nT as a, useI18n as o } from './workbench-vue-i18n.js';
