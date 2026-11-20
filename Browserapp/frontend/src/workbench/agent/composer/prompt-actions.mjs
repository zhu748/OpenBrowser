import { computed } from './workbench-vue.js';
import { c as useStorage } from './dist-NctnpPRe.js';

const accessKey = 'agent-console-access-mode';
const modeOf = value => value === 'full' ? 'full' : 'ask';
let savedMode;

function initialAccessMode() {
  try {
    const saved = globalThis.localStorage?.getItem(accessKey);
    if (saved) return modeOf(saved.replace(/^"|"$/g, ''));
    const legacy = globalThis.localStorage?.getItem('chatStream');
    if (legacy) return JSON.parse(legacy).fullAccess === true ? 'full' : 'ask';
  } catch { /* The workbench supports installations with unavailable storage. */ }
  return 'full';
}

export function useApproval() {
  savedMode ??= useStorage(accessKey, initialAccessMode(), { listenToStorageChanges: true });
  const accessMode = computed({ get: () => modeOf(savedMode.value), set: value => { savedMode.value = modeOf(value); } });
  const fullAccess = computed({ get: () => accessMode.value === 'full', set: value => { accessMode.value = value ? 'full' : 'ask'; } });
  return { accessMode, fullAccess };
}

export function makeQueuedPrompt(conversationId, content, now = Date.now(), { draftContent, attachments } = {}) {
  return { id: `queued-prompt-${now}-${Math.random().toString(16).slice(2, 8)}`, conversationId,
    content: content.trim(), draftContent, attachments, createdAt: now };
}

export const formatQueuedPrompt = prompt => prompt.content || prompt.attachments?.map(file => file.fileName).join(', ') || '';

export function removeQueuedPrompt(prompts, id) {
  const position = prompts.findIndex(prompt => prompt.id === id);
  if (position >= 0) return prompts.splice(position, 1)[0];
}

export function reorderQueuedPrompt(prompts, id, position) {
  const prompt = removeQueuedPrompt(prompts, id);
  if (!prompt) return false;
  prompts.splice(Math.max(0, Math.min(position, prompts.length)), 0, prompt);
  return true;
}

export function clipboardFiles(clipboard) {
  if (!clipboard) return [];
  const items = Array.from(clipboard.items ?? []).filter(item => item.kind === 'file');
  const files = Array.from(clipboard.files ?? []);
  if (files.length) return files.map((file, index) => ({ file, entry: items[index]?.webkitGetAsEntry?.() ?? null }));
  return items.flatMap(item => {
    const file = item.getAsFile();
    return file ? [{ file, entry: item.webkitGetAsEntry?.() ?? null }] : [];
  });
}

export function partitionPastedFiles(files, getPath) {
  const localPathFiles = [];
  const uploadFiles = [];
  for (const file of files) {
    const path = getPath(file);
    if (path) localPathFiles.push({ file, path });
    else uploadFiles.push(file);
  }
  return { localPathFiles, uploadFiles };
}

export function pathAttachment(name, path, entry) {
  return { kind: entry?.isDirectory ? 'folder' : 'file', name: entry?.name || name || path.replace(/[\\/]+$/, '').split(/[\\/]/).at(-1) || path, path };
}

export function shouldAttachPastedText(value) {
  const text = value.trim();
  if (!text) return false;
  const lines = text.split(/\r?\n/);
  return text.length >= 4000 || lines.length >= 40 || lines.some(line => line.length >= 1000);
}

const answerKey = id => `answer:${id}`;
export function collectClarificationAnswers({ questions, hitlValues, selections }) {
  return Object.fromEntries(questions.map(({ id }) => [id, String(hitlValues[answerKey(id)] ?? '').trim() || selections[id] || '']));
}

export function selectClarificationAnswer({ hitlValues, selections, questionId, answer }) {
  const value = answer.trim();
  return { hitlValues: { ...hitlValues, [answerKey(questionId)]: value }, selections: { ...selections, [questionId]: value } };
}
