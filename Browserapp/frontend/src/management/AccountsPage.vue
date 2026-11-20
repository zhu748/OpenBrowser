<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { message, request } from '../desktop';
import ProfilePicker from './ProfilePicker.vue';

const props = defineProps<{ create?: boolean; openAccounts: (create?: boolean) => unknown }>();
const size = 25;

interface Account {
  id: string;
  platformName: string;
  platformUrl: string;
  platformUserName: string;
  platformRemarks: string;
  platformPassword?: string;
  platformEfa?: string;
  hasPassword?: boolean;
  hasTotpSecret?: boolean;
  window_info: string;
  boundProfileIds: string[];
}

type Fields = Pick<Account, 'platformName' | 'platformUrl' | 'platformUserName' | 'platformRemarks'>;
const blank = (): Fields => ({ platformName: '', platformUrl: '', platformUserName: '', platformRemarks: '' });

const rows = ref<Account[]>([]);
const query = ref('');
const filter = ref('');
const scope = ref('name_remark');
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const ready = ref(false);
const busy = ref(false);
const error = ref('');
const notice = ref('');
const editing = ref<Account | null>(null);
const binding = ref<Account | null>(null);
const remove = ref<string[] | null>(null);
const selected = ref<Account[]>([]);
const links = ref<string[]>([]);
const draft = reactive(blank());
const password = ref('');
const totp = ref('');
const changePassword = ref(false);
const changeTotp = ref(false);
const revealed = ref<{ id: string; contents: string } | null>(null);
const mode = ref<'single' | 'batch'>('single');
const batch = ref('');
const imported = ref<{ filename: string; values: Partial<Account>[] } | null>(null);
const exportOpen = ref(false);
const includeCredentials = ref(false);
const last = computed(() => Math.max(1, Math.ceil(total.value / size)));
let mounted = true;
let revision = 0;
let viewRevision = 0;

async function load(target = page.value) {
  const ticket = ++revision;
  loading.value = true;
  try {
    const queryValue = filter.value;
    const queryKey = scope.value;
    const fetchPage = (index: number) => request<{ rows: Account[]; total: number }>('accounts:list', {
      queryKey, queryValue, page_index: index, page_size: size,
    });
    let result = await fetchPage(target);
    if (ticket !== revision || !mounted) return;
    const finalPage = Math.max(1, Math.ceil(result.total / size));
    if (target > finalPage) {
      target = finalPage;
      result = await fetchPage(target);
      if (ticket !== revision || !mounted) return;
    }
    rows.value = result.rows;
    total.value = result.total;
    page.value = target;
    ready.value = true;
  } catch (failure) {
    if (ticket === revision && mounted) error.value = message(failure);
  } finally {
    if (ticket === revision && mounted) loading.value = false;
  }
}

function dismiss() {
  editing.value = binding.value = remove.value = revealed.value = null;
  changePassword.value = changeTotp.value = false;
  exportOpen.value = includeCredentials.value = false;
  password.value = totp.value = '';
  Object.assign(draft, blank());
}

function beginEdit(row: Account) {
  dismiss();
  editing.value = row;
  Object.assign(draft, {
    platformName: row.platformName, platformUrl: row.platformUrl,
    platformUserName: row.platformUserName, platformRemarks: row.platformRemarks,
  });
  error.value = notice.value = '';
}

function beginBinding(row: Account) {
  dismiss();
  binding.value = row;
  links.value = [...row.boundProfileIds];
  error.value = notice.value = '';
}

async function transaction(action: () => Promise<unknown>, success = '', reset = true) {
  if (busy.value) return;
  busy.value = true;
  const view = viewRevision;
  error.value = notice.value = '';
  try {
    await action();
    if (!mounted || view !== viewRevision) return;
    if (reset) dismiss();
    if (success) {
      notice.value = success;
      if (props.create) {
        batch.value = '';
        imported.value = null;
        props.openAccounts();
      } else await load();
    }
  } catch (failure) {
    if (mounted && view === viewRevision) error.value = message(failure);
  } finally {
    if (mounted) busy.value = false;
  }
}

function parseBatch(lines: string) {
  const values = lines.split(/\r?\n/).filter(line => line.trim());
  if (!values.length || values.length > 500) throw new Error('每次可导入 1–500 行账号');
  return values.map((line, index) => {
    const columns = line.split('\t');
    const [platformUrl, platformUserName, platformPassword = '', platformEfa = '', platformRemarks = ''] = columns;
    if (columns.length < 2 || columns.length > 5 || !platformUserName.trim())
      throw new Error('第 ' + (index + 1) + ' 行需要提供网址列与用户名，字段之间使用制表符');
    return { platformUrl: platformUrl.trim(), platformUserName: platformUserName.trim(), platformPassword, platformEfa, platformRemarks };
  });
}

function payload() {
  return {
    platformUrl: draft.platformUrl.trim(), platformName: draft.platformName.trim(),
    platformUserName: draft.platformUserName.trim(), platformRemarks: draft.platformRemarks,
    ...((!editing.value || changePassword.value) && { platformPassword: password.value }),
    ...((!editing.value || changeTotp.value) && { platformEfa: totp.value }),
  };
}

