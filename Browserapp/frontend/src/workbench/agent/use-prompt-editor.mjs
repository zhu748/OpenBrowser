import { computed, onBeforeUnmount, reactive, ref, watch } from "./workbench-vue.js";
import { n as useNotice } from "./agent-BmSFI9WH.js";
import { h as requests, N as useAgentApi, sn as useLocale, mt as useWorkspace } from "./utils-BIWenCnY.js";
import { o as useEditor, r as Mention, t as StarterKit } from "./dist-BAPiYeUN.js";
import {
  markUserTemplateRead, parsePromptTokens, filterSuggestions, buildProfileToken, serializeToken,
  hasPromptTokens, loadProfileLabels, resolveProfiles, suggestionProfileIds, loadUserTemplateReadState,
  userTemplatePage, replaceInputTokensByLabel, serializePromptDocument, parsePromptDocument,
  officialTemplatePage, suggestionTokenNode
} from "./CreateTemplateDialog-Bpq9OLTG.js";
import {
  createSlashExtension, promptLink, promptToken, tokenIcon, readProjectSelection,
  rememberProjectSelection, suggestionSelectionMode, moveSuggestionIndex, selectedTokenTargets,
  recommendedTemplateLimit, takeRecommendedTemplates, setInstalledSkillRoot, getInstalledSkillRoot,
  userTemplateSuggestion, officialTemplateSuggestion, mergeTemplateSuggestions, profileSuggestionPage,
  allProfileSuggestions, userTemplatePageSize, profileSearchDelay, allProjects, userTemplateReadKey,
  templateIsUnread, insertSuggestion, pasteTokenDocument, deleteSuggestionRange,
  removeNodeWithWhitespace, removeSelectedProfiles, readProfileNodeIds, mergeAttributes
} from "./workbench-prompt-editor-support.js";

