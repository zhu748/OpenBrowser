<script setup>
import { nn as usePermissions } from './utils-BIWenCnY.js';
import { n as requestType } from './permission-DOhNJfB3.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import { i as isMemberLabel, r as useProjects } from './use-tag-menu-DZnIrtE9.js';

const props = defineProps({ labels: Array, projectId: {}, projectName: {}, disabled: Boolean });
const emit = defineEmits(['update']);
const { check } = usePermissions();
const { openMenu } = useProjects({
  projectId: () => props.projectId == null ? undefined : String(props.projectId),
  disabled: () => props.disabled,
  canCreate: () => check('Projects_add'),
  onChange({ projectName, projectId }) {
    const labelInfo = (props.labels ?? []).filter(label => !isMemberLabel(label.labelId));
    emit('update', { projectName, projectId, requestType: requestType.MoveProject, labelInfo, labelIds: labelInfo.map(label => label.labelId) });
  },
});
</script>

<template><Tag class="cursor-pointer" icon="base/rx_ic_stack" :label="projectName" @click.stop="openMenu" /></template>
