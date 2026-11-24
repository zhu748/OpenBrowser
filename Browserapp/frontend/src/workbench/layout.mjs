/* global $t */
import {
  D as h, E as normalizeProps, F as nextTick, P as mergeProps, St as ref,
  R as onBeforeUnmount, V as onMounted, Y as resolveComponent, at as useTemplateRef, ct as watchEffect,
  d as computed, i as Fragment, m as comment, nn as guardReactiveProps,
  st as watch, ut as withDirectives,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import {
  at as useWorkspaceRole, h as api, mt as useWorkspace, nn as usePermissions, pr as createTutorial,
  sn as useLocale, tn as WorkspaceType, v as useUser, xi as sidebarStorageKey,
} from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useBusinessToast } from './agent-BmSFI9WH.js';
import { n as ProjectPin, t as useProjects } from './project-zUGx3yhI.js';
import { b as useRouter, r as eventBus, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { t as makeAvatar } from './workspace-CNvgSgaH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Ripple } from './ripple-DKjDc6yC.js';
import { t as Tooltip } from './tooltip-BYYKWrvu.js';
import { n as useAppearance, t as themeOptions } from './theme-mq6SsndU.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { s as TieredMenu, w as useBusinessCode } from './hook-CnJE4hRq.js';
import { i as highlightElement, t as clearHighlight } from './useDomSpotlight-CA279FOk.js';
import { t as MenuDivider } from './rx-divider-Ci3C58Q3.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';
import { n as LoadingOverlay } from './m-input-select-C8pih1gY.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
import { t as Divider } from './divider-BXJIHZjP.js';
import { t as Avatar } from './rx-avatar-h90aIpxl.js';
import { t as languages } from './iso-639-CUMONuwI.js';
import {
  a as DesktopDownload, i as Notifications, n as Update, o as SidebarLinks, r as Refresh,
} from './identity-verification-entry-B8EzLOCj.js';
import { t as useTutorialLabels } from './useTutorialEntityLabels-BJzywsZZ.js';
import { SidebarFooter } from './workbench-chrome.js';
import { createNetworkIndicator } from './workbench-network.js';

function sidebarItems(projectChildren) {
  return [
    { path: 'browser', name: 'browser', meta: { title: $t('窗口管理'), icon: 'base/rx_ic_browser' } },
    { path: 'projects', name: 'projects', meta: { title: $t('项目管理'), icon: 'base/rx_ic_stack' }, children: projectChildren },
    { path: 'proxy', name: 'agent-list', meta: { title: $t('代理 IP'), icon: 'base/rx_ic_internet' } },
    { path: 'account', name: 'local-account-root', meta: { title: $t('平台账号'), icon: 'base/rx_ic_keys' } },
    { path: 'extensions', name: 'local-extensions', meta: { title: $t('扩展中心'), icon: 'base/rx_ic_extension_store' } },
    {
      path: 'automation', name: 'local-automation-group', meta: { title: $t('AI & 自动化'), type: 'group' },
      children: [
        { path: 'sync-control', name: 'local-synchronizer', meta: { title: $t('窗口同步'), icon: 'base/rx_ic_frame_stack' } },
        { path: 'roxy-agent', name: 'agent-console-chat', meta: { title: 'AI Agent', icon: 'roxy-agent/rx-ic-logo', isRoxyAgent: true, showNewBadge: true } },
        { path: 'template-store', name: 'agent-console-template-store', meta: { title: $t('模板商城'), icon: 'roxy-agent/rx-ic-templates-store' } },
        { path: 'task-manager', name: 'agent-console-task-manager', meta: { title: $t('任务管理'), icon: 'roxy-agent/rx-ic-task-manager' } },
        { path: 'my-templates', name: 'agent-console-my-templates', meta: { title: $t('我的模板'), icon: 'roxy-agent/rx-ic-templates' } },
        { path: 'api-keys', name: 'api-keys', meta: { title: 'API & AI MCP', icon: 'base/rx_ic_doc_code' } },
        { path: 'skills', name: 'local-agent-skills', meta: { title: 'Skill 管理', icon: 'base/rx_ic_doc_code' } },
      ],
    },
  ];
}

const Sidebar = {
  name: 'WorkbenchSidebar',
  __scopeId: 'data-v-fa7a9b2a',
  props: { collapsed: Boolean },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const role = useWorkspaceRole();
    const projectStore = useProjects();
    const { currentWorkspace } = storeToRefs(useWorkspace());
    const { ctx: context } = useRouteContext();
    const labels = useTutorialLabels();
    const { check: permitted } = usePermissions();
    const { handleBusinessCode } = useBusinessCode();
    const [, showBusinessError] = useBusinessToast();
    const badgeMap = ref(Object(localStorage.getItem('badgeMapCache') || {}));
    const guidance = ref();
    const pinned = computed(() => projectStore.projects
      .filter(project => project.pinStatus === ProjectPin.pinned)
      .slice(0, 5)
      .map(project => ({
        path: ':id', name: 'project-item', meta: { title: project.projectName, params: { id: project.project_id } },
      })));
    const items = computed(() => sidebarItems(context.value.isNormal ? pinned.value : undefined));

    watch(currentWorkspace, (current, previous) => {
      if (current?.id && current.id !== previous?.id && (role.isOwner || current.workspaceType !== WorkspaceType.Public)) {
        setTimeout(() => projectStore.getProjects());
      }
    }, { immediate: true });
    function addBadge(key) {
      if (!Reflect.has(badgeMap.value, key)) Reflect.set(badgeMap.value, key, true);
    }
    function showAsideGuide() {
      if (context.value.isEcommerce) return;
      guidance.value = createTutorial({
        showProgress: false,
        disableActiveInteraction: false,
        allowClose: true,
        overlayClickBehavior: 'close',
        showButtons: ['close'],
        stagePadding: 0,
        popoverOffset: 20,
        steps: [{
          element: '#NEW_PROFILE',
          popover: { description: labels.value.createEntityGuideDesc, side: 'right', align: 'center' },
          onHighlightStarted: () => nextTick(() => requestAnimationFrame(() => highlightElement('#NEW_PROFILE'))),
        }],
        onDestroyed: clearHighlight,
      });
      guidance.value.drive();
    }
    eventBus.on('badgeMap', addBadge);
    eventBus.on('asideMenuGuide', showAsideGuide);
    const stopProjects = globalThis.rebuild.onEvent(event => {
      if (event.type !== 'profiles' || event.action !== 'group-metadata') return;
      projectStore.getProjects({ afterChange: true }).catch(error => globalThis.__localUiError?.(error.message));
    });
    onBeforeUnmount(() => {
      stopProjects();
      eventBus.off('badgeMap', addBadge);
      eventBus.off('asideMenuGuide', showAsideGuide);
      guidance.value?.destroy();
    });

    async function createProfile() {
      const { code, msg } = await api.window.userCheckWindowTotalCountList();
      if (code !== 0) {
        handleBusinessCode(code, () => showBusinessError(code, msg));
        return;
      }
      const query = route.name === 'project-item' ? { projectId: route.params.id } : {};
      if (guidance.value) {
        guidance.value.destroy();
        guidance.value = undefined;
        query.driver = 1;
      }
      router.push({ name: 'browser-create', query });
    }

    return () => h('aside', {
      class: ['relative -mt-6.5 pt-5.25 -mb-3 pb-3 -ml-0.5 pl-0.5 -mr-0.75 pr-0.75 flex-1 flex flex-col self-stretch gap-3 aside', { collapsed: props.collapsed }],
    }, [
      permitted('Profiles_add') && context.value.isNormal ? h('div', { class: 'flex items-center gap-1.5' }, [
        h(Button, { id: 'NEW_PROFILE', class: '!h-9 new-profile-btn', size: 'md', icon: 'base/rx_ic_browser_add', label: props.collapsed ? undefined : $t('创建窗口'), onClick: createProfile }),
      ]) : comment(),
      h('div', { class: 'relative flex-1 min-h-0 overflow-hidden' }, [
        h('nav', { class: 'h-full flex flex-col items-start self-stretch gap-3 overflow-y-auto menu' }, [
          h(SidebarLinks, {
            'badge-map': badgeMap.value,
            'onUpdate:badgeMap': value => { badgeMap.value = value; },
            class: 'relative z-1',
            items: items.value,
            collapsed: props.collapsed,
          }),
        ]),
      ]),
    ]);
  },
};

