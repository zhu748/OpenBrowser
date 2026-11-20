import { computed, inject, onMounted, ref, watch } from "./workbench-vue.js";
import { N as useAgentApi, Sn as parsePrompt, sn as useLocale } from "./utils-BIWenCnY.js";
import { n as useDialog } from "./usedialog-Dh0xp3r7.js";
import { c as serializeParameters, f as isParameterDraft, h as validateParameters, l as createParameterDraft, m as readSchema, s as ParameterError, u as parameterSchema } from "./ScriptSchemaForm-z_48GvPJ.js";
import { templateDialogRuntime } from "./CreateTemplateDialog-Bpq9OLTG.js";

export function useTemplateDialog() {
  const { localizedText, readTemplatePrompt, parseTemplate, unwrapResult, parseOfficialTemplates, unwrapUpload,
    reservedSlug, normalizeSlug, UploadScript } = templateDialogRuntime;

  const dialog = inject("dialogRef");
  const options = dialog?.value.data ?? {};
  const template = options.template;
  const officialTemplate = options.officialTemplate;
  const needsDetail = !!(options.loadDetail && template);
  const api = useAgentApi();
  const dialogs = useDialog();
  const locale = useLocale();
  const kind = ref(template?.kind ?? parseKind(officialTemplate?.templateType) ?? parseKind(options.initialKind) ?? (typeof options.initialPrompt === "string" && options.initialPrompt.trim() ? "prompt" : "script"));
  const name = ref(needsDetail ? "" : template?.name ?? localizedText(officialTemplate?.name, locale.currentLocale) ?? "");
  const description = ref(needsDetail ? "" : template?.description ?? localizedText(officialTemplate?.description, locale.currentLocale) ?? "");
  const prompt = ref(needsDetail ? "" : typeof template?.metadata.prompt == "string" ? template.metadata.prompt : options.initialPrompt ?? readTemplatePrompt(officialTemplate, locale.currentLocale));
  const selectedSource = ref(needsDetail ? undefined : template?.officialTemplateId ?? officialTemplate?.id ?? (template ? "custom" : undefined));
  const sources = ref(officialTemplate ? [officialTemplate] : []);
  const uploaded = ref();
  const uploadedMetadata = ref({});
  const loadedTemplate = ref();
  const params = ref(needsDetail ? {} : template?.metadata.params && typeof template.metadata.params == "object" && !Array.isArray(template.metadata.params) ? { ...template.metadata.params } : {});
  const parameterDraft = ref({});
  const parameterErrors = ref([]);
  const showValidation = ref(false);
  const attemptedSave = ref(false);
  const schemaError = ref("");
  const loadingSources = ref(false);
  const loadingDetail = ref(needsDetail);
  const detailError = ref("");
  const uploading = ref(false);
  const dragging = ref(false);
  const saving = ref(false);
  const error = ref("");
  const skillInput = ref();
  let sourceRevision = 0;
  let dragDepth = 0;
  const editing = computed(() => !!template);
  const readonly = computed(() => !!options.readonly);
  const lockedSource = computed(() => readonly.value || !!options.lockSource || editing.value && kind.value !== "script");
  const showSourceSkeleton = computed(() => loadingSources.value && !lockedSource.value && !loadingDetail.value);
  const canSave = computed(() => !loadingDetail.value && !detailError.value);
  const kinds = computed(() => [{ value: "script", label: $t("脚本"), tooltip: $t("本地脚本按任务窗口运行") }, { value: "skill", label: "Skill", tooltip: $t("AI 深度参与的自动化，适合调研和分析等任务") }, { value: "prompt", label: $t("提示词"), tooltip: "" }]);
  const sourceOptions = computed(() => [...sources.value.map((e5) => ({ label: localizedText(e5.name, locale.currentLocale) || e5.slug, value: e5.id })), ...uploaded.value || kind.value === "script" && (loadedTemplate.value ?? template)?.metadata.filename ? [{ label: uploaded.value?.filename || (loadedTemplate.value ?? template).metadata.filename, value: "custom" }] : []]);
  const selectedOfficial = computed(() => typeof selectedSource.value == "number" ? sources.value.find((e5) => e5.id === selectedSource.value) : undefined);
  const metadata = computed(() => kind.value === "script" && uploaded.value ? uploadedMetadata.value : loadedTemplate.value ? loadedTemplate.value.metadata : template ? template.metadata : selectedOfficial.value?.metadata ?? uploadedMetadata.value);
  const sourceLabel = computed(() => {
    if (typeof selectedSource.value == "number") return sourceOptions.value.find((e6) => e6.value === selectedSource.value)?.label || `${$t("官方模板")} #${selectedSource.value}`;
    let e5 = loadedTemplate.value ?? template;
    return (e5 && typeof e5.metadata.filename == "string" ? e5.metadata.filename : "") || $t("自定义上传");
  });
  const validationMessage = computed(() => !attemptedSave.value || kind.value !== "script" ? "" : name.value.trim() ? !editing.value && selectedSource.value == null ? $t("请选择或上传脚本") : showValidation.value && parameterErrors.value.length ? $t("有 {count} 个脚本参数填写有误，请检查标红内容后重试。", { count: parameterErrors.value.length }) : "" : $t("请输入模板名称"));
  const errorMessage = computed(() => error.value || validationMessage.value);

  function parseKind(e5) {
    return e5 === "script" || e5 === "skill" || e5 === "prompt" ? e5 : undefined;
  }

  const detailDescription = computed(() => {
    if (selectedOfficial.value) return localizedText(selectedOfficial.value.description, locale.currentLocale);
    if (kind.value === "skill") {
      let e5 = metadata.value.skillMetadata;
      if (e5 && typeof e5 == "object" && !Array.isArray(e5)) {
        let t3 = e5.description;
        if (typeof t3 == "string") return t3;
      }
    }
    return description.value;
  });
  const schema = computed(() => {
    try {
      return readSchema(metadata.value.optionsSchema);
    } catch {
      return null;
    }
  });

  function resetParameters(e5 = params.value) {
    parameterDraft.value = schema.value ? createParameterDraft(schema.value, e5) : {}, parameterErrors.value = [], showValidation.value = false, attemptedSave.value = false, schemaError.value = "";
  }

  function updateParameters(e5) {
    parameterDraft.value = isParameterDraft(e5.data) ? e5.data : {}, parameterErrors.value = e5.errors ?? [];
  }

  function assignTemplate(e5) {
    loadedTemplate.value = e5, name.value = e5.name, description.value = e5.description, prompt.value = typeof e5.metadata.prompt == "string" ? e5.metadata.prompt : "", selectedSource.value = e5.officialTemplateId ?? "custom", params.value = e5.metadata.params && typeof e5.metadata.params == "object" && !Array.isArray(e5.metadata.params) ? { ...e5.metadata.params } : {}, resetParameters();
  }

  async function loadDetail(e5) {
    loadingDetail.value = true, detailError.value = "";
    try {
      let t3 = parseTemplate(unwrapResult(await api.userTemplates.getUserTemplate({ templateId: e5 }), $t("加载我的模板失败")));
      if (!t3) throw Error($t("加载我的模板失败"));
      assignTemplate(t3);
    } catch (e6) {
      console.error("Failed to load user template detail", e6), detailError.value = e6 instanceof Error ? e6.message : $t("加载我的模板失败");
    } finally {
      loadingDetail.value = false;
    }
  }

  function retryDetail() {
    template && loadDetail(template.id);
  }

  async function loadSources(templateType) {
    const revision = ++sourceRevision;
    if (templateType === "prompt") {
      sources.value = [];
      loadingSources.value = false;
      return;
    }
    loadingSources.value = true;
    try {
      const templates = parseOfficialTemplates(await api.templates.listOfficialTemplates({ templateType }), $t("加载官方模板失败"));
      if (revision === sourceRevision) sources.value = templates.filter(template => template.templateType === templateType);
    } catch (failure) {
      if (revision !== sourceRevision) return;
      sources.value = [];
      error.value = failure instanceof Error ? failure.message : $t("加载官方模板失败");
    } finally {
      if (revision === sourceRevision) loadingSources.value = false;
    }
  }

  function cannotChangeKind() {
    return editing.value || lockedSource.value || saving.value || !!options.lockKind;
  }

  function changeKind(e5) {
    cannotChangeKind() || kind.value === e5 || (kind.value = e5, selectedSource.value = undefined, uploaded.value = undefined, uploadedMetadata.value = {}, params.value = {}, description.value = "", prompt.value = "", error.value = "", clearDrag(), resetParameters({}), loadSources(e5));
  }

  function selectSource() {
    if (editing.value) return;
    let e5 = selectedOfficial.value;
    e5 && (name.value = localizedText(e5.name, locale.currentLocale) || e5.slug, description.value = localizedText(e5.description, locale.currentLocale), params.value = {}, resetParameters({}), kind.value === "skill" && (prompt.value = readTemplatePrompt(e5, locale.currentLocale)));
  }

  async function uploadScript(e5, t3) {
    if (error.value = "", reservedSlug(t3.metadata.slug)) return error.value = $t("脚本 slug 不能以 official- 开头，请修改脚本中的 defineMetadata.slug 后重试"), false;
    try {
      let n2 = unwrapUpload(await api.userTemplates.uploadUserTemplateScript({ file: e5 }), $t("上传脚本失败")), r2 = normalizeSlug(t3.metadata.slug);
      return uploaded.value = n2, uploadedMetadata.value = { fileId: n2.fileId, ossUrl: n2.ossUrl, sha512: n2.sha512, contentType: n2.contentType, fileSize: n2.fileSize, filename: n2.filename, scriptSource: n2.scriptSource, optionsSchema: n2.optionsSchema, ...r2 ? { slug: r2 } : {} }, params.value = {}, selectedSource.value = "custom", name.value = localizedText(t3.metadata.name, locale.currentLocale) || name.value, description.value = t3.metadata.description ? localizedText(t3.metadata.description, locale.currentLocale) : "", resetParameters({}), true;
    } catch (e6) {
      return error.value = e6 instanceof Error ? e6.message : $t("上传脚本失败"), false;
    }
  }

  function openScriptUpload() {
    dialogs.open(UploadScript, { props: { modal: true, blockScroll: true, dismissableMask: false, draggable: false, showHeader: false, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-upload-script-dialog", content: "!p-0 !overflow-hidden" } }, data: { onUpload: uploadScript, initialSource: metadata.value.scriptSource, initialFilename: metadata.value.filename } });
  }

  async function uploadSkill(e5) {
    if (!e5.name.toLowerCase().endsWith(".zip")) error.value = $t("仅支持 .zip Skill 包");
    else {
      uploading.value = true, error.value = "";
      try {
        let t3 = unwrapUpload(await api.userTemplates.uploadUserTemplateSkill({ file: e5 }), $t("上传 Skill 失败")), n2 = normalizeSlug(t3.packageSlug);
        uploaded.value = t3, uploadedMetadata.value = { fileId: t3.fileId, ossUrl: t3.ossUrl, sha512: t3.sha512, contentType: t3.contentType, fileSize: t3.fileSize, filename: t3.filename, ...n2 ? { slug: n2 } : {}, skillMetadata: t3.skillMetadata ?? {}, packageSlug: t3.packageSlug, fileCount: t3.fileCount, files: t3.files, skillMdPath: t3.skillMdPath }, prompt.value = "", selectedSource.value = "custom", name.value = t3.packageName || name.value, description.value = t3.packageDescription || "";
      } catch (e6) {
        error.value = e6 instanceof Error ? e6.message : $t("上传 Skill 失败");
      } finally {
        uploading.value = false;
      }
    }
  }

  async function onSkillChange(e5) {
    let t3 = e5.target, n2 = t3.files?.[0];
    t3.value = "", n2 && await uploadSkill(n2);
  }

  function isFileDrag(e5) {
    return Array.from(e5.dataTransfer?.types ?? []).includes("Files");
  }

  function canDropSkill(e5) {
    return kind.value === "skill" && !lockedSource.value && !readonly.value && !saving.value && !uploading.value && isFileDrag(e5);
  }

  function clearDrag() {
    dragDepth = 0, dragging.value = false;
  }

  function dragEnter(e5) {
    canDropSkill(e5) && (e5.preventDefault(), dragDepth += 1, dragging.value = true);
  }

  function dragOver(e5) {
    canDropSkill(e5) && (e5.preventDefault(), e5.dataTransfer && (e5.dataTransfer.dropEffect = "copy"));
  }

  function dragLeave(e5) {
    isFileDrag(e5) && (e5.preventDefault(), dragDepth = Math.max(0, dragDepth - 1), dragDepth === 0 && (dragging.value = false));
  }

  async function dropSkill(e5) {
    if (!canDropSkill(e5)) return;
    e5.preventDefault();
    let t3 = e5.dataTransfer?.files?.[0];
    clearDrag(), t3 && await uploadSkill(t3);
  }

  async function close() {
    await options.onCancel?.(), dialog?.value.close();
  }

  function buildMetadata() {
    if (kind.value === "prompt") return { prompt: prompt.value.trim() };
    if (kind.value === "skill") {
      let e5 = prompt.value.trim();
      return editing.value ? { prompt: e5 } : { ...selectedSource.value === "custom" ? uploadedMetadata.value : {}, prompt: e5 };
    }
    return { ...selectedSource.value === "custom" ? uploadedMetadata.value : {}, params: params.value };
  }

  function getParameters(e5) {
    let t3 = readSchema(metadata.value.optionsSchema);
    if (!t3) return {};
    if (schemaError.value) throw new ParameterError(schemaError.value);
    return e5 ? (parameterErrors.value = validateParameters(parameterSchema(t3), parameterDraft.value, locale.currentLocale), serializeParameters(parameterDraft.value, parameterErrors.value)) : serializeParameters(parameterDraft.value);
  }

  async function save(e5) {
    error.value = "", kind.value === "script" && (attemptedSave.value = true);
    let n2 = name.value.trim();
    if (!n2) kind.value !== "script" && (error.value = $t("请输入模板名称"));
    else if (kind.value === "prompt" && !prompt.value.trim()) error.value = $t("请输入提示词内容");
    else {
      if (kind.value === "skill" || kind.value === "prompt") {
        let e6 = parsePrompt(prompt.value);
        if (e6.hasProfileSelection) {
          error.value = $t("模板提示词不能包含浏览器选择，请移除后保存。浏览器可在使用模板时选择。");
          return;
        }
        if (e6.missingInputLabels.length) {
          error.value = $t("请填写以下提示词参数后再保存：{items}", { items: e6.missingInputLabels.join("、") });
          return;
        }
      }
      if (kind.value !== "prompt" && !editing.value && selectedSource.value == null) kind.value !== "script" && (error.value = $t("请选择或上传 Skill"));
      else {
        if (kind.value === "script") {
          showValidation.value = e5;
          try {
            params.value = getParameters(false);
          } catch (e6) {
            if (e6 instanceof ParameterError && parameterErrors.value.length) return;
            error.value = e6 instanceof ParameterError ? e6.message : $t("脚本参数校验失败");
            return;
          }
        }
        saving.value = true;
        try {
          await options.onSave?.({ templateType: kind.value, name: n2, description: description.value.trim(), metadata: buildMetadata(), officialTemplateId: typeof selectedSource.value == "number" ? selectedSource.value : undefined, saveAndRun: e5 }) !== false && dialog?.value.close();
        } finally {
          saving.value = false;
        }
      }
    }
  }

  watch(selectedSource, selectSource);

  onMounted(() => {
    needsDetail && template ? (loadDetail(template.id), options.lockSource || loadSources(kind.value)) : (resetParameters(), options.lockSource || loadSources(kind.value));
  });

  return { options, locale, kind, name, prompt, selectedSource, uploaded, parameterDraft, showValidation, schemaError, loadingSources, loadingDetail, detailError,
    uploading, dragging, saving, skillInput, editing, readonly, lockedSource, showSourceSkeleton, canSave, kinds, sourceOptions, selectedOfficial,
    metadata, sourceLabel, errorMessage, detailDescription, schema, updateParameters, retryDetail, cannotChangeKind, changeKind,
    openScriptUpload, onSkillChange, dragEnter, dragLeave, dragOver, dropSkill, close, save };
}
