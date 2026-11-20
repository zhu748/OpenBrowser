<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message, request, subscribe } from '../desktop';
import ProfilesPage from '../profiles/ProfilesPage.vue';

const props = defineProps<{
  id?: string;
  openProject: (id?: string) => unknown;
  openProfile: (id?: string, projectId?: string) => unknown;
}>();

interface Project {
  id: string;
  projectName: string;
  windowCount: number;
  pinStatus?: number;
}

const defaultId = 'local-default';
const rows = ref<Project[]>([]);
const current = computed(() => rows.value.find(row => row.id === props.id));
const query = ref('');
const filtered = computed(() => rows.value.filter(row =>
  row.projectName.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())));
const busy = ref(false);
const ready = ref(false);
const loading = ref(false);
const fault = ref('');
const notice = ref('');
const formId = ref<string | null>(null);
const name = ref('');
const confirm = ref<Project | null>(null);
let active = true;
let version = 0;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let stop: (() => void) | undefined;

async function refresh() {
  const ticket = ++version;
  loading.value = true;
  try {
    const result = await request<Project[]>('groups:list', { default: 2 });
    if (active && version === ticket) {
      rows.value = result;
      ready.value = true;
    }
  } catch (error) {
    if (active && version === ticket) fault.value = message(error);
  } finally {
    if (active && version === ticket) loading.value = false;
  }
}

function edit(row?: Project) {
  formId.value = row?.id ?? '';
  name.value = row?.projectName ?? '';
  confirm.value = null;
  notice.value = fault.value = '';
}

async function change(action: () => Promise<unknown>, success: string) {
  if (busy.value) return;
  busy.value = true;
  fault.value = notice.value = '';
  try {
    await action();
    await refresh();
    if (!active) return;
    formId.value = null;
    confirm.value = null;
    notice.value = success;
  } catch (error) {
    if (active) fault.value = message(error);
  } finally {
    if (active) busy.value = false;
  }
}

function save() {
  const projectName = name.value.trim();
  if (!projectName) { fault.value = '请输入项目名称'; return; }
  const id = formId.value;
  void change(() => request('groups:save', { ...(id && { id }), projectName }), '项目已保存');
}

function pin(row: Project) {
  void change(() => request('groups:save', { id: row.id, pinStatus: row.pinStatus === 1 ? 0 : 1 }), '侧栏固定状态已更新');
}

function position(row: Project, shift: number) {
  const ids = rows.value.filter(item => item.id !== defaultId).map(item => item.id);
  const index = ids.indexOf(row.id);
  const target = index + shift;
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  void change(() => request('groups:sort', { projectIds: ids }), '项目顺序已保存');
}

watch(() => props.id, () => { confirm.value = null; formId.value = null; notice.value = fault.value = ''; });
onMounted(() => {
  stop = subscribe(event => {
    if (event.type !== 'profiles' || busy.value) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { void refresh(); }, 70);
  });
  void refresh();
});
onBeforeUnmount(() => { active = false; clearTimeout(refreshTimer); stop?.(); });
</script>

<template>
  <template v-if="id">
    <div class="workspace-page" style="padding-bottom: 0">
      <div class="toolbar">
        <button type="button" @click="openProject()">返回项目列表</button>
        <span v-if="!ready && !fault" role="status">正在读取项目…</span>
      </div>
      <p v-if="fault" class="callout danger" role="alert">{{ fault }}</p>
      <p v-else-if="ready && !current" class="callout" role="alert">该项目不存在或已删除。</p>
    </div>
    <ProfilesPage v-if="current" :key="current.id" :project-id="current.id" :title="current.projectName" :trash="false"
      :edit="profileId => openProfile(profileId)" :create="() => openProfile(undefined, current?.id)" />
  </template>
  <section v-else class="workspace-page" aria-labelledby="project-title">
    <header class="page-header">
      <h1 id="project-title">项目</h1>
      <button class="primary" type="button" :disabled="busy" @click="edit()">创建项目</button>
    </header>
    <div class="toolbar">
      <input v-model="query" aria-label="筛选项目名称" placeholder="筛选项目名称">
      <button type="button" :disabled="loading || busy" @click="refresh()">刷新</button>
    </div>
    <p v-if="fault" class="callout danger" role="alert">{{ fault }}</p>
    <p v-if="notice" class="callout" role="status">{{ notice }}</p>
    <form v-if="formId !== null" class="panel editor" @submit.prevent="save">
      <h2>{{ formId ? '重命名项目' : '创建项目' }}</h2>
      <label>项目名称<input v-model="name" name="projectName" required maxlength="160" :disabled="busy"></label>
      <div class="toolbar">
        <button type="submit" class="primary" :disabled="busy">保存项目</button>
        <button type="button" :disabled="busy" @click="formId = null">取消</button>
      </div>
    </form>
    <div v-if="confirm" class="panel editor" role="group" aria-label="确认删除项目">
      <p>删除「{{ confirm.projectName }}」？关联窗口会移至默认项目。</p>
      <div class="toolbar">
        <button type="button" class="danger" :disabled="busy" @click="change(() => request('groups:delete', { ids: [confirm?.id] }), '项目已删除')">确认删除</button>
        <button type="button" :disabled="busy" @click="confirm = null">取消</button>
      </div>
    </div>
    <div class="panel table-scroll" :aria-busy="loading">
      <p v-if="!ready && loading" class="empty-state" role="status">正在读取项目…</p>
      <p v-else-if="ready && !filtered.length" class="empty-state">没有匹配的项目</p>
      <table v-if="filtered.length" class="profiles-table">
        <thead><tr><th>项目</th><th>窗口数</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <th scope="row">
              <button type="button" :disabled="busy" @click="openProject(row.id)">{{ row.projectName }}</button>
              <small v-if="row.pinStatus === 1">已固定到侧栏</small>
            </th>
            <td>{{ row.windowCount }}</td>
            <td class="row-actions">
              <div class="toolbar">
                <button type="button" :disabled="busy" @click="pin(row)">{{ row.pinStatus === 1 ? '取消固定' : '固定到侧栏' }}</button>
                <template v-if="row.id !== defaultId">
                  <button type="button" :disabled="busy" @click="edit(row)">重命名</button>
                  <button type="button" :disabled="busy || rows[1]?.id === row.id" @click="position(row, -1)">上移</button>
                  <button type="button" :disabled="busy || rows.at(-1)?.id === row.id" @click="position(row, 1)">下移</button>
                  <button type="button" class="danger" :disabled="busy" @click="confirm = row; formId = null">删除</button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