const NetworkStatus = {
  name: 'WorkbenchNetworkStatus',
  __scopeId: 'data-v-1794327e',
  setup() {
    const { network, loading, refresh } = createNetworkIndicator({
      ref, onMounted, request: (...args) => globalThis.__localRequest(...args),
    });
    return () => h('div', { class: 'flex items-center gap-1' }, [
      withDirectives(h(Button, {
        class: 'shrink-0',
        'aria-label': '刷新网络定位',
        icon: network.value.ip ? 'base/rx_ic_location' : 'base/rx_ic_location_error',
        severity: 'secondary', outlined: true, size: 'xs', onClick: refresh,
      }), [[Tooltip, { value: $t('点击刷新'), showDelay: 300 }, undefined, { left: true }]]),
      loading.value ? h(Fragment, { key: 'loading' }, [
        h(Skeleton, { width: '4rem', height: '12px' }),
        h(Skeleton, { width: '3rem', height: '10px' }),
      ]) : network.value.ip ? withDirectives(h('div', { class: 'flex items-center gap-1' }, [
        h('div', { class: 'city' }, network.value.city),
        h('div', { class: 'ip' }, ' (' + network.value.ip + ') '),
      ]), [[Tooltip, { value: network.value.routeLabel || $t('当前网络定位'), showDelay: 300 }, undefined, { bottom: true }]]) : comment(),
    ]);
  },
};

