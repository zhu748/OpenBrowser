import { t as defineSchemas } from './rx-form-A3sc3aGh.js';

function projectSchema(labels) {
  return defineSchemas([{ field: 'projectName', component: 'InputText', componentProps: { placeholder: labels.namePlaceholder },
    rule: { trigger: 'blur', validator: z => z.string().min(1, labels.nameRequired).min(2, labels.nameMinLength).max(30, labels.nameMaxLength) } }]);
}

export { projectSchema as t };