export function usePromptEditor(options) {
  const api = useAgentApi();
  const workspace = useWorkspace();
  const locale = useLocale();
  const [, notifyError] = useNotice();
  const profiles = ref([]);
  const profileById = new Map();
  const projectOptions = ref([{ label: $t("全部项目"), value: allProjects }]);
  const selectedProjectId = ref(readProjectSelection(workspace.currentWorkspace?.id) ?? allProjects);
  const userTemplates = ref([]);
  const officialTemplates = ref([]);
  const templatesRead = ref(loadUserTemplateReadState());
  const loaded = reactive({ profile: false, slash: false });
  const templateSuggestions = computed(() => mergeTemplateSuggestions(loaded.slash ? officialTemplates.value : options.recommendedSlashItems?.value ?? [], userTemplates.value).map((e5) => ({ ...e5, unread: templateIsUnread(templatesRead.value, e5) })));
  const committingMention = ref(false);
  const draftSelectedIds = ref(new Set());
  const loadedQuery = ref("");
  const profilePage = ref(0);
  const hasMoreProfiles = ref(false);
  const loadingMoreProfiles = ref(false);
  const reloadingProfiles = ref(false);
  const profileLoadError = ref("");
  const failedOperation = ref("page");
  const selectingAllProfiles = ref(false);
  const allProfiles = ref();
  const inputEditor = reactive({ open: false, kind: "input", label: "", value: "", nodePos: 0, nodeSize: 0, anchorEl: null });
  let profileRevision = 0;
  let searchTimer;
  let focusFrame = 0;
  let templateRequest;
  let projectRequest;
  let documentRevision = 0;
  let updatingPinnedState = false;
  const suggestion = reactive({ open: false, loading: false, kind: "mention", trigger: "@", query: "", activeIndex: 0, items: [] });
  reloadProfiles(), loadProjects();
  let initialPrompt = options.model.value, editor = useEditor({ autofocus: false, editable: options.editable?.value ?? true, content: parsePromptTokens(initialPrompt).length ? "" : parsePromptDocument(initialPrompt, { profiles: profiles.value, slashItems: templateSuggestions.value }), extensions: [StarterKit.configure({ heading: false, blockquote: false, bulletList: false, orderedList: false, codeBlock: false, horizontalRule: false, link: false }), promptLink, promptToken, Mention.configure({ HTMLAttributes: { class: "agent-token agent-token--profile" }, renderText({ node: e5 }) {
    return serializeToken({ id: e5.attrs.id, kind: "profile", title: e5.attrs.label || e5.attrs.id, label: e5.attrs.label || e5.attrs.id, description: e5.attrs.description || "", iconName: e5.attrs.iconName || "base/rx_ic_at", group: "Windows", payload: { dirId: e5.attrs.id } });
  }, renderHTML({ node: e5, options: t3 }) {
    let n2 = e5.attrs.iconName || tokenIcon("profile");
    return ["span", mergeAttributes(t3.HTMLAttributes, { "data-agent-token": "profile", "data-id": e5.attrs.id, "data-kind": "profile", "data-description": e5.attrs.description || "", "data-icon-name": e5.attrs.iconName || "base/rx_ic_at" }), ["span", { class: "agent-token__icon" }, ["roxy-svg-icon", { name: n2, fallback: tokenIcon("profile"), size: 16 }]], ["span", { class: "agent-token__label" }, e5.attrs.label || e5.attrs.id], ["span", { "aria-label": "Remove token", contenteditable: "false", "data-agent-token-remove": "", role: "button", class: "agent-token__remove" }, ["roxy-svg-icon", { name: "base/rx_ic_delete", size: 12 }]]];
  }, suggestion: { char: "@", items: async ({ query: e5 }) => (await reloadProfiles(e5), profiles.value), command: ({ editor: e5, range: t3, props: n2 }) => {
    insertSuggestion(e5, n2, t3);
  }, render: suggestionLifecycle("mention") } }), createSlashExtension({ getItems: async (e5) => (await ensureTemplates(), filterSuggestions(templateSuggestions.value, e5)), command: ({ editor: e5, range: t3, item: n2 }) => insertSuggestion(e5, n2, t3), render: suggestionLifecycle("slash") })], editorProps: { attributes: { class: "agent-composer-editor", "aria-label": "Roxy AI Agent prompt composer" }, handleKeyDown(t3, n2) {
    return options.editable?.value === false || options.submitOnEnter === false || n2.key !== "Enter" || suggestion.open || n2.isComposing || n2.keyCode === 229 || n2.shiftKey ? false : !n2.altKey && (n2.preventDefault(), options.onSend(), true);
  }, handlePaste(t3, n2) {
    if (options.editable?.value === false) return false;
    let r3 = n2.clipboardData?.getData("text/plain") ?? "";
    if (!hasPromptTokens(r3)) return false;
    let i2 = pasteTokenDocument(r3, { profiles: profiles.value, slashItems: templateSuggestions.value });
    return i2.length ? (n2.preventDefault(), closeSuggestion(), editor.value?.chain().focus().insertContent(i2).run(), true) : false;
  }, handleClickOn(t3, n2, r3, i2, a3, o3) {
    if (options.editable?.value === false || !o3 || r3.type.name !== "mention" && r3.type.name !== "agentToken") return false;
    let s2 = a3.target;
    return s2?.closest("[data-agent-token-remove]") ? (a3.preventDefault(), a3.stopPropagation(), closeSuggestion(), removeNodeWithWhitespace(t3, i2, r3.nodeSize), true) : r3.type.name === "agentToken" && (r3.attrs.kind === "input" || r3.attrs.kind === "textarea" || r3.attrs.kind === "url" || r3.attrs.kind === "project") ? (a3.preventDefault(), openInputToken(r3, i2, s2?.closest(".agent-token, .mention")), true) : r3.type.name === "agentToken" && r3.attrs.kind !== "profile" ? false : (a3.preventDefault(), openProfileToken(r3, i2), true);
  }, handleClick(e5, t3, n2) {
    let r3 = n2.target;
    return suggestion.open && !r3?.closest(".agent-token, .mention") && dismissSuggestion(), false;
  } }, onUpdate: ({ editor: t3 }) => {
    let n2 = serializePromptDocument(t3.getJSON());
    options.model.value !== n2 && (options.model.value = n2), syncSelection(t3);
  }, onSelectionUpdate: ({ editor: e5 }) => syncSelection(e5) }), canSubmit = computed(() => !!options.model.value.trim()), isEmpty = computed(() => !options.model.value.trim());
  watch(editor, (t3) => {
    if (!t3) return;
    let n2 = options.model.value;
    serializePromptDocument(t3.getJSON()) !== n2 && updateEditorDocument(n2);
  }, { immediate: true }), watch(() => [options.model.value, options.contentKey?.value], ([e5, t3], n2) => {
    if (!editor.value) return;
    let r3 = serializePromptDocument(editor.value.getJSON());
    (t3 !== n2?.[1] || r3 !== e5) && updateEditorDocument(e5);
  });
  async function updateEditorDocument(t3) {
    let n2 = ++documentRevision;
    try {
      await loadProfileLabels(t3, async (e5) => (await resolveProfiles(e5, workspace.currentWorkspace?.workspaceName)).map((e6) => ({ id: e6.id, label: e6.code || e6.name || e6.id })));
    } catch (e5) {
      console.error("Failed to load Agent composer profile labels:", e5);
      return;
    }
    n2 === documentRevision && options.model.value === t3 && editor.value && editor.value.commands.setContent(parsePromptDocument(t3, { profiles: profiles.value, slashItems: templateSuggestions.value }), { emitUpdate: false });
  }
  watch(() => options.editable?.value, (e5) => {
    editor.value?.setEditable(e5 !== false), e5 === false && (closeSuggestion(), cancelInputTokenEdit());
  });
  function suggestionLifecycle(e5) {
    return () => ({ onStart: (t3) => {
      suggestion.activeIndex = 0, updatePluginSuggestions(t3, e5);
    }, onUpdate: (t3) => updatePluginSuggestions(t3, e5), onKeyDown: ({ event: e6 }) => suggestion.open ? e6.key === "ArrowDown" ? (e6.preventDefault(), navigateSuggestion("next"), true) : e6.key === "ArrowUp" ? (e6.preventDefault(), navigateSuggestion("previous"), true) : e6.key === "Enter" || e6.key === "Tab" ? (e6.preventDefault(), chooseItem(suggestion.items[suggestion.activeIndex]), true) : e6.key === "Escape" && (e6.preventDefault(), closeSuggestion(), true) : false, onExit: exitSuggestion });
  }
  function updatePluginSuggestions(e5, t3) {
    let n2 = e5.items ?? [], r3 = t3 === "mention" && (!suggestion.open || suggestion.kind !== "mention");
    suggestion.open = true, suggestion.loading = !!e5.loading, suggestion.kind = t3, suggestion.trigger = t3 === "mention" ? "@" : "/", suggestion.query = e5.query ?? "", suggestion.items = n2, suggestion.command = e5.command, suggestion.range = e5.range, suggestion.activeIndex = Math.min(suggestion.activeIndex, Math.max(n2.length - 1, 0)), r3 && resetMentionSelection();
  }
  function openSuggestion(e5) {
    let t3 = e5.activeId ? e5.items.findIndex((t4) => t4.id === e5.activeId) : -1;
    suggestion.open = true, suggestion.loading = !!e5.loading, suggestion.kind = e5.kind, suggestion.trigger = e5.kind === "mention" ? "@" : "/", suggestion.query = e5.query ?? "", suggestion.items = e5.items, suggestion.command = e5.command, suggestion.range = e5.range, suggestion.activeIndex = Math.max(t3, 0), e5.kind === "mention" && resetMentionSelection();
  }
  function exitSuggestion() {
    committingMention.value && suggestion.kind === "mention" || closeSuggestion();
  }
  function closeSuggestion() {
    cancelSearchTimer(), suggestion.open = false, suggestion.loading = false, suggestion.items = [], suggestion.command = undefined, suggestion.range = undefined, suggestion.activeIndex = 0;
  }
  function dismissSuggestion() {
    let e5 = editor.value;
    if (!e5 || typeof KeyboardEvent === "undefined") {
      closeSuggestion();
      return;
    }
    let t3 = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    e5.view.someProp("handleKeyDown", (n2) => n2(e5.view, t3)) || closeSuggestion();
  }
  function openInputToken(e5, t3, n2) {
    closeSuggestion(), inputEditor.open = true, inputEditor.kind = e5.attrs.kind === "url" ? "url" : e5.attrs.kind === "textarea" ? "textarea" : e5.attrs.kind === "project" ? "project" : "input", inputEditor.label = e5.attrs.title || e5.attrs.label || e5.attrs.id, inputEditor.value = e5.attrs.payload?.value || "", inputEditor.nodePos = t3, inputEditor.nodeSize = e5.nodeSize, inputEditor.anchorEl = n2 ?? null;
  }
  function cancelInputTokenEdit() {
    inputEditor.open = false, inputEditor.anchorEl = null;
  }
  function confirmInputTokenEdit(e5) {
    let t3 = editor.value;
    if (!t3 || !inputEditor.open) return;
    let n2 = replaceInputTokensByLabel(t3.getJSON(), inputEditor.label, e5.trim(), inputEditor.kind);
    t3.commands.setContent(n2 ?? t3.getJSON()), t3.view.focus(), inputEditor.open = false, inputEditor.anchorEl = null;
  }
  function markSuggestionItemRead(e5) {
    if (suggestion.kind !== "slash" || !e5.unread) return;
    let t3 = userTemplateReadKey(e5);
    t3 && (templatesRead.value = markUserTemplateRead(t3));
  }
  function patchTemplate(e5, t3, n2) {
    let r3 = e5 === "official" ? officialTemplates : userTemplates;
    r3.value = r3.value.map((e6) => e6.templateId === t3 ? { ...e6, ...n2 } : e6);
  }
  async function toggleSuggestionItemTop(item) {
    const { templateSource, templateId } = item;
    if (!templateSource || !templateId || item.isTopping || updatingPinnedState) return;
    const official = templateSource === "official";
    const pinned = !item.isTopped;
    const timestamp = pinned ? new Date().toISOString() : null;
    updatingPinnedState = true;
    patchTemplate(templateSource, templateId, { isTopped: pinned, isTopping: true, toppedAt: timestamp });
    try {
      const action = official ? (pinned ? "topOfficialTemplate" : "untopOfficialTemplate") : (pinned ? "topUserTemplate" : "untopUserTemplate");
      const response = await (official ? api.templates : api.userTemplates)[action](templateId);
      if (response?.code !== undefined && response.code !== 0) throw Error(response.message || $t("模板置顶操作失败"));
      const result = response?.data ?? response;
      if (typeof result?.isTopped !== "boolean") throw Error($t("模板置顶操作失败"));
      patchTemplate(templateSource, templateId, { isTopped: result.isTopped, isTopping: false, toppedAt: result.isTopped ? result.toppedAt ?? timestamp : null });
      if (official) options.onOfficialTemplateTopChanged?.();
    } catch (error) {
      patchTemplate(templateSource, templateId, { isTopped: item.isTopped, isTopping: false, toppedAt: item.toppedAt });
      notifyError(-1, error instanceof Error ? error.message : $t("模板置顶操作失败"));
    } finally {
      updatingPinnedState = false;
    }
  }
  function chooseItem(e5) {
    if (!e5 || !suggestion.command) return;
    markSuggestionItemRead(e5);
    let t3 = suggestionSelectionMode(suggestion.kind);
    if (t3.multiSelect) {
      toggleProfile(e5);
      return;
    }
    let n2 = suggestion.command;
    n2(e5), t3.closeAfterChoose && closeSuggestion();
  }
  function navigateSuggestion(e5) {
    suggestion.activeIndex = moveSuggestionIndex(suggestion.activeIndex, suggestion.items.length, e5);
  }
  async function selectToolbar(e5) {
    let t3 = e5 === "@" ? "mention" : "slash", n2 = (e6) => insertSuggestion(editor.value, e6);
    if (t3 === "slash" && !loaded.slash) {
      if (openSuggestion({ kind: t3, items: templateSuggestions.value, command: n2, loading: true }), await ensureTemplates(), !suggestion.open || suggestion.kind !== t3 || suggestion.command !== n2) return;
      openSuggestion({ kind: t3, items: templateSuggestions.value, command: n2 });
    } else openSuggestion({ kind: t3, items: await getSuggestions(t3), command: n2 });
  }
  async function updateSuggestionQuery(e5) {
    suggestion.query = e5, suggestion.activeIndex = 0, suggestion.kind === "mention" ? scheduleSearch(e5) : suggestion.items = filterSuggestions(templateSuggestions.value, e5);
  }
  function cancelSearchTimer() {
    searchTimer &&= (window.clearTimeout(searchTimer), undefined);
  }
  function scheduleSearch(e5) {
    cancelSearchTimer();
    let t3 = e5.trim();
    t3 === loadedQuery.value ? suggestion.items = profiles.value : searchTimer = window.setTimeout(() => {
      searchTimer = undefined, reloadProfiles(e5, { showSuggestionLoading: false }).then(() => {
        suggestion.open && suggestion.kind === "mention" && suggestion.query.trim() === t3 && (suggestion.items = profiles.value);
      });
    }, profileSearchDelay);
  }
  async function loadProjects() {
    if (projectRequest) return projectRequest;
    let e5 = (async () => {
      try {
        let e6 = await requests.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
        if (e6.code !== 0) throw Error(e6.msg || "Failed to load projects");
        let t3 = new Set();
        projectOptions.value = [{ label: $t("全部项目"), value: allProjects }, ...(e6.data?.rows ?? []).flatMap((e7) => {
          let n2 = e7.project_id?.toString();
          return !n2 || t3.has(n2) ? [] : (t3.add(n2), [{ label: e7.projectName || (e7.projectDefault ? $t("默认项目") : n2), value: n2, projectName: e7.projectName?.trim() }]);
        })], projectOptions.value.some((e7) => e7.value === selectedProjectId.value) || resetProject(true);
      } catch (e6) {
        console.error("Failed to load agent projects", e6), projectOptions.value = [{ label: $t("全部项目"), value: allProjects }], resetProject(false);
      }
    })();
    projectRequest = e5;
    try {
      await e5;
    } finally {
      projectRequest === e5 && (projectRequest = undefined);
    }
  }
  function resetProject(e5) {
    selectedProjectId.value !== allProjects && (selectedProjectId.value = allProjects, e5 && rememberProjectSelection(workspace.currentWorkspace?.id, allProjects), refreshProjectProfiles());
  }
  async function updateSelectedProject(e5) {
    selectedProjectId.value = e5, rememberProjectSelection(workspace.currentWorkspace?.id, e5), await refreshProjectProfiles();
  }
  async function refreshProjectProfiles() {
    cancelSearchTimer(), suggestion.activeIndex = 0, await reloadProfiles(suggestion.query, { showSuggestionLoading: false }), suggestion.open && suggestion.kind === "mention" && (suggestion.items = profiles.value);
  }
  function focusEditor(t3) {
    options.editable?.value !== false && (t3?.target?.closest(".ProseMirror, button") || editor.value?.chain().focus("end").run());
  }
  function syncSelection(e5) {
    typeof window !== "undefined" && (focusFrame && window.cancelAnimationFrame(focusFrame), focusFrame = window.requestAnimationFrame(() => {
      if (focusFrame = 0, e5.isDestroyed || !e5.view.hasFocus()) return;
      let t3 = e5.view.dom, n2 = t3.getBoundingClientRect(), r3 = e5.view.coordsAtPos(e5.view.state.selection.head);
      r3.bottom > n2.bottom - 4 ? t3.scrollTop += r3.bottom - n2.bottom + 4 : r3.top < n2.top + 4 && (t3.scrollTop -= n2.top - r3.top + 4);
    }));
  }
  async function openProfileToken(e5, t3) {
    let n2 = e5.type.name === "mention" || e5.attrs.kind === "profile" ? "mention" : "slash";
    openSuggestion({ kind: n2, items: await getSuggestions(n2), activeId: e5.attrs.id, range: { from: t3, to: t3 + e5.nodeSize }, command: (n3) => {
      let r3 = editor.value;
      if (!r3) return;
      let { tr: i2 } = r3.view.state, a3 = r3.view.state.schema.nodeFromJSON(suggestionTokenNode(n3));
      r3.view.dispatch(i2.replaceWith(t3, t3 + e5.nodeSize, a3)), r3.view.focus();
    } }), n2 === "mention" && (draftSelectedIds.value = readProfileNodeIds(e5));
  }
  async function getSuggestions(e5) {
    return e5 === "mention" ? (await reloadProfiles("", { showSuggestionLoading: false }), profiles.value) : (loaded.slash || await ensureTemplates(), templateSuggestions.value);
  }
  function projectFilter() {
    return selectedProjectId.value === allProjects ? "" : selectedProjectId.value;
  }
  function cacheProfiles(e5) {
    e5.forEach((e6) => profileById.set(e6.id, e6));
  }
  function mergeProfiles(e5) {
    let t3 = new Map(profiles.value.map((e6) => [e6.id, e6]));
    return e5.forEach((e6) => t3.set(e6.id, e6)), Array.from(t3.values());
  }
  async function reloadProfiles(e5 = "", t3 = {}) {
    let n2 = t3.showSuggestionLoading ?? true, i2 = e5.trim(), a3 = ++profileRevision;
    profilePage.value = 0, hasMoreProfiles.value = true, reloadingProfiles.value = true, loadingMoreProfiles.value = false, profileLoadError.value = "", failedOperation.value = "page", allProfiles.value = undefined, n2 && (suggestion.loading = suggestion.kind === "mention");
    try {
      let e6 = await profileSuggestionPage({ pageIndex: 1, keyword: i2, projectId: projectFilter() }, workspace.currentWorkspace?.workspaceName);
      if (a3 !== profileRevision) return;
      profiles.value = e6.items, cacheProfiles(e6.items), loadedQuery.value = i2, profilePage.value = 1, hasMoreProfiles.value = e6.hasMore, allProfiles.value = e6.hasMore ? undefined : e6.items, loaded.profile = !i2 || loaded.profile;
    } catch (e6) {
      if (a3 !== profileRevision) return;
      console.error("Failed to load agent windows", e6), profiles.value = [], loadedQuery.value = i2, hasMoreProfiles.value = false, profileLoadError.value = e6 instanceof Error ? e6.message : $t("获取窗口信息失败"), loaded.profile = !i2 || loaded.profile;
    } finally {
      a3 === profileRevision && (reloadingProfiles.value = false, n2 && (suggestion.loading = false));
    }
  }
  async function loadMoreProfiles() {
    if (suggestion.kind !== "mention" || suggestion.loading || reloadingProfiles.value || selectingAllProfiles.value || loadingMoreProfiles.value || !hasMoreProfiles.value || suggestion.query.trim() !== loadedQuery.value) return;
    let e5 = profileRevision, t3 = profilePage.value + 1;
    loadingMoreProfiles.value = true, profileLoadError.value = "", failedOperation.value = "page";
    try {
      let n2 = await profileSuggestionPage({ pageIndex: t3, keyword: loadedQuery.value, projectId: projectFilter() }, workspace.currentWorkspace?.workspaceName);
      if (e5 !== profileRevision) return;
      let i2 = mergeProfiles(n2.items);
      profiles.value = i2, cacheProfiles(n2.items), profilePage.value = t3, hasMoreProfiles.value = n2.hasMore, !allProfiles.value && !n2.hasMore && (allProfiles.value = i2), suggestion.open && suggestion.kind === "mention" && (suggestion.items = i2);
    } catch (t4) {
      if (e5 !== profileRevision) return;
      console.error("Failed to load more agent windows", t4), profileLoadError.value = t4 instanceof Error ? t4.message : $t("获取窗口信息失败");
    } finally {
      e5 === profileRevision && (loadingMoreProfiles.value = false);
    }
  }
  function retryLoadProfiles() {
    failedOperation.value === "selectAll" ? toggleAllMentionItems() : profilePage.value === 0 ? reloadProfiles(suggestion.query, { showSuggestionLoading: false }).then(() => {
      suggestion.open && suggestion.kind === "mention" && (suggestion.items = profiles.value);
    }) : loadMoreProfiles();
  }
  async function loadAllMatchingProfiles() {
    if (reloadingProfiles.value) return;
    if (allProfiles.value) return allProfiles.value;
    let e5 = suggestion.query.trim();
    e5 !== loadedQuery.value && (cancelSearchTimer(), await reloadProfiles(e5, { showSuggestionLoading: false }));
    let t3 = profileRevision;
    selectingAllProfiles.value = true, profileLoadError.value = "", failedOperation.value = "selectAll";
    try {
      let e6 = await allProfileSuggestions(loadedQuery.value, workspace.currentWorkspace?.workspaceName, projectFilter());
      return t3 === profileRevision ? (cacheProfiles(e6), allProfiles.value = e6, e6) : undefined;
    } catch (e6) {
      if (t3 !== profileRevision) return;
      console.error("Failed to load all agent windows", e6), profileLoadError.value = e6 instanceof Error ? e6.message : $t("获取窗口信息失败");
      return;
    } finally {
      selectingAllProfiles.value = false;
    }
  }
  async function ensureTemplates() {
    if (loaded.slash) return;
    if (templateRequest) return templateRequest;
    let e5 = (async () => {
      try {
        if (!getInstalledSkillRoot()) try {
          setInstalledSkillRoot((await api.skillPathInfo()).installedRoot);
        } catch (e6) {
          console.error("Failed to load Skill installed root", e6);
        }
        await reloadTemplates(), loaded.slash = true;
      } catch (e6) {
        console.error("Failed to load templates", e6), officialTemplates.value = [], userTemplates.value = [], loaded.slash = true;
      }
    })();
    templateRequest = e5;
    try {
      await e5;
    } finally {
      templateRequest === e5 && (templateRequest = undefined);
    }
  }
  async function reloadTemplates(e5 = {}) {
    let [t3, n2] = await Promise.allSettled([fetchOfficialTemplates(), fetchUserTemplates()]);
    t3.status === "fulfilled" ? officialTemplates.value = t3.value.map((e6) => officialTemplateSuggestion(e6, locale.currentLocale)) : (console.error("Failed to load official templates", t3.reason), e5.preserveOnFailure || (officialTemplates.value = [])), n2.status === "fulfilled" ? userTemplates.value = n2.value.map((e6) => userTemplateSuggestion(e6)) : (console.error("Failed to load user templates", n2.reason), e5.preserveOnFailure || (userTemplates.value = []));
  }
  async function fetchOfficialTemplates() {
    return takeRecommendedTemplates(officialTemplatePage(await api.templates.listOfficialTemplates({ limit: recommendedTemplateLimit, offset: 0 }), "加载官方模板失败").items);
  }
  async function fetchUserTemplates() {
    let e5 = [], n2 = 0, r3 = 0;
    do {
      let i2 = userTemplatePage(await api.userTemplates.listUserTemplates({ limit: userTemplatePageSize, offset: n2, sortBy: "updated_at", sortOrder: "desc" }), "加载用户模板失败");
      if (e5.push(...i2.items.filter(item => item.templateType !== "script")), r3 = i2.total, n2 += i2.items.length, i2.items.length === 0) break;
    } while (n2 < r3);
    return e5;
  }
  watch(templateSuggestions, (e5) => {
    if (!suggestion.open || suggestion.kind !== "slash") return;
    let t3 = suggestion.items[suggestion.activeIndex]?.id, n2 = filterSuggestions(e5, suggestion.query), r3 = t3 ? n2.findIndex((e6) => e6.id === t3) : -1;
    suggestion.items = n2, suggestion.activeIndex = r3 >= 0 ? r3 : Math.min(suggestion.activeIndex, Math.max(0, n2.length - 1));
  }), onBeforeUnmount(() => {
    cancelSearchTimer(), focusFrame && window.cancelAnimationFrame(focusFrame), editor.value?.destroy();
  });
  let selectedMentionIds = computed(() => suggestion.open && suggestion.kind === "mention" ? draftSelectedIds.value : storedProfileSelection()), selectedMentionCount = computed(() => selectedMentionIds.value.size), allMentionItemsSelected = computed(() => {
    if (!allProfiles.value) return false;
    let e5 = collectProfileIds(allProfiles.value);
    return !!e5.length && e5.every((e6) => draftSelectedIds.value.has(e6));
  });
  function storedProfileSelection() {
    return selectedTokenTargets(options.model.value, "profile");
  }
  function collectProfileIds(e5 = suggestion.items) {
    return e5.flatMap(suggestionProfileIds);
  }
  function resetMentionSelection() {
    draftSelectedIds.value = new Set(storedProfileSelection());
  }
  function toggleProfile(e5) {
    let t3 = new Set(draftSelectedIds.value);
    suggestionProfileIds(e5).forEach((e6) => {
      t3.has(e6) ? t3.delete(e6) : t3.add(e6);
    }), draftSelectedIds.value = t3;
  }
  async function toggleAllMentionItems() {
    if (selectingAllProfiles.value) return;
    let e5 = await loadAllMatchingProfiles();
    if (!e5) return;
    let t3 = collectProfileIds(e5), n2 = new Set(draftSelectedIds.value), r3 = !!t3.length && t3.every((e6) => n2.has(e6));
    t3.forEach((e6) => {
      r3 ? n2.delete(e6) : n2.add(e6);
    }), draftSelectedIds.value = n2;
  }
  function cancelMentionSelection() {
    resetMentionSelection(), dismissSuggestion();
  }
  function confirmMentionSelection() {
    let e5 = editor.value;
    if (!e5) return;
    let t3 = Array.from(draftSelectedIds.value).map((e6) => profileById.get(e6) ?? profiles.value.find((t4) => suggestionProfileIds(t4).includes(e6)) ?? { id: e6, kind: "profile", title: e6, label: e6, description: "", iconName: "roxy-agent/rx-ic-token-profile", group: "Windows", payload: { dirId: e6 } });
    committingMention.value = true;
    let n2 = buildProfileToken(t3, !!suggestion.range);
    suggestion.range && n2 ? insertSuggestion(e5, n2, suggestion.range) : suggestion.range ? deleteSuggestionRange(e5, suggestion.range) : removeSelectedProfiles(e5), !suggestion.range && n2 && insertSuggestion(e5, n2), suggestion.range = undefined, closeSuggestion(), window.setTimeout(() => {
      committingMention.value = false;
    }, 0);
  }
  return { allMentionItemsSelected: allMentionItemsSelected, cancelMentionSelection: cancelMentionSelection, canSubmit: canSubmit, chooseItem: chooseItem, closeSuggestion: closeSuggestion, confirmMentionSelection: confirmMentionSelection, confirmInputTokenEdit: confirmInputTokenEdit, cancelInputTokenEdit: cancelInputTokenEdit, editor: editor, focusEditor: focusEditor, inputEditor: inputEditor, isEmpty: isEmpty, markSuggestionItemRead: markSuggestionItemRead, toggleSuggestionItemTop: toggleSuggestionItemTop, navigateSuggestion: navigateSuggestion, profileHasMore: hasMoreProfiles, profileLoadError: profileLoadError, profileLoadingMore: loadingMoreProfiles, profileReloading: reloadingProfiles, profileSelectingAll: selectingAllProfiles, projectOptions: projectOptions, loadMoreProfiles: loadMoreProfiles, selectedMentionIds: selectedMentionIds, selectedProjectId: selectedProjectId, selectedMentionCount: selectedMentionCount, retryLoadProfiles: retryLoadProfiles, selectToolbar: selectToolbar, suggestion: suggestion, toggleAllMentionItems: toggleAllMentionItems, updateSelectedProject: updateSelectedProject, updateSuggestionQuery: updateSuggestionQuery };
}
