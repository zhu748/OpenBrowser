const limit = 4096;
const translate = (text, values = {}) => typeof globalThis.$t === 'function'
  ? globalThis.$t(text, values) : text.replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ''));
const startMessage = phase => phase === 'proxy' ? '检测 IP…'
  : phase === 'kernel' ? '检测内核…'
  : ['configure', 'spawn', 'cdp', 'inject', 'verify'].includes(phase) ? '启动窗口' : '启动中...';
const isReady = lifecycle => lifecycle?.operation === 'start' && !lifecycle.pending && !lifecycle.error;
const positiveRevision = value => Number.isSafeInteger(value) && value > 0 ? value : null;
const listWarnings = (...lists) => [...new Set(lists.flatMap(value => Array.isArray(value) ? value : [])
  .filter(value => typeof value === 'string' && value.trim()))].slice(0, 12);
const receiptOf = value => value?.launchStatus
  || (value?.verificationBlocked || value?.blocked ? { configurationState: 'blocked' } : undefined);

function launchDescription(receipt, reused) {
  const capturedRevision = positiveRevision(receipt?.capturedRevision);
  const savedRevision = positiveRevision(receipt?.savedRevision);
  const configurationState = receipt?.configurationState === 'blocked' ? 'blocked' : 'unverified';
  const savedRelation = capturedRevision && savedRevision && ['matches', 'differs'].includes(receipt?.savedRelation)
    ? receipt.savedRelation : 'unknown';
  const message = translate(configurationState === 'blocked' ? '窗口已打开，配置验证受阻' : '窗口已打开，配置未完整验证');
  const warningMessages = listWarnings(receipt?.warningMessages);
  const detail = [
    message,
    reused ? translate('已复用原窗口，未重新启动。') : '',
    capturedRevision ? translate('启动时记录的保存版本：{revision}', { revision: capturedRevision }) : translate('启动时的配置版本未知'),
    savedRevision && savedRevision !== capturedRevision ? translate('当前保存版本：{revision}', { revision: savedRevision }) : '',
    savedRelation === 'differs' ? translate('当前保存配置与启动记录不同。若要按新配置启动，请先关闭窗口。') : '',
    ...warningMessages,
  ].filter(Boolean).join('\n');
  return { message, detail, warningMessages, launchStatus: { configurationState, capturedRevision, savedRevision, savedRelation, reused } };
}

export function profileProgressMessage(id, lifecycle, receipt, reused = false) {
  if (lifecycle.error) return { code: 1, message: lifecycle.message,
    ...(lifecycle.errorCode !== undefined ? { errorCode: lifecycle.errorCode } : {}),
    data: { dirId: id, percent: 0, message: lifecycle.message, warningMessages: [] } };
  const uploading = lifecycle.pending && lifecycle.operation !== 'start';
  return { code: 0, uploading, data: { dirId: id,
    percent: uploading || !lifecycle.pending ? 100 : Math.max(1, Math.min(99, lifecycle.percent || 1)),
    phase: lifecycle.phase,
    ...(isReady(lifecycle) ? launchDescription(receipt, reused) : {
      message: translate(uploading ? '同步中…' : lifecycle.pending ? startMessage(lifecycle.phase) : '窗口已关闭'),
      detail: lifecycle.message || '', warningMessages: [],
    }),
  } };
}

function mergeReceipt(previous, next, warnings) {
  const latest = (positiveRevision(previous?.savedRevision) || 0) > (positiveRevision(next?.savedRevision) || 0) ? previous : next || previous;
  return {
    ...latest,
    // A later reply can be older than live diagnostics for this same owner.
    configurationState: previous?.configurationState === 'blocked' || next?.configurationState === 'blocked' ? 'blocked' : 'unverified',
    capturedRevision: positiveRevision(previous?.capturedRevision) ?? positiveRevision(next?.capturedRevision),
    warningMessages: listWarnings(previous?.warningMessages, next?.warningMessages, warnings),
  };
}

