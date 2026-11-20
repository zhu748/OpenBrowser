<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { mt as useWorkspace } from './utils-BIWenCnY.js';
import { n as workspaceName } from './workspace-CNvgSgaH.js';
import { t as Textarea } from './textarea-DvuriTzI.js';

const props = defineProps({ syncWindows: { type: Array, default: () => [] } });
const workspace = useWorkspace();
const name = computed(() => workspaceName(workspace.currentWorkspace?.workspaceName));
const texts = ref({});
const labelList = ref([]);
const labelWidth = ref(0);
watch(() => props.syncWindows, windows => {
  for (const row of windows) texts.value[row.dirId] ??= '';
}, { immediate: true });

onMounted(() => {
  labelWidth.value = Math.ceil(labelList.value.reduce((width, label) => Math.max(width, label.getBoundingClientRect().width), 0));
});

defineExpose({
  get formData() {
    return Object.fromEntries(props.syncWindows.filter(row => texts.value[row.dirId])
      .map(row => [row.$pId, texts.value[row.dirId]]));
  },
});
</script>

<template>
  <div class="diff-text">
    <div v-for="row in syncWindows" :key="row.dirId" class="form-item">
      <div class="form-item-label">
        <label for="diff-text" ref="labelList" :style="{ width: labelWidth + 'px' }">
          <span class="profile-name">{{ name }}-</span><span class="profile-num">{{ row.windowSortNum }}</span>
        </label>
      </div>
      <div class="form-item-content">
        <Textarea v-model="texts[row.dirId]" class="textarea" rows="1" auto-resize
          :placeholder="translate('请在此输入内容，支持换行')" />
      </div>
    </div>
  </div>
</template>
