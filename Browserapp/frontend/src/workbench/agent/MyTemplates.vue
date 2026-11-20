<script setup>
import { TransitionGroup, onMounted, ref } from 'vue';
import { N as useAgentApi, v as useConfig } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { n as useDialog } from './usedialog-Dh0xp3r7.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
import { A as requireSuccess, C as creationBody, E as templateCard, O as readTemplate, S as initialUnread, b as markRead, c as setSkillRoot,
  j as sortTemplates, k as pageResult, l as promptFor, r as skillRoot, t as TemplateDialog, w as updateBody,
  x as markUnread, y as hasUnread } from './CreateTemplateDialog-Bpq9OLTG.js';
import { t as PageLayout } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { i as guideId, n as updateGuide, s as markGuide } from './template-guide-OgW15d11.js';
import { n as showSkeletonAfterDelay, t as useTaskExecution } from './useTemplateTaskExecution-yGKXS9Rw.js';
import { n as useTaskDialog } from './useCustomTemplateDialog-2nSs2D8n.js';
import TemplateCard from './workbench-my-template-card.js';
import TemplateSkeleton from './workbench-my-template-skeleton.js';

const prompt = defineModel('prompt', { required: true });
const api = useAgentApi();
const config = useConfig();
const router = useRouter();
const route = useRoute();
const dialog = useDialog();
const confirm = useConfirm();
const [showSuccess, showError] = useNotice();
const { openCreateTaskDialog } = useTaskDialog();
const { executeTemplateTask } = useTaskExecution(prompt);
const rows = ref([]);
const count = ref(0);
const loading = ref(true);
const showSkeleton = showSkeletonAfterDelay(loading);
const failed = ref(false);
const creatingTask = ref();
const editing = ref();
const deleting = ref(new Set());
const topping = ref(new Set());
const unread = ref(initialUnread());
let loadRequest = 0;

function run(item, fromNew = false) {
  const type = item.templateType ?? item.kind;
  const kind = type === 'script' || type === 'skill' ? type : 'prompt';
  return openCreateTaskDialog({ id: item.id, kind, name: item.name }, fromNew ? { onCreated: task => executeTemplateTask(task, item) } : undefined);
}
function saveAndRun(form, row) {
  if (form.saveAndRun) window.setTimeout(() => run(row, true));
}
async function save(form, original) {
  try {
    if (original) {
      const result = await api.userTemplates.updateUserTemplate({ templateId: original.id }, updateBody(form));
      const updated = readTemplate(result, $t('更新模板失败'));
      showSuccess(0, $t('模板已更新'));
      await load();
      saveAndRun(form, updated);
      return true;
    }
    const result = await api.userTemplates.createUserTemplate(creationBody(form));
    const created = readTemplate(result, $t('创建模板失败'));
    unread.value = markUnread(created);
    const guide = guideId(config.userInfo);
    if (guide) { markGuide(guide); updateGuide(); }
    showSuccess(0, $t('模板已创建'));
    await load();
    saveAndRun(form, created);
    return Boolean(created.id);
  } catch (error) {
    const message = $t(original ? '更新模板失败' : '创建模板失败');
    console.error(message, error);
    showError(-1, error instanceof Error ? error.message : message);
    return false;
  }
}
function openEditor(item) {
  if (item) {
    if (editing.value !== undefined) return;
    editing.value = item.id;
    unread.value = markRead(item);
  }
  dialog.open(TemplateDialog, {
    props: {
      modal: true, blockScroll: true, dismissableMask: false, draggable: false, showHeader: false,
      style: { width: 'min(540px, calc(100vw - 32px))' },
      pt: { root: 'agent-console-dialog agent-console-create-template-dialog', content: '!p-0 !overflow-hidden' },
    },
    data: { template: item, loadDetail: item ? true : undefined, onSave: form => save(form, item) },
    onClose: () => { editing.value = undefined; },
  });
}
async function openTask(item, execute = false) {
  if (creatingTask.value) return;
  creatingTask.value = item.id;
  try {
    if (execute) await run(item, true);
    else await openCreateTaskDialog({ id: item.id, kind: item.kind, name: item.name });
  } finally { creatingTask.value = undefined; }
}
async function ensureSkillRoot() {
  try {
    const { installedRoot } = await api.skillPathInfo();
    setSkillRoot(installedRoot);
  } catch (error) {
    console.error('Failed to load Skill installed root', error);
  }
}
async function runInChat(item) {
  if (item.kind === 'script') return openTask(item, true);
  if (!skillRoot()) await ensureSkillRoot();
  prompt.value = promptFor(item);
  return router.push({ name: 'agent-console-chat', query: route.query });
}

