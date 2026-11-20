<script setup>
import { computed, ref } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Form } from './form-BQBA_XzO.js';
import { n as useProjectLabels } from './useProjectEntityLabels-DdcfADRx.js';

const props = defineProps({ data: Object, onClose: Function, onSuccess: Function });
const labels = useProjectLabels();
const [, report] = useFeedback();
const fields = computed(() => [{
  type: 'text', name: 'projectName', value: props.data?.projectName,
  props: { placeholder: labels.value.namePlaceholder, size: 'lg' },
  resolver: schema => schema.string().min(1, labels.value.nameRequired).min(2, labels.value.nameMinLength).max(30, labels.value.nameMaxLength),
}]);
const saving = ref(false);
async function save(values) {
  if (saving.value) return;
  saving.value = true;
  try {
    const { code, msg } = await api.limit.userAddProjectInfoCreate({ ...values });
    report(code, msg);
    if (code === 0) await props.onSuccess?.();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col pa-6 pt-4 gap-6 w-120">
    <div class="h-9 flex justify-between items-center">
      <div class="tt-primary text-4 font-600">{{ labels.createTitle }}</div>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" @click="onClose" />
    </div>
    <Form id="gen_project" class="-mt-2" :inputs="fields" @submit="save" />
    <div class="flex flex-col gap-5 relative w-full">
      <Button class="self-end" size="md" form="gen_project" type="submit" :loading="saving" :label="$t('确认')" />
    </div>
  </div>
</template>
