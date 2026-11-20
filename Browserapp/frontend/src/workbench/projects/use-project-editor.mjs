import { h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { t as useSchemaDialog } from './useFormDialog-ChvKgFzE.js';
import { n as useProjectLabels } from './useProjectEntityLabels-DdcfADRx.js';
import { t as projectSchemas } from './schemas-Y9Ask_a8.js';

function useProjectEditor({ toast = true } = {}) {
  const [showForm] = useSchemaDialog();
  const [notify] = useFeedback();
  const labels = useProjectLabels();
  async function open(project = {}) {
    const { project_id: id, confirmNext, ...initial } = project;
    const names = labels.value;
    const { formRef } = await showForm({
      header: id ? names.editTitle : names.createTitle,
      class: 'w-[500px]', schemas: projectSchemas(names), formProps: { layout: 'vertical' },
      async handleOk(params) {
        const result = id ? await api.limit.userMdfProjectInfoCreate({ id, ...params }) : await api.limit.userAddProjectInfoCreate(params);
        if (toast || result.code !== 0) notify(result.code, result.msg);
        if (result.code !== 0) return false;
        if (typeof confirmNext === 'function') await confirmNext({ params, res: result });
        return true;
      },
    });
    formRef.value?.setFieldsValue({ id, project_id: id, ...initial });
  }
  return [open];
}

export { useProjectEditor as t };
