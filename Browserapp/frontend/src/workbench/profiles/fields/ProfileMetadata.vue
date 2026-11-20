<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { at as useAccount, nn as usePermissions, xr as isEmpty } from './utils-BIWenCnY.js';
import { a as storeToRefs } from './agent-BmSFI9WH.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { r as Remark } from './proxy-create-mode-BCcLAAf5.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { a as canonicalTagId, o as useProjectData, r as useProjectMenu, t as useTagMenu } from './use-tag-menu-DZnIrtE9.js';
import { n as useProjectLabels } from './useProjectEntityLabels-DdcfADRx.js';

const props = defineProps({ isEdit: Boolean, showRemark: { type: Boolean, default: true } });
const metadata = defineModel();
const route = useRoute();
const { isOwner } = storeToRefs(useAccount());
const { check } = usePermissions();
const { getTags, getProjects, getProjectMember } = useProjectData();
const profileLabels = useProfileLabels();
const projectLabels = useProjectLabels();
metadata.value ??= { projectName: projectLabels.value.unspecified, projectId: undefined, labelIds: [], windowRemark: '', projectDefault: 0 };
const titles = ref(new Map());
let sequence = 0;
onMounted(async () => {
  if (props.isEdit || !isEmpty(metadata.value.projectId)) return;
  const projects = await getProjects();
  if (!isEmpty(metadata.value.projectId)) return;
  const projectId = route.query.projectId || (!isOwner.value ? projects[0]?.value : undefined);
  const project = projects.find(row => projectId ? row.value === projectId : row.projectDefault);
  if (project) Object.assign(metadata.value, { projectId: project.value, projectName: project.label, projectDefault: 1 });
});
const { openMenu: openProjects } = useProjectMenu({
  projectId: () => metadata.value?.projectId, canCreate: () => check('Projects_add'),
  onChange: project => Object.assign(metadata.value, { projectId: project.projectId, projectName: project.projectName, projectDefault: project.projectDefault }),
});
const { openMenu: openTags } = useTagMenu({
  labels: () => (metadata.value?.labelIds ?? []).map(id => ({ labelId: canonicalTagId(id) })),
  projectId: () => metadata.value?.projectId, disabled: () => !check('Profiles_select_label'),
  genTag: () => check('Profiles_Label_add'),
  onUpdate({ labelInfo, labelIds }) {
    for (const label of labelInfo) {
      const id = canonicalTagId(label.labelId);
      if (id && label.labelName) titles.value.set(id, label.labelName);
    }
    metadata.value.labelIds = labelIds;
  },
});
async function loadTagTitles() {
  const current = ++sequence;
  const ids = metadata.value?.labelIds ?? [];
  if (!ids.length || ids.every(id => titles.value.has(canonicalTagId(id)))) return;
  const projectId = metadata.value?.projectId;
  const [tags, projectTags] = await Promise.all([getTags(), projectId ? getProjectMember(projectId) : []]);
  if (current !== sequence) return;
  for (const item of [...projectTags, ...tags]) {
    const name = item.label || item.name || item._origin?.userName || item._origin?.name || '';
    if (item.value && name) titles.value.set(String(item.value), name);
  }
}
watch(() => [metadata.value?.projectId, ...(metadata.value?.labelIds ?? [])], loadTagTitles, { immediate: true });
const projectHint = computed(() => projectLabels.value.assignedTooltip(metadata.value?.projectName?.trim() || projectLabels.value.unspecified));
const tagsHint = computed(() => {
  const names = (metadata.value?.labelIds ?? []).map(id => titles.value.get(canonicalTagId(id))).filter(Boolean);
  return names.length ? $t('标签: {names}', { names: names.join('、') }) : $t('标签');
});
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-tooltip.top="projectHint" class="flex items-center">
      <Button :disabled="!check('Profiles_move_project')" outlined severity="secondary" icon="base/rx_ic_stack"
        :label="metadata?.projectName" @click="openProjects" />
    </div>
    <div v-tooltip.top="tagsHint" class="flex items-center position-relative" :class="{ selected: metadata?.labelIds?.length }">
      <Button class="!min-w-auto" :disabled="!check('Profiles_select_label')" outlined severity="secondary" icon="base/rx_ic_tag" @click="openTags" />
    </div>
    <Remark v-if="showRemark" hide-label :disabled="!check('Profiles_edit_remark')" :title="profileLabels.addRemarkTitle"
      :label="$t('备注')" mode="button" :value="metadata?.windowRemark" @confirm="metadata.windowRemark = $event" />
  </div>
</template>