const WorkbenchProfileMenu = {
  name: 'LocalProfileMenu',
  __scopeId: 'data-v-47962e3a',
  setup() {
    const router = useRouter();
    const user = useUser();
    const locale = useLocale();
    const appearance = useAppearance();
    const menu = useTemplateRef('menu');
    const displayName = computed(() => user.userInfo.userName || 'OpenBrowser');
    const avatar = computed(() => makeAvatar({ workspaceName: displayName.value, size: 26, emojiFontSize: 18, textFontSize: 14 }));
    const items = computed(() => [
      { label: $t('设置'), icon: 'base/rx_ic_settings', command: () => router.push('/agent-console/settings') },
      { label: 'API & AI MCP', icon: 'base/rx_ic_doc_code', command: () => router.push('/api-keys') },
      { separator: true },
      {
        label: $t('语言'), icon: 'base/rx_ic_language',
        items: languages.map(option => ({
          ...option, isCheck: () => locale.currentLocale === option.locale,
          command: () => locale.setSimpleLocale(option.locale),
        })),
      },
      {
        label: $t('主题模式'), icon: 'base/rx_ic_contrast',
        items: themeOptions().map(option => ({
          ...option, isCheck: () => appearance.theme === option.value,
          command: () => appearance.setTheme(option.value),
        })),
      },
    ]);

    async function toggle(event) {
      menu.value?.toggle(event);
      const saved = await globalThis.__localRequest('settings:get');
      user.userInfo.userName = saved.localUserName || 'OpenBrowser';
    }

    return () => [
      h('button', {
        type: 'button',
        class: 'flex items-center pr-1.5 pl-1 py-0.5 gap-1.5 select-none cursor-pointer rounded-1 settings',
        'aria-label': '本地工作区菜单',
        onClick: toggle,
      }, [
        h(Avatar, normalizeProps(guardReactiveProps(avatar.value))),
        h('div', { class: 'tt-primary text-3.25 font-600 leading-4' }, displayName.value),
        h(Icon, { class: 'cursor-pointer pointer-events-none', name: 'base/rx_ic_chevron_down', size: 12 }),
      ]),
      h(TieredMenu, {
        ref: 'menu', model: items.value, popup: true, pt: { root: '!border-0.5 !min-w-60 max-w-80' },
      }, {
        start: () => h('div', { class: 'flex flex-col gap-1 pa-1' }, [
          h('div', { class: 'pa-3 text-3.5 font-medium' }, $t('本地工作区')),
          h(MenuDivider, { 'line-only': true, 'line-color': 'var(--tieredmenu-separator-border-color)' }),
        ]),
        item: ({ item, props, hasSubmenu }) => withDirectives(h('a', mergeProps({ class: 'flex items-center' }, props.action), [
          h(Icon, { name: item.icon, color: 'var(--colors-icon-icon-secondary)' }),
          h('span', { class: 'tt-primary text-3.25 leading-4' }, item.label),
          hasSubmenu ? h(Icon, { class: 'ml-auto', name: 'base/rx_ic_chevron_right' }) : comment(),
          item.isCheck?.() ? h(Icon, { class: 'ml-auto', name: 'base/rx_ic_check' }) : comment(),
        ]), [[Ripple]]),
      }),
    ];
  },
};

