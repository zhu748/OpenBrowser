import { h, toRaw } from './workbench-vue.js';
import {
  a as findInput, at as useWorkspaceRole, h as api, r as filterObject, s as buildInputValues,
  v as useUser, xr as isEmpty,
} from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useFeedback } from './agent-BmSFI9WH.js';
import { r as eventBus } from './rich-html-link-VdBpR3Cm.js';
import { w as useBusinessCode } from './hook-CnJE4hRq.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { t as useNetworkChecks } from './hooks-Jw3GridD.js';
import { a as generateProfileName } from './quick-kroUOSn_.js';
import { o as hasProfileName } from './utils-CnUy4XUk.js';
import { o as useProjectOptions } from './use-tag-menu-DZnIrtE9.js';
import { t as preparePayload } from './api-extract-BlmYcIz7.js';
import {
  o as cleanPayload, r as initializeForm, t as readFingerprint,
} from './form-inputs-CnnG6T0O.js';
import QuickCreateEditor from './workbench-quick-create-editor.js';

export function useQuickCreate() {
  const { isOwner } = storeToRefs(useWorkspaceRole());
  const { userConfig } = storeToRefs(useUser());
  const { getProjects } = useProjectOptions();
  const { handleBusinessCode } = useBusinessCode();
  const { testProxy } = useNetworkChecks();
  const [showFeedback, showError] = useFeedback();
  const [openDialog] = useDialog();
  let creating = false;

  async function fetchQuickCreateTemplate() {
    const { code, data, msg } = await api.window.userGetQuickCreateTemplateList();
    showError(code, msg);
    if (code !== 0 || !data) return null;
    return {
      id: data.id,
      templateInfo: cleanPayload(data.templateInfo && typeof data.templateInfo === 'object' ? data.templateInfo : {}),
    };
  }

  async function saveQuickCreateTemplate(template, id) {
    const info = cleanPayload(template);
    const { code, msg } = id
      ? await api.window.userMdfQuickCreateTemplateCreate({ id, ...info })
      : await api.window.userAddQuickCreateTemplateCreate(info);
    showError(code, msg);
    return code === 0;
  }

  async function defaultProject() {
    const projects = await getProjects();
    const project = projects.find(item => item.projectDefault) ?? projects[0];
    return {
      projectName: project?.label || $t('未指定项目'), projectId: project?.value,
      labelIds: [], windowRemark: '', projectDefault: Number(Boolean(project)),
    };
  }

  async function canCreateWindow() {
    const { code, msg } = await api.window.userCheckWindowTotalCountList();
    if (code === 0) return true;
    handleBusinessCode(code, () => showError(code, msg));
    return false;
  }

  async function createAndOpenFromFormData(template, { openAfterCreate = false } = {}) {
    if (creating) return false;
    creating = true;
    try {
      if (!await canCreateWindow()) return false;
      const [groups, baseValues] = await initializeForm(template);
      const [fingerprint] = await readFingerprint(groups);
      // The preview reports its own failure. Do not submit a form without
      // a fingerprint or turn the same message into a second notification.
      if (!fingerprint) return false;
      Object.assign(baseValues, fingerprint);
      const project = filterObject(toRaw(await defaultProject()), value => !isEmpty(value));
      const inputValues = buildInputValues(groups, project);
      if (!hasProfileName(inputValues.windowName)) {
        const inputs = groups[0] ?? [];
        const name = await generateProfileName({
          accounts: findInput(inputs, 'windowPlatformList')?.value,
          proxyList: findInput(inputs, 'proxyInfoList')?.value,
        });
        if (name) inputValues.windowName = name;
      }
      const form = cleanPayload({ createCount: 1, ...toRaw(baseValues), ...inputValues });
      const payload = cleanPayload(await preparePayload(form, {
        checkChannel: userConfig.value.ipChecker, isDirect: false, testProxy,
      }));
      const { code, data, msg } = await api.window.userAddWindowInfoV2Create(payload);
      if (code !== 0) {
        showError(code, msg);
        return false;
      }
      eventBus.emit('refreshProfileList', openAfterCreate ? data?.windowId : undefined);
      showFeedback(0, msg || $t('创建成功'));
      return true;
    } finally {
      creating = false;
    }
  }

  async function openQuickCreateEditor() {
    const saved = await fetchQuickCreateTemplate();
    return openDialog({
      showHeader: false, modal: true, blockScroll: true,
      pt: { root: { class: 'quick-create-dialog' }, content: { class: '!pa-0 !overflow-hidden' } },
      slots: {
        container: ({ hideModal }) => h(QuickCreateEditor, {
          template: saved?.templateInfo ?? {},
          onClose: hideModal,
          onSaved: async ({ formData, createAndRun }) => {
            if (!await saveQuickCreateTemplate(formData, saved?.id)) throw Error($t('保存配置'));
            hideModal();
            if (createAndRun) await createAndOpenFromFormData(formData, { openAfterCreate: true });
          },
        }),
      },
    });
  }

  async function onQuickCreateMainClick() {
    try {
      return await createAndOpenFromFormData((await fetchQuickCreateTemplate())?.templateInfo ?? {});
    } catch (error) {
      showError(-1, error.message);
      return false;
    }
  }
  async function onQuickCreateSettingsClick() {
    try {
      return await openQuickCreateEditor();
    } catch (error) {
      showError(-1, error.message);
    }
  }

  return {
    canQuickCreate: () => isOwner.value, fetchQuickCreateTemplate, saveQuickCreateTemplate, createAndOpenFromFormData,
    openQuickCreateEditor, onQuickCreateMainClick, onQuickCreateSettingsClick,
  };
}