function save() {
  const row = editing.value;
  void transaction(() => row
    ? request('accounts:update', { platformList: [{ id: row.id, ...payload() }] })
    : request('accounts:create', { values: mode.value === 'batch'
      ? imported.value?.values.map(record => ({ ...record })) ?? parseBatch(batch.value)
      : [payload()] }), '账号已保存');
}

function bind() {
  const row = binding.value;
  if (row) void transaction(() => request('accounts:bind', { platformId: row.id, windowIds: [...links.value] }), '窗口关联已保存');
}

function erase() {
  const ids = remove.value;
  if (ids) void transaction(async () => {
    await request('accounts:delete', { ids: [...ids] });
    selected.value = selected.value.filter(row => !ids.includes(row.id));
  }, '账号已删除');
}

async function reveal(row: Account) {
  if (revealed.value?.id === row.id) { revealed.value = null; return; }
  dismiss();
  const view = viewRevision;
  await transaction(async () => {
    const { rows: [record] } = await request<{ rows: Account[] }>('accounts:list', { id: row.id });
    if (!mounted || viewRevision !== view || !record) return;
    revealed.value = { id: row.id, contents: record.platformPassword || '未设置密码' };
  }, '', false);
}

function numbers(value: string) {
  try {
    const list: unknown = JSON.parse(value);
    return Array.isArray(list) ? list.filter(n => typeof n === 'number' || typeof n === 'string').map(n => 'OPE-' + n).join('、') : '';
  } catch { return ''; }
}

function select(row: Account, next: boolean) {
  selected.value = next
    ? [...selected.value.filter(item => item.id !== row.id), row]
    : selected.value.filter(item => item.id !== row.id);
}

function chooseAccounts() {
  void transaction(async () => {
    const selection = await request<{ canceled: true } | NonNullable<typeof imported.value>>('accounts:import-preview');
    if (mounted && !('canceled' in selection)) imported.value = selection;
  }, '', false);
}

function download(template = false) {
  void transaction(async () => {
    const result = await request<{ canceled?: boolean; count?: number }>(template ? 'accounts:export-template' : 'accounts:export', {
      ids: selected.value.map(row => row.id), includeCredentials: includeCredentials.value,
    });
    if (!mounted || result.canceled) return;
    exportOpen.value = includeCredentials.value = false;
    notice.value = template ? '导入模板已保存' : '已导出 ' + result.count + ' 个账号';
  }, '', false);
}

watch(() => props.create, create => {
  viewRevision++;
  dismiss();
  imported.value = null;
  batch.value = '';
  error.value = notice.value = '';
  if (!create) void load(1);
});
onMounted(() => { if (!props.create) void load(1); });
onBeforeUnmount(() => { mounted = false; revision++; imported.value = null; batch.value = ''; dismiss(); });
</script>

