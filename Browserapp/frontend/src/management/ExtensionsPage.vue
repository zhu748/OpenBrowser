<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { message, request } from '../desktop';
import ExtensionAvatar from './ExtensionAvatar.vue';
import ExtensionGlyph from './ExtensionGlyph.vue';

type Pin = 'customize' | 'pin' | 'unpin';
type Source = 'sys' | 'local' | 'store';
type Dialog = 'upload' | 'store' | 'assign' | 'remove' | 'inspect';
interface Extension {
  id: string;
  pluginName: string;
  pluginVersion: string;
  pluginDescription: string;
  pluginIcon: string;
  fixedPlugin: Pin;
  canDelete: boolean;
  projectIds: string[];
  projectNames: string[];
  installType: number;
  source: Source;
}
interface Project { id: string; projectName: string }
interface Upload {
  pluginPath: string;
  pluginName: string;
  pluginVersion: string;
  pluginDesc: string;
  pluginIcon?: string;
}
interface VersionCheck { pluginVersion: string; pluginNewVersion: string; pluginUpdateState: number }

const sources: Record<Source, string> = { sys: '内置扩展', local: '本地上传', store: 'Chrome 应用商店' };
const pins: { value: Pin; label: string }[] = [
  { value: 'customize', label: '由窗口设置' },
  { value: 'pin', label: '始终固定到工具栏' },
  { value: 'unpin', label: '始终不固定到工具栏' },
];
const pageSizes = [10, 20, 50, 100];
const rows = ref<Extension[]>([]);
const total = ref(0);
const size = ref(pageSizes[0]);
const page = ref(1);
const jump = ref<number | ''>(1);
const last = computed(() => Math.max(1, Math.ceil(total.value / size.value)));
const query = ref('');
const filter = ref('');
const loading = ref(false);
const ready = ref(false);
const busy = ref(false);
const locked = computed(() => busy.value || loading.value);
const error = ref('');
const notice = ref('');
const checked = ref<string[]>([]);
const selected = computed(() => rows.value.filter(row => checked.value.includes(row.id)));
const allChecked = computed(() => rows.value.length > 0 && selected.value.length === rows.value.length);
const versions = ref<Record<string, VersionCheck>>({});
const updates = computed(() => selected.value.filter(row => availableUpdate(row)));
const dialog = ref<HTMLDialogElement>();
const mode = ref<Dialog | null>(null);
const upload = ref<Upload | null>(null);
const replacement = ref<Extension | null>(null);
const editing = ref<Extension | null>(null);
const projects = ref<Project[]>([]);
const chosen = ref<string[]>([]);
const removing = ref<Extension[]>([]);
const storeUrl = ref('');
const popover = ref<HTMLElement>();
const menu = ref<{ row: Extension; pin: boolean } | null>(null);
let alive = true;
let sequence = 0;

async function refresh(target = page.value) {
  const ticket = ++sequence;
  loading.value = true;
  closeMenu();
  try {
    const pageSize = size.value;
    const search = filter.value;
    const fetchPage = (index: number) => request<{ rows: Extension[]; total: number }>('extensions:list', {
      page_index: index, page_size: pageSize, queryValue: search,
    });
    let result = await fetchPage(target);
    if (!alive || ticket !== sequence) return;
    const finalPage = Math.max(1, Math.ceil(result.total / pageSize));
    if (target > finalPage) {
      target = finalPage;
      result = await fetchPage(target);
      if (!alive || ticket !== sequence) return;
    }
    rows.value = result.rows;
    checked.value = checked.value.filter(id => result.rows.some(row => row.id === id));
    total.value = result.total;
    page.value = jump.value = target;
    ready.value = true;
  } catch (failure) {
    if (alive && ticket === sequence) error.value = message(failure);
  } finally {
    if (alive && ticket === sequence) loading.value = false;
  }
}

function reloadList() {
  error.value = notice.value = '';
  void refresh();
}

function search() {
  error.value = notice.value = '';
  checked.value = [];
  filter.value = query.value.trim();
  void refresh(1);
}

function go(pageNumber: number) {
  const target = Math.max(1, Math.min(last.value, Math.trunc(pageNumber)));
  if (Number.isNaN(target) || target === page.value) {
    jump.value = page.value;
    return;
  }
  error.value = notice.value = '';
  checked.value = [];
  void refresh(target);
}

function changePageSize(event: Event) {
  const previousSize = size.value;
  size.value = Number((event.target as HTMLSelectElement).value);
  checked.value = [];
  error.value = notice.value = '';
  void refresh(1).then(() => { if (alive && error.value) size.value = previousSize; });
}

