import { n as createWebHashHistory, t as createRouter } from './vue-router-buZVHxQS.js';

const syncDialogs = {
  preferences: () => import('./preferences--734d_2_.js'),
  'batch-inputs': () => import('./batch-inputs-B_HNTlr8.js'),
  'open-sites': () => import('./open-sites-BUgaXFNX.js'),
  'syncing-window-list': () => import('./syncing-window-list-g5VmUz_T.js'),
};

const syncDialogKinds = Object.keys(syncDialogs);

const legacyRoutes = {
  '/resource/agent': 'agent-list',
  '/resource/create': 'agent-create',
  '/resource/account': 'account-list',
  '/resource/accountcreate': 'account-create',
  '/resource/extensions': 'local-extensions',
  '/automation/sync-control': 'local-synchronizer',
  '/automation/roxy-agent': 'agent-console-chat',
  '/automation/template-store': 'agent-console-template-store',
  '/automation/task-manager': 'agent-console-task-manager',
  '/automation/my-templates': 'agent-console-my-templates',
  '/automation/api-keys': 'api-keys',
  '/mcp': 'agent-console-chat',
  '/agent-console/roxyclaw': 'agent-console-roxyclaw',
  '/skills': 'local-agent-skills',
  '/sync-control-synchronizer': 'local-synchronizer',
  '/sync-control-action-bar': 'local-synchronizer-active',
  '/sync-control-preferences-dialog': 'local-dialog-preferences',
  '/sync-control-batch-inputs-dialog': 'local-dialog-batch-inputs',
  '/sync-control-open-sites-dialog': 'local-dialog-open-sites',
  '/syncing-window-list-dialog': 'local-dialog-syncing-window-list',
};

function legacyRendererProps(route) {
  return { legacy: route.query.renderer === 'legacy' };
}

function managementPage(kind, fallback) {
  return () => import('./management-routes.js').then(module => module.managementRoute(kind, fallback));
}

function managementProps(route, options = {}) {
  return { legacy: route.query.renderer !== 'source', sourceOptions: { key: route.fullPath, ...options } };
}

function createWorkbenchRouter({ agentShell, agentChat }) {
  return createRouter({
    history: createWebHashHistory('/index.html#'),
    routes: [
      ...Object.entries(legacyRoutes).map(([path, name]) => ({ path, redirect: { name } })),
      {
        path: '/sync-control-custom-layout-dialog',
        redirect: ({ query, hash }) => ({
          name: 'local-dialog-preferences', query: { ...query, tab: 'customLayout' }, hash,
        }),
      },
      ...Object.entries(syncDialogs).map(([kind, component]) => ({
        path: '/synchronizer/dialog/' + kind,
        name: 'local-dialog-' + kind,
        meta: { syncDialog: kind },
        component,
      })),
      { path: '/synchronizer/active', name: 'local-synchronizer-active', component: () => import('./action-bar-50RAQCsf.js') },
      { path: '/synchronizer', name: 'local-synchronizer', component: () => import('./synchronizer-mUJbzl7S.js') },
      {
        path: '/agent-console',
        name: 'agent-console',
        component: agentShell,
        children: [
          { path: 'mcp', name: 'agent-console-settings', component: () => import('./AgentSettingsRoute-BB9ba93X.js') },
          { path: '', name: 'agent-console-chat', component: agentChat },
          { path: 'c/:conversationId', name: 'agent-console-conversation', component: agentChat },
          { path: 'task-manager', name: 'agent-console-task-manager', component: () => import('./TaskManagerRoute-iC4ANt4w.js') },
          { path: 'templates', name: 'agent-console-my-templates', component: () => import('./MyTemplatesRoute-Eq3HlS6M.js') },
          { path: 'settings', name: 'agent-console-roxyclaw', component: () => import('./local-pages.js').then(module => module.AgentConfig) },
          ...['telegram', 'lark', 'slack', 'discord'].map(provider => ({
            path: 'roxyclaw/' + provider,
            name: 'agent-console-roxyclaw-' + provider,
            component: () => import('./local-pages.js').then(module => module.AgentIntegrationSettings),
            props: { provider },
          })),
          { path: 'skills', name: 'local-agent-skills', component: () => import('./local-pages.js').then(module => module.Skills) },
          { path: 'template-store', name: 'agent-console-template-store', component: () => import('./TemplateStoreRoute-vzcUC0bD.js') },
        ],
      },
      {
        path: '/',
        component: () => import('./layout-C916OUcf.js'),
        redirect: '/browser/list',
        children: [
          { path: 'api-keys', name: 'api-keys', component: managementPage('api', () => import('./api-keys-qLZdcspG.js')),
            props: route => managementProps(route), meta: { title: 'API & AI MCP' } },
          { path: 'extensions', name: 'local-extensions', component: managementPage('extensions', () => import('./extensions-DkcE60nw.js')),
            props: route => managementProps(route), meta: { title: '扩展中心' } },
          {
            path: 'account', name: 'local-account-root', redirect: '/account/list',
            children: [
              { path: 'list', name: 'account-list', component: managementPage('accounts', () => import('./list-CkXy4JN3.js')),
                props: route => managementProps(route), meta: { title: '平台账号' } },
              { path: 'create', name: 'account-create', component: managementPage('accounts', () => import('./create-QG0MnZuH.js')),
                props: route => managementProps(route, { create: true }), meta: { title: '添加账号' } },
            ],
          },
          { path: 'kernels', name: 'local-kernels', component: () => import('./kernels-route.js'), props: legacyRendererProps },
          { path: 'templates', name: 'local-templates', component: () => import('./templates-route.js'), props: legacyRendererProps },
          {
            path: 'projects', name: 'projects', redirect: '/projects/list',
            children: [
              { path: ':id/new-window', name: 'project-new-window', component: managementPage('project-editor'),
                props: route => managementProps(route, { id: route.params.id }) },
              { path: ':id', name: 'project-item', component: managementPage('projects', () => import('./project-item-Dd4vT7Wq.js')),
                props: route => managementProps(route, { id: route.params.id }) },
              { path: 'list', name: 'project-list', component: managementPage('projects', () => import('./projects-CN6_vL2j.js')),
                props: route => managementProps(route) },
            ],
          },
          { path: 'agent/create', name: 'agent-create', component: () => import('./create-DJwGZbA7.js') },
          { path: 'agent', name: 'agent-list', component: () => import('./agent-CYnwl_KT.js') },
          {
            path: 'browser', name: 'browser', redirect: '/browser/list',
            children: [
              { path: 'list', name: 'browser-list', component: () => import('./list-ByevuXQD.js') },
              { path: 'edit', name: 'browser-edit', component: () => import('./edit-IaDdchpD.js') },
              { path: 'create', name: 'browser-create', component: () => import('./create-HSjma60V.js') },
            ],
          },
        ],
      },
    ],
  });
}

export { createWorkbenchRouter, syncDialogKinds };
