<script setup>
import { computed, inject, onMounted, ref } from 'vue';
import { h as api } from './utils-BIWenCnY.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Table } from './table-BJcS2I0Z.js';
import { useExtensionText } from './extension-labels.js';

const dialog = inject('dialogRef');
const [, showError] = useFeedback();
const text = useExtensionText();
const extension = ref();
const projects = ref([]);
const selected = ref([]);
const columns = computed(() => [{ header: text.value.projectNameColumn, field: 'projectName', slot: 'project' }]);
let saving = false;

onMounted(async () => {
  extension.value = dialog.value.data.props;
  try {
    const { data, code, msg } = await api.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
    if (code !== 0) {
      showError(code, msg);
      return;
    }
    projects.value = data.rows ?? [];
    selected.value = projects.value.filter(project => extension.value.bindPluginId?.includes(project.project_id));
  } catch (error) {
    showError(-1, error.message);
  }
});

function close() {
  dialog.value.close();
  dialog.value.data.onCancel?.();
}

async function save() {
  if (saving || !extension.value) return;
  const assigned = new Set((selected.value ?? []).map(row => row.project_id));
  if (extension.value.required && !assigned.size) {
    showError(-1, text.value.selectAtLeastOneProject);
    return;
  }
  saving = true;
  try {
    const projectId = projects.value.map(project => project.project_id);
    const installStatus = projectId.map(id => Number(assigned.has(id)));
    await dialog.value.data.onConfirm?.({
      pluginSwitchType: Number(extension.value.pluginSwitchType || 2),
      projectId, installStatus, installType: installStatus.includes(0) ? 1 : 0,
    });
    close();
  } catch (error) {
    showError(-1, error.message);
  } finally {
    saving = false;
  }
}
</script>

<template>
  <div class="flex flex-col overflow-y-hidden popup">
    <div v-if="extension" class="extension">
      <div class="extension-icon"><img class="extension-icon-image" :src="extension.pluginIcon"></div>
      <div class="extension-name">{{ extension.pluginName }}</div>
      <div class="extension-version"> v{{ extension.pluginVersion }}</div>
    </div>
    <div>
      <div class="title">{{ text.installToProjectTitle }}</div>
      <div class="description">
        <Icon name="base/rx_ic_info_fill" :size="12" color="#A3A9AD" />{{ ' ' + text.installToWindow }}
      </div>
      <div class="project-table mt-2.5 h-60">
        <Table v-model:selection="selected" data-key="project_id" :columns="columns" :data-list="projects"
          :regions="{ header: false, paginator: false, actions: false, selectionBar: false }"
          selection-mode="multiple" size="small">
          <template #project="{ data }">
            <div class="flex items-center gap-2">
              <Icon name="base/rx_ic_stack" color="var(--colors-icon-icon-secondary, #575D61)" />
              <span class="project-name">{{ data.projectName }}</span>
            </div>
          </template>
        </Table>
      </div>
    </div>
    <div class="flex justify-end items-center gap-3">
      <Button size="sm" :label="translate('取消')" text severity="secondary" autofocus @click.stop="close" />
      <Button size="sm" :label="translate('保存')" autofocus @click.stop="save" />
    </div>
  </div>
</template>