function closeMenu() {
  if (popover.value?.matches(':popover-open')) popover.value.hidePopover();
  menu.value = null;
}

async function openMenu(event: MouseEvent, row: Extension, pin = false) {
  const same = menu.value?.row.id === row.id && menu.value.pin === pin;
  if (same && popover.value?.matches(':popover-open')) {
    closeMenu();
    return;
  }
  const button = event.currentTarget as HTMLButtonElement;
  const bounds = button.getBoundingClientRect();
  menu.value = { row, pin };
  await nextTick();
  const panel = popover.value;
  if (!panel || !button.isConnected || !menu.value) return;
  if (!panel.matches(':popover-open')) panel.showPopover();
  panel.style.left = Math.max(8, bounds.right - panel.offsetWidth) + 'px';
  panel.style.top = (bounds.bottom + panel.offsetHeight + 10 <= window.innerHeight
    ? bounds.bottom + 4 : Math.max(8, bounds.top - panel.offsetHeight - 4)) + 'px';
  panel.querySelector('button')?.focus({ preventScroll: true });
}

function toggleAll(event: Event) {
  checked.value = (event.target as HTMLInputElement).checked ? rows.value.map(row => row.id) : [];
}

function dismiss() {
  dialog.value?.close();
  mode.value = null;
  upload.value = replacement.value = editing.value = null;
  removing.value = [];
  storeUrl.value = '';
}

async function show(kind: Dialog) {
  closeMenu();
  error.value = notice.value = '';
  mode.value = kind;
  await nextTick();
  if (alive && !dialog.value?.open) dialog.value?.showModal();
}

function openUpload(row?: Extension) {
  replacement.value = row ?? null;
  void show('upload');
}

async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  notice.value = error.value = '';
  try { await action(); }
  catch (failure) { if (alive) error.value = message(failure); }
  finally { if (alive) busy.value = false; }
}

function choose(kind: 'dir' | 'file') {
  return run(async () => {
    const picked = await request<{ type: 'cancel' } | { type: 'success'; data: Upload }>('extensions:select', { kind });
    if (alive && picked.type === 'success') upload.value = picked.data;
  });
}

async function openAssign(row: Extension) {
  closeMenu();
  const choices = await request<Project[]>('groups:list', { default: 2 });
  if (!alive) return;
  projects.value = choices;
  chosen.value = row.installType === 1 ? choices.map(project => project.id) : [...row.projectIds];
  editing.value = row;
  await show('assign');
}

async function assignImported(id: string) {
  const { rows: [row] } = await request<{ rows: Extension[] }>('extensions:read', { pluginId: id });
  if (row && alive) await openAssign(row);
}

function install() {
  const file = upload.value;
  if (!file) return;
  const previous = replacement.value;
  return run(async () => {
    const { localToken } = await request<{ localToken: string }>('extensions:stage', { pluginPath: file.pluginPath });
    const { plugin_id } = await request<{ plugin_id: string }>('extensions:finish', {
      localToken, pluginName: file.pluginName, pluginDesc: file.pluginDesc, ...(previous && { pluginDir: previous.id }),
    });
    if (!alive) return;
    dismiss();
    notice.value = previous ? '扩展已替换' : '扩展已导入';
    if (previous) delete versions.value[previous.id];
    if (!previous) query.value = filter.value = '';
    await refresh(previous ? page.value : 1);
    if (!previous) await assignImported(plugin_id);
  });
}

function saveAssignment() {
  const pluginId = editing.value?.id;
  if (!pluginId) return;
  return run(async () => {
    const projectId = projects.value.map(row => row.id);
    const result = await request<{ assigned: number; restartRequired: string[] }>('extensions:assign', {
      pluginId, projectId, installStatus: projectId.map(id => Number(chosen.value.includes(id))),
    });
    if (!alive) return;
    dismiss();
    notice.value = '分配已保存，关联 ' + result.assigned + ' 个窗口' +
      (result.restartRequired.length ? '，' + result.restartRequired.length + ' 个运行中的窗口需要重启' : '');
    await refresh();
  });
}

function pin(row: Extension, fixedPlugin: Pin) {
  closeMenu();
  if (row.fixedPlugin === fixedPlugin) return;
  return run(async () => {
    const value = await request<{ message: string }>('extensions:pin', { id: row.id, fixedPlugin });
    if (!alive) return;
    notice.value = value.message;
    await refresh();
  });
}

function lastCheck(row: Extension) {
  const version = versions.value[row.id];
  return version?.pluginVersion === row.pluginVersion ? version : undefined;
}