const Header = {
  name: 'WorkbenchHeader',
  __scopeId: 'data-v-c3fba65e',
  setup() {
    return () => h('div', { class: 'rx-layout-header', 'data-testid': 'workbench-header' }, [
      h('div', { class: 'top-bar-items' }, [
        h(NetworkStatus),
        h(Divider, { class: '!ma-0', layout: 'vertical' }),
        globalThis.isElectron ? h(Update) : h(DesktopDownload),
        h(Notifications),
        h(Refresh),
        h(Divider, { class: '!ma-0', layout: 'vertical' }),
        h(WorkbenchProfileMenu),
      ]),
    ]);
  },
};

const WorkbenchLayout = {
  name: 'WorkbenchLayout',
  __scopeId: 'data-v-15ca8d5a',
  setup() {
    const { currentWorkspace } = storeToRefs(useWorkspace());
    const { realTheme } = storeToRefs(useAppearance());
    const collapsed = ref(Boolean(Number(localStorage.getItem(sidebarStorageKey)) | 0));
    const wordmark = computed(() => '/images/openbrowser-wordmark-' + (realTheme.value === 'dark' ? 'dark' : 'light') + '.svg');
    useCssVars(() => ({ v55c73ff8: realTheme.value === 'dark' ? '#FFFFFF33' : 'rgba(0, 0, 0, 0.1)' }));
    watchEffect(() => localStorage.setItem(sidebarStorageKey, collapsed.value ? '1' : '0'));

    return () => h('div', { class: 'rx-layout' }, [
      h('div', { class: ['rx-side', { collapsed: collapsed.value }] }, [
        h('div', {
          class: 'indicator', title: collapsed.value ? $t('展开') : $t('收起'),
          onClick: () => { collapsed.value = !collapsed.value; },
        }, [
          h(Icon, { name: 'indicator/indicator_default', class: 'default' }),
          h(Icon, { name: 'indicator/indicator_expand', class: 'expand' }),
          h(Icon, { name: 'indicator/indicator_fold', class: 'fold' }),
        ]),
        h('div', { class: 'logo' }, [
          h('img', { src: '/images/openbrowser.png', width: 36, height: 36, alt: 'OpenBrowser' }),
          collapsed.value ? comment() : h('img', { draggable: 'false', class: 'block h-5', src: wordmark.value }),
        ]),
        h(Sidebar, { collapsed: collapsed.value }),
        h(SidebarFooter, { collapsed: collapsed.value, 'onUpdate:collapsed': value => { collapsed.value = value; } }),
      ]),
      h('main', { class: 'flex-1 flex flex-col overflow-hidden' }, [
        h(Header),
        h('div', { class: 'flex-1 mr-4 mb-4 rounded overflow-hidden relative flex min-h-0 flex-col rx-main-content' }, [
          currentWorkspace.value?.id ? h(resolveComponent('RouterView'), { key: currentWorkspace.value.id }) : comment(),
          h(LoadingOverlay, { 'model-value': false, opacity: 0.9 }),
        ]),
      ]),
    ]);
  },
};

export { WorkbenchLayout as default, WorkbenchProfileMenu as LocalProfile };
