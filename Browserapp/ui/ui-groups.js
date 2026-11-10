// Group UI domain (classic script loaded before renderer.js).
// Function declarations only: state and generic helpers stay renderer-owned.
// Moving existing names preserves the shared-script contract without adding
// runtime globals; eslint.config.js records the cross-file dependencies.
/* exported renderGroupsPage, openGroupDialog, saveGroupFromDialog, deleteGroup, assignSelectedToGroup */

// ========== 分组管理 ==========
function renderGroupsPage() {
  const table = $('#group-table');
  const empty = $('#group-empty');
  const countEl = $('#group-count');
  if (!table) return;
  // Callers (deleteGroup, group renames) mutate ui.profiles right before
  // rendering this page; the badge cache otherwise serves pre-mutation counts
  // and the groups view does not re-render on its own.
  rebuildGroupCounts();
  table.replaceChildren();
  const groups = listGroups();
  if (countEl) countEl.textContent = String(groups.length);
  const fragment = new DocumentFragment();
  // ungrouped row
  {
    const row = document.createElement('tr');
    const n = countProfilesInGroup('ungrouped');
    const colorCell = document.createElement('td');
    colorCell.append(buildSquareMark('—', { color: '#94a3b8', title: t('groups.ungrouped'), size: UI_MARK_SIZE, className: 'group-mark' }));
    row.append(
      colorCell,
      element('td', '', t('groups.ungrouped')),
      element('td', '', String(n)),
      element('td', '', t('groups.default')),
      element('td', '', '—')
    );
    fragment.append(row);
  }
  for (const g of groups) {
    const row = document.createElement('tr');
    const colorCell = document.createElement('td');
    const letter = String(g.name || '?').trim().charAt(0) || '?';
    colorCell.append(buildSquareMark(letter, {
      color: g.color || '#245cff',
      title: g.name,
      size: UI_MARK_SIZE,
      className: 'group-mark',
    }));
    const nameCell = document.createElement('td');
    const nameWrap = element('div', 'profile-name env-identity');
    nameWrap.append(element('strong', '', g.name));
    if (g.note) nameWrap.append(element('small', 'group-note', g.note));
    nameCell.append(nameWrap);
    const n = countProfilesInGroup(g.id);
    const actions = element('div', 'actions');
    const edit = element('button', 'mini edit', t('action.edit')); edit.dataset.groupEdit = g.id;
    const view = element('button', 'mini blue', t('action.use')); view.dataset.groupView = g.id;
    const del = element('button', 'mini', t('action.delete')); del.dataset.groupDelete = g.id;
    actions.append(view, edit, del);
    const actionCell = document.createElement('td'); actionCell.append(actions);
    row.append(colorCell, nameCell, element('td', '', String(n)), element('td', '', (g.createdAt || '').replace('T', ' ').slice(0, 16) || '—'), actionCell);
    fragment.append(row);
  }
  table.append(fragment);
  if (empty) empty.hidden = true;
  afterUiRender(document.getElementById('view-groups') || document);
  loadedViews.add('groups');
}

function openGroupDialog(group = null) {
  $('#group-edit-id').value = group?.id || '';
  $('#group-dialog-title').textContent = group ? tx('编辑分组') : tx('新建分组');
  $('#group-name').value = group?.name || '';
  $('#group-note').value = group?.note || '';
  const color = group?.color || GROUP_COLORS[listGroups().length % GROUP_COLORS.length];
  const normalizedColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#245cff';
  $('#group-color').value = normalizedColor;
  $('#group-color-preview')?.style.setProperty('--group-color', normalizedColor);
  // color chips
  const chips = $('#group-color-chips');
  if (chips) {
    chips.replaceChildren();
    for (const c of GROUP_COLORS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'group-color-pick' + (c.toLowerCase() === normalizedColor.toLowerCase() ? ' active' : '');
      b.style.background = c;
      b.dataset.color = c;
      chips.append(b);
    }
  }
  $('#group-dialog').showModal();
}

function saveGroupFromDialog() {
  const id = $('#group-edit-id').value.trim();
  const name = $('#group-name').value.trim();
  if (!name) throw new Error(tx('请输入分组名称'));
  const color = $('#group-color').value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error(tx('颜色必须是 #RRGGBB 格式'));
  const note = $('#group-note').value.trim();
  if (id) {
    const idx = ui.groups.findIndex((g) => g.id === id);
    if (idx < 0) throw new Error(tx('分组不存在'));
    if (ui.groups.some((g) => g.id !== id && g.name === name)) throw new Error(tx('已有同名分组'));
    ui.groups[idx] = normalizeGroup({ ...ui.groups[idx], name, color, note }, idx);
  } else {
    if (ui.groups.some((g) => g.name === name)) throw new Error(tx('已有同名分组'));
    ui.groups.push(normalizeGroup({
      id: createGroupId(),
      name,
      color,
      note,
      sort: listGroups().length,
    }, listGroups().length));
  }
  save();
  invalidateViewCache(['groups', 'profiles']);
  renderGroupsPage();
  renderProfiles();
  fillGroupSelect($('#editor-group'), $('#editor-group')?.value || UNGROUPED_ID);
  fillGroupSelect($('#batch-add-group'), $('#batch-add-group')?.value || UNGROUPED_ID);
  fillGroupSelect($('#profile-create-group'), $('#profile-create-group')?.value || UNGROUPED_ID);
  fillGroupSelect($('#batch-assign-group'), '', { includeUngrouped: true });
}

async function deleteGroup(id) {
  const g = findGroup(id);
  if (!g) return;
  const n = countProfilesInGroup(id);
  if (!await confirmAction({
    title: tx('删除分组'),
    message: tx('删除分组「') + g.name + tx('」？\n其中 ') + n + tx(' 个环境将变为「未分组」。'),
    confirmLabel: tx('删除分组'),
    tone: 'danger',
  })) return;
  ui.profiles = ui.profiles.map((p) => (p.groupId === id ? { ...p, groupId: UNGROUPED_ID } : p));
  ui.groups = ui.groups.filter((item) => item.id !== id);
  if (activeGroupFilter === id) activeGroupFilter = 'all';
  save();
  invalidateViewCache(['groups', 'profiles']);
  // fire-and-forget: the group edit is already saved locally; surface a failed
  // engine sync instead of swallowing it (engineProfiles would drift).
  window.ops.syncProfiles(ui.profiles).catch((error) => log('Error', '环境同步失败: ' + ((error && error.message) || error)));
  renderGroupsPage();
  renderProfiles();
  toast(tx('已删除分组'));
  log('Group', '删除分组 ' + g.name);
}

async function assignSelectedToGroup(groupId) {
  const ids = new Set(selectedProfiles);
  if (!ids.size) throw new Error(tx('请先勾选环境'));
  const gid = groupId === 'ungrouped' ? UNGROUPED_ID : groupId;
  if (gid && !findGroup(gid)) throw new Error(tx('分组不存在'));
  ui.profiles = ui.profiles.map((p) => (ids.has(p.id) ? { ...p, groupId: gid } : p));
  save();
  engineProfiles = await window.ops.syncProfiles(ui.profiles);
  renderProfiles();
  toast(tx(`已将 ${ids.size} 个环境移到「${gid ? groupNameOf({ groupId: gid }) : '未分组'}」`));
  log('Group', `批量移动 ${ids.size} 个环境 → ${gid || '未分组'}`);
}