function availableUpdate(row: Extension) {
  const version = lastCheck(row);
  return version?.pluginUpdateState === 1 ? version.pluginNewVersion : '';
}

function changeVersions(targets: Extension[], check: boolean) {
  closeMenu();
  return run(async () => {
    const failures: string[] = [];
    let completed = 0;
    let changed = 0;
    for (const row of targets) {
      if (!alive) return;
      try {
        const result = await request<{ pluginUpdateStates?: VersionCheck[] }>('extensions:reload', { pluginId: row.id, check });
        if (!alive) return;
        const version = result.pluginUpdateStates?.[0];
        if (check && version) {
          versions.value[row.id] = version;
          if (version.pluginUpdateState === 1) changed++;
        }
        if (!check) delete versions.value[row.id];
        completed++;
      } catch (failure) {
        delete versions.value[row.id];
        failures.push(row.pluginName + '：' + message(failure));
      }
    }
    if (!alive) return;
    if (completed) {
      notice.value = check ? (changed ? `检查完成，${changed} 个扩展可更新` : '检查完成，清单版本没有变化')
        : `已重新加载 ${completed} 个扩展`;
    }
    if (failures.length) error.value = failures.join('；');
    if (!check && completed) await refresh();
  });
}

function openInspection(row: Extension) {
  void run(async () => {
    await show('inspect');
    if (!alive) return;
    editing.value = row;
    await request('extensions:exists', { id: row.id });
  });
}

function importStore() {
  const url = storeUrl.value.trim();
  return run(async () => {
    const { plugin_id } = await request<{ plugin_id: string }>('extensions:store', { url });
    if (!alive) return;
    dismiss();
    notice.value = '扩展已添加';
    query.value = filter.value = '';
    await refresh(1);
    await assignImported(plugin_id);
  });
}

function confirmRemove(targets: Extension[]) {
  removing.value = targets;
  void show('remove');
}

function erase() {
  const ids = removing.value.map(row => row.id);
  if (!ids.length) return;
  return run(async () => {
    try {
      await request('extensions:remove', { ids });
      if (alive) notice.value = `已移除 ${ids.length} 个扩展`;
    } finally {
      if (alive) {
        dismiss();
        for (const id of ids) delete versions.value[id];
        await refresh();
      }
    }
  });
}

const titles: Record<Dialog, string> = {
  upload: '本地上传', store: '添加 Google 扩展', assign: '安装到项目',
  remove: '移除扩展', inspect: '扩展安全',
};

onMounted(() => { void refresh(); });
onBeforeUnmount(() => {
  alive = false;
  sequence++;
  closeMenu();
  dismiss();
});
</script>

