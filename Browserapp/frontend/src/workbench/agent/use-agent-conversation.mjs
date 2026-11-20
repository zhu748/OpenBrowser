import {
  formatMessageDate,
  formatTaskDuration,
  buildRunProcess,
  readConversationRow,
  readConversationMessages,
  IncrementalProcess,
  failLiveTimelineEvents,
} from './workbench-run-process.js';
import { enrichScriptEvents, idleScheduler, RunEventBatch } from './workbench-run-event-batch.js';
import {
  localAttachmentRefs,
  mergeUploadedFiles,
  releasePreviews,
  fileDraft,
  folderDraft,
  pathDraft,
} from './workbench-attachment-draft.js';
import { readApprovalRequest, approvalDecisions } from './workbench-approval-request.js';
import { approvalActionTitles } from './workbench-approval-resource-names.js';
import { toolLabel } from './workbench-tool-event-labels.js';
import {
  unreadRun,
  needsConversationHistory,
  runIsBusy,
  pendingMessages,
  reconcilePendingMessages,
  acceptStreamEvent,
  drainStreamBuffer,
  mergeEventHistory,
  restoreEventHistory,
  terminalRunStatus,
  mergeConversationRun,
  StoppedRuns,
  PendingRequests,
} from './workbench-agent-conversation-stream.js';
import {
  prefillKey,
  batchCreateIntent,
  windowIdsKey,
  isBatchCreateIntent,
  isAutomationIntent,
  batchCreatePrompt,
  automationWindows,
  prefillAutomation,
  prefillKey as automationPrefillKey,
  batchCreateGuide,
  automationGuide,
} from './workbench-agent-route-intents.js';
import { useTaskMonitor } from './workbench-agent-task-monitor.js';
import { touchConversationCache } from './agent-conversation-cache.js';
import {
  N as useAgentApi,
  gt as trace,
  ht as measure,
  mt as useWorkspace,
  sn as useLocale,
  v as useLocalUser,
} from './utils-BIWenCnY.js';
import {
  F as nextTick,
  R as onBeforeUnmount,
  St as ref,
  V as onMounted,
  bt as reactive,
  d as computed,
  st as watch,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { i as recentTaskConversations, r as useAgentChannel } from './TaskStatusBadge-fl9VE7c_.js';
import {
  B as readHomeTemplates,
  M as useApproval,
  N as resolveProfiles,
  R as updateProfileLabels,
  X as removeQueuedPrompt,
  Y as makeQueuedPrompt,
  Z as reorderQueuedPrompt,
  q as readTemplatePage,
} from './CreateTemplateDialog-Bpq9OLTG.js';
const {
  event: xp,
  request: requestBatchCreateGuide,
  shown: Ep,
  remember: Dp,
  requested: kp,
  forced: Ap,
  clear: jp,
} = batchCreateGuide;
const {
  event: Hp,
  request: requestAutomationGuide,
  shown: Kp,
  remember: qp,
  requested: Yp,
  clear: Xp,
} = automationGuide;
const taskMonitor = () => useTaskMonitor(toolLabel);
var sharedState;
var homePrompt = ref('');
var homeAttachments = ref([]);
var homeMessages = ref([]);
var homeQueue = ref([]);
var creatingConversation;
var conversationPageSize = 10;
var messagePageSize = 5;
var eventBatchInterval = 50;
var paintInterval = 50;
var loadingDetails = new Set();
var pendingHistoryRefresh = new Set();
var outOfOrderEvents = new Map();
var refreshRequest;
var nextPageRequest;
var remoteConversationIds = [];
var conversationListHasMore = ref(true);
var conversationListLoadingMore = ref(false);
var listening = false;
var historyPages = reactive({});
var uploads = new Map();
var requestTimeout = 2e4;
var pendingRequests = new PendingRequests();
var pendingMessagesByRun = new Map();
var preparingMessages = new Map();
var stoppedRuns = new StoppedRuns();
var pendingVersion = ref(0);
function conversationState() {
  sharedState ||= reactive(createState());
  return sharedState;
}
function createState() {
  return {
    conversationIds: [],
    conversationsById: {},
    draftsByConversationId: {},
    queuedPromptsByConversationId: {},
    messagesByConversationId: {},
    runsById: {},
    streamsByRunId: {},
    todoProgressByRunId: {},
    taskGroupsByConversationId: {},
    pendingHitlByConversationId: {},
  };
}
function firstRouteValue(value) {
  return Array.isArray(value) ? value[0] : typeof value == 'string' ? value : undefined;
}
function initialTitle(prompt) {
  let title = prompt?.trim();
  return title ? (title.length > 42 ? `${title.slice(0, 42)}...` : title) : 'New conversation';
}
function clockText() {
  return formatMessageDate(Date.now());
}
function createLocalConversation(state, title = 'New conversation', id, includeMessages = true) {
  let conversationId = id ?? `conv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    conversation = {
      id: conversationId,
      title: title,
      updatedAt: clockText(),
      runningRunIds: [],
      unread: false,
    };
  state.conversationIds.unshift(conversationId);
  state.conversationsById[conversationId] = conversation;
  state.draftsByConversationId[conversationId] = {
    conversationId: conversationId,
    prompt: '',
    attachments: [],
  };
  state.queuedPromptsByConversationId[conversationId] = [];
  includeMessages && (state.messagesByConversationId[conversationId] = []);
  state.taskGroupsByConversationId[conversationId] = [];
  return conversation;
}
function ensureConversation(state, id) {
  if (id)
    return (
      state.conversationsById[id] ?? createLocalConversation(state, 'Loading conversation...', id, false)
    );
}
function updateRunStatus(state, id, status, error, options = {}) {
  let run = state.runsById[id],
    stream = state.streamsByRunId[id];
  if (
    (run &&
      ((run.status = status),
      (run.error = error),
      (status === 'completed' || status === 'failed' || status === 'cancelled') &&
        (run.completedAt = clockText())),
    stream && ((stream.status = status), (stream.error = error)),
    run && (status === 'completed' || status === 'failed' || status === 'cancelled'))
  ) {
    let r3 = state.conversationsById[run.conversationId];
    r3 &&
      ((r3.latestRunStatus = status),
      (r3.runningRunIds = r3.runningRunIds.filter((e3) => e3 !== id)),
      r3.runningRunIds.length === 0 && cacheConversation(state, run.conversationId),
      options.markUnread && (r3.unread = true));
    delete state.todoProgressByRunId[id];
    delete state.pendingHitlByConversationId[run.conversationId];
  }
}
function runningStatus(status) {
  return status === 'queued' || status === 'streaming';
}
function terminalStatus(status) {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}
function hasRunningRun(state, id) {
  let conversation = state.conversationsById[id];
  return conversation
    ? conversation.runningRunIds.some((t3) => {
        let n3 = state.runsById[t3];
        return !n3 || runningStatus(n3.status);
      })
    : false;
}
var cachedConversations = 3;
var recentConversations = new Map();
function protectConversationCache(state, id) {
  let hasRunningMessage =
    state.messagesByConversationId[id]?.some(
      (e3) => e3.role === 'assistant' && (e3.status === 'thinking' || e3.status === 'streaming'),
    ) ?? false;
  return runIsBusy({
    hasActiveRun: hasRunningRun(state, id),
    hasPendingRun: pendingRequests.has(id),
    hasPreparingRun: preparingMessages.has(id),
    hasRunningMessage: hasRunningMessage,
    hasStoppedPendingRun: stoppedRuns.hasPending(id),
  });
}
function forgetCacheEntry(id) {
  recentConversations.delete(id);
}
function cacheConversation(state, id) {
  return touchConversationCache(state, id, {
    recent: recentConversations,
    maximum: cachedConversations,
    isActive: (id2) => protectConversationCache(state, id2),
    selected: () => firstRouteValue(globalThis.__router?.currentRoute?.value?.params?.conversationId),
    onEvict: (id2) => {
      delete historyPages[id2];
      recentConversations.delete(id2);
    },
  });
}
function isTemporaryConversation(id) {
  return id.startsWith('conv-');
}
function removeConversationRecord(state, id) {
  remoteConversationIds = remoteConversationIds.filter((e3) => e3 !== id);
  releasePreviews(state.draftsByConversationId[id]?.attachments);
  state.conversationIds = state.conversationIds.filter((e3) => e3 !== id);
  delete state.conversationsById[id];
  delete state.draftsByConversationId[id];
  delete state.queuedPromptsByConversationId[id];
  delete state.messagesByConversationId[id];
  delete historyPages[id];
  delete state.taskGroupsByConversationId[id];
  delete state.pendingHitlByConversationId[id];
  loadingDetails.delete(id);
  recentConversations.delete(id);
  let n2 = Object.values(state.runsById)
    .filter((e3) => e3.conversationId === id)
    .map((e3) => e3.id);
  stoppedRuns.removeConversation(id, n2);
  for (let n3 of Object.keys(state.runsById))
    state.runsById[n3]?.conversationId === id &&
      (delete state.runsById[n3], delete state.streamsByRunId[n3], delete state.todoProgressByRunId[n3]);
}
function emptyDraft(conversationId) {
  return { conversationId: conversationId, prompt: '', attachments: [] };
}
function todoStatus(status) {
  return status === 'in_progress' || status === 'completed' ? status : 'pending';
}
function todoRows(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value == 'object') {
    let t2 = value.todos;
    if (Array.isArray(t2)) return t2;
  }
  return [];
}
function formatTodoProgress(conversationId, runId, value) {
  let todos = todoRows(value)
    .map((e3, t3) => {
      let n3 = e3 && typeof e3 == 'object' ? e3 : {},
        r3 =
          typeof n3.content == 'string'
            ? n3.content
            : typeof n3.title == 'string'
              ? n3.title
              : typeof n3.text == 'string'
                ? n3.text
                : '';
      return {
        id: typeof n3.id == 'string' ? n3.id : `todo-${t3}`,
        content: r3,
        status: todoStatus(n3.status),
      };
    })
    .filter((e3) => e3.content.trim());
  if (!todos.length) return;
  let active = todos.findIndex((e3) => e3.status === 'in_progress'),
    firstPending = todos.findIndex((e3) => e3.status === 'pending'),
    completed = todos.filter((e3) => e3.status === 'completed').length,
    highlighted = active >= 0 ? active : firstPending >= 0 ? firstPending : Math.max(0, completed - 1);
  return {
    id: `todo-progress-${runId}`,
    conversationId: conversationId,
    runId: runId,
    current: Math.min(highlighted + 1, todos.length),
    total: todos.length,
    content: todos[highlighted]?.content,
    todos: todos,
  };
}
function useAgentConversation() {
  let state = conversationState(),
    api = useAgentApi(),
    user = useLocalUser(),
    workspace = useWorkspace(),
    locale = useLocale(),
    { fullAccess: fullAccess } = useApproval(),
    [notify, notifyError] = useFeedback(),
    channel = useAgentChannel(),
    monitor = taskMonitor(),
    route = useRoute(),
    router = useRouter();
  trace('agent-console:useAgentConsole:start');
  let pendingPaints = new Map(),
    eventHistory = new Map(),
    eventQueues = new Map(),
    checkpoints = new Map(),
    draining = new Set(),
    paintTimer;
  onBeforeUnmount(() => {
    paintTimer !== undefined && window.clearTimeout(paintTimer);
    pendingPaints.clear();
    checkpoints.clear();
  });
  let batchPrefillRevision = 0,
    automationPrefillRevision = 0;
  async function prefillBatchCreate() {
    let revision = ++batchPrefillRevision;
    homePrompt.value = '';
    releasePreviews(homeAttachments.value);
    homeAttachments.value = [];
    try {
      let n3 = await api.templates.listOfficialTemplates({
          limit: 20,
          search: batchCreateIntent,
          templateType: 'prompt',
        }),
        r3 = batchCreatePrompt(readTemplatePage(n3, $t('加载官方模板失败')), locale.currentLocale);
      if (!r3) throw Error($t('未找到批量创建窗口模板'));
      revision === batchPrefillRevision && route.name === 'agent-console-chat' && (homePrompt.value = r3);
    } catch (t3) {
      let n3 = batchCreatePrompt(readHomeTemplates()?.templates ?? [], locale.currentLocale);
      revision === batchPrefillRevision &&
        route.name === 'agent-console-chat' &&
        (n3
          ? (homePrompt.value = n3)
          : (console.error('[agent-console] Failed to load the batch profile creation template:', t3),
            notifyError(-1, t3 instanceof Error ? t3.message : $t('加载官方模板失败'))));
    } finally {
      if (revision === batchPrefillRevision && route.name === 'agent-console-chat') {
        let e4 = { ...route.query };
        delete e4[prefillKey];
        router.replace({ name: 'agent-console-chat', query: e4 });
      }
    }
  }
  async function prefillAutomationFromRoute() {
    let revision = ++automationPrefillRevision,
      windows = automationWindows(route.query[windowIdsKey]);
    homePrompt.value = '';
    releasePreviews(homeAttachments.value);
    homeAttachments.value = [];
    try {
      let n3 = await prefillAutomation(
        windows,
        async (e4) => {
          let t4 = await resolveProfiles(e4, workspace.currentWorkspace?.workspaceName);
          updateProfileLabels(t4.map((e5) => ({ id: e5.id, label: e5.code || e5.name || e5.id })));
        },
        (e4) => $t('在 {profile} 窗口中运行', { profile: e4 }),
      );
      revision === automationPrefillRevision &&
        route.name === 'agent-console-chat' &&
        (homePrompt.value = n3);
    } catch (t4) {
      revision === automationPrefillRevision &&
        route.name === 'agent-console-chat' &&
        (console.error('[agent-console] Failed to load windows for automation prefill:', t4),
        notifyError(-1, t4 instanceof Error ? t4.message : $t('获取窗口信息失败')));
    } finally {
      if (revision === automationPrefillRevision && route.name === 'agent-console-chat') {
        let e4 = { ...route.query };
        delete e4[automationPrefillKey];
        delete e4[windowIdsKey];
        router.replace({ name: 'agent-console-chat', query: e4 });
      }
    }
  }
  watch(
    () => [route.name, route.query[prefillKey], route.query[windowIdsKey]],
    ([e3, t3]) => {
      e3 === 'agent-console-chat' &&
        (isBatchCreateIntent(t3)
          ? (requestBatchCreateGuide(), prefillBatchCreate())
          : isAutomationIntent(t3) && (requestAutomationGuide(), prefillAutomationFromRoute()));
    },
    { immediate: true },
  );
  function trackOnboarding() {}
  let selectedId = computed(() => firstRouteValue(route.params.conversationId));
  (watch(
    () => [route.name, selectedId.value],
    ([t3, n3]) => {
      t3 === 'agent-console-conversation' &&
        (ensureConversation(state, n3), n3 && loadConversationDetail(n3));
    },
    { immediate: true },
  ),
    watch(
      () =>
        recentTaskConversations({
          taskLogs: channel.taskLogs.value,
          taskExecutionDetails: channel.taskExecutionDetails.value,
        }),
      (t3) => {
        for (let n3 of t3)
          (state.conversationsById[n3] && state.conversationIds.includes(n3)) || refreshConversations();
      },
      { flush: 'post', immediate: true },
    ),
    onMounted(() => {
      trace('agent-console:onMounted');
      refreshConversations();
    }));
  let activeConversationId = computed(() => {
      let t3 = selectedId.value;
      if (t3 && state.conversationsById[t3]) return t3;
    }),
    activeConversation = computed(() => {
      let t3 = activeConversationId.value;
      return t3 ? state.conversationsById[t3] : undefined;
    }),
    markingRead = new Set();
  async function markRunRead(run) {
    let identity = `${run.conversationId}:${run.runId}`;
    if (!markingRead.has(identity)) {
      markingRead.add(identity);
      try {
        upsertConversation(
          readConversationRow(await api.markConversationRead(run.conversationId, run.runId)),
        );
      } catch (t3) {
        console.error(`[agent-console] Failed to mark conversation ${run.conversationId} as read:`, t3);
      } finally {
        markingRead.delete(identity);
      }
    }
  }
  watch(
    () => unreadRun(activeConversation.value, activeConversationId.value),
    (e3) => {
      e3 && markRunRead(e3);
    },
    { immediate: true },
  );
  let conversationList = computed(() =>
      state.conversationIds.map((t3) => state.conversationsById[t3]).filter(Boolean),
    ),
    messageList = computed(() => {
      let t3 = activeConversationId.value;
      return t3 ? (state.messagesByConversationId[t3] ?? []) : homeMessages.value;
    }),
    messageHistoryHasMore = computed(() => {
      let e3 = activeConversationId.value;
      return e3 ? historyPages[e3]?.hasMore === true : false;
    }),
    messageHistoryLoading = computed(() => {
      let e3 = activeConversationId.value;
      return e3 ? historyPages[e3]?.loading === true : false;
    }),
    taskGroupList = monitor.taskGroupList,
    activeHitlRequest = computed(() => {
      let t3 = activeConversationId.value;
      return t3 ? state.pendingHitlByConversationId[t3] : undefined;
    }),
    pendingApprovalConversationIds = computed(() => Object.keys(state.pendingHitlByConversationId)),
    activeTodoProgress = computed(() => {
      let t3 = activeConversation.value;
      if (t3)
        for (let n3 = t3.runningRunIds.length - 1; n3 >= 0; n3--) {
          let r3 = t3.runningRunIds[n3],
            i3 = state.runsById[r3],
            a3 = state.todoProgressByRunId[r3];
          if (a3 && (i3?.status === 'queued' || i3?.status === 'streaming')) return a3;
        }
    }),
    prompt = computed({
      get() {
        let t3 = activeConversationId.value;
        return t3 ? (state.draftsByConversationId[t3]?.prompt ?? '') : homePrompt.value;
      },
      set(t3) {
        let n3 = activeConversationId.value;
        n3
          ? ((state.draftsByConversationId[n3] ||= emptyDraft(n3)),
            (state.draftsByConversationId[n3].prompt = t3))
          : (homePrompt.value = t3);
      },
    }),
    queuedPrompts = computed(() => {
      let t3 = activeConversationId.value;
      return t3 ? (state.queuedPromptsByConversationId[t3] ||= []) : homeQueue.value;
    }),
    flushingPrompts = new Set();
  function queueFor(conversationId) {
    return conversationId ? (state.queuedPromptsByConversationId[conversationId] ||= []) : homeQueue.value;
  }
  function queuePrompt(conversationId, content, options = {}) {
    let prompt = content.trim();
    (prompt || options.attachments?.length) &&
      queueFor(conversationId).push(makeQueuedPrompt(conversationId ?? 'home', prompt, Date.now(), options));
  }
  function removeQueuedPrompt(promptId) {
    releasePreviews(removeQueuedPrompt(queuedPrompts.value, promptId)?.attachments);
  }
  function reorderQueuedPrompt(move) {
    reorderQueuedPrompt(queuedPrompts.value, move.promptId, move.targetIndex);
  }
  function restoreQueuedPrompt(id) {
    let saved = removeQueuedPrompt(queuedPrompts.value, id);
    if (saved && ((prompt.value = saved.draftContent ?? saved.content), saved.attachments?.length)) {
      let t4 = activeConversationId.value;
      t4
        ? (state.draftsByConversationId[t4] ||= emptyDraft(t4)).attachments.push(...saved.attachments)
        : (homeAttachments.value = [...homeAttachments.value, ...saved.attachments]);
    }
  }
  function runPending(id) {
    return hasRunningRun(state, id) || pendingRequests.has(id) || preparingMessages.has(id);
  }
  function schedulePromptDrain(id) {
    let key = id ?? 'home';
    queueMicrotask(() => {
      drainPromptQueue(id, key);
    });
  }
  async function drainPromptQueue(id, key) {
    if (flushingPrompts.has(key) || (id ? runPending(id) : creatingConversation)) return;
    let items = queueFor(id),
      next = items[0];
    if (next) {
      flushingPrompts.add(key);
      try {
        (await sendPrompt({
          attachments: next.attachments ?? [],
          content: next.content,
          conversationId: id,
          fromQueue: true,
        })) && removeQueuedPrompt(items, next.id);
      } finally {
        flushingPrompts.delete(key);
      }
    }
  }
  let pendingAttachments = computed(() => {
      let t3 = activeConversationId.value;
      return t3
        ? ((state.draftsByConversationId[t3] ||= emptyDraft(t3)),
          state.draftsByConversationId[t3].attachments)
        : homeAttachments.value;
    }),
    isThinking = computed(() => {
      let t3 = activeConversation.value;
      return t3
        ? pendingVersion.value >= 0 && pendingRequests.has(t3.id)
          ? true
          : t3.runningRunIds.some((t4) => {
              let n3 = state.runsById[t4];
              return n3?.status === 'queued' || n3?.status === 'streaming';
            })
        : homeMessages.value.some(
            (e3) => e3.role === 'assistant' && (e3.status === 'thinking' || e3.status === 'streaming'),
          );
    }),
    runningTaskCount = computed(() => monitor.runningTaskCount.value),
    profileCount = computed(() => monitor.profileCount.value);
  function openConversation(id) {
    return router.push({
      name: 'agent-console-conversation',
      params: { conversationId: id },
      query: route.query,
    });
  }
  function selectConversation(id) {
    return openConversation(id);
  }
  async function startNewChat() {
    creatingConversation = undefined;
    homeMessages.value = [];
    homeQueue.value = [];
    homePrompt.value = '';
    clearAttachments();
    await router.push({ name: 'agent-console-chat', query: route.query });
  }
  function toggleTaskGroup(id) {
    monitor.toggleTaskGroup(id);
  }
  function upsertConversation(record) {
    let existing = state.conversationsById[record.id],
      latestId = existing?.latestRunId,
      currentRun = latestId ? state.runsById[latestId] : undefined,
      cancelled = !!(
        latestId &&
        latestId === record.latestRunId &&
        (runningStatus(currentRun?.status) || existing?.runningRunIds.includes(latestId))
      ),
      o3 = mergeConversationRun(
        existing,
        record,
        !!(record.latestRunId && stoppedRuns.hasRun(record.latestRunId)),
      );
    state.conversationsById[record.id] = { ...existing, ...record, ...o3 };
    state.draftsByConversationId[record.id] ||= emptyDraft(record.id);
    state.queuedPromptsByConversationId[record.id] ||= [];
    state.taskGroupsByConversationId[record.id] ||= [];
    cancelled &&
      record.latestRunId &&
      terminalStatus(o3.latestRunStatus) &&
      (stopProcessClock(record.id, record.latestRunId, o3.latestRunStatus),
      scheduleHistoryRefresh(record.id, record.latestRunId));
    protectConversationCache(state, record.id) &&
      ((state.messagesByConversationId[record.id] ||= []), forgetCacheEntry(record.id));
  }
  async function refreshConversations() {
    if (refreshRequest) return refreshRequest;
    let finishMeasure = measure('agent-console:loadConversationList');
    return (
      (refreshRequest = (async () => {
        try {
          let n4 = new Set(remoteConversationIds),
            r3 = Math.max(conversationPageSize, remoteConversationIds.length),
            i3 = await api.conversationList({ limit: r3, offset: 0 }),
            a3 = [];
          for (let e3 of i3) {
            let t3 = readConversationRow(e3);
            a3.push(t3.id);
            upsertConversation(t3);
          }
          let o3 = activeConversationId.value,
            s3 = state.conversationIds.filter(
              (t3) =>
                !n4.has(t3) &&
                !a3.includes(t3) &&
                state.conversationsById[t3] &&
                (t3 === o3 || isTemporaryConversation(t3) || hasRunningRun(state, t3)),
            );
          remoteConversationIds = a3;
          conversationListHasMore.value = i3.length === r3;
          state.conversationIds = [...s3, ...remoteConversationIds];
          o3 && (await loadConversationDetail(o3));
        } catch (e3) {
          console.error('[agent-console] Failed to load conversation list:', e3);
        } finally {
          refreshRequest = undefined;
          finishMeasure({ conversationCount: state.conversationIds.length });
        }
      })()),
      refreshRequest
    );
  }
  async function loadMoreConversations() {
    return (
      refreshRequest && (await refreshRequest),
      !conversationListHasMore.value ||
        nextPageRequest ||
        ((conversationListLoadingMore.value = true),
        (nextPageRequest = (async () => {
          try {
            let n3 = await api.conversationList({
                limit: conversationPageSize,
                offset: remoteConversationIds.length,
              }),
              r3 = [];
            for (let e3 of n3) {
              let t3 = readConversationRow(e3);
              r3.push(t3.id);
              upsertConversation(t3);
            }
            remoteConversationIds = [
              ...remoteConversationIds,
              ...r3.filter((e3) => !remoteConversationIds.includes(e3)),
            ];
            conversationListHasMore.value = n3.length === conversationPageSize;
            let i3 = state.conversationIds.filter((e3) => !remoteConversationIds.includes(e3));
            state.conversationIds = [...i3, ...remoteConversationIds];
          } catch (e3) {
            console.error('[agent-console] Failed to load more conversations:', e3);
          } finally {
            nextPageRequest = undefined;
            conversationListLoadingMore.value = false;
          }
        })())),
      nextPageRequest
    );
  }
  function needsHistory(id) {
    let conversation = state.conversationsById[id],
      terminal =
        conversation?.latestRunStatus === 'completed' ||
        conversation?.latestRunStatus === 'failed' ||
        conversation?.latestRunStatus === 'cancelled',
      i3 = remoteConversationIds.includes(id) || terminal;
    return needsConversationHistory({
      hasMessageCache: Object.hasOwn(state.messagesByConversationId, id),
      isKnownConversation: i3,
      isRunning: protectConversationCache(state, id),
    });
  }
  async function resolveHistoryLabels(history) {
    let messages = await Promise.all(
      history.messages.map(async (e4) =>
        e4.events?.length
          ? {
              ...e4,
              events: await enrichScriptEvents(e4.events, {
                templates: api.templates,
                userTemplates: api.userTemplates,
                locale: locale.currentLocale,
                workspaceId: workspace.currentWorkspace?.id,
              }),
            }
          : e4,
      ),
    );
    return { ...history, messages: messages };
  }
  async function loadConversationDetail(id) {
    if ((cacheConversation(state, id), !needsHistory(id) || loadingDetails.has(id))) return;
    let finishMeasure = measure('agent-console:loadConversationDetail', { conversationId: id });
    loadingDetails.add(id);
    try {
      let r4 = await api.conversationDetail(id, { limit: messagePageSize });
      if (!needsHistory(id) || ((r4 = await resolveHistoryLabels(r4)), !needsHistory(id))) return;
      let i3 = readConversationRow(r4.conversation);
      upsertConversation(i3);
      state.conversationIds.includes(i3.id) || state.conversationIds.unshift(i3.id);
      let a3 = [];
      for (let e3 of r4.messages) {
        if (e3.role !== 'assistant' || !e3.events?.length || stoppedRuns.hasRun(e3.events[0].runId)) continue;
        let t3 = streamFor(e3.events[0]);
        if (!restoreEventHistory(t3, e3.events)) continue;
        let n4 = e3.events.map(terminalRunStatus).findLast(Boolean);
        if (n4) {
          let r5 = e3.events.findLast((e4) => e4.event.type === 'run_failed');
          a3.push({
            runId: t3.runId,
            status: n4,
            error: r5?.event.type === 'run_failed' ? r5.event.data.message : undefined,
          });
        }
      }
      state.messagesByConversationId[id] = readConversationMessages(r4);
      historyPages[id] = {
        hasMore: r4.hasMore === true && r4.nextCursor !== null,
        loading: false,
        nextCursor: r4.nextCursor ?? null,
      };
      cacheConversation(state, id);
      for (let t3 of a3) (updateRunStatus(state, t3.runId, t3.status, t3.error), schedulePromptDrain(id));
    } catch (e3) {
      console.error(`[agent-console] Failed to load conversation detail ${id}:`, e3);
    } finally {
      loadingDetails.delete(id);
      finishMeasure({ loaded: Object.hasOwn(state.messagesByConversationId, id) });
    }
  }
  async function loadEarlierMessages() {
    let id = activeConversationId.value;
    if (!id) return;
    let pagination = historyPages[id];
    if (pagination?.hasMore && !pagination.loading && pagination.nextCursor) {
      pagination.loading = true;
      try {
        let i3 = await resolveHistoryLabels(
            await api.conversationDetail(id, { cursor: pagination.nextCursor, limit: messagePageSize }),
          ),
          a3 = state.messagesByConversationId[id] ?? [],
          o3 = new Set(a3.map((e3) => e3.id)),
          s3 = readConversationMessages(i3).filter((e3) => !o3.has(e3.id));
        state.messagesByConversationId[id] = [...s3, ...a3];
        pagination.hasMore = i3.hasMore === true && i3.nextCursor !== null;
        pagination.nextCursor = i3.nextCursor ?? null;
        cacheConversation(state, id);
      } catch (e3) {
        console.error(`[agent-console] Failed to load earlier messages for ${id}:`, e3);
      } finally {
        pagination.loading = false;
      }
    }
  }
  function streamFor(envelope) {
    let { conversationId: conversationId, runId: runId, assistantMessageId: assistantMessageId } = envelope,
      conversation = ensureConversation(state, conversationId);
    state.conversationIds.includes(conversationId) || state.conversationIds.unshift(conversationId);
    let o3 = envelope.event.type === 'run_started' ? envelope.event.data.startedAt : envelope.timestamp,
      s3 = formatMessageDate(o3);
    state.runsById[runId] ||= {
      id: runId,
      conversationId: conversationId,
      status: 'streaming',
      startedAt: s3,
    };
    state.streamsByRunId[runId] ||= {
      id: `stream-${runId}`,
      conversationId: conversationId,
      runId: runId,
      status: 'streaming',
      events: [],
      lastSequence: 0,
    };
    conversation.updatedAt = s3;
    conversation.latestRunId = runId;
    conversation.latestRunStatus = 'streaming';
    conversation.runningRunIds.includes(runId) || conversation.runningRunIds.push(runId);
    forgetCacheEntry(conversationId);
    state.messagesByConversationId[conversationId] ||= [];
    findAssistantMessage(conversationId, runId, assistantMessageId) ||
      state.messagesByConversationId[conversationId].push({
        id: assistantMessageId,
        conversationId: conversationId,
        runId: runId,
        role: 'assistant',
        author: 'OpenBrowser AI Agent',
        content: '',
        createdAt: '',
        status: 'streaming',
        process: {
          id: `pending-process-${assistantMessageId}`,
          revision: 0,
          completed: false,
          durationState: 'thinking',
          durationStartedAt: o3,
          collapsed: false,
          events: [],
        },
      });
    return state.streamsByRunId[runId];
  }
  function findAssistantMessage(conversationId, runId, messageId) {
    let messages = state.messagesByConversationId[conversationId];
    if (!messages) return;
    let matches = (e3) =>
        e3.role === 'assistant' && (e3.runId === runId || !!(messageId && e3.id === messageId)),
      o3 = messages.find(matches);
    if (o3) {
      for (let e3 = messages.length - 1; e3 >= 0; e3--) {
        let t4 = messages[e3];
        t4 !== o3 && matches(t4) && messages.splice(e3, 1);
      }
      return o3;
    }
  }
  function completeOpenSteps(events, failed) {
    for (let n3 of events)
      (n3.status === 'running' || n3.status === 'pending') && (n3.status = failed ? 'failed' : 'success');
  }
  function stopProcessClock(conversationId, runId, status) {
    let message = findAssistantMessage(conversationId, runId);
    if (message?.process) {
      let e3 = Date.now(),
        t4 = message.process.durationStartedAt ?? e3;
      message.process.durationEndedAt = e3;
      message.process.durationLabel ??= formatFinalDuration(status, Math.max(0, e3 - t4));
      message.process.durationState = undefined;
      message.process.completed = status === 'completed';
      message.process.collapsed = status === 'completed';
      completeOpenSteps(message.process.events, status === 'failed');
    }
    message &&
      ((message.status = status === 'failed' ? 'error' : 'done'), (message.createdAt ||= clockText()));
    updateRunStatus(state, runId, status);
    schedulePromptDrain(conversationId);
  }
  function scheduleHistoryRefresh(conversationId, runId) {
    pendingHistoryRefresh.has(runId) ||
      (pendingHistoryRefresh.add(runId),
      queueMicrotask(() => {
        loadConversationDetail(conversationId).finally(() => pendingHistoryRefresh.delete(runId));
      }));
  }
  function paintMessage(conversationId, runId, assistantMessageId, finalize = false) {
    let stream = state.streamsByRunId[runId];
    if (!stream) return;
    let events = eventHistory.get(runId) ?? stream.events,
      message = findAssistantMessage(conversationId, runId, assistantMessageId),
      checkpoint = checkpoints.get(runId),
      incremental =
        !finalize && message?.process
          ? checkpoint?.update(assistantMessageId, message.process, events)
          : false;
    if (incremental)
      return (
        (message.content = incremental.content),
        (message.errorData = incremental.errorData),
        (message.status = incremental.status === 'error' ? 'error' : 'streaming'),
        { ...incremental, status: message.status }
      );
    let u3 = buildRunProcess(assistantMessageId, events, { finalize: finalize }),
      d3 = checkpoint ?? new IncrementalProcess();
    if ((d3.reset(events, u3.checkpoint), checkpoints.set(runId, d3), message)) {
      let e3 = message.process?.durationStartedAt;
      e3 !== undefined &&
        (u3.process.durationStartedAt === undefined || e3 < u3.process.durationStartedAt) &&
        ((u3.process.durationStartedAt = e3),
        u3.process.durationEndedAt !== undefined &&
          (u3.process.durationLabel = formatTaskDuration(Math.max(0, u3.process.durationEndedAt - e3))));
      message.content = u3.content;
      message.process = u3.process;
      message.errorData = u3.errorData;
      message.status = finalize ? u3.status : u3.status === 'error' ? 'error' : 'streaming';
      finalize && (message.createdAt = u3.completedAt);
    }
    return u3;
  }
  function flushPaint(runId, finalize = false) {
    let paint = pendingPaints.get(runId);
    if (!paint) return;
    pendingPaints.delete(runId);
    let result = paintMessage(paint.conversationId, runId, paint.assistantMessageId, finalize);
    paintTimer !== undefined &&
      pendingPaints.size === 0 &&
      (window.clearTimeout(paintTimer), (paintTimer = undefined));
    return result;
  }
  function schedulePaint(conversationId, runId, assistantMessageId) {
    pendingPaints.set(runId, { assistantMessageId: assistantMessageId, conversationId: conversationId });
    paintTimer === undefined &&
      (paintTimer = window.setTimeout(() => {
        paintTimer = undefined;
        let e4 = [...pendingPaints.keys()];
        for (let t4 of e4) flushPaint(t4);
      }, paintInterval));
  }
  async function openApprovalRequest(conversationId, runId, data) {
    let request = readApprovalRequest(conversationId, runId, data, {
      actionTitles: await approvalActionTitles(data?.actionRequests, {
        templates: api.templates,
        userTemplates: api.userTemplates,
        locale: locale.currentLocale,
        workspaceName: workspace.currentWorkspace?.workspaceName,
      }),
    });
    request && (state.pendingHitlByConversationId[conversationId] = request);
  }
  function clearApproval(conversationId, id) {
    let request = state.pendingHitlByConversationId[conversationId];
    request && ((id && id !== request.id) || delete state.pendingHitlByConversationId[conversationId]);
  }
  function updateTodoList(conversationId, runId, data) {
    let progress = formatTodoProgress(conversationId, runId, data);
    progress ? (state.todoProgressByRunId[runId] = progress) : delete state.todoProgressByRunId[runId];
  }
  function eventAttachments(envelope) {
    return envelope.event.type === 'user_message'
      ? envelope.event.data.attachments.map((e4) => ({
          fileId: e4.fileId,
          kind: 'file',
          fileName: e4.fileName ?? e4.fileId,
          mimeType: e4.mimeType ?? 'application/octet-stream',
          size: e4.size,
          url: e4.url,
          localUrl: e4.localUrl,
          remoteUrl: e4.remoteUrl,
          fileUrl: e4.fileUrl,
          uploadStatus: 'uploaded',
        }))
      : [];
  }
  function applyUserMessage(envelope) {
    if (envelope.event.type !== 'user_message') return;
    let { conversationId: conversationId, runId: runId, assistantMessageId: assistantMessageId } = envelope,
      pending = pendingMessagesByRun.get(runId),
      messages = (state.messagesByConversationId[conversationId] ||= []),
      attachments = eventAttachments(envelope),
      message = {
        id: envelope.event.data.messageId,
        conversationId: conversationId,
        runId: runId,
        role: 'user',
        author: 'You',
        content: envelope.event.data.content,
        attachments: pending?.attachments.length
          ? mergeUploadedFiles(pending.attachments, attachments)
          : attachments,
        createdAt: formatMessageDate(envelope.event.data.createdAt || envelope.timestamp),
        status: 'done',
      },
      l3 = messages.findIndex((e3) => e3.id === message.id || e3.id === pending?.userMessageId);
    if (l3 >= 0) messages[l3] = message;
    else {
      let e3 = messages.findIndex((e4) => e4.id === assistantMessageId);
      messages.splice(e3 >= 0 ? e3 : messages.length, 0, message);
    }
    pendingMessagesByRun.delete(runId);
  }
  async function applyStreamUpdate(envelope) {
    let event = envelope.event,
      { conversationId: conversationId, runId: runId, assistantMessageId: assistantMessageId } = envelope;
    if (event.type === 'user_message') applyUserMessage(envelope);
    else if (event.type === 'title_changed') {
      let t4 = state.conversationsById[conversationId];
      t4 && event.data.title.trim() && (t4.title = event.data.title.trim());
    } else
      event.type === 'plan_updated'
        ? updateTodoList(conversationId, runId, event.data.todos)
        : event.type === 'approval_requested'
          ? await openApprovalRequest(conversationId, runId, {
              ...event.data,
              interruptsId: event.data.approvalId,
            })
          : event.type === 'approval_resolved' && clearApproval(conversationId, event.data.approvalId);
    let o3 = terminalRunStatus(envelope);
    if (
      (pendingPaints.set(runId, { assistantMessageId: assistantMessageId, conversationId: conversationId }),
      !o3)
    ) {
      schedulePaint(conversationId, runId, assistantMessageId);
      return;
    }
    let s3 = flushPaint(runId, true);
    if (
      (o3 === 'cancelled' && paintStoppedRun(conversationId, runId),
      updateRunStatus(state, runId, o3, event.type === 'run_failed' ? event.data.message : undefined, {
        markUnread: true,
      }),
      schedulePromptDrain(conversationId),
      s3?.status === 'error')
    ) {
      let e3 = findAssistantMessage(conversationId, runId, assistantMessageId);
      e3 && (e3.status = 'error');
    }
    refreshConversations();
  }
  async function applyStreamEvents(batch) {
    let events = await enrichScriptEvents(batch, {
        templates: api.templates,
        userTemplates: api.userTemplates,
        locale: locale.currentLocale,
        workspaceId: workspace.currentWorkspace?.id,
      }),
      updatedRuns = new Set(),
      endedRuns = new Set();
    for (let e4 of events) {
      e4.startSequence !== undefined && checkpoints.delete(e4.runId);
      let t3 = eventHistory.get(e4.runId) ?? [];
      mergeEventHistory(t3, [e4]);
      eventHistory.set(e4.runId, t3);
      updatedRuns.add(e4.runId);
      terminalRunStatus(e4) && endedRuns.add(e4.runId);
      await applyStreamUpdate(e4);
    }
    for (let e4 of updatedRuns) flushPaint(e4);
    await nextTick();
    for (let e4 of endedRuns) (eventHistory.delete(e4), eventQueues.delete(e4), checkpoints.delete(e4));
  }
  let eventBatch = new RunEventBatch({
    ttlMs: eventBatchInterval,
    scheduler: idleScheduler(window),
    onFlush: applyStreamEvents,
    onError(e3) {
      console.error('[agent-console] Failed to flush buffered stream text events:', e3);
    },
  });
  async function drainRunEvents(runId) {
    if (!draining.has(runId)) {
      draining.add(runId);
      try {
        let t3 = eventQueues.get(runId);
        for (; t3?.length; ) {
          let n3 = t3.shift();
          if (!eventBatch.enqueue(n3)) {
            try {
              await eventBatch.flushRun(runId);
            } catch (e4) {
              console.error('[agent-console] Failed to render buffered stream text before a run event:', e4);
            }
            await applyStreamEvents([n3]);
          }
        }
      } finally {
        draining.delete(runId);
        eventQueues.get(runId)?.length && drainRunEvents(runId);
      }
    }
  }
  function queueRunEvent(event) {
    let queue = eventQueues.get(event.runId) ?? [];
    queue.push(event);
    eventQueues.set(event.runId, queue);
    drainRunEvents(event.runId);
  }
  function onRunEvent(event) {
    let stopped = stoppedRuns.resolve(event);
    if (
      (stopped &&
        (reconcilePendingMessages(state.messagesByConversationId[event.conversationId] ?? [], stopped, event),
        acceptStreamEvent(streamFor(event), event),
        pendingMessagesByRun.set(event.runId, stopped),
        applyUserMessage({
          ...event,
          event: {
            type: 'user_message',
            data: {
              messageId: event.turnId,
              content: stopped.content,
              attachments: [],
              createdAt: event.timestamp,
            },
          },
        }),
        paintStoppedRun(event.conversationId, event.runId),
        updateRunStatus(state, event.runId, 'cancelled'),
        schedulePromptDrain(event.conversationId)),
      stoppedRuns.hasRun(event.runId))
    ) {
      terminalRunStatus(event) && refreshConversations();
      return;
    }
    if (event.event.type === 'run_started') {
      let n4 = pendingRequests.acknowledge(event.conversationId, event.event.data.requestId);
      n4 &&
        (pendingMessagesByRun.set(event.runId, n4),
        reconcilePendingMessages(state.messagesByConversationId[event.conversationId] ?? [], n4, event),
        n4.onRunStarted?.({ conversationId: event.conversationId, runId: event.runId }));
      let r4 = state.conversationsById[event.conversationId];
      r4 &&
        ((r4.unread = false),
        n4 &&
          (r4.title === 'New conversation' ||
            r4.title === 'New Chat' ||
            r4.title === 'Loading conversation...') &&
          (r4.title = initialTitle(n4.content)));
      pendingVersion.value++;
    }
    let drained = drainStreamBuffer(streamFor(event), outOfOrderEvents.get(event.runId) ?? [], event);
    drained.buffered.length > 0
      ? outOfOrderEvents.set(event.runId, drained.buffered)
      : outOfOrderEvents.delete(event.runId);
    for (let e3 of drained.accepted) queueRunEvent(e3);
  }
  function subscribeToChannel() {
    listening ||
      ((listening = true),
      channel.subscribe((e3) => {
        e3.type === 'conversation.run.event'
          ? onRunEvent(e3.data)
          : e3.type === 'channel.ready' && refreshConversations();
      }));
  }
  subscribeToChannel();
  function completeRun(conversationId, runId) {
    let message = state.messagesByConversationId[conversationId]?.find(
      (e3) => e3.runId === runId && e3.role === 'assistant',
    );
    message && (message.status = 'done');
    updateRunStatus(state, runId, 'completed', undefined, { markUnread: true });
    schedulePromptDrain(conversationId);
  }
  function failRun(conversationId, runId, error) {
    let message = findAssistantMessage(conversationId, runId);
    message && ((message.status = 'error'), (message.content = error), (message.errorData = error));
    updateRunStatus(state, runId, 'failed', error, { markUnread: true });
    schedulePromptDrain(conversationId);
  }
  function stoppedDuration(milliseconds) {
    if (milliseconds < 1e3) return `${$t('已停止')} 1s`;
    let seconds = Math.round(milliseconds / 1e3);
    if (seconds < 60) return `${$t('已停止')} ${seconds}s`;
    let n3 = Math.floor(seconds / 60),
      r3 = seconds % 60;
    return r3 > 0 ? `${$t('已停止')} ${n3}m${r3}s` : `${$t('已停止')} ${n3}m`;
  }
  function formatFinalDuration(status, milliseconds) {
    if (status === 'cancelled') return stoppedDuration(milliseconds);
    if (milliseconds < 1e3) return `${$t('任务耗时')} 1s`;
    let seconds = Math.round(milliseconds / 1e3);
    if (seconds < 60) return `${$t('任务耗时')} ${seconds}s`;
    let r3 = Math.floor(seconds / 60),
      i3 = seconds % 60;
    return i3 > 0 ? `${$t('任务耗时')} ${r3}m${i3}s` : `${$t('任务耗时')} ${r3}m`;
  }
  function paintStoppedRun(conversationId, runId) {
    let message = findAssistantMessage(conversationId, runId);
    if (!message || ((message.status = 'done'), (message.createdAt ||= clockText()), !message.process))
      return;
    let endedAt = Date.now(),
      elapsed = message.process.durationStartedAt ?? endedAt;
    message.process.durationEndedAt = endedAt;
    message.process.durationLabel = stoppedDuration(Math.max(0, endedAt - elapsed));
    message.process.durationState = undefined;
    message.process.completed = false;
    message.process.collapsed = false;
    failLiveTimelineEvents(message.process.events);
  }
  async function cancelRun(runId) {
    let run = state.runsById[runId];
    if (run)
      if (!channel.send('conversation.run.stop', { conversationId: run.conversationId }))
        notifyError(-1, $t('Agent 连接尚未就绪'));
      else {
        stoppedRuns.addRun(runId);
        try {
          await eventBatch.flushRun(runId);
        } catch (e3) {
          console.error('[agent-console] Failed to render buffered stream text before stopping a run:', e3);
        }
        eventQueues.delete(runId);
        eventBatch.discardRun(runId);
        flushPaint(runId);
        outOfOrderEvents.delete(runId);
        pendingPaints.delete(runId);
        eventHistory.delete(runId);
        checkpoints.delete(runId);
        paintStoppedRun(run.conversationId, runId);
        updateRunStatus(state, runId, 'cancelled');
        schedulePromptDrain(run.conversationId);
      }
  }
  function cancelActiveRun() {
    let conversation = activeConversation.value;
    if (!conversation && creatingConversation)
      ((creatingConversation = undefined), (homeMessages.value = []), schedulePromptDrain());
    else if (conversation)
      if (pendingRequests.has(conversation.id)) {
        if (!channel.send('conversation.run.stop', { conversationId: conversation.id })) {
          notifyError(-1, $t('Agent 连接尚未就绪'));
          return;
        }
        let n3 = pendingRequests.acknowledge(conversation.id);
        if (n3) {
          stoppedRuns.addPending(conversation.id, n3.requestId, n3);
          let r3 = state.messagesByConversationId[conversation.id]?.find(
            (e3) => e3.id === n3.assistantMessageId,
          );
          if (r3 && ((r3.status = 'done'), (r3.createdAt = clockText()), r3.process)) {
            let e3 = Date.now();
            r3.process.durationEndedAt = e3;
            r3.process.durationLabel = stoppedDuration(Math.max(0, e3 - n3.startedAt));
            r3.process.durationState = undefined;
          }
        }
        pendingVersion.value++;
        schedulePromptDrain(conversation.id);
      } else
        for (let n3 = conversation.runningRunIds.length - 1; n3 >= 0; n3--) {
          let r3 = conversation.runningRunIds[n3],
            i3 = state.runsById[r3];
          if (!i3 || runningStatus(i3.status)) {
            cancelRun(r3);
            return;
          }
        }
  }
  async function deleteConversation(id) {
    if (state.conversationsById[id])
      if (hasRunningRun(state, id)) notifyError(-1, $t('任务进行中，请先停止再删除'));
      else
        try {
          await api.deleteConversation(id);
          eventBatch.removeConversation(id);
          for (let t3 of Object.values(state.streamsByRunId))
            t3.conversationId === id &&
              (eventQueues.delete(t3.runId), eventHistory.delete(t3.runId), checkpoints.delete(t3.runId));
          removeConversationRecord(state, id);
          notify(0, $t('对话已删除'));
          if (route.name === 'agent-console-conversation' && selectedId.value === id) {
            const remaining = state.conversationIds[0];
            await router.replace(
              remaining
                ? {
                    name: 'agent-console-conversation',
                    params: { conversationId: remaining },
                    query: route.query,
                  }
                : { name: 'agent-console-chat', query: route.query },
            );
          }
        } catch (e3) {
          console.error('[agent-console] Failed to delete conversation:', e3);
          notifyError(-1, e3 instanceof Error ? e3.message : $t('删除对话失败'));
        }
  }
  async function renameConversation(id, title) {
    let conversation = state.conversationsById[id],
      name = title.trim();
    if (!conversation || !name) return false;
    if (name === conversation.title) return true;
    try {
      upsertConversation(readConversationRow(await api.updateConversation(id, name)));
      return true;
    } catch (e3) {
      console.error('[agent-console] Failed to rename conversation:', e3);
      notifyError(-1, e3 instanceof Error ? e3.message : $t('重命名失败'));
      return false;
    }
  }
  async function submitHitl(submission) {
    let conversationId = activeConversationId.value,
      request = conversationId ? state.pendingHitlByConversationId[conversationId] : undefined;
    if (conversationId && request && request.id === submission.requestId) {
      request.status = 'submitting';
      try {
        let e3 = approvalDecisions(request, submission).map((e4) =>
          submission.fullAccess && e4.type === 'approve' ? { ...e4, fullAccess: true } : e4,
        );
        if (
          !channel.send('conversation.approval.submit', {
            conversationId: conversationId,
            approvalId: request.id,
            decisions: e3,
          })
        )
          throw Error('Agent WebSocket is not ready');
        submission.fullAccess && (fullAccess.value = true);
      } catch (e3) {
        request.status = 'error';
        console.error('[agent-console] Failed to submit HITL decision:', e3);
        notifyError(-1, e3 instanceof Error ? e3.message : $t('提交审批失败'));
      }
    }
  }
  function addPendingAttachments(files) {
    if (!files.length || isThinking.value) return;
    let attachments = files.map((e4) => fileDraft(e4));
    if (!attachments.length) return;
    let id = activeConversationId.value,
      draft = draftAttachments(id);
    draft.push(...attachments);
    for (let e4 of draft.slice(-attachments.length)) uploadOne(id, draft, e4);
  }
  function addPendingFolder(source) {
    if (isThinking.value) return;
    let attachment = folderDraft(source),
      id = activeConversationId.value,
      draft = draftAttachments(id);
    draft.push(attachment);
    uploadOne(id, draft, draft[draft.length - 1]);
  }
  function addPendingPathAttachment(source) {
    let attachment = pathDraft(source),
      id = activeConversationId.value;
    id
      ? ((state.draftsByConversationId[id] ||= emptyDraft(id)),
        state.draftsByConversationId[id].attachments.push(attachment))
      : (homeAttachments.value = [...homeAttachments.value, attachment]);
  }
  function draftAttachments(id) {
    return id
      ? ((state.draftsByConversationId[id] ||= emptyDraft(id)), state.draftsByConversationId[id].attachments)
      : homeAttachments.value;
  }
  function uploadOne(conversationId, items, attachment) {
    if (!attachment || attachment.uploadStatus === 'uploaded') return;
    let fileId = attachment.fileId,
      request = uploadAttachments(conversationId, items, [attachment]);
    (uploads.set(fileId, request),
      request
        .catch((e4) => {
          console.error('[agent-console] Failed to upload attachment:', e4);
          notifyError(-1, e4 instanceof Error ? e4.message : $t('文件上传失败'));
        })
        .finally(() => {
          uploads.get(fileId) === request && uploads.delete(fileId);
        }));
  }
  function removePendingAttachment(id) {
    let items = pendingAttachments.value,
      index = items.findIndex((t4) => t4.fileId === id);
    if (index < 0) return;
    let [removed] = items.splice(index, 1);
    releasePreviews(removed ? [removed] : []);
  }
  function clearAttachments(id) {
    if (!id) {
      releasePreviews(homeAttachments.value);
      homeAttachments.value = [];
      return;
    }
    let draft = state.draftsByConversationId[id];
    draft && (releasePreviews(draft.attachments), (draft.attachments = []));
  }
  function detachAttachments(id) {
    if (!id) {
      homeAttachments.value = [];
      return;
    }
    let draft = state.draftsByConversationId[id];
    draft && (draft.attachments = []);
  }
  async function uploadAttachments(conversationId, items, selection = items.slice()) {
    let results = [];
    for (let a3 of selection) {
      if (!items.includes(a3)) continue;
      let r4 = uploads.get(a3.fileId);
      if (r4) results.push(...(await r4));
      else if (a3.localPath) ((a3.uploadStatus = 'uploaded'), results.push(a3));
      else if (a3.kind === 'folder' && a3.localFiles?.length) {
        a3.uploadStatus = 'uploading';
        try {
          let r5 = [];
          for (let o3 of a3.localFiles) {
            if (!items.includes(a3)) return results;
            let s3 = await api.fileToBase64(o3),
              c3 = o3.webkitRelativePath,
              l3 = await api.uploadFile(
                s3,
                o3.type || 'application/octet-stream',
                c3 || o3.name,
                conversationId,
              );
            r5.push({
              fileId: l3.fileId,
              kind: 'file',
              fileName: l3.fileName,
              mimeType: l3.mimeType,
              size: l3.size,
              url: api.getFileUrl(l3.fileId, { fileName: l3.fileName }),
              localUrl: l3.localUrl || l3.url || api.getFileUrl(l3.fileId),
              remoteUrl: l3.remoteUrl || l3.fileUrl,
              fileUrl: l3.fileUrl || l3.remoteUrl,
              uploadStatus: 'uploaded',
            });
          }
          if (!items.includes(a3)) continue;
          Object.assign(a3, { localFiles: undefined, uploadedFiles: r5, uploadStatus: 'uploaded' });
          results.push(a3);
          results.push(...r5);
        } catch (e4) {
          throw (items.includes(a3) && (a3.uploadStatus = 'error'), e4);
        }
      } else if (a3.kind === 'folder') results.push(a3, ...(a3.uploadedFiles ?? []));
      else if (!a3.localFile) results.push(a3);
      else {
        a3.uploadStatus = 'uploading';
        try {
          let r5 = await api.fileToBase64(a3.localFile),
            o3 = await api.uploadFile(r5, a3.mimeType, a3.fileName, conversationId),
            s3 = {
              ...a3,
              fileId: o3.fileId,
              fileName: o3.fileName,
              mimeType: o3.mimeType,
              size: o3.size,
              url: api.getFileUrl(o3.fileId, { fileName: o3.fileName }),
              localUrl: o3.localUrl || o3.url || api.getFileUrl(o3.fileId),
              remoteUrl: o3.remoteUrl || o3.fileUrl,
              fileUrl: o3.fileUrl || o3.remoteUrl,
              preview: undefined,
              localFile: undefined,
              uploadStatus: 'uploaded',
            };
          if (!items.includes(a3)) continue;
          releasePreviews([a3]);
          Object.assign(a3, s3);
          results.push(a3);
        } catch (e4) {
          throw (items.includes(a3) && (a3.uploadStatus = 'error'), e4);
        }
      }
    }
    return results;
  }
  async function sendPrompt(options = {}) {
    let startedAt = Date.now(),
      conversationId = options.conversationId ?? activeConversationId.value,
      content = (options.content ?? prompt.value).trim(),
      attachments = options.attachments ?? (options.content === undefined ? pendingAttachments.value : []);
    if (!content && attachments.length === 0) return false;
    if (conversationId ? runPending(conversationId) : creatingConversation)
      return options.fromQueue ||
        options.templateContext !== undefined ||
        (!content && attachments.length === 0) ||
        attachments.some((e3) => !e3.localPath)
        ? false
        : (queuePrompt(conversationId, content, { attachments: attachments.slice(), draftContent: content }),
          detachAttachments(conversationId),
          (prompt.value = ''),
          true);
    let token = `${startedAt}-${Math.random().toString(16).slice(2, 8)}`,
      needsConversation = !conversationId,
      pending = pendingMessages({
        conversationId: conversationId ?? `pending-home-${token}`,
        content: content,
        attachments: [...attachments],
        createdAt: formatMessageDate(startedAt),
        startedAt: startedAt,
        token: token,
      }),
      presentation = {
        ...pending.presentation,
        content: content,
        draftContent: content,
        attachments: pending.messages[0]?.attachments ?? [],
      };
    if (
      (needsConversation
        ? ((creatingConversation = token), (homeMessages.value = pending.messages))
        : ((state.messagesByConversationId[conversationId] ||= []),
          state.messagesByConversationId[conversationId].push(...pending.messages),
          preparingMessages.set(conversationId, presentation),
          forgetCacheEntry(conversationId)),
      needsConversation)
    ) {
      let n4;
      try {
        n4 = readConversationRow(await api.createConversation());
      } catch (e3) {
        creatingConversation === token && ((creatingConversation = undefined), (homeMessages.value = []));
        console.error('[agent-console] Failed to create conversation:', e3);
        notifyError(-1, e3 instanceof Error ? e3.message : $t('创建会话失败'));
        return false;
      }
      if (creatingConversation !== token) return false;
      upsertConversation(n4);
      state.conversationIds.includes(n4.id) || state.conversationIds.unshift(n4.id);
      conversationId = n4.id;
      let r4 = homeQueue.value;
      for (let e3 of r4) e3.conversationId = conversationId;
      state.queuedPromptsByConversationId[conversationId] = r4;
      homeQueue.value = [];
      state.messagesByConversationId[conversationId] ||= [];
      for (let e3 of pending.messages) e3.conversationId = conversationId;
      state.messagesByConversationId[conversationId].push(...pending.messages);
      state.draftsByConversationId[conversationId].prompt = content;
      state.draftsByConversationId[conversationId].attachments = homeAttachments.value;
      preparingMessages.set(conversationId, presentation);
      forgetCacheEntry(conversationId);
      homeAttachments.value = [];
      homePrompt.value = '';
      await openConversation(conversationId);
      creatingConversation === token && ((creatingConversation = undefined), (homeMessages.value = []));
    }
    function rollback() {
      let t3 = state.messagesByConversationId[conversationId] ?? [];
      state.messagesByConversationId[conversationId] = t3.filter(
        (e3) => e3.id !== presentation.userMessageId && e3.id !== presentation.assistantMessageId,
      );
      preparingMessages.delete(conversationId);
      cacheConversation(state, conversationId);
    }
    try {
      await channel.waitUntilConnected();
    } catch (e3) {
      rollback();
      console.error('[agent-console] Agent channel is not ready:', e3);
      notifyError(-1, $t('Agent 连接尚未就绪'));
      return false;
    }
    let visibleAttachments = attachments.filter((e3) => e3.kind === 'folder' || !e3.fileName.includes('/')),
      attachmentMetadata = visibleAttachments.map((e3) => ({
        fileId: e3.fileId,
        fileName: e3.fileName,
        mimeType: e3.mimeType,
        ...(e3.size === undefined ? {} : { size: e3.size }),
        ...(e3.url ? { url: e3.url } : {}),
        ...(e3.localUrl ? { localUrl: e3.localUrl } : {}),
        ...(e3.remoteUrl ? { remoteUrl: e3.remoteUrl } : {}),
        ...(e3.fileUrl ? { fileUrl: e3.fileUrl } : {}),
      })),
      requestId = channel.send('conversation.run.start', {
        conversationId: conversationId,
        turnId: presentation.userMessageId,
        message: content,
        ...(attachments.length > 0 ? { attachmentsPending: true } : {}),
        ...(attachmentMetadata.length > 0 ? { pendingAttachments: attachmentMetadata } : {}),
        ...(options.templateContext ? { templateContext: options.templateContext } : {}),
        fullAccess: fullAccess.value,
      });
    if (!requestId) return (rollback(), notifyError(-1, $t('Agent 连接尚未就绪')), false);
    let prepared = {
        ...presentation,
        requestId: requestId,
        content: content,
        attachments: visibleAttachments,
        onRunStarted: options.onRunStarted,
      },
      userMessage = state.messagesByConversationId[conversationId]?.find(
        (e3) => e3.id === presentation.userMessageId,
      );
    if (
      (userMessage && ((userMessage.content = content), (userMessage.attachments = visibleAttachments)),
      preparingMessages.delete(conversationId),
      pendingRequests.begin(conversationId, requestId, prepared, requestTimeout, (t3) => {
        let n4 = state.messagesByConversationId[conversationId] ?? [];
        state.messagesByConversationId[conversationId] = n4.filter(
          (e3) => e3.id !== t3.userMessageId && e3.id !== t3.assistantMessageId,
        );
        let r4 = (state.draftsByConversationId[conversationId] ||= emptyDraft(conversationId));
        r4.prompt ||= t3.draftContent;
        r4.attachments.length === 0 && (r4.attachments = t3.attachments);
        notifyError(-1, $t('Agent 响应超时，请稍后重试'));
        cacheConversation(state, conversationId);
        pendingVersion.value++;
      }),
      pendingVersion.value++,
      !options.fromQueue)
    ) {
      let t3 = (state.draftsByConversationId[conversationId] ||= emptyDraft(conversationId));
      t3.prompt = '';
      t3.attachments = [];
    }
    let uploaded = [];
    try {
      uploaded = await uploadAttachments(conversationId, attachments);
    } catch (e3) {
      console.error('[agent-console] Failed to upload attachments:', e3);
      notifyError(-1, e3 instanceof Error ? e3.message : $t('文件上传失败'));
      channel.send('conversation.run.stop', { conversationId: conversationId });
      return true;
    }
    if (attachments.length > 0) {
      let e3 = localAttachmentRefs(uploaded),
        t3 = uploaded.filter((e4) => e4.kind === 'file' && !e4.localPath);
      channel.send('conversation.run.attachments.ready', {
        conversationId: conversationId,
        turnId: presentation.userMessageId,
        attachments: t3.map((e4) => ({ fileId: e4.fileId })),
        ...(e3.length > 0 ? { localAttachments: e3 } : {}),
      }) ||
        (notifyError(-1, $t('Agent 连接尚未就绪')),
        channel.send('conversation.run.stop', { conversationId: conversationId }));
    }
    return true;
  }
  return {
    activeConversation: activeConversation,
    activeConversationId: activeConversationId,
    activeHitlRequest: activeHitlRequest,
    activeTodoProgress: activeTodoProgress,
    addPendingAttachments: addPendingAttachments,
    addPendingFolder: addPendingFolder,
    addPendingPathAttachment: addPendingPathAttachment,
    cancelActiveRun: cancelActiveRun,
    cancelRun: cancelRun,
    completeRun: completeRun,
    conversationList: conversationList,
    conversationListHasMore: conversationListHasMore,
    conversationListLoadingMore: conversationListLoadingMore,
    deleteConversation: deleteConversation,
    failRun: failRun,
    isThinking: isThinking,
    loadMoreConversations: loadMoreConversations,
    loadEarlierMessages: loadEarlierMessages,
    messageList: messageList,
    messageHistoryHasMore: messageHistoryHasMore,
    messageHistoryLoading: messageHistoryLoading,
    pendingAttachments: pendingAttachments,
    pendingApprovalConversationIds: pendingApprovalConversationIds,
    prompt: prompt,
    queuedPrompts: queuedPrompts,
    removePendingAttachment: removePendingAttachment,
    removeQueuedPrompt: removeQueuedPrompt,
    renameConversation: renameConversation,
    reorderQueuedPrompt: reorderQueuedPrompt,
    restoreQueuedPrompt: restoreQueuedPrompt,
    runningTaskCount: runningTaskCount,
    profileCount: profileCount,
    selectConversation: selectConversation,
    sendPrompt: sendPrompt,
    startNewChat: startNewChat,
    submitHitl: submitHitl,
    state: state,
    taskGroupList: taskGroupList,
    profileMonitorConnected: monitor.connected,
    toggleTaskGroup: toggleTaskGroup,
  };
}
export { useAgentConversation };
