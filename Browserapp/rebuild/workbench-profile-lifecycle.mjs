const limit = 4096;
const translate = text => typeof globalThis.$t === 'function' ? globalThis.$t(text) : text;
const startMessage = phase => phase === 'proxy' ? '检测 IP…'
  : phase === 'kernel' ? '检测内核…'
  : ['configure', 'spawn', 'cdp', 'inject', 'verify'].includes(phase) ? '启动窗口' : '启动中...';

export function profileProgressMessage(id, lifecycle, warnings = []) {
  if (lifecycle.error) return { code: 1, message: lifecycle.message,
    data: { dirId: id, percent: 0, message: lifecycle.message, warningMessages: [] } };
  const uploading = lifecycle.pending && lifecycle.operation !== 'start';
  return { code: 0, uploading, data: { dirId: id,
    percent: uploading || !lifecycle.pending ? 100 : Math.max(1, Math.min(99, lifecycle.percent || 1)),
    message: translate(uploading ? '同步中…' : lifecycle.pending ? startMessage(lifecycle.phase) : '打开成功'),
    phase: lifecycle.phase, detail: lifecycle.message || '', warningMessages: warnings } };
}

// Adapt the engine's real lifecycle to the archived frontend IPC contract.
// Backend snapshots recover progress after reload; this small cache only
// suppresses repeated completions and late client promises.
export function createProfileLifecycleBridge({ emit, notify = () => {} }) {
  const latest = new Map();
  const remember = (id, value) => {
    latest.delete(id);latest.set(id, value);
    while (latest.size > limit) latest.delete(latest.keys().next().value);
  };
  function publish(id, lifecycle, warnings = []) {
    id = String(id);
    const previous = latest.get(id), generation = Number(lifecycle.generation) || 0;
    if (generation < (previous?.generation || 0)) return;
    if (['closed', 'stop', 'sync'].includes(previous?.kind) && generation <= previous.generation
      && lifecycle.operation === 'start' && !lifecycle.error) return;
    const closed = !lifecycle.pending && !lifecycle.error && lifecycle.operation !== 'start';
    const message = profileProgressMessage(id, lifecycle, warnings);
    const key = closed ? 'closed' : JSON.stringify([message.code, message.uploading, message.data.percent,
      message.data.message, warnings]);
    const value = { generation, key, kind: closed ? 'closed' : lifecycle.operation, pending: lifecycle.pending,
      token: lifecycle.operation === 'start' ? previous?.token : null };
    remember(id, value);
    if (previous?.key === key && previous.generation === generation) return;
    if (closed || (lifecycle.error && lifecycle.operation !== 'start')) {
      emit('browser:on-close', [id]);
      if (lifecycle.error) notify('关闭或同步失败：' + lifecycle.message);
    } else {
      emit('browser:launch-process-message', message);
      if (message.uploading) emit('browser:on-close-syncing-data', [id]);
    }
  }
  function handle(event) {
    if (!event.id) return;
    const lifecycle = event.lifecycle || (/^profile-(start|stop|sync)-progress$/.test(event.type) ? {
      operation: event.type.split('-')[1], phase: event.phase, generation: event.lifecycleGeneration,
      pending: !event.error && !['ready', 'done', 'error'].includes(event.phase),
      error: Boolean(event.error) || event.phase === 'error', percent: event.percent, message: event.message,
    } : null);
    if (event.type === 'status') {
      if (lifecycle?.pending || lifecycle?.error) publish(event.id, lifecycle);
      else if (!event.running && !latest.get(String(event.id))?.pending)
        publish(event.id, { operation: 'stop', phase: 'done', generation: lifecycle?.generation });
      else if (event.running && !lifecycle && !latest.has(String(event.id)))
        publish(event.id, { operation: 'start', phase: 'ready' });
    } else if (/^profile-(start|stop|sync)-progress$/.test(event.type)) publish(event.id, lifecycle);
  }
  function beginStart(id) {
    id = String(id);
    const previous = latest.get(id);
    if (previous?.kind === 'start' && previous.pending) return { id, token: previous.token };
    const token = Symbol('start'), generation = previous?.generation ? previous.generation + 1 : 0;
    remember(id, { generation, token, kind: 'start', pending: true });
    publish(id, { operation: 'start', phase: 'prepare', pending: true, generation, percent: 1 });
    return { id, token };
  }
  function finishStart(context, result, error) {
    const state = latest.get(String(context.id));
    if (state?.token !== context.token) return;
    // The client anticipates a new generation before IPC. An already-open
    // browser retains its owner generation; reconcile from the server result.
    const existingGeneration = Number(result?.lifecycle?.generation);
    if (!error && result?.alreadyRunning && existingGeneration > 0) {
      state.generation = existingGeneration;
    }
    publish(context.id, { operation: 'start', generation: state.generation,
      phase: error ? 'error' : 'ready', pending: false, error: Boolean(error),
      percent: error ? 0 : 100, message: error?.message || '' }, result?.warningMessages || []);
  }
  function messages(rows) {
    return rows.flatMap(row => {
      const lifecycle = row.lifecycle;
      if (!row.openStatus && !lifecycle?.pending && !lifecycle?.error) return [];
      const value = profileProgressMessage(row.dirId || row.id, lifecycle || { operation: 'start', phase: 'ready' });
      return [{ ...value.data, code: value.code, uploading: value.uploading, errorMessage: value.message }];
    });
  }
  return { handle, beginStart, finishStart, messages };
}