<template>
  <section class="workspace-page extension-workspace" aria-labelledby="extensions-title">
    <header class="extension-heading">
      <h1 id="extensions-title">已安装扩展</h1>
    </header>

    <div class="toolbar extension-toolbar">
      <button type="button" class="primary glyph-button" :disabled="locked" @click="show('store')"><ExtensionGlyph name="download" /> 添加 Google 扩展</button>
      <button type="button" class="glyph-button" :disabled="locked" @click="openUpload()"><ExtensionGlyph name="upload" /> 本地上传</button>
      <div class="toolbar extension-query">
        <form class="toolbar extension-search" @submit.prevent="search">
          <input v-model="query" type="search" aria-label="搜索扩展" placeholder="搜索名称或说明" :disabled="locked"
            @search="!query && filter && search()">
          <button type="submit" :disabled="locked">搜索</button>
        </form>
        <button type="button" class="glyph-button" :disabled="locked" @click="reloadList"><ExtensionGlyph name="refresh" /> 刷新</button>
      </div>
    </div>

    <div v-if="selected.length" class="toolbar selection-bar" aria-label="批量操作">
      <span>已选 {{ selected.length }} 项</span>
      <button type="button" :disabled="locked" @click="changeVersions(selected, true)">批量检查更新</button>
      <button v-if="updates.length" type="button" :disabled="locked" @click="changeVersions(updates, false)">更新所选</button>
      <button type="button" class="danger" :disabled="locked || selected.some(row => !row.canDelete)"
        @click="confirmRemove(selected)">移除所选</button>
      <button type="button" :disabled="locked" @click="checked = []">取消选择</button>
    </div>

    <div v-if="!mode && (error || notice)" class="extension-feedback">
      <p v-if="error" role="alert" class="danger">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
    </div>

    <div class="extension-scroll" :aria-busy="loading" @scroll.passive="closeMenu">
      <table class="extensions-table">
        <thead>
          <tr>
            <th scope="col" class="extension-check"><input type="checkbox" aria-label="选择本页全部扩展"
              :checked="allChecked" :indeterminate.prop="selected.length > 0 && !allChecked" :disabled="locked || !rows.length" @change="toggleAll"></th>
            <th scope="col" class="extension-info-column">扩展信息</th>
            <th scope="col">来源</th>
            <th scope="col">已安装项目</th>
            <th scope="col">更新信息</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" :class="{ 'extension-selected': checked.includes(row.id) }">
            <td class="extension-check"><input v-model="checked" :value="row.id" type="checkbox" :aria-label="'选择 ' + row.pluginName" :disabled="locked"></td>
            <th scope="row">
              <div class="extension-identity">
                <ExtensionAvatar :name="row.pluginName" :icon="row.pluginIcon" />
                <div class="extension-name">
                  <span :title="row.pluginDescription || undefined">{{ row.pluginName }}</span>
                  <small>v{{ row.pluginVersion }}</small>
                </div>
              </div>
            </th>
            <td class="extension-source">{{ sources[row.source] }}</td>
            <td>
              <button type="button" class="project-labels" :aria-label="'安装到项目 · ' + row.pluginName" :disabled="locked"
                @click="run(() => openAssign(row))">
                <template v-if="row.projectNames.length">
                  <span v-for="(name, index) in row.projectNames" :key="row.projectIds[index]" class="project-label"><ExtensionGlyph name="project" /> {{ name }}</span>
                </template>
                <span v-else class="project-label">{{ row.installType === 1 ? '全部项目' : '未分配' }}</span>
              </button>
            </td>
            <td>
              <button v-if="availableUpdate(row)" type="button" class="version-update" :disabled="locked"
                @click="changeVersions([row], false)">更新到 v{{ availableUpdate(row) }}</button>
              <span v-else class="muted">{{ lastCheck(row) ? '版本未变化' : '—' }}</span>
            </td>
            <td>
              <div class="extension-actions">
                <button type="button" class="row-button" :class="{ 'pinned-button': row.fixedPlugin === 'pin' }"
                  :aria-label="'工具栏固定方式 · ' + row.pluginName" :title="pins.find(option => option.value === row.fixedPlugin)?.label"
                  :aria-expanded="menu?.row.id === row.id && menu.pin" :disabled="locked" @click="openMenu($event, row, true)"><ExtensionGlyph name="pin" /></button>
                <button type="button" class="row-button" aria-label="安全" title="查看本地清单" :disabled="locked" @click="openInspection(row)"><ExtensionGlyph name="shield" /></button>
                <button type="button" class="row-button" aria-label="检查更新" title="检查更新" :disabled="locked" @click="changeVersions([row], true)"><ExtensionGlyph name="check" /></button>
                <button type="button" class="row-button" :aria-label="'更多操作 · ' + row.pluginName" title="更多操作"
                  :aria-expanded="menu?.row.id === row.id && !menu.pin" :disabled="locked" @click="openMenu($event, row)"><ExtensionGlyph name="more" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading && !ready" class="empty-state" role="status">正在读取扩展…</p>
      <p v-else-if="ready && !rows.length" class="empty-state">{{ filter ? '暂无匹配扩展' : '暂无已安装扩展' }}</p>
    </div>

    <footer v-if="ready" class="toolbar extension-footer">
      <div class="toolbar">
        <span>共 {{ total }} 个扩展</span>
        <select aria-label="每页条数" :value="size" :disabled="locked" @change="changePageSize">
          <option v-for="count in pageSizes" :key="count" :value="count">{{ count }} 条/页</option>
        </select>
      </div>
      <form class="toolbar" aria-label="扩展分页" @submit.prevent="go(Number(jump))">
        <label>跳至第 <input v-model.number="jump" type="number" min="1" :max="last" :disabled="locked" required> 页</label>
        <button type="submit" :disabled="locked || jump === page">跳转</button>
        <button type="button" class="row-button" :disabled="locked || page <= 1" aria-label="上一页" @click="go(page - 1)"><ExtensionGlyph name="previous" /></button>
        <output aria-live="polite">{{ page }} / {{ last }}</output>
        <button type="button" class="row-button" :disabled="locked || page >= last" aria-label="下一页" @click="go(page + 1)"><ExtensionGlyph name="next" /></button>
      </form>
    </footer>

    <div ref="popover" popover="auto" class="extension-menu" @toggle="($event as ToggleEvent).newState === 'closed' && closeMenu()">
      <template v-if="menu">
        <template v-if="menu.pin">
          <button v-for="option in pins" :key="option.value" type="button" :aria-pressed="menu.row.fixedPlugin === option.value"
            @click="pin(menu.row, option.value)">{{ option.label }}</button>
        </template>
        <template v-else>
          <button type="button" @click="run(() => openAssign(menu!.row))">分配项目</button>
          <button type="button" @click="changeVersions([menu.row], false)">重新加载</button>
          <button v-if="menu.row.source === 'local' && menu.row.canDelete" type="button" @click="openUpload(menu.row)">替换本地扩展</button>
          <button v-if="menu.row.canDelete" type="button" class="danger" @click="confirmRemove([menu.row])">移除</button>
        </template>
      </template>
    </div>

    <dialog ref="dialog" class="extension-dialog" aria-labelledby="extension-dialog-title" @cancel.prevent="!busy && dismiss()">
      <template v-if="mode">
        <h2 id="extension-dialog-title">{{ mode === 'upload' && replacement ? '替换「' + replacement.pluginName + '」' : titles[mode] }}</h2>
        <p v-if="error" role="alert" class="danger">{{ error }}</p>
        <form v-if="mode === 'store'" class="extension-form" @submit.prevent="importStore">
          <label>Chrome 扩展网址<input v-model="storeUrl" type="url" required :disabled="busy" placeholder="https://chromewebstore.google.com/detail/…"></label>
          <div class="toolbar dialog-actions">
            <button type="button" :disabled="busy" @click="dismiss">取消</button>
            <button type="submit" class="primary" :disabled="busy">确认添加</button>
          </div>
        </form>
        <form v-else-if="mode === 'upload'" class="extension-form" @submit.prevent="install">
          <div class="toolbar">
            <button type="button" :disabled="busy" @click="choose('file')">选择 ZIP / CRX</button>
            <button type="button" :disabled="busy" @click="choose('dir')">选择文件夹</button>
          </div>
          <template v-if="upload">
            <div class="extension-identity">
              <ExtensionAvatar :name="upload.pluginName" :icon="upload.pluginIcon" />
              <span class="muted">清单版本 v{{ upload.pluginVersion }}</span>
            </div>
            <label>扩展名称<input v-model="upload.pluginName" required maxlength="50" :disabled="busy"></label>
            <label>说明<textarea v-model="upload.pluginDesc" rows="3" maxlength="500" :disabled="busy"></textarea></label>
          </template>
          <div class="toolbar dialog-actions">
            <button type="button" :disabled="busy" @click="dismiss">取消</button>
            <button type="submit" class="primary" :disabled="busy || !upload">上传</button>
          </div>
        </form>
        <form v-else-if="mode === 'assign'" class="extension-form" @submit.prevent="saveAssignment">
          <p>{{ editing?.pluginName }}</p>
          <fieldset class="checklist" :disabled="busy">
            <legend>项目</legend>
            <label v-for="project in projects" :key="project.id"><input v-model="chosen" type="checkbox" :value="project.id">{{ project.projectName }}</label>
          </fieldset>
          <div class="toolbar dialog-actions">
            <button type="button" :disabled="busy" @click="dismiss">取消</button>
            <button type="submit" class="primary" :disabled="busy">保存分配</button>
          </div>
        </form>
        <div v-else-if="mode === 'remove'" class="extension-form">
          <p>{{ removing.length === 1 ? '移除「' + removing[0].pluginName + '」并解除窗口关联？' : '移除选中的 ' + removing.length + ' 个扩展并解除窗口关联？' }}</p>
          <div class="toolbar dialog-actions">
            <button type="button" :disabled="busy" @click="dismiss">取消</button>
            <button type="button" class="danger" :disabled="busy" @click="erase">确认移除</button>
          </div>
        </div>
        <div v-else-if="editing" class="extension-form">
          <div class="extension-identity"><ExtensionAvatar :name="editing.pluginName" :icon="editing.pluginIcon" /><p>{{ editing.pluginName }} · v{{ editing.pluginVersion }}</p></div>
          <p v-if="!error && !busy" role="status">本地清单可读取。可以打开目录进一步检查扩展文件。</p>
          <div class="toolbar dialog-actions">
            <button type="button" :disabled="busy" @click="dismiss">关闭</button>
            <button type="button" :disabled="busy" @click="run(async () => { await request('extensions:show', { id: editing!.id }); })">打开目录</button>
          </div>
        </div>
      </template>
    </dialog>
  </section>
</template>
