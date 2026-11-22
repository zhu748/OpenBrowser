// Sync-page load-time event wiring (classic script, no build step).
// Loaded AFTER renderer.js (after ui-proxy-wiring.js): these statements
// execute during script evaluation and need renderer.js's $ helper and its
// sync-domain globals to already exist. The domain functions they bind
// (runSyncAction / applySyncSettings / specified-text group store / tab &
// window actions) stay in renderer.js; this file owns only the event
// wiring, the two text-action entry points (sendSameText /
// sendRandomNumbers, also reached from renderer.js's IPC dispatch table)
// and the Ctrl+Alt sync-page shortcut map.

$('#refresh-sessions')?.addEventListener('click', refreshSessions);
$('#start-sync')?.addEventListener('click', () => { invalidateViewCache('sync'); return runSyncAction('\u542f\u52a8\u540c\u6b65', () => window.ops.startSync(selectedSessionIds(2))); });
$('#stop-sync')?.addEventListener('click', () => { invalidateViewCache('sync'); return runSyncAction('\u505c\u6b62\u540c\u6b65', () => window.ops.stopSync()); });
$('#restart-sync')?.addEventListener('click', () => { invalidateViewCache('sync'); return runSyncAction('\u91cd\u542f\u540c\u6b65', () => window.ops.restartSync()); });
async function sendSameText() { const [delayMin, delayMax] = textDelayRange(); return runSyncAction('\u6587\u672c\u8f93\u5165', () => window.ops.textAction(selectedSessionIds(), 'insert', $('#sync-text').value, delayMin, delayMax)); }
async function sendRandomNumbers() {
  let ids; try { ids = specifiedTextSessionIds(); } catch (error) { return toast(error.message); }
  let min = Number($('#random-number-min').value), max = Number($('#random-number-max').value); if (!Number.isFinite(min) || !Number.isFinite(max)) return toast('\u8bf7\u8f93\u5165\u6709\u6548\u7684\u6570\u5b57\u8303\u56f4'); if (max < min) [min, max] = [max, min];
  const decimals = Math.max((String($('#random-number-min').value).split('.')[1] || '').length, (String($('#random-number-max').value).split('.')[1] || '').length);
  const texts = ids.map(() => (min + Math.random() * (max - min)).toFixed(Math.min(8, decimals)));
  const [delayMin, delayMax] = textDelayRange(); return runSyncAction('\u968f\u673a\u6570\u5b57\u8f93\u5165', () => window.ops.batchTextAction(ids, texts, delayMin, delayMax));
}
$('#send-text')?.addEventListener('click', sendSameText);
$('#send-random-number')?.addEventListener('click', sendRandomNumbers);
$('#sync-settings-button')?.addEventListener('click', () => { fillSyncSettingsForm(); $('#sync-settings-dialog').showModal(); });
$('#sync-settings-form')?.addEventListener('submit', async (event) => { event.preventDefault(); if (event.submitter?.value === 'cancel') return $('#sync-settings-dialog').close('cancel'); await applySyncSettings(syncSettingsFromForm(), true); $('#sync-settings-dialog').close(); });
$('#delay-input')?.addEventListener('change', () => applySyncSettings({ ...syncSettings, delayInput: $('#delay-input').checked }));
$('#delay-click')?.addEventListener('change', () => applySyncSettings({ ...syncSettings, delayClick: $('#delay-click').checked }));
$('#clear-text')?.addEventListener('click', () => runSyncAction('清空内容', () => window.ops.textAction(selectedSessionIds(), 'clear', '', 0, 0)));
$('#add-specified-text-group')?.addEventListener('click', () => {
  if (specifiedTextGroups.length >= SPECIFIED_TEXT_GROUP_LIMIT) return toast('\u6700\u591a\u6dfb\u52a0 ' + SPECIFIED_TEXT_GROUP_LIMIT + ' \u4e2a\u6587\u672c\u7ec4');
  specifiedTextGroups.push(createSpecifiedTextGroup(specifiedTextGroups.length)); saveSpecifiedTextGroups(); renderSpecifiedTextGroups();
});
$('#specified-text-groups')?.addEventListener('input', (event) => {
  const id = event.target.dataset.specifiedText; if (!id) return;
  const group = specifiedTextGroups.find((item) => item.id === id); if (!group) return;
  group.text = event.target.value.slice(0, 500000); group.cursor = Math.min(group.cursor, Math.max(0, specifiedTextItems(group.text).length - 1));
  // Debounced: serializing all 20 groups (up to ~10MB) on every keystroke
  // froze input and could silently exceed the localStorage quota.
  clearTimeout(saveSpecifiedTextGroups.__timer);
  saveSpecifiedTextGroups.__timer = setTimeout(() => saveSpecifiedTextGroups(), 400);
  const counter = document.querySelector('[data-specified-count="' + id + '"]'); if (counter) counter.textContent = specifiedTextItems(group.text).length + ' \u6761\u6587\u672c';
});
$('#specified-text-groups')?.addEventListener('change', (event) => {
  const id = event.target.dataset.specifiedMode; if (!id) return;
  const group = specifiedTextGroups.find((item) => item.id === id); if (!group) return;
  group.mode = event.target.value === 'random' ? 'random' : 'sequence'; group.cursor = 0; saveSpecifiedTextGroups();
});
$('#specified-text-groups')?.addEventListener('click', (event) => {
  const send = event.target.closest('[data-specified-send]'); if (send) return sendSpecifiedTextGroup(send.dataset.specifiedSend);
  const remove = event.target.closest('[data-specified-remove]'); if (!remove || specifiedTextGroups.length <= 1) return;
  specifiedTextGroups = specifiedTextGroups.filter((item) => item.id !== remove.dataset.specifiedRemove); saveSpecifiedTextGroups(); renderSpecifiedTextGroups();
});
$('#new-tab')?.addEventListener('click', () => runSyncAction('新建标签页', () => window.ops.tabAction(selectedSessionIds(), 'new', { url: normalizeUrl($('#tab-url').value) })));
$('#navigate-tab')?.addEventListener('click', () => runSyncAction('批量导航', () => window.ops.tabAction(selectedSessionIds(), 'navigate', { url: normalizeUrl($('#tab-url').value) })));
$('#reload-tab')?.addEventListener('click', () => runSyncAction('刷新标签页', () => window.ops.tabAction(selectedSessionIds(), 'reload', {})));
$('#close-tab')?.addEventListener('click', () => runSyncAction('关闭标签页', () => window.ops.tabAction(selectedSessionIds(), 'close', {})));
$('#close-other-tabs')?.addEventListener('click', () => runSyncAction('关闭其他标签页', () => window.ops.tabAction(selectedSessionIds(), 'closeOthers', {})));
$('#close-blank-tabs')?.addEventListener('click', () => runSyncAction('关闭空白标签页', () => window.ops.tabAction(selectedSessionIds(), 'closeBlank', {})));
$('#sync-tabs')?.addEventListener('click', () => runSyncAction('同步标签页', () => window.ops.tabAction(selectedSessionIds(2), 'sync', {})));
// 窗口同步快捷键（Roxy simulation 快捷键对齐）：仅在同步页生效，避免全局劫持。
// Ctrl+Alt+A 启动/停止同步；D 停止；R 重启；F3 平铺；F4 层叠；F5 批量输入；X 统一
// 标签页；B 关闭其他标签页；C 关闭当前页；N 关闭空白标签页；O 打开网址；L 全选会话；
// P 同步设置（与工具栏按钮标注一致）。
const syncShortcutHandlers = {
  'KeyA': () => $(syncState.active ? '#stop-sync' : '#start-sync')?.click(),
  'KeyD': () => $('#stop-sync')?.click(),
  'KeyR': () => $('#restart-sync')?.click(),
  'F3': () => runSyncAction('平铺窗口', () => window.ops.windowAction(selectedSessionIds(), 'tile')),
  'F4': () => runSyncAction('层叠窗口', () => window.ops.windowAction(selectedSessionIds(), 'cascade')),
  'F5': () => { document.querySelector('.sync-tab[data-console="text"]')?.click(); $('#sync-text')?.focus(); },
  'KeyX': () => document.querySelector('.sync-tab[data-console="tabs"]')?.click(),
  'KeyB': () => $('#close-other-tabs')?.click(),
  'KeyC': () => $('#close-tab')?.click(),
  'KeyN': () => $('#close-blank-tabs')?.click(),
  'KeyO': () => { document.querySelector('.sync-tab[data-console="window"]')?.click(); $('#tab-url')?.focus(); },
  'KeyL': () => $('#select-all-sessions')?.click(),
  'KeyP': () => $('#sync-settings-button')?.click(),
};
document.addEventListener('keydown', (event) => {
  if (!document.querySelector('.view.active#view-sync')) return;
  if (!(event.ctrlKey && event.altKey) || event.shiftKey || event.metaKey) return;
  const handler = syncShortcutHandlers[event.code];
  if (!handler) return;
  event.preventDefault();
  try { handler(); } catch (error) { toast(error.message); }
});