<template>
  <section class="workspace-page" aria-labelledby="accounts-title">
    <header class="page-header">
      <h1 id="accounts-title">{{ create ? '添加平台账号' : '平台账号' }}</h1>
      <button type="button" :class="{ primary: !create }" :disabled="busy" @click="openAccounts(!create)">{{ create ? '返回账号列表' : '添加账号' }}</button>
    </header>
    <p v-if="error" class="callout danger" role="alert">{{ error }}</p>
    <p v-if="notice" class="callout" role="status">{{ notice }}</p>
    <template v-if="create || editing">
      <div v-if="create" class="toolbar" aria-label="添加方式">
        <button type="button" :aria-pressed="mode === 'single'" :disabled="busy" @click="mode = 'single'">单条录入</button>
        <button type="button" :aria-pressed="mode === 'batch'" :disabled="busy" @click="mode = 'batch'">批量录入</button>
      </div>
      <form class="panel editor" @submit.prevent="save">
        <h2 v-if="editing">编辑账号</h2>
        <template v-if="create && mode === 'batch'">
          <div class="toolbar">
            <button type="button" :disabled="busy" @click="chooseAccounts">选择 TXT / XLSX</button>
            <button type="button" :disabled="busy" @click="download(true)">下载 Excel 模板</button>
          </div>
          <div v-if="imported" class="toolbar" role="status">
            <span>{{ imported.filename }} · {{ imported.values.length }} 个账号</span>
            <button type="button" :disabled="busy" @click="imported = null">清除文件</button>
          </div>
          <label v-else>
            按行粘贴账号
            <textarea v-model="batch" :disabled="busy" rows="9" required aria-describedby="batch-description"></textarea>
            <small id="batch-description">使用制表符分隔网址、用户名、密码、验证密钥、备注。后三列可留空。</small>
          </label>
        </template>
        <template v-else>
          <div class="form-grid">
            <label>平台名称<input v-model="draft.platformName" maxlength="4096" :disabled="busy"></label>
            <label>平台网址<input v-model="draft.platformUrl" type="url" name="platformUrl" :disabled="busy"></label>
          </div>
          <label>用户名<input v-model="draft.platformUserName" name="platformUserName" required maxlength="4096" :disabled="busy"></label>
          <label v-if="editing" class="check-field"><input v-model="changePassword" type="checkbox" :disabled="busy"> 修改密码</label>
          <label v-if="create || changePassword" >密码<input v-model="password" name="platformPassword" type="password" autocomplete="new-password" :disabled="busy"></label>
          <label v-if="editing" class="check-field"><input v-model="changeTotp" type="checkbox" :disabled="busy"> 修改验证密钥</label>
          <label v-if="create || changeTotp">验证密钥<input v-model="totp" type="password" autocomplete="off" :disabled="busy"></label>
          <label>备注<textarea v-model="draft.platformRemarks" maxlength="20000" :disabled="busy"></textarea></label>
        </template>
        <div class="toolbar">
          <button type="submit" class="primary" :disabled="busy">保存账号</button>
          <button v-if="editing" type="button" :disabled="busy" @click="dismiss">取消</button>
        </div>
      </form>
    </template>
    <template v-if="!create">
      <form class="toolbar" @submit.prevent="dismiss(); filter = query.trim(); load(1)">
        <select v-model="scope" aria-label="搜索字段" :disabled="loading">
          <option value="name_remark">全部字段</option><option value="platform">平台网址</option>
          <option value="account">用户名</option><option value="remark">备注</option>
        </select>
        <input v-model="query" aria-label="搜索账号" placeholder="搜索账号">
        <button type="submit" :disabled="loading || busy">搜索</button>
        <button type="button" :disabled="loading || busy" @click="load()">刷新</button>
        <button type="button" :disabled="!selected.length || busy" @click="dismiss(); exportOpen = true">导出 Excel</button>
        <button type="button" class="danger" :disabled="!selected.length || busy" @click="dismiss(); remove = selected.map(row => row.id)">删除所选</button>
      </form>
      <div v-if="exportOpen" class="panel editor">
        <h2>导出 {{ selected.length }} 个账号</h2>
        <label class="check-field"><input v-model="includeCredentials" type="checkbox" :disabled="busy"> 包含密码和验证密钥</label>
        <p v-if="includeCredentials">Excel 文件会以明文保存这些凭据。</p>
        <div class="toolbar">
          <button type="button" class="primary" :disabled="busy" @click="download()">选择导出位置</button>
          <button type="button" :disabled="busy" @click="dismiss">取消</button>
        </div>
      </div>
      <form v-if="binding" class="panel editor" @submit.prevent="bind">
        <h2>关联窗口 · {{ binding.platformUserName }}</h2>
        <ProfilePicker v-model="links" :disabled="busy" />
        <div class="toolbar">
          <button type="submit" class="primary" :disabled="busy">保存关联</button>
          <button type="button" :disabled="busy" @click="dismiss">取消</button>
        </div>
      </form>
      <div v-if="remove" class="panel editor" role="group" aria-label="确认删除账号">
        <p>删除所选 {{ remove.length }} 个账号并解除窗口关联？</p>
        <div class="toolbar">
          <button type="button" class="danger" :disabled="busy" @click="erase">确认删除</button>
          <button type="button" :disabled="busy" @click="dismiss">取消</button>
        </div>
      </div>
      <div class="panel" :aria-busy="loading">
        <p v-if="!ready && loading" class="empty-state" role="status">正在读取账号…</p>
        <p v-else-if="ready && !rows.length" class="empty-state">暂无匹配的账号</p>
        <div v-if="rows.length" class="table-scroll">
          <table class="profiles-table">
            <thead><tr><th>选择</th><th>平台和用户</th><th>关联窗口</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td><input type="checkbox" :aria-label="'选择 ' + row.platformUserName" :disabled="busy"
                  :checked="selected.some(item => item.id === row.id)" @change="select(row, ($event.target as HTMLInputElement).checked)"></td>
                <th scope="row">{{ row.platformUserName }}<small>{{ row.platformName || row.platformUrl }}</small><small v-if="row.platformRemarks">{{ row.platformRemarks }}</small></th>
                <td>{{ numbers(row.window_info) || '—' }}</td>
                <td class="row-actions">
                  <div class="toolbar">
                    <button type="button" :disabled="busy" @click="beginEdit(row)">编辑</button>
                    <button type="button" :disabled="busy" @click="beginBinding(row)">关联窗口</button>
                    <button v-if="row.hasPassword" type="button" :disabled="busy" @click="reveal(row)">{{ revealed?.id === row.id ? '隐藏密码' : '查看密码' }}</button>
                    <button type="button" class="danger" :disabled="busy" @click="dismiss(); remove = [row.id]">删除</button>
                  </div>
                  <output v-if="revealed?.id === row.id" class="text-break">{{ revealed.contents }}</output>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="ready" class="toolbar table-footer">
          <span>第 {{ page }} / {{ last }} 页，共 {{ total }} 个账号</span>
          <button type="button" :disabled="loading || busy || page <= 1" @click="dismiss(); load(page - 1)">上一页</button>
          <button type="button" :disabled="loading || busy || page >= last" @click="dismiss(); load(page + 1)">下一页</button>
        </div>
      </div>
    </template>
  </section>
</template>