function setTop(id, value, time) {
  rows.value = sortTemplates(rows.value.map(row => row.id === id ? { ...row, isTopped: value, toppedAt: value ? time : null } : row));
}
async function toggleTop(item) {
  const id = item.id;
  if (topping.value.has(id)) return;
  const next = !item.isTopped;
  const time = next ? new Date().toISOString() : null;
  topping.value.add(id);
  setTop(id, next, time);
  try {
    const result = next ? await api.userTemplates.topUserTemplate(id) : await api.userTemplates.untopUserTemplate(id);
    setTop(id, result.isTopped, result.toppedAt ?? time);
  } catch (error) {
    console.error('Failed to update user template top state', error);
    setTop(id, item.isTopped, item.toppedAt);
    showError(-1, error instanceof Error ? error.message : $t('模板置顶操作失败'));
  } finally { topping.value.delete(id); }
}
function remove(item) {
  confirm.require({
    group: 'agentConsoleDeleteConfirmDialog', header: $t('删除模板'),
    message: $t('删除后无法恢复，确认删除模板“{name}”吗？', { name: item.name }), acceptLabel: $t('删除'), rejectLabel: $t('取消'),
    accept: async () => {
      deleting.value.add(item.id);
      try {
        requireSuccess(await api.userTemplates.deleteUserTemplate({ templateId: item.id }), $t('删除模板失败'));
        await load();
      } catch (error) {
        console.error('Failed to delete user template', error);
        showError(-1, error instanceof Error ? error.message : $t('删除模板失败'));
      } finally { deleting.value.delete(item.id); }
    },
  });
}
async function load() {
  const ticket = ++loadRequest;
  loading.value = true;
  failed.value = false;
  try {
    const result = [];
    let total;
    do {
      const response = await api.userTemplates.listUserTemplates({ limit: 200, offset: result.length, sortBy: 'updated_at', sortOrder: 'desc' });
      const page = pageResult(response, $t('加载我的模板失败'));
      if (ticket !== loadRequest) return;
      total = page.total;
      result.push(...page.items);
      if (!page.items.length) break;
    } while (result.length < total);
    rows.value = sortTemplates(result.map(templateCard).filter(Boolean));
    count.value = total;
  } catch (error) {
    if (ticket !== loadRequest) return;
    console.error('Failed to load user templates', error);
    rows.value = [];
    count.value = 0;
    failed.value = true;
  } finally {
    if (ticket === loadRequest) loading.value = false;
  }
}
async function openFromRoute() {
  const value = Array.isArray(route.query.editTemplateId) ? route.query.editTemplateId[0] : route.query.editTemplateId;
  if (typeof value !== 'string' || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) return;
  const item = rows.value.find(row => row.id === Number(value));
  await router.replace({ name: 'agent-console-my-templates', query: { ...route.query, editTemplateId: undefined } });
  if (item) openEditor(item);
}
onMounted(async () => {
  await ensureSkillRoot();
  await load();
  await openFromRoute();
});
</script>

<template>
  <PageLayout overflow="auto" padding="56px 20px 40px" mobile-padding="56px 16px 32px" :title="$t('我的模板')">
    <div class="my-templates-content">
      <h1>{{ $t('我的模板') }}</h1>
      <div class="my-templates-toolbar">
        <Skeleton v-if="loading" class="my-templates-toolbar__count-skeleton" :class="{ 'is-hidden': !showSkeleton }" width="96px" height="20px" border-radius="4px" />
        <span v-else>{{ $t('共 {count} 个模板', { count }) }}</span>
        <div class="my-templates-toolbar__actions">
          <button class="my-templates-create-button" type="button" @click="openEditor()">
            <Icon name="base/rx_ic_plus" size="16" aria-hidden="true" /> {{ $t('创建模板') }}
          </button>
        </div>
      </div>
      <template v-if="loading"><div v-if="showSkeleton" class="my-templates-grid"><TemplateSkeleton :count="6" /></div></template>
      <div v-else-if="failed" class="my-templates-state">
        <Icon name="roxy-agent/rx-ic-templates" size="32" /><strong>{{ $t('我的模板加载失败') }}</strong>
        <span>{{ $t('请检查网络连接后重试。') }}</span>
        <button class="my-templates-state__retry" type="button" @click="load">{{ $t('重试') }}</button>
      </div>
      <TransitionGroup v-else-if="rows.length" class="my-templates-grid" name="my-template-card" tag="div">
        <TemplateCard v-for="item in rows" :key="item.id" :item="item" :unread="hasUnread(unread, item)" :creating-task="creatingTask === item.id"
          :edit-disabled="editing !== undefined" :deleting="deleting.has(item.id)" :topping="topping.has(item.id)"
          @edit="openEditor" @delete="remove" @create-task="openTask" @run-in-chat="runInChat" @toggle-top="toggleTop" />
      </TransitionGroup>
      <div v-else class="my-templates-state">
        <Icon name="roxy-agent/rx-ic-templates" size="32" /><strong>{{ $t('暂无模板') }}</strong>
        <span>{{ $t('团队空间中还没有模板。') }}</span>
      </div>
    </div>
  </PageLayout>
</template>
