import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "./workbench-vue.js";
import { promptEditorRuntime } from "./CreateTemplateDialog-Bpq9OLTG.js";

const collapsedInputHeight = 30;
const expandedInputHeight = 52;

export function useChatComposer(props, emit, model) {
  const { usePromptEditor, partitionPastedFiles, pathAttachment, clipboardFiles, shouldAttachPastedText,
    missingInputs, invalidTemplateReferences, parseUrlInput, collectClarificationAnswers, selectClarificationAnswer, trackComposerSize } = promptEditorRuntime;

  const recommendedTemplates = computed(() => props.recommendedTemplateItems ?? []);
  const inline = computed(() => props.variant === "prompt-field");
  const editable = computed(() => !props.readonly);
  const fieldPlaceholder = computed(() => props.placeholder ?? "");
  const fieldStyle = computed(() => inline.value && props.promptMinHeight ? { "--agent-prompt-field-min-height": props.promptMinHeight } : undefined);
  const shellRef = ref(null);
  const composerRef = ref(null);
  const fileInputRef = ref(null);
  const attachmentStripRef = ref(null);
  const canScrollLeft = ref(false);
  const canScrollRight = ref(false);
  const tokenInputRef = ref(null);
  const tokenPopoverRef = ref(null);
  const tokenActionsRef = ref(null);
  const approvalValues = ref({});
  const tokenValue = ref("");
  const urlProtocol = ref("https://");
  const composing = ref(false);
  const expandedInput = ref(false);
  const manuallyResized = ref(false);
  const warning = ref("");
  const popoverStyle = reactive({ left: "0px", top: "0px", transform: "translate(-50%, -100%)", maxWidth: "460px", zIndex: "80" });
  const popoverSide = ref("top");
  const pastedTextCount = ref(0);
  const overflowingSuggestions = ref({});
  const questionIndex = ref(0);
  const chosenAnswers = ref({});
  const {
    allMentionItemsSelected,
    cancelMentionSelection,
    canSubmit: editorCanSubmit,
    chooseItem,
    closeSuggestion,
    cancelInputTokenEdit,
    editor,
    focusEditor,
    confirmMentionSelection,
    confirmInputTokenEdit,
    inputEditor,
    isEmpty,
    markSuggestionItemRead,
    toggleSuggestionItemTop,
    navigateSuggestion,
    profileHasMore,
    profileLoadError,
    profileLoadingMore,
    profileReloading,
    profileSelectingAll,
    projectOptions,
    loadMoreProfiles,
    selectedMentionCount,
    selectedMentionIds,
    selectedProjectId,
    retryLoadProfiles,
    selectToolbar,
    suggestion,
    toggleAllMentionItems,
    updateSelectedProject,
    updateSuggestionQuery,
  } = usePromptEditor({ model, editable, contentKey: computed(() => props.contentKey), onSend: sendPrompt,
    onOfficialTemplateTopChanged: () => emit("officialTemplateTopChanged"), recommendedSlashItems: recommendedTemplates, submitOnEnter: !inline.value });
  const tokenProjects = computed(() => {
    let e5 = new Set();
    return projectOptions.value.flatMap((t3) => {
      let n3 = t3.projectName?.trim() ?? "";
      return t3.value === "__all__" || !n3 || e5.has(n3) ? [] : (e5.add(n3), [{ label: n3, value: n3 }]);
    });
  });
  const uploading = computed(() => props.pendingAttachments.some((e5) => e5.uploadStatus === "uploading"));
  const canSend = computed(() => editorCanSubmit.value || props.pendingAttachments.length > 0);
  const hasText = computed(() => !!model.value.trim());
  const hasDraft = computed(() => hasText.value || props.pendingAttachments.length > 0);
  const canStop = computed(() => props.thinking && !hasDraft.value);
  let focusFrame = 0;
  let placementFrame = 0;
  let actionFrame = 0;
  let listeningForOutside = false;
  let popoverObserver;
  let attachmentObserver;
  let finishTokenResize;
  let overflowFrame = 0;
  let suggestionObserver;
  const suggestionLabels = new Map();
  let stopTrackingSize = () => {
  };

  function scheduleFocus() {
    props.autoFocus && !props.hitlRequest && (typeof window === "undefined" ? focusEditor() : (focusFrame && window.cancelAnimationFrame(focusFrame), focusFrame = window.requestAnimationFrame(() => {
      focusFrame = 0, focusEditor();
    })));
  }

  function previewUrl(e5) {
    return e5.preview || e5.url || e5.localUrl || e5.fileUrl || e5.remoteUrl || "";
  }

  function basename(e5) {
    return e5.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || e5;
  }

  function folderName(e5) {
    let t3 = e5[0];
    return t3?.webkitRelativePath?.split("/").filter(Boolean)[0] || t3?.name || $t("文件夹");
  }

  async function chooseAttachment() {
    if (globalThis.isElectron) try {
      let e5 = await globalThis.electronAPI.send("dialog:selectFileOrDirInfo");
      e5?.path && emit("addPathAttachment", { kind: e5.type === "dir" ? "folder" : "file", name: e5.name || basename(e5.path), path: e5.path });
      return;
    } catch (e5) {
      globalThis.__localUiError?.(e5.message || String(e5));
      return;
    }
    fileInputRef.value?.click();
  }

  function uploadAttachments(e5) {
    e5.length && !props.thinking && emit("addAttachments", e5);
  }

  function pastedFilePath(e5) {
    if (!globalThis.isElectron) return "";
    try {
      return globalThis.electronAPI.getPathForFile(e5) || "";
    } catch (e6) {
      return console.error("[agent-console] Failed to get pasted file path:", e6), "";
    }
  }

  function addClipboardFiles(e5) {
    if (!e5.length) return;
    let t3 = e5.map((e6) => e6.file);
    if (!globalThis.isElectron) {
      emit("addAttachments", t3);
      return;
    }
    let { localPathFiles: n3, uploadFiles: r3 } = partitionPastedFiles(t3, pastedFilePath), a3 = new Map(e5.map((e6) => [e6.file, e6.entry])), o3 = n3.map(({ file: e6, path: t4 }) => {
      let n4 = a3.get(e6) ?? null;
      return pathAttachment(e6.name, t4, n4);
    });
    for (let e6 of o3) emit("addPathAttachment", e6);
    r3.length && emit("addAttachments", r3);
  }

  function makeTextAttachment(e5) {
    pastedTextCount.value += 1;
    let t3 = pastedTextCount.value === 1 ? "" : `-${pastedTextCount.value}`;
    return new File([e5], `pasted-text${t3}.txt`, { lastModified: Date.now(), type: "text/plain" });
  }

  function onPaste(e5) {
    let t3 = clipboardFiles(e5.clipboardData);
    if (inline.value || props.readonly) return;
    if (t3.length) {
      e5.preventDefault(), e5.stopPropagation(), addClipboardFiles(t3);
      return;
    }
    let n3 = e5.clipboardData?.getData("text/plain") ?? "";
    shouldAttachPastedText(n3) && (e5.preventDefault(), e5.stopPropagation(), uploadAttachments([makeTextAttachment(n3)]));
  }

  function onFileChange(e5) {
    let t3 = e5.target;
    uploadAttachments(Array.from(t3?.files ?? [])), t3 && (t3.value = "");
  }

  function onFolderChange(e5) {
    let t3 = e5.target, n3 = Array.from(t3?.files ?? []);
    n3.length > 0 && emit("addFolder", { name: folderName(n3), files: n3 }), t3 && (t3.value = "");
  }

  function hoverSuggestion(e5) {
    let t3 = suggestion.items.findIndex((t4) => t4.id === e5.id);
    t3 >= 0 && (suggestion.activeIndex = t3);
  }

  function activateSend() {
    canStop.value ? emit("stop") : canSend.value && sendPrompt();
  }

  function sendPrompt() {
    if (!canSend.value) return;
    let e5 = missingInputs(model.value);
    e5.length ? (warning.value = $t("请补充：{items}", { items: e5.join("、") }), focusEditor()) : invalidTemplateReferences(model.value).length ? (warning.value = $t("模板引用无效，请重新选择模板"), focusEditor()) : (warning.value = "", emit("send"));
  }

  function restoreQueuedPrompt(e5) {
    emit("restoreQueuedPrompt", e5), nextTick(focusEditor);
  }

  function saveToken() {
    composing.value = false;
    let e5 = tokenValue.value;
    if (inputEditor.kind === "url" && e5.trim()) {
      let t3 = /^https?:\/\//i.test(e5.trim()), n3 = parseUrlInput(e5);
      e5 = `${t3 ? n3.protocol : urlProtocol.value}${n3.value}`;
    }
    confirmInputTokenEdit(e5), warning.value = "";
  }

  function chooseTokenProject(e5) {
    tokenValue.value = e5, confirmInputTokenEdit(e5), warning.value = "";
  }

  function pasteUrl(e5) {
    let t3 = e5.clipboardData?.getData("text/plain")?.trim();
    if (!t3) return;
    let n3 = parseUrlInput(t3);
    urlProtocol.value = n3.protocol, tokenValue.value = n3.value, e5.preventDefault();
  }

  function handleTokenKey(e5) {
    if (e5.stopPropagation(), !(composing.value || e5.isComposing || e5.keyCode === 229))
      if (e5.key === "Enter") {
        if (inputEditor.kind === "textarea") {
          (e5.metaKey || e5.ctrlKey) && (e5.preventDefault(), saveToken());
          return;
        }
        e5.preventDefault(), saveToken();
      } else e5.key === "Escape" && (e5.preventDefault(), cancelInputTokenEdit());
  }

  function schedulePopoverPlacement() {
    inputEditor.open && inputEditor.anchorEl && (placementFrame && window.cancelAnimationFrame(placementFrame), placementFrame = window.requestAnimationFrame(() => {
      placementFrame = 0, placeTokenPopover();
    }));
  }

  function adjustTokenHeight() {
    if (inputEditor.kind !== "textarea") {
      expandedInput.value = false, manuallyResized.value = false;
      return;
    }
    let e5 = tokenInputRef.value;
    if (!(e5 instanceof HTMLTextAreaElement)) return;
    if (manuallyResized.value) {
      e5.style.overflowY = "auto", schedulePopoverPlacement();
      return;
    }
    if (expandedInput.value) {
      e5.style.height = `${expandedInputHeight}px`, e5.style.overflowY = "auto", schedulePopoverPlacement();
      return;
    }
    let t3 = tokenActionsRef.value?.getBoundingClientRect();
    e5.style.height = `${collapsedInputHeight}px`;
    let n3 = e5.scrollHeight > 32;
    n3 ? (expandedInput.value = true, e5.style.height = `${expandedInputHeight}px`, e5.style.overflowY = "auto") : e5.style.overflowY = "hidden", schedulePopoverPlacement(), n3 && t3 && nextTick(() => {
      if (expandedInput.value !== n3) return;
      placeTokenPopover();
      let e6 = tokenActionsRef.value?.getBoundingClientRect();
      e6 && animateTokenActions(t3, e6);
    });
  }

  function startTokenResize(e5) {
    if (e5.button !== 0) return;
    let t3 = tokenInputRef.value;
    if (!(t3 instanceof HTMLTextAreaElement)) return;
    e5.preventDefault(), finishTokenResize?.(), t3.focus(), actionFrame &&= (window.cancelAnimationFrame(actionFrame), 0), tokenActionsRef.value?.classList.remove("input-token-popover__actions--moving");
    let n3 = e5.pointerId, r3 = e5.clientY, i3 = t3.getBoundingClientRect().height, a3 = Math.max(collapsedInputHeight, Math.min(window.innerHeight * 0.4, 320)), o3 = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    let s3 = (e6) => {
      if (e6.pointerId !== n3) return;
      let o4 = Math.min(a3, Math.max(collapsedInputHeight, i3 + r3 - e6.clientY)), s4 = o4 > collapsedInputHeight;
      manuallyResized.value = true, t3.style.height = `${o4}px`, expandedInput.value = s4, schedulePopoverPlacement();
    }, c3 = (e6) => {
      e6 && e6.pointerId !== n3 || (window.removeEventListener("pointermove", s3), window.removeEventListener("pointerup", c3), window.removeEventListener("pointercancel", c3), document.body.style.userSelect = o3, finishTokenResize = undefined);
    };
    finishTokenResize = c3, window.addEventListener("pointermove", s3), window.addEventListener("pointerup", c3), window.addEventListener("pointercancel", c3);
  }

  function animateTokenActions(e5, t3) {
    let n3 = tokenActionsRef.value;
    if (!n3) return;
    let r3 = e5.left - t3.left, i3 = e5.top - t3.top;
    Math.abs(r3) < 1 && Math.abs(i3) < 1 || (actionFrame && window.cancelAnimationFrame(actionFrame), n3.classList.remove("input-token-popover__actions--moving"), n3.style.setProperty("--input-token-actions-from-x", `${r3}px`), n3.style.setProperty("--input-token-actions-from-y", `${i3}px`), actionFrame = window.requestAnimationFrame(() => {
      actionFrame = 0, n3.classList.add("input-token-popover__actions--moving");
    }));
  }

  function popoverZIndex(e5) {
    let t3 = 80, n3 = e5;
    for (; n3; ) {
      let e6 = Number.parseInt(window.getComputedStyle(n3).zIndex, 10);
      if (Number.isFinite(e6) && (t3 = Math.max(t3, e6)), n3 === document.body) break;
      n3 = n3.parentElement;
    }
    return t3 + 1;
  }

  function placeTokenPopover() {
    let e5 = inputEditor.anchorEl;
    if (!inputEditor.open || !e5) return;
    let t3 = e5.getBoundingClientRect(), n3 = tokenPopoverRef.value, r3 = n3?.offsetWidth || 360, i3 = n3?.offsetHeight || 120, a3 = window.innerWidth, o3 = window.innerHeight, s3 = t3.top, c3 = o3 - t3.bottom, l3 = s3 >= i3 + 16 || s3 >= c3 ? "top" : "bottom", u3 = Math.min(Math.max(t3.left + t3.width / 2, r3 / 2 + 12), a3 - r3 / 2 - 12), d3 = l3 === "top" ? t3.top - 8 : t3.bottom + 8;
    popoverStyle.left = `${u3}px`, popoverStyle.top = `${d3}px`, popoverStyle.transform = l3 === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)", popoverStyle.maxWidth = `${Math.min(460, a3 - 24)}px`, popoverStyle.zIndex = String(popoverZIndex(e5)), popoverSide.value = l3;
  }

  function closeOnOutsidePointer(e5) {
    if (!inputEditor.open) return;
    let t3 = e5.composedPath();
    tokenPopoverRef.value && t3.includes(tokenPopoverRef.value) || inputEditor.anchorEl && t3.includes(inputEditor.anchorEl) || cancelInputTokenEdit();
  }

  function closeOnEscape(e5) {
    e5.key === "Escape" && cancelInputTokenEdit();
  }

  function listenForPopoverDismissal() {
    listeningForOutside || typeof window === "undefined" || (listeningForOutside = true, document.addEventListener("pointerdown", closeOnOutsidePointer, true), document.addEventListener("keydown", closeOnEscape), window.addEventListener("resize", schedulePopoverPlacement), window.addEventListener("scroll", schedulePopoverPlacement, true));
  }

  function stopListeningForPopoverDismissal() {
    listeningForOutside && typeof window !== "undefined" && (listeningForOutside = false, document.removeEventListener("pointerdown", closeOnOutsidePointer, true), document.removeEventListener("keydown", closeOnEscape), window.removeEventListener("resize", schedulePopoverPlacement), window.removeEventListener("scroll", schedulePopoverPlacement, true));
  }

  function dismissSuggestions() {
    suggestion.open && (suggestion.kind === "mention" ? cancelMentionSelection() : closeSuggestion());
  }

  function runToolbarAction(e5) {
    if (e5 === "attach") {
      dismissSuggestions(), chooseAttachment();
      return;
    }
    let t3 = e5 === "@" ? "mention" : "slash";
    suggestion.open && suggestion.kind === t3 ? dismissSuggestions() : selectToolbar(e5);
  }

  const choiceControls = computed(() => props.hitlRequest?.controls.filter((e5) => e5.kind === "choice") ?? []);
  const textControls = computed(() => props.hitlRequest?.controls.filter((e5) => e5.kind === "text" || e5.kind === "textarea") ?? []);
  const submittingApproval = computed(() => props.hitlRequest?.status === "submitting");
  const clarification = computed(() => {
    let e5 = props.hitlRequest?.source?.payload;
    return !(!e5 || typeof e5 != "object" || Array.isArray(e5) || e5.requestKind !== "clarification");
  });
  const questions = computed(() => clarification.value ? props.hitlRequest?.clarificationQuestions ?? [] : []);
  const hasQuestions = computed(() => questions.value.length > 0);
  const question = computed(() => questions.value[questionIndex.value]);
  const answerChoice = computed(() => {
    if (clarification.value && !hasQuestions.value) return choiceControls.value.find((e5) => e5.id === "answer") ?? choiceControls.value[0];
  });
  const submitChoice = computed(() => {
    if (clarification.value) return choiceControls.value.find((e5) => e5.id === "submit");
  });
  const answerInput = computed(() => {
    if (clarification.value && !hasQuestions.value) return textControls.value.find((e5) => e5.id === "answer") ?? textControls.value[0];
  });
  const answerKey = computed(() => question.value ? `answer:${question.value.id}` : answerInput.value?.id ?? answerChoice.value?.id ?? "answer");
  const answerSuggestions = computed(() => {
    let e5 = question.value;
    return e5 ? e5.options.map((t3, n3) => ({ id: `${e5.id}-option-${n3 + 1}`, label: t3.label, value: t3.label, description: t3.description })) : answerChoice.value?.options ?? [];
  });
  const showClarification = computed(() => !!(clarification.value && props.hitlRequest));
  const approvalActions = computed(() => clarification.value ? [] : choiceControls.value);
  const approvalFields = computed(() => clarification.value ? [] : textControls.value);
  const answerPlaceholder = computed(() => question.value ? $t("输入你的回答，也可以先选择上方建议") : answerInput.value?.placeholder ?? $t("输入你的回答，也可以先选择上方建议"));
  const approvalPrompt = computed(() => question.value?.question ?? props.hitlRequest?.prompt ?? "");
  const canAnswer = computed(() => {
    if (!props.hitlRequest || submittingApproval.value) return false;
    let e5 = readAnswer(answerKey.value).trim();
    return hasQuestions.value ? true : !(answerInput.value?.required ?? answerChoice.value?.required ?? true) || !!e5;
  });

  function readAnswer(e5) {
    let t3 = approvalValues.value[e5];
    return t3 == null ? "" : String(t3);
  }

  function setAnswer(e5, t3) {
    approvalValues.value = { ...approvalValues.value, [e5]: t3 };
  }

  function updateAnswer(e5, t3) {
    let n3 = t3.target;
    (n3 instanceof HTMLInputElement || n3 instanceof HTMLTextAreaElement) && setAnswer(e5, n3.value);
  }

  function submitChoiceAnswer(e5, t3) {
    let n3 = props.hitlRequest;
    n3 && !submittingApproval.value && emit("submitHitl", { requestId: n3.id, values: { ...approvalValues.value, [e5.id]: t3 }, fullAccess: e5.id === "approval" && e5.options.find((e6) => e6.value === t3)?.id === "full-access" });
  }

  function toAnswerText(e5, t3 = "") {
    return e5 == null ? t3 : String(e5);
  }

  function allAnswers() {
    return collectClarificationAnswers({ questions: questions.value, hitlValues: approvalValues.value, selections: chosenAnswers.value });
  }

  function submitAllAnswers() {
    let e5 = props.hitlRequest;
    e5 && !submittingApproval.value && emit("submitHitl", { requestId: e5.id, values: { ...approvalValues.value, answer: JSON.stringify(allAnswers()) } });
  }

  function previousQuestion() {
    questionIndex.value = Math.max(0, questionIndex.value - 1);
  }

  function nextQuestion() {
    questionIndex.value >= questions.value.length - 1 ? submitAllAnswers() : questionIndex.value += 1;
  }

  function chooseAnswer(e5) {
    let t3 = question.value;
    if (t3) {
      let n3 = selectClarificationAnswer({ hitlValues: approvalValues.value, selections: chosenAnswers.value, questionId: t3.id, answer: toAnswerText(e5.value, e5.label) });
      approvalValues.value = n3.hitlValues, chosenAnswers.value = n3.selections, nextQuestion();
    } else answerChoice.value && !submittingApproval.value && submitAnswer(toAnswerText(e5.value, e5.label));
  }

  function submitAnswer(e5) {
    let t3 = props.hitlRequest;
    if (!t3 || submittingApproval.value) return;
    let n3 = answerKey.value, a3 = (e5 ?? readAnswer(n3)).trim();
    if (question.value) {
      setAnswer(n3, a3), nextQuestion();
      return;
    }
    if (!a3 && !canAnswer.value) return;
    let o3 = { ...approvalValues.value, answer: a3, [n3]: a3 };
    submitChoice.value && (o3[submitChoice.value.id] = submitChoice.value.options[0]?.value ?? true), emit("submitHitl", { requestId: t3.id, values: o3 });
  }

  function skipAnswer() {
    let e5 = props.hitlRequest;
    if (!e5 || submittingApproval.value) return;
    let t3 = answerKey.value, n3 = question.value;
    if (n3) {
      setAnswer(t3, "");
      let { [n3.id]: e6, ...r3 } = chosenAnswers.value;
      chosenAnswers.value = r3, nextQuestion();
      return;
    }
    let a3 = { ...approvalValues.value, answer: "", [t3]: "" };
    submitChoice.value && (a3[submitChoice.value.id] = submitChoice.value.options[0]?.value ?? true), emit("submitHitl", { requestId: e5.id, values: a3 });
  }

  function handleAnswerKey(e5) {
    e5.key !== "Enter" || e5.shiftKey || e5.metaKey || e5.ctrlKey || e5.altKey || (e5.preventDefault(), submitAnswer());
  }

  function answerTitle(e5) {
    return splitAnswerLabel(e5.label).title;
  }

  function answerDescription(e5) {
    return e5.description ?? splitAnswerLabel(e5.label).description;
  }

  function isChosenAnswer(e5) {
    let t3 = question.value;
    return !!(t3 && chosenAnswers.value[t3.id] === toAnswerText(e5.value, e5.label).trim());
  }

  function isDescriptionClipped(e5) {
    return !!overflowingSuggestions.value[e5];
  }

  function scheduleMeasureDescriptions() {
    typeof window !== "undefined" && (overflowFrame && window.cancelAnimationFrame(overflowFrame), overflowFrame = window.requestAnimationFrame(() => {
      overflowFrame = 0, measureDescriptions();
    }));
  }

  function observeDescriptions() {
    return suggestionObserver ||= new ResizeObserver(() => {
      scheduleMeasureDescriptions();
    }), suggestionObserver;
  }

  function bindDescription(e5, t3) {
    let n3 = t3 instanceof HTMLElement ? t3 : null, r3 = suggestionLabels.get(e5);
    if (r3 !== n3)
      if (r3 && suggestionObserver?.unobserve(r3), !n3) {
        suggestionLabels.delete(e5);
        let { [e5]: t4, ...n4 } = overflowingSuggestions.value;
        overflowingSuggestions.value = n4;
      } else suggestionLabels.set(e5, n3), observeDescriptions().observe(n3), scheduleMeasureDescriptions();
  }

  function measureDescriptions() {
    let e5 = {};
    suggestionLabels.forEach((t3, n3) => {
      e5[n3] = t3.scrollWidth > t3.clientWidth + 1;
    }), overflowingSuggestions.value = e5;
  }

  function splitAnswerLabel(e5) {
    let [t3, ...n3] = e5.split(/[:：]/), r3 = n3.join("：").trim();
    return r3 ? { title: t3.trim(), description: r3 } : { title: e5, description: "" };
  }

  function updateAttachmentScroll() {
    let e5 = attachmentStripRef.value;
    if (!e5) {
      canScrollLeft.value = false, canScrollRight.value = false;
      return;
    }
    let t3 = Math.abs(e5.scrollLeft);
    canScrollLeft.value = t3 >= 1, canScrollRight.value = e5.scrollWidth - e5.clientWidth - t3 >= 1;
  }

  function scrollAttachments(e5) {
    let t3 = attachmentStripRef.value;
    t3?.scrollTo({ left: t3.scrollLeft + e5 * t3.clientWidth, behavior: "smooth" });
  }

  watch(attachmentStripRef, (e5) => {
    attachmentObserver?.disconnect(), attachmentObserver = undefined, e5 && typeof ResizeObserver !== "undefined" && (attachmentObserver = new ResizeObserver(updateAttachmentScroll), attachmentObserver.observe(e5)), nextTick(updateAttachmentScroll);
  }, { flush: "post" });
  watch(() => props.pendingAttachments.length, () => {
    nextTick(updateAttachmentScroll);
  }, { flush: "post" });
  watch(() => props.hitlRequest?.id, () => {
    let e5 = { ...props.hitlRequest?.values ?? {} };
    for (let t3 of props.hitlRequest?.controls ?? []) (t3.kind === "text" || t3.kind === "textarea") && e5[t3.id] === undefined && (e5[t3.id] = t3.defaultValue ?? "");
    approvalValues.value = e5, questionIndex.value = 0, chosenAnswers.value = {}, overflowingSuggestions.value = {}, nextTick(scheduleMeasureDescriptions);
  }, { immediate: true });
  watch(() => answerSuggestions.value.map((e5) => e5.label).join(`
`), () => {
    nextTick(scheduleMeasureDescriptions);
  }, { flush: "post" });
  watch(() => [props.autoFocus, props.focusKey, props.hitlRequest?.id, editor.value], async ([e5, t3, n3]) => {
    e5 && !n3 && editor.value && (await nextTick(), scheduleFocus());
  }, { flush: "post", immediate: true });
  watch(() => [inputEditor.open, inputEditor.label, inputEditor.value, inputEditor.kind], async ([e5, t3, n3]) => {
    if (!e5) composing.value = false, expandedInput.value = false, manuallyResized.value = false, finishTokenResize?.(), stopListeningForPopoverDismissal(), popoverObserver?.disconnect(), popoverObserver = undefined;
    else {
      if (composing.value = false, expandedInput.value = inputEditor.kind === "textarea", manuallyResized.value = false, inputEditor.kind === "url") {
        let e6 = parseUrlInput(n3);
        urlProtocol.value = e6.protocol, tokenValue.value = e6.value;
      } else tokenValue.value = n3;
      listenForPopoverDismissal(), await nextTick(), typeof ResizeObserver !== "undefined" && tokenPopoverRef.value && (popoverObserver?.disconnect(), popoverObserver = new ResizeObserver(() => schedulePopoverPlacement()), popoverObserver.observe(tokenPopoverRef.value)), tokenInputRef.value?.focus(), tokenInputRef.value?.select(), adjustTokenHeight(), schedulePopoverPlacement();
    }
  });
  watch(tokenValue, async () => {
    inputEditor.open && inputEditor.kind === "textarea" && (await nextTick(), adjustTokenHeight());
  });
  watch(model, (e5) => {
    warning.value && (missingInputs(e5).length || (warning.value = ""));
  });
  onMounted(() => {
    stopTrackingSize = trackComposerSize(composerRef.value);
  });
  onBeforeUnmount(() => {
    focusFrame && window.cancelAnimationFrame(focusFrame), placementFrame && window.cancelAnimationFrame(placementFrame), overflowFrame && window.cancelAnimationFrame(overflowFrame), actionFrame && window.cancelAnimationFrame(actionFrame), stopListeningForPopoverDismissal(), finishTokenResize?.(), popoverObserver?.disconnect(), attachmentObserver?.disconnect(), suggestionObserver?.disconnect(), stopTrackingSize();
  });
  const exposed = {
    getComposerElement: () => composerRef.value,
    getEmptyInputTokenElement: () => composerRef.value?.querySelector('[data-agent-token="input"].agent-token--input-empty, [data-agent-token="textarea"].agent-token--input-empty') ?? null,
    getEmptyProfileTokenElement: () => composerRef.value?.querySelector('[data-agent-token="profile"].agent-token--profile-empty') ?? null,
    getSelectWindowButtonElement: () => composerRef.value?.querySelector("[data-agent-select-window]") ?? null,
    getSelectTemplateButtonElement: () => composerRef.value?.querySelector("[data-agent-select-template]") ?? null,
    getShellElement: () => shellRef.value,
    focusEditor,
  };

  return {
    exposed,
    inline, fieldPlaceholder, fieldStyle, shellRef, composerRef,
    fileInputRef, attachmentStripRef, canScrollLeft, canScrollRight, tokenInputRef,
    tokenPopoverRef, tokenActionsRef, tokenValue, urlProtocol, composing,
    expandedInput, warning, popoverStyle, popoverSide, questionIndex,
    allMentionItemsSelected, cancelMentionSelection, chooseItem, cancelInputTokenEdit, editor,
    focusEditor, confirmMentionSelection, inputEditor, isEmpty, markSuggestionItemRead,
    toggleSuggestionItemTop, navigateSuggestion, profileHasMore, profileLoadError, profileLoadingMore,
    profileReloading, profileSelectingAll, projectOptions, loadMoreProfiles, selectedMentionCount,
    selectedMentionIds, selectedProjectId, retryLoadProfiles, suggestion, toggleAllMentionItems,
    updateSelectedProject, updateSuggestionQuery, tokenProjects, uploading, canSend,
    canStop, previewUrl, onPaste, onFileChange, onFolderChange,
    hoverSuggestion, activateSend, restoreQueuedPrompt, saveToken, chooseTokenProject,
    pasteUrl, handleTokenKey, startTokenResize, dismissSuggestions, runToolbarAction,
    submittingApproval, questions, hasQuestions, answerKey, answerSuggestions,
    showClarification, approvalActions, approvalFields, answerPlaceholder, approvalPrompt,
    readAnswer, updateAnswer, submitChoiceAnswer, previousQuestion, nextQuestion,
    chooseAnswer, skipAnswer, handleAnswerKey, answerTitle, answerDescription,
    isChosenAnswer, isDescriptionClipped, bindDescription, updateAttachmentScroll, scrollAttachments,
  };
}
