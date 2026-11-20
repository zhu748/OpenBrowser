<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ToolScreen from './ToolScreen.vue';
import ProfileEditor from './profiles/ProfileEditor.vue';
import ProfileImport from './profiles/ProfileImport.vue';
import ProfilesPage from './profiles/ProfilesPage.vue';
import ProxiesPage from './proxies/ProxiesPage.vue';
import ManagementHost from './management/ManagementHost.vue';
import type { ManagementScreen } from './management/mount';
import { request, subscribe } from './desktop';

function currentRoute() {
  const hash = location.hash.slice(1) || '/profiles';
  const [rawPath, query] = hash.split('?', 2);
  const params = new URLSearchParams(query);
  let path = rawPath === '/browser/list' ? '/profiles' : rawPath;
  if (path === '/profiles/edit' && !params.get('id')) path = '/profiles';
  if (path === '/templates/edit' && !params.get('template')) path = '/templates';
  return { path, params, key: hash };
}

const route = ref(currentRoute());
const nav = [
  { path: '/profiles', label: '窗口管理' },
  { path: '/trash', label: '回收站' },
  { path: '/templates', label: '窗口模板' },
  { path: '/proxies', label: '代理库' },
  { path: '/kernels', label: '内核管理' },
  { path: '/projects', label: '项目' },
  { path: '/accounts', label: '平台账号' },
  { path: '/extensions', label: '扩展中心' },
  { path: '/api-keys', label: 'API & MCP' },
];
const update = () => { route.value = currentRoute(); };
const theme = matchMedia('(prefers-color-scheme: dark)');
const updateTheme = () => { document.documentElement.dataset.theme = theme.matches ? 'dark' : 'light'; };
const go = (path: string) => { location.hash = path; };
const edit = (id: string) => go(`/profiles/edit?id=${encodeURIComponent(id)}`);
const openTemplate = (id?: number) => go(id == null ? '/templates/new' : `/templates/edit?template=${encodeURIComponent(id)}`);
const editorPaths = new Set(['/profiles/new', '/profiles/batch', '/profiles/edit', '/templates/new', '/templates/edit']);
const openProject = (id?: string) => go(id ? `/projects?id=${encodeURIComponent(id)}` : '/projects');
const pinned = ref<{ id: string; projectName: string }[]>([]);
let projectSequence = 0;
let stopProjects: (() => void) | undefined;
async function refreshPins() {
  const ticket = ++projectSequence;
  const rows = await request<typeof pinned.value>('groups:list', { default: 2, pinnedOnly: true }).catch(() => null);
  if (rows && ticket === projectSequence) pinned.value = rows.slice(0, 5);
}
const management = computed<ManagementScreen | null>(() => {
  switch (route.value.path) {
    case '/projects':
      return {
        kind: 'projects', id: route.value.params.get('id') ?? undefined, openProject,
        openProfile: (id, projectId) => id ? edit(id) : go(`/profiles/new?project=${encodeURIComponent(projectId ?? '')}`),
      };
    case '/accounts':
    case '/accounts/new':
      return { kind: 'accounts', create: route.value.path.endsWith('/new'), openAccounts: create => go(create ? '/accounts/new' : '/accounts') };
    case '/extensions': return { kind: 'extensions' };
    case '/api-keys': return { kind: 'api' };
    default: return null;
  }
});

onMounted(() => {
  updateTheme();
  theme.addEventListener('change', updateTheme);
  window.addEventListener('hashchange', update);
  stopProjects = subscribe(event => {
    if (event.type === 'profiles' && event.action === 'group-metadata') void refreshPins();
  });
  void refreshPins();
});
onBeforeUnmount(() => {
  projectSequence++;
  stopProjects?.();
  theme.removeEventListener('change', updateTheme);
  window.removeEventListener('hashchange', update);
});
</script>

<template>
  <div class="workspace">
    <aside class="rail">
      <a class="brand" href="#/profiles">OpenBrowser</a>
      <nav aria-label="工作台">
        <a v-for="item in nav" :key="item.path" :href="`#${item.path}`"
          :aria-current="route.path === item.path || route.path.startsWith(`${item.path}/`) ? 'page' : undefined">{{ item.label }}</a>
      </nav>
      <nav v-if="pinned.length" class="pinned-projects" aria-label="固定项目">
        <a v-for="item in pinned" :key="item.id" :href="'#/projects?id=' + encodeURIComponent(item.id)"
          :aria-current="route.path === '/projects' && route.params.get('id') === item.id ? 'page' : undefined">{{ item.projectName }}</a>
      </nav>
    </aside>
    <main :key="route.key" class="workspace-main">
      <ProfilesPage v-if="route.path === '/profiles' || route.path === '/trash'" :trash="route.path === '/trash'" :edit="edit" :create="() => go('/profiles/new')" />
      <ToolScreen v-else-if="route.path === '/templates' || route.path === '/kernels'" :kind="route.path === '/templates' ? 'templates' : 'kernels'" :open-template="openTemplate" />
      <ProfileImport v-else-if="route.path === '/profiles/import'" />
      <ProxiesPage v-else-if="route.path === '/proxies'" />
      <ManagementHost v-else-if="management" :screen="management" />
      <ProfileEditor v-else-if="editorPaths.has(route.path)" :id="route.path === '/profiles/edit' ? route.params.get('id') : null"
        :project-id="route.params.get('project')" :template-id="route.params.get('template')"
        :template-mode="route.path.startsWith('/templates/')" :batch="route.path === '/profiles/batch'"
        :done="() => route.params.has('project') ? openProject(route.params.get('project') || undefined) : go(route.path.startsWith('/templates/') ? '/templates' : '/profiles')" />
      <section v-else class="workspace-page"><h1>此页面尚未迁移</h1><a href="#/profiles">返回窗口管理</a></section>
    </main>
  </div>
</template>
