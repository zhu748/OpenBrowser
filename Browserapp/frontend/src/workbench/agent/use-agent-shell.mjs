import { agentShellRuntime } from "./hook-CnJE4hRq.js";

const minimumMonitorWindowWidth = 1181;
const initialMonitorWidth = 320;
const minimumMonitorWidth = 280;
const maximumMonitorWidth = 480;
const initialSidebarWidth = 220;
const minimumSidebarWidth = 200;
const maximumSidebarWidth = 360;
const minimumContentWidth = 460;
const updatePollMs = 6e5;

export function useAgentShell() {
  const { Be, Y, ae, ce, He, x, qn, Pe, mh, N, F, Ve, K, jt, kt, tn, nn, Ct, Hv, hh, gh, Me, Ir } = agentShellRuntime;
  let LiveChat = Be(() => Y(() => import("./live-chat-DNUnbM8O.js"), [])), showLiveChat = !ae && !globalThis.isCloudPhoneApp;
  ce("agent-shell:setup:start"), He(() => {
    document.body.classList.add("agent-console-window"), ce("agent-shell:mounted");
  });
  let r2 = x();
  qn(), r2.initializeAgentBackendAuth().catch((e3) => {
    console.error("[agent-console] Failed to initialize Agent backend authentication:", e3);
  }), Pe(() => {
    document.body.classList.remove("agent-console-window");
  });
  let { activeConversation: activeConversation, activeConversationId: activeConversationId, activeHitlRequest: hitlRequest, activeTodoProgress: todoProgress, addPendingAttachments: addAttachments, addPendingFolder: addFolder, addPendingPathAttachment: addPath, cancelActiveRun: stop, conversationList: conversations, conversationListHasMore: hasMoreConversations, conversationListLoadingMore: loadingConversations, isThinking: thinking, loadMoreConversations: loadMoreConversations, loadEarlierMessages: loadEarlier, messageList: messages, messageHistoryHasMore: hasEarlier, messageHistoryLoading: loadingEarlier, pendingAttachments: attachments, pendingApprovalConversationIds: approvalIds, profileCount: w2, prompt: prompt, queuedPrompts: queuedPrompts, removePendingAttachment: removeAttachment, removeQueuedPrompt: removeQueuedPrompt, renameConversation: D2, reorderQueuedPrompt: reorderPrompt, restoreQueuedPrompt: restorePrompt, runningTaskCount: runningCount, taskGroupList: monitorGroups, deleteConversation: oe2, selectConversation: selectConversation, sendPrompt: send, state: A2, startNewChat: le2, submitHitl: submitHitl, toggleTaskGroup: toggleMonitorGroup } = mh();
  ce("agent-shell:setup-complete");
  let monitorEnabled = N(!1), fe2 = N(typeof window > "u" || window.innerWidth >= minimumMonitorWindowWidth), pe2 = F(() => fe2.value && w2.value > 0), monitorOpen = F(() => monitorEnabled.value && pe2.value), monitorWidth = N(initialMonitorWidth), sidebarWidth = N(initialSidebarWidth), sidebarRef = N(null), guideVisible = N(!1), guideTarget = Ve(null), onboardingCompleteVisible = N(!1), xe2 = N(), Se2 = 0, layoutStyle = F(() => ({ "--agent-sidebar-width": `${sidebarWidth.value}px`, "--task-monitor-width": `${monitorWidth.value}px` })), we2 = F(() => monitorGroups.value.flatMap((e3) => e3.tasks.filter((e4) => e4.status === "running").map((t3) => `${e3.id}:${t3.id}`)));
  K(we2, (e3, t3) => {
    let n3 = new Set(t3);
    e3.some((e4) => !n3.has(e4)) && (monitorEnabled.value = !0);
  });
  let Te2 = jt(), Ee2 = kt(), De2 = tn(), Oe2 = nn(), [, ke2] = Ct(), isRoxyClaw = F(() => String(Te2.name ?? "").startsWith("agent-console-roxyclaw")), settings = F(() => Te2.meta.agentConsoleLayout === "settings" || isRoxyClaw.value), je2 = /* @__PURE__ */ new Set(["agent-console-chat", "agent-console-conversation"]), Ne2 = /* @__PURE__ */ new Set(["agent-console-credits", "agent-console-roxyclaw", "agent-console-task-manager"]), Fe2 = /* @__PURE__ */ new Set([...Ne2, "agent-console-my-templates", "agent-console-template-store"]), updateInfo = N(null), Le2 = N(!1), composerFocus = N(0), ze2 = F(() => updateInfo.value?.type === "agent" && ["update", "downloaded", "failed"].includes(updateInfo.value.status)), Ue2 = F(() => thinking.value || runningCount.value > 0 || conversations.value.some((e3) => e3.runningRunIds.length > 0));
  async function saveTemplate(e3) {
    await send({ conversationId: e3.conversationId, content: $t("请你将刚才的任务保存为模板"), templateContext: { sourceReportId: e3.sourceReportId, report: e3.report } }) ? e3.resolve() : e3.reject(Error("Template save turn could not be started."));
  }
  let backRoute = F(() => activeConversationId.value ? { name: "agent-console-conversation", params: { conversationId: activeConversationId.value } } : { name: "agent-console-chat" }), Ye2 = null, Xe2 = null, z2 = null, Ze2 = null, Qe2 = null, G2 = null;
  function maxMonitorWidth() {
    return typeof window > "u" ? maximumMonitorWidth : Math.max(minimumMonitorWidth, Math.min(maximumMonitorWidth, window.innerWidth - sidebarWidth.value - minimumContentWidth));
  }
  function tt2(e3) {
    return Math.min(Math.max(e3, minimumMonitorWidth), maxMonitorWidth());
  }
  function stepMonitor(e3) {
    monitorWidth.value = tt2(monitorWidth.value + e3);
  }
  function maxSidebarWidth() {
    if (typeof window > "u") return maximumSidebarWidth;
    let e3 = monitorOpen.value ? monitorWidth.value : 0;
    return Math.max(minimumSidebarWidth, Math.min(maximumSidebarWidth, window.innerWidth - minimumContentWidth - e3));
  }
  function it2(e3) {
    return Math.min(Math.max(e3, minimumSidebarWidth), maxSidebarWidth());
  }
  function stepSidebar(e3) {
    sidebarWidth.value = it2(sidebarWidth.value + e3);
  }
  function ot2() {
    Xe2?.(), Xe2 = null, document.body.classList.remove("agent-console-window--resizing-monitor");
  }
  function resizeMonitor(e3) {
    if (e3.button !== 0) return;
    e3.preventDefault(), ot2();
    let t3 = e3.clientX, n3 = monitorWidth.value, r3 = (e4) => {
      monitorWidth.value = tt2(n3 + t3 - e4.clientX), sidebarWidth.value = it2(sidebarWidth.value);
    }, i3 = () => ot2();
    window.addEventListener("pointermove", r3), window.addEventListener("pointerup", i3), window.addEventListener("pointercancel", i3), window.addEventListener("blur", i3), document.body.classList.add("agent-console-window--resizing-monitor"), Xe2 = () => {
      window.removeEventListener("pointermove", r3), window.removeEventListener("pointerup", i3), window.removeEventListener("pointercancel", i3), window.removeEventListener("blur", i3);
    };
  }
  function ct2() {
    z2?.(), z2 = null, document.body.classList.remove("agent-console-window--resizing-sidebar");
  }
  function resizeSidebar(e3) {
    if (e3.button !== 0) return;
    e3.preventDefault(), ct2();
    let t3 = e3.clientX, n3 = sidebarWidth.value, r3 = (e4) => {
      sidebarWidth.value = it2(n3 + (e4.clientX - t3)), monitorWidth.value = tt2(monitorWidth.value);
    }, i3 = () => ct2();
    window.addEventListener("pointermove", r3), window.addEventListener("pointerup", i3), window.addEventListener("pointercancel", i3), window.addEventListener("blur", i3), document.body.classList.add("agent-console-window--resizing-sidebar"), z2 = () => {
      window.removeEventListener("pointermove", r3), window.removeEventListener("pointerup", i3), window.removeEventListener("pointercancel", i3), window.removeEventListener("blur", i3);
    };
  }
  function dt2(e3) {
    fe2.value !== e3 && (fe2.value = e3, e3 || (ot2(), monitorEnabled.value = !1));
  }
  K(pe2, (e3) => {
    e3 || (monitorEnabled.value = !1);
  });
  async function pt2() {
    if (globalThis.isElectron && ze2.value && !Le2.value) {
      Le2.value = !0;
      try {
        let e3 = await mt2(Te2.fullPath);
        e3.success || (ke2(-1, e3.message || $t("AI Agent 更新失败")), Le2.value = !1);
      } catch (e3) {
        console.error("Failed to restart agent for update:", e3), ke2(-1, e3 instanceof Error ? e3.message : $t("AI Agent 更新失败")), Le2.value = !1;
      }
    }
  }
  async function mt2(e3) {throw Error('Agent 随本地安装包更新，无独立云端更新器');}
  async function ht2() {
  }
  async function gt2() {return {updateAvailable:false,distribution:'local-package'};}
  function restartAgent() {
    ze2.value && (Ue2.value ? De2.require({ header: $t("更新 AI Agent"), message: $t("当前有对话正在进行中，更新会中断当前对话。确认继续更新吗？"), rejectProps: { label: $t("取消"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("继续更新") }, accept: () => {
      pt2();
    } }) : pt2());
  }
  function _t2(e3, t3) {
    return typeof e3 == "string" && t3.has(e3);
  }
  function isChatRoute(e3) {
    return _t2(e3, je2);
  }
  function hasTaskPageProps(e3) {
    return _t2(e3, Ne2);
  }
  function isTemplateRoute(e3) {
    return _t2(e3, Fe2);
  }
  function deleteConversation(e3) {
    let t3 = conversations.value.find((t4) => t4.id === e3);
    t3 && De2.require({ group: "agentConsoleDeleteConfirmDialog", header: $t("删除对话"), message: $t("删除后无法恢复，确认删除对话“{name}”吗？", { name: t3.title }), acceptLabel: $t("删除"), rejectLabel: $t("取消"), accept: () => {
      oe2(e3);
    } });
  }
  function renameConversation(e3) {
    let t3 = conversations.value.find((t4) => t4.id === e3);
    t3 && Oe2.open(Hv, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(440px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-rename-conversation-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialTitle: t3.title, onSave: (t4) => D2(e3, t4) } });
  }
  function hideGuide() {
    guideVisible.value = !1, guideTarget.value = null;
  }
  function resetOnboarding() {
    Se2 += 1, xe2.value = void 0, onboardingCompleteVisible.value = !1;
  }
  async function runOnboarding(e3) {
    let t3 = ++Se2;
    xe2.value = void 0, onboardingCompleteVisible.value = !1, !await hh(e3, { startNewChat: le2, sendPrompt: send, onRunStarted: ({ runId: e4 }) => {
      t3 === Se2 && (xe2.value = e4);
    } }) && t3 === Se2 && (xe2.value = void 0);
  }
  K(() => xe2.value ? A2.runsById[xe2.value]?.status : void 0, () => {
    gh(xe2.value, A2.runsById) && (xe2.value = void 0, onboardingCompleteVisible.value = !0);
  }, { flush: "sync" });
  async function onboardingComplete() {
    await Me();
    let e3 = sidebarRef.value?.getNewChatElement() ?? null;
    e3 && (guideTarget.value = e3, guideVisible.value = !0);
  }
  async function newChat() {
    hideGuide(), await le2(), composerFocus.value += 1;
  }
  He(() => {
    let e3 = () => {
      dt2(window.innerWidth >= minimumMonitorWindowWidth), monitorWidth.value = tt2(monitorWidth.value), sidebarWidth.value = it2(sidebarWidth.value);
    };
    e3(), window.addEventListener("resize", e3), Ye2 = () => window.removeEventListener("resize", e3), globalThis.isElectron && (Ze2 = globalThis.electronAPI.on("mcp:navigate", (e4) => {
      e4 && Ee2.push(e4).catch(() => {
      });
    }), Qe2 = globalThis.electronAPI.on("mcp:resource-update", (e4) => {
      e4.type === "agent" && (updateInfo.value = e4);
    }), ht2(), G2 = setInterval(() => {
      ht2();
    }, updatePollMs));
  }), Pe(() => {
    ot2(), ct2(), Ye2?.(), Ye2 = null, Ze2?.(), Ze2 = null, Qe2?.(), Qe2 = null, G2 &&= (clearInterval(G2), null);
  }), K(monitorOpen, () => {
    sidebarWidth.value = it2(sidebarWidth.value);
  }), Ir(monitorEnabled, pe2, runningCount);

  return {
    LiveChat,
    showLiveChat,
    monitorOpen,
    settings,
    isRoxyClaw,
    layoutStyle,
    backRoute,
    sidebarWidth,
    maxSidebarWidth,
    stepSidebar,
    resizeSidebar,
    sidebarRef,
    activeConversationId,
    activeConversation,
    conversations,
    hasMoreConversations,
    loadingConversations,
    approvalIds,
    updateInfo,
    deleteConversation,
    newChat,
    renameConversation,
    restartAgent,
    selectConversation,
    loadMoreConversations,
    hasTaskPageProps,
    isChatRoute,
    isTemplateRoute,
    prompt,
    thinking,
    send,
    composerFocus,
    hitlRequest,
    messages,
    onboardingCompleteVisible,
    hasEarlier,
    loadingEarlier,
    attachments,
    queuedPrompts,
    todoProgress,
    addAttachments,
    addFolder,
    addPath,
    removeAttachment,
    removeQueuedPrompt,
    reorderPrompt,
    restorePrompt,
    loadEarlier,
    saveTemplate,
    onboardingComplete,
    resetOnboarding,
    runOnboarding,
    stop,
    submitHitl,
    monitorGroups,
    maxMonitorWidth,
    monitorWidth,
    runningCount,
    monitorEnabled,
    resizeMonitor,
    stepMonitor,
    toggleMonitorGroup,
    guideTarget,
    guideVisible,
    hideGuide,
    minimumMonitorWidth,
    minimumSidebarWidth,
  };
}
