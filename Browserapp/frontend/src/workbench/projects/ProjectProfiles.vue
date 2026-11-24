<script setup>
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import { nn as usePermission, vt as cache, yt as useCache } from './utils-BIWenCnY.js';
import { n as pinStatus } from './project-zUGx3yhI.js';
import { b as useRouter, i as onWorkbenchEvent, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Header } from './views-header-CcjwXPjG.js';
import { t as useProjectEditor } from './useProject-BHb2F7tC.js';
import { n as ProfileTable, t as ProfileDialogs } from './renewal-reminder-drawer-C9_4HaAB.js';

const route = useRoute();
const router = useRouter();
const [openEditor] = useProjectEditor();
const { check } = usePermission();
const { invalidateCache } = useCache();
const profiles = useTemplateRef('project');

function normalizeId(id) {
  const first = Array.isArray(id) ? id[0] : id;
  return String(first ?? '');
}

const projectId = ref(normalizeId(route.params.id));
const title = ref(String(route.query.title));

async function loadProject() {
  const id = projectId.value;
  try {
    const groups = await globalThis.__localRequest('groups:list', { default: 2 });
    if (projectId.value !== id) return;
    const group = groups.find(row => row.id === id);
    if (!group) throw Error($t('项目不存在'));
    title.value = group.projectName;
  } catch (error) {
    if (projectId.value === id) globalThis.__localUiError(error.message);
  }
}

function editProject() {
  const id = projectId.value;
  openEditor({
    pinStatus: pinStatus.pinned, projectName: title.value, project_id: id,
    confirmNext: ({ params }) => {
      if (projectId.value === id) title.value = params.projectName;
    },
  });
}

watch(() => route.params.id, id => {
  projectId.value = normalizeId(id);
  title.value = String(route.query.title);
  void loadProject();
});
onWorkbenchEvent('updateProjectList', () => {
  invalidateCache(cache.BROWSER_LIST, { projectId: String(projectId.value) });
  profiles.value?.tableRef?.refresh();
});
onMounted(loadProject);
</script>

<template>
  <div class="flex flex-col h-full w-full relative">
    <Header>
      <template #title>
        <div class="cursor-pointer title" @click="router.replace({ name: 'projects' })">{{ $t('项目管理') }}</div>
      </template>
      <template #title-after>
        <Icon name="base/rx_ic_play" :size="8" />
        <div class="subproject">{{ title }}</div>
        <Icon v-if="check('Projects_edit') && projectId !== 'local-default'" class="cursor-pointer" name="base/rx_ic_edit" color="var(--colors-text-text-secondary)" @click="editProject" />
      </template>
    </Header>
    <div class="flex-1 overflow-hidden"><ProfileTable ref="project" is-project-profile /></div>
    <ProfileDialogs />
  </div>
</template>