// Adapt the engine's real lifecycle to the archived frontend IPC contract.
// Backend snapshots recover progress after reload; this small cache only
// suppresses repeated completions and late client promises.
export function createProfileLifecycleBridge({ emit, notify = () => {} }) {
  const latest = new Map();
  let serial = 0;
  const remember = (id, value) => {
    latest.delete(id);latest.set(id, { ...value, serial: ++serial });
    while (latest.size > limit) latest.delete(latest.keys().next().value);
  };
  function publish(id, lifecycle, { launchStatus, warnings, reused, running, optimistic = false } = {}) {
    id = String(id);
    const previous = latest.get(id), generation = Number(lifecycle.generation) || 0;
    if (generation < (previous?.generation || 0)) return;
    if (['closed', 'stop', 'sync'].includes(previous?.kind) && generation <= previous.generation
      && lifecycle.operation === 'start' && !lifecycle.error) return;
    const sameOwner = previous?.generation === generation;
    const closed = !lifecycle.pending && !lifecycle.error && lifecycle.operation !== 'start';
    const windowOpen = isReady(lifecycle);
    const receipt = windowOpen ? mergeReceipt(sameOwner ? previous?.receipt : null, launchStatus, warnings) : null;
    const reuse = windowOpen && (reused ?? (sameOwner && previous?.reused) ?? false);
    const message = profileProgressMessage(id, lifecycle, receipt, reuse);
    const retained = Boolean(lifecycle.error && lifecycle.operation !== 'start' && running);
    const key = closed ? 'closed' : JSON.stringify([message, retained]);
    const token = lifecycle.operation === 'start' && (sameOwner || previous?.optimistic) ? previous?.token : null;
    if (previous?.key === key && sameOwner && previous.optimistic === optimistic) return;
    remember(id, { generation, key, kind: closed ? 'closed' : lifecycle.operation, pending: lifecycle.pending,
      token, optimistic, windowOpen, receipt, reused: reuse });
    if (closed || (lifecycle.error && lifecycle.operation !== 'start')) {
      if (retained) {
        const open = profileProgressMessage(id, { operation: 'start', phase: 'ready' }, launchStatus);
        open.data.detail = [lifecycle.message, open.data.detail].filter(Boolean).join('\n');
        open.data.statusUpdate = true;
        emit('browser:launch-process-message', open);
      } else emit('browser:on-close', [id]);
      if (lifecycle.error) notify('关闭或同步失败：' + lifecycle.message);
    } else {
      if (windowOpen && sameOwner && previous?.windowOpen) message.data.statusUpdate = true;
      emit('browser:launch-process-message', message);
      if (message.uploading) emit('browser:on-close-syncing-data', [id]);
    }
  }
  function handle(event) {
    if (!event.id) return;
    const lifecycle = event.lifecycle || (/^profile-(start|stop|sync)-progress$/.test(event.type) ? {
      operation: event.type.split('-')[1], phase: event.phase, generation: event.lifecycleGeneration,
      pending: !event.error && !['ready', 'done', 'error'].includes(event.phase),
      error: Boolean(event.error) || event.phase === 'error', percent: event.percent, message: event.message, errorCode: event.errorCode,
    } : null);
    const details = { launchStatus: receiptOf(event), running: event.running };
    if (event.type === 'status') {
      if (lifecycle?.pending || lifecycle?.error) publish(event.id, lifecycle, details);
      else if (!event.running && !latest.get(String(event.id))?.pending)
        publish(event.id, { operation: 'stop', phase: 'done', generation: lifecycle?.generation });
      else if (event.running && (details.launchStatus || (!lifecycle && !latest.has(String(event.id)))))
        publish(event.id, isReady(lifecycle) ? lifecycle : { operation: 'start', phase: 'ready', generation: lifecycle?.generation }, details);
    } else if (/^profile-(start|stop|sync)-progress$/.test(event.type) || (details.launchStatus && isReady(lifecycle)))
      publish(event.id, lifecycle, details);
  }
  function beginStart(id) {
    id = String(id);
    const previous = latest.get(id);
    if (previous?.kind === 'start' && previous.pending) return { id, token: previous.token };
    const token = Symbol('start'), generation = previous?.generation ? previous.generation + 1 : 0;
    remember(id, { generation, token, kind: 'start', pending: true, optimistic: true });
    publish(id, { operation: 'start', phase: 'prepare', pending: true, generation, percent: 1 }, { optimistic: true });
    return { id, token };
  }
  function finishStart(context, result, error) {
    const state = latest.get(String(context.id));
    if (state?.token !== context.token) return;
    // The optimistic generation may differ from the real owner (a reused
    // window, or a start whose progress events have not arrived).
    const existingGeneration = Number(result?.lifecycle?.generation);
    if (!error && Number.isSafeInteger(existingGeneration) && existingGeneration > 0) {
      if (!state.optimistic && state.generation !== existingGeneration) return;
      if (state.optimistic) state.generation = existingGeneration;
    }
    if (!error && (result?.running === false || (result?.running !== true && result?.alreadyRunning !== true && !state.windowOpen))) {
      error = Object.assign(new Error(translate('未确认窗口已打开')), { code: 'PROFILE_WINDOW_NOT_CONFIRMED' });
    }
    publish(context.id, { operation: 'start', generation: state.generation,
      phase: error ? 'error' : 'ready', pending: false, error: Boolean(error),
      percent: error ? 0 : 100, message: error?.message || '', errorCode: error?.code }, {
      launchStatus: receiptOf(result), warnings: result?.warningMessages, reused: result?.alreadyRunning,
    });
  }
  const readyLifecycle = generation => ({ operation: 'start', phase: 'ready', generation });
  const snapshotCursor = () => serial;
  function freshSnapshot(rows, cursor) {
    return rows.filter(row => {
      const previous = latest.get(String(row.dirId || row.id));
      return cursor === undefined || !previous
        || (previous.serial <= cursor && previous.generation <= (Number(row.lifecycle?.generation) || 0));
    });
  }
  function messages(rows, cursor) {
    return freshSnapshot(rows, cursor).flatMap(row => {
      const lifecycle = row.lifecycle, id = row.dirId || row.id;
      if (!row.openStatus && !lifecycle?.pending && !lifecycle?.error) return [];
      const retainRunning = row.openStatus && lifecycle?.error && lifecycle.operation !== 'start';
      const previous = latest.get(String(id));
      const reused = previous?.generation === lifecycle?.generation && previous?.reused;
      const value = profileProgressMessage(id, retainRunning || !lifecycle ? readyLifecycle(lifecycle?.generation) : lifecycle, receiptOf(row), Boolean(reused));
      if (retainRunning) value.data.detail = [lifecycle.message, value.data.detail].filter(Boolean).join('\n');
      return [{ ...value.data, code: value.code, uploading: value.uploading, errorMessage: value.message, errorCode: value.errorCode }];
    });
  }
  function refreshReceipts(rows, cursor) {
    for (const row of freshSnapshot(rows, cursor)) {
      if (row.openStatus && row.launchStatus && (isReady(row.lifecycle) || !row.lifecycle)) {
        publish(row.dirId || row.id, row.lifecycle || readyLifecycle(), { launchStatus: row.launchStatus });
      }
    }
  }
  return { handle, beginStart, finishStart, messages, snapshotCursor, refreshReceipts };
}
