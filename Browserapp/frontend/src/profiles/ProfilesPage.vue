<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { message, request, subscribe } from '../desktop';
import { queryProfiles, type ProfileRow } from './api';

const props = defineProps<{
  trash: boolean; edit: (id: string) => void; create: () => void; projectId?: string; title?: string;
}>();
const { trash, edit, create } = props;
const rows = ref<ProfileRow[]>([]);
const total = ref(0);
const page = ref(1);
const size = 20;
const pages = computed(() => Math.max(1, Math.ceil(total.value / size)));
const draft = ref('');
const search = ref('');
const loading = ref(false);
const ready = ref(false);
const activeAction = ref<string | null>(null);
const confirmAction = ref<string | null>(null);
const loadError = ref('');
const actionError = ref('');
const notice = ref('');
let sequence = 0;
let requestedPage = 1;
let alive = true;
let timer: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | undefined;

async function load(target = requestedPage) {
  requestedPage = target;
  const ticket = ++sequence;
  const term = search.value;
  loading.value = true;
  loadError.value = '';
  try {
    let result = await queryProfiles(target, size, term, trash, props.projectId);
    if (!alive || ticket !== sequence) return;
    const last = Math.max(1, Math.ceil(result.total / size));
    if (!result.rows.length && target > last) {
      target = last;
      result = await queryProfiles(target, size, term, trash, props.projectId);
      if (!alive || ticket !== sequence) return;
    }
    page.value = requestedPage = target;
    rows.value = result.rows;
    total.value = result.total;
    ready.value = true;
  } catch (failure) {
    if (alive && ticket === sequence) loadError.value = message(failure);
  } finally {
    if (alive && ticket === sequence) loading.value = false;
  }
}

function searchNow() {
  if (activeAction.value) return;
  search.value = draft.value.trim();
  notice.value = '';
  confirmAction.value = null;
  void load(1);
}

type Action = 'start' | 'stop' | 'delete' | 'restore' | 'purge';
const feedback: Record<Action, string> = {
  start: '窗口已启动', stop: '窗口已停止', delete: '已移入回收站', restore: '窗口已恢复', purge: '窗口已永久删除',
};

async function act(action: Action, row: ProfileRow) {
  if (!alive || activeAction.value) return;
  activeAction.value = row.id;
  actionError.value = '';
  notice.value = '';
  try {
    const single = action === 'start' || action === 'stop';
    const result = await request<{ warningMessages?: string[], deleted?: number }>(
      action === 'purge' ? 'profiles:purge-trash' : `profiles:${action}`,
      single ? { id: row.id } : { ids: [row.id], ...(action === 'purge' && {
        trashedAtById: { [row.id]: row.trashedAt ?? null }, revisions: row.rev === undefined ? undefined : { [row.id]: row.rev },
      }) },
    );
    if (!alive) return;
    confirmAction.value = null;
    notice.value = action === 'purge' && result.deleted === 0 ? '窗口的回收站状态已变更' : result.warningMessages?.join('，') || feedback[action];
    await load();
  } catch (failure) {
    if (alive) actionError.value = message(failure);
  } finally {
    if (alive) activeAction.value = null;
  }
}

onMounted(() => {
  unsubscribe = subscribe(event => {
    const changed = event.type === 'profiles'
      || (event.type === 'status' && ['profiles-update', 'profile-write-rollback'].includes(event.action ?? ''))
      || (/^profile-(start|stop|sync)-progress$/.test(event.type ?? '') && event.lifecycle && !event.lifecycle.pending);
    if (!changed || activeAction.value) return;
    clearTimeout(timer);
    timer = setTimeout(() => { void load(); }, 60);
  });
  void load();
});
onBeforeUnmount(() => { alive = false; clearTimeout(timer); unsubscribe?.(); });
</script>

<template>
  <section class="workspace-page" aria-labelledby="list-title">
    <header class="page-header">
      <h1 id="list-title">{{ title || (trash ? '回收站' : '窗口管理') }}</h1>
      <div v-if="!trash" class="toolbar">
        <a v-if="!projectId" href="#/profiles/import">导入窗口</a>
        <a v-if="!projectId" href="#/profiles/batch">批量创建</a>
        <button class="primary" type="button" @click="create">{{ projectId ? '在此项目创建窗口' : '创建窗口' }}</button>
      </div>
    </header>
    <form class="toolbar" @submit.prevent="searchNow">
      <input v-model="draft" aria-label="搜索名称或备注" placeholder="搜索名称或备注">
      <button type="submit" :disabled="!!activeAction">搜索</button>
      <button type="button" :disabled="loading || !!activeAction" @click="load()">刷新</button>
    </form>
    <p v-if="actionError" class="callout danger" role="alert">{{ actionError }}</p>
    <p v-if="loadError" class="callout danger" role="alert">{{ loadError }}</p>
    <p v-if="notice" class="callout" role="status">{{ notice }}</p>
    <div class="panel" :aria-busy="loading">
      <p v-if="!ready && loading" class="empty-state" role="status">正在读取窗口…</p>
      <p v-else-if="ready && !rows.length" class="empty-state">{{ search ? '没有匹配的窗口' : trash ? '回收站为空' : '暂无窗口' }}</p>
      <div v-if="rows.length" class="table-scroll">
        <table class="profiles-table">
          <thead><tr><th>编号</th><th>窗口</th><th>操作系统</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.windowSortNum ?? '—' }}</td>
              <th scope="row">{{ row.windowName }}<small v-if="row.windowRemark">{{ row.windowRemark }}</small></th>
              <td>{{ row.os || '—' }}</td>
              <td>{{ trash ? '已移入回收站' : row.openStatus ? '运行中' : '已停止' }}</td>
              <td>
                <div v-if="confirmAction === row.id" class="toolbar">
                  <span>{{ trash ? '永久删除窗口及数据？' : '将窗口移入回收站？' }}</span>
                  <button type="button" :disabled="!!activeAction" @click="confirmAction = null">取消</button>
                  <button type="button" class="danger" :disabled="!!activeAction" @click="act(trash ? 'purge' : 'delete', row)">确认{{ trash ? '永久删除' : '移入回收站' }}</button>
                </div>
                <div v-else class="toolbar">
                  <template v-if="trash">
                    <button type="button" :disabled="!!activeAction" @click="act('restore', row)">恢复</button>
                    <button type="button" class="danger" :disabled="!!activeAction" @click="confirmAction = row.id">永久删除</button>
                  </template>
                  <template v-else>
                    <button type="button" :disabled="!!activeAction" @click="act(row.openStatus ? 'stop' : 'start', row)">{{ row.openStatus ? '停止' : '启动' }}</button>
                    <button type="button" :disabled="!!activeAction" @click="edit(row.id)">编辑</button>
                    <button type="button" :disabled="!!activeAction" @click="confirmAction = row.id">移入回收站</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer v-if="ready" class="table-footer toolbar">
        <span>第 {{ page }} / {{ pages }} 页，共 {{ total }} 个窗口</span>
        <button type="button" :disabled="loading || !!activeAction || page <= 1" @click="load(page - 1)">上一页</button>
        <button type="button" :disabled="loading || !!activeAction || page >= pages" @click="load(page + 1)">下一页</button>
      </footer>
    </div>
  </section>
</template>
