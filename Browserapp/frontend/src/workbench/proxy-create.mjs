/* global $t */
import { D as h, St as ref, d as computed, ut as withDirectives } from './runtime-core.esm-bundler-CBj16o9G.js';
import { f as Show } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { v as useUser } from './utils-BIWenCnY.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import { n as getProxyLabels } from './proxy-create-mode-BCcLAAf5.js';
import { a as Tabs, n as TabList, t as Tab } from './tab-6bJNMvq4.js';
import { t as SingleProxyForm } from './single-proxies-C7CAMkyq.js';
import { t as BatchProxyForm } from './batch-proxies-wPSH-NmI.js';
import { t as PageHeader } from './views-header-CcjwXPjG.js';
import { t as useProxyChanges } from './useProxyModuleCreate-DnWsQ0mq.js';

const CreateProxy = {
  name: 'CreateProxy',
  __scopeId: 'data-v-b30d5053',
  props: { mode: String },
  setup(props) {
    const router = useRouter();
    const { mixpanelTrack } = useUser();
    const { saveProxyModules } = useProxyChanges();
    const mode = computed(() => props.mode ?? 'proxy');
    const labels = getProxyLabels(mode);
    const tabs = [
      { title: $t('单个添加'), value: 'single' },
      { title: $t('批量添加'), value: 'batch' },
    ];
    const currentTab = ref('single');

    async function save(rows) {
      await saveProxyModules(rows, {
        labels: labels.value,
        async onSuccess() {
          if (globalThis.isCloudPhoneApp) {
            const { useProxyStore } = await import('./proxy-BZs_g4bS.js');
            await useProxyStore().fetchPickerList();
          }
          const name = labels.value.successRouteName;
          router.replace({ name, query: name === 'agent-list' ? { name: 'list' } : undefined });
        },
      });
    }

    function selectTab(tab) {
      currentTab.value = tab;
      if (tab === 'batch') mixpanelTrack('click_batch_add_proxy');
    }

    return () => h('div', { class: 'flex flex-col h-full w-full overflow-hidden' }, [
      h(PageHeader, { 'show-back': true, divider: false, title: labels.value.pageTitle }),
      h('div', { class: 'proxies-tabs' }, [
        h(Tabs, { value: currentTab.value, 'onUpdate:value': selectTab }, {
          default: () => h(TabList, null, {
            default: () => tabs.map(({ title, value }) => h(Tab, { key: title, value }, { default: () => title })),
          }),
        }),
      ]),
      h('div', { class: 'flex-ovh-1 w-full' }, [
        // Keep both forms mounted so switching tabs preserves in-progress inputs.
        h('div', { class: 'flex mx-auto h-full min-h-0' }, [
          withDirectives(h(SingleProxyForm, {
            mode: mode.value, 'show-remark': true, 'show-advertise': true, 'on-confirm': row => save([row]),
          }), [[Show, currentTab.value === 'single']]),
        ]),
        withDirectives(h(BatchProxyForm, { 'on-confirm': save }), [[Show, currentTab.value === 'batch']]),
      ]),
    ]);
  },
};

export { CreateProxy as t };
