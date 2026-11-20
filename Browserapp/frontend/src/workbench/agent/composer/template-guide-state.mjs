const templateCreated = 'agent-console:new-template-created';

function authorKey(author) {
  const id = author?.id ?? author?.email ?? author?.phone;
  return id == null ? '' : String(id);
}

function getKey(kind, id) {
  if (id != null && id !== '') return `agent-console:new-template-guide-${kind}:${encodeURIComponent(String(id))}`;
}

function isMarked(kind, id) {
  const key = getKey(kind, id);
  try { return Boolean(key && globalThis.window?.localStorage.getItem(key) === '1'); }
  catch { return false; }
}

function mark(kind, id, show) {
  const key = getKey(kind, id);
  if (!key) return;
  try {
    if (show) globalThis.window?.localStorage.setItem(key, '1');
    else globalThis.window?.localStorage.removeItem(key);
  } catch { /* Guide state is optional in a private window. */ }
}

const pendingGuide = id => isMarked('pending', id);
const showPending = id => mark('pending', id, true);
const clearPending = id => mark('pending', id, false);
const wasShown = id => isMarked('shown', id);
const recordShown = id => mark('shown', id, true);
const informCreated = () => globalThis.window?.dispatchEvent(new Event(templateCreated));

export { pendingGuide as a, recordShown as c, authorKey as i, informCreated as n, wasShown as o, clearPending as r,
  showPending as s, templateCreated as t };
