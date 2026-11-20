<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { N as useAgentApi, sn as useLocale } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useDialog } from './usedialog-Dh0xp3r7.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { C as creationBody, D as templateKind, G as officialPrompt, J as serializeParams, O as readTemplate, T as indexInstalled,
  U as templateCard, W as localizedLabel, b as markRead, k as readPage, q as readList, t as TemplateDialog, x as markUnread } from './CreateTemplateDialog-Bpq9OLTG.js';
import { d as defaultParams, m as parseOptions, u as optionsSchema } from './ScriptSchemaForm-z_48GvPJ.js';
import { t as PageLayout } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { t as SelectButton } from './rx-select-button-DQtmZ0kT.js';
import { n as showSkeletonAfterDelay, t as useTaskExecution } from './useTemplateTaskExecution-yGKXS9Rw.js';
import { n as useTaskDialog } from './useCustomTemplateDialog-2nSs2D8n.js';
import TemplateCard from './workbench-store-template-card.js';
import TemplateSkeleton from './workbench-store-template-skeleton.js';
import FilterSkeleton from './workbench-store-filter-skeleton.js';

const prompt = defineModel('prompt', { required: true });
const api = useAgentApi();
const locale = useLocale();
const theme = useTheme();
const route = useRoute();
const router = useRouter();
const dialog = useDialog();
const [showSuccess, showError] = useNotice();
const { openCreateTaskDialog } = useTaskDialog();
const { executeTemplateTask, findTaskByUserTemplateId } = useTaskExecution(prompt);

const dark = computed(() => theme.realTheme === 'dark');
const background = computed(() => dark.value ? '/images/agent-console/template-store-bg-dark.png' : '/images/agent-console/template-store-bg-light.svg');
const cacheKey = 'agent-console:template-label-catalog:v1';
const cached = readCatalog();
const categories = ref(cached?.categories ?? []);
const labels = ref(cached?.labels ?? []);
const officials = ref([]);
const installed = ref([]);
const selections = reactive({});
const busy = reactive({});
const catalogLoading = ref(!cached);
const templatesLoading = ref(true);
const catalogFailed = ref(false);
const templatesFailed = ref(false);
const showSkeleton = showSkeletonAfterDelay(computed(() => catalogLoading.value || templatesLoading.value));
const hideBanner = ref(false);
let readyCatalog = Boolean(cached);
let loadRequest = 0;
let lastScroll = 0;

const cards = computed(() => officials.value.map(template => templateCard(template, locale.currentLocale)));
const installedById = computed(() => indexInstalled(installed.value));
const filters = computed(() => categories.value.map(category => {
  const title = localizedLabel(category.name, locale.currentLocale) || category.slug;
  return {
    id: category.id, label: category.slug === 'platform' || title === $t('平台') ? $t('账号平台') : title,
    options: [{ label: $t('全部'), value: 'all' }, ...labels.value.filter(label => label.categoryId === category.id)
      .map(label => ({ label: localizedLabel(label.name, locale.currentLocale) || label.slug, value: label.id }))],
  };
}));
const labelIds = computed(() => categories.value.map(category => selections[category.id]).filter(value => typeof value === 'number'));

function isRecord(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function isCategory(category) {
  return isRecord(category) && Number.isFinite(category.id) && typeof category.slug === 'string'
    && 'name' in category && Number.isFinite(category.sortOrder) && Number.isFinite(category.enabled);
}
function isLabel(label) {
  return isCategory(label) && Number.isFinite(label.categoryId) && isCategory(label.category) && (typeof label.color === 'string' || label.color === null);
}
function readCatalog() {
  try {
    const value = JSON.parse(localStorage.getItem(cacheKey));
    if (value?.version === 1 && Number.isFinite(value.updatedAt) && value.updatedAt >= 0
      && Array.isArray(value.categories) && value.categories.every(isCategory)
      && Array.isArray(value.labels) && value.labels.every(isLabel)) return value;
  } catch { return undefined; }
}
function cacheCatalog() {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ version: 1, categories: categories.value, labels: labels.value, updatedAt: Date.now() }));
  } catch { /* Storage is optional. */ }
}
function validateFilters() {
  let changed = false;
  const ids = new Set(categories.value.map(category => category.id));
  for (const id of Object.keys(selections)) {
    if (!ids.has(Number(id))) {
      if (typeof selections[id] === 'number') changed = true;
      delete selections[id];
    }
  }
  for (const { id } of categories.value) {
    const selected = selections[id];
    if (selected === undefined) selections[id] = 'all';
    else if (typeof selected === 'number' && !labels.value.some(label => label.id === selected && label.categoryId === id)) {
      selections[id] = 'all';
      changed = true;
    }
  }
  return changed;
}
validateFilters();

async function loadTemplates() {
  const ticket = ++loadRequest;
  templatesLoading.value = true;
  templatesFailed.value = false;
  try {
    const params = { ...(labelIds.value.length ? { labelIds: labelIds.value } : {}), prioritizeTopped: false };
    const result = readList(await api.templates.listOfficialTemplates(params, { paramsSerializer: serializeParams }), $t('加载官方模板失败'));
    if (ticket === loadRequest) officials.value = result;
  } catch (error) {
    if (ticket !== loadRequest) return;
    console.error('Failed to load official templates', error);
    officials.value = [];
    templatesFailed.value = true;
  } finally {
    if (ticket === loadRequest) templatesLoading.value = false;
  }
}
async function loadCatalog() {
  if (!readyCatalog) catalogLoading.value = true;
  catalogFailed.value = false;
  try {
    const [categoryList, labelList] = await Promise.all([api.templates.listTemplateLabelCategories(), api.templates.listTemplateLabels({})]);
    const availableCategories = readList(categoryList, $t('加载标签分类失败'));
    const availableLabels = readList(labelList, $t('加载模板标签失败'));
    categories.value = availableCategories;
    labels.value = availableLabels;
    readyCatalog = true;
    cacheCatalog();
    if (validateFilters()) await loadTemplates();
  } catch (error) {
    console.error('Failed to load template label catalog', error);
    if (!readyCatalog) {
      catalogFailed.value = true;
      categories.value = [];
      labels.value = [];
    }
  } finally { catalogLoading.value = false; }
}
async function loadInstalled() {
  const entries = [];
  try {
    let total;
    do {
      const page = readPage(await api.userTemplates.listUserTemplates({ limit: 200, offset: entries.length, sortBy: 'updated_at', sortOrder: 'desc' }),
        $t('加载已获取模板失败'));
      entries.push(...page.items);
      if (!page.items.length) break;
      total = page.total;
    } while (entries.length < total);
    installed.value = entries;
  } catch (error) {
    console.error('Failed to load installed templates', error);
  }
}
function filter(id, value) {
  selections[id] = typeof value === 'number' ? value : 'all';
  void loadTemplates();
}
function runTask(template) {
  return openCreateTaskDialog({ id: template.id, kind: templateKind(template.templateType), name: template.name },
    { onCreated: task => executeTemplateTask(task, template) });
}
async function acquire(id, params, run) {
  busy[id] = run ? 'run' : 'get';
  try {
    const template = readTemplate(await api.userTemplates.createUserTemplate(params), $t('获取模板失败'));
    markUnread(template);
    installed.value = [template, ...installed.value];
    showSuccess(0, $t('模板已添加，点击查看详情'), {
      onClick: () => router.push({ name: 'agent-console-my-templates', query: { ...route.query, editTemplateId: String(template.id) } }),
    });
    if (run) {
      markRead(template);
      window.setTimeout(() => runTask(template));
    }
    return true;
  } catch (error) {
    console.error('Failed to create official user template', error);
    showError(-1, error instanceof Error ? error.message : $t('获取模板失败'));
    return false;
  } finally { delete busy[id]; }
}
function showAcquisition(template, run) {
  const id = template.id;
  busy[id] = run ? 'run' : 'get';
  const clear = () => { delete busy[id]; };
  dialog.open(TemplateDialog, {
    props: {
      modal: true, blockScroll: true, dismissableMask: false, draggable: false, showHeader: false,
      style: { width: 'min(540px, calc(100vw - 32px))' },
      pt: { root: 'agent-console-dialog agent-console-create-template-dialog', content: '!p-0 !overflow-hidden' },
    },
    data: { officialTemplate: template, lockSource: true, submitMode: run ? 'run' : 'save', onCancel: clear,
      onSave: form => acquire(id, creationBody(form), form.saveAndRun) },
    onClose: clear,
  });
}
function missingRequired(schema, values) {
  if (!isRecord(schema)) return false;
  const required = Array.isArray(schema.required) ? schema.required : [];
  if (required.some(key => typeof key === 'string' && key !== 'debug' && (!isRecord(values) || values[key] == null
    || (typeof values[key] === 'string' && !values[key].trim()) || (Array.isArray(values[key]) && !values[key].length)))) return true;
  return isRecord(values) && isRecord(schema.properties) && Object.entries(schema.properties)
    .some(([key, field]) => key !== 'debug' && key in values && missingRequired(field, values[key]));
}
function acquireOptions(template) {
  const params = { official_template_id: template.id };
  if (template.templateType === 'prompt') return officialPrompt(template, locale.currentLocale).trim() ? params : undefined;
  if (template.templateType !== 'script') return params;
  try {
    const options = parseOptions(template.metadata.optionsSchema);
    const fields = options ? defaultParams(options) : {};
    if (options && missingRequired(optionsSchema(options), fields)) return undefined;
    return { ...params, metadata: { params: fields } };
  } catch { return undefined; }
}
async function selectTemplate(id, run = false) {
  if (busy[id]) return;
  const local = run && installedById.value.get(id);
  if (local) {
    busy[id] = 'run';
    try {
      const task = await findTaskByUserTemplateId(local.id);
      if (task) await executeTemplateTask(task, local);
      else await runTask(local);
    } catch (error) {
      console.error('Failed to prepare installed template task', error);
      showError(-1, error instanceof Error ? error.message : $t('加载任务失败'));
    } finally { delete busy[id]; }
    return;
  }
  const template = officials.value.find(template => template.id === id);
  if (!template) return showError(-1, $t('官方模板不存在或已下架'));
  const params = acquireOptions(template);
  if (params) await acquire(id, params, run);
  else showAcquisition(template, run);
}
function scroll(event) {
  const element = event.target;
  if (!(element instanceof HTMLElement) || !element.matches('[data-agent-page-scroll]')) return;
  const delta = element.scrollTop - lastScroll;
  if (element.scrollTop <= 0) hideBanner.value = false;
  else if (Math.abs(delta) >= 4) hideBanner.value = delta > 0;
  lastScroll = element.scrollTop;
}
onMounted(() => Promise.all([loadCatalog(), loadTemplates(), loadInstalled()]));
</script>

<template>
  <PageLayout class="template-store-workspace" :class="{ 'template-store-workspace--dark': dark }" overflow="auto"
    padding="0" mobile-padding="0" :style="{ backgroundImage: 'url(' + background + ')' }" :title="$t('模板商城')" @scroll="scroll">
    <template #overlay>
      <div v-if="!catalogLoading && !catalogFailed" class="template-store-floating-banner"
        :class="{ 'template-store-floating-banner--hidden': hideBanner }" :aria-hidden="hideBanner"></div>
    </template>
    <section class="template-store-panel">
      <div class="template-store-content">
        <h1>{{ $t('模板商城') }}</h1>
        <template v-if="catalogLoading">
          <template v-if="showSkeleton">
            <FilterSkeleton />
            <div class="template-store-grid"><TemplateSkeleton :count="6" /></div>
          </template>
        </template>
        <div v-else-if="catalogFailed" class="template-store-state">
          <Icon name="roxy-agent/rx-ic-templates" size="32" />
          <strong>{{ $t('模板商城加载失败') }}</strong><span>{{ $t('请检查网络连接后重试。') }}</span>
          <button class="template-store-state__retry" type="button" @click="loadCatalog">{{ $t('重试') }}</button>
        </div>
        <template v-else>
          <div v-if="filters.length" class="template-store-filters">
            <section v-for="group in filters" :key="group.id" class="template-store-filter" :aria-labelledby="'template-filter-' + group.id">
              <h2 :id="'template-filter-' + group.id">{{ group.label }}</h2>
              <SelectButton :model-value="selections[group.id] ?? 'all'" class="template-store-filter__control" :options="group.options"
                option-label="label" option-value="value" data-key="value" size="lg" :disabled="templatesLoading"
                :aria-labelledby="'template-filter-' + group.id" @update:model-value="filter(group.id, $event)" />
            </section>
          </div>
          <template v-if="templatesLoading">
            <div v-if="showSkeleton" class="template-store-grid"><TemplateSkeleton :count="Math.min(9, Math.max(3, cards.length))" /></div>
          </template>
          <div v-else-if="templatesFailed" class="template-store-state template-store-state--compact">
            <Icon name="roxy-agent/rx-ic-templates" size="32" />
            <strong>{{ $t('官方模板加载失败') }}</strong><span>{{ $t('请稍后重试。') }}</span>
            <button class="template-store-state__retry" type="button" @click="loadTemplates">{{ $t('重试') }}</button>
          </div>
          <div v-else-if="cards.length" class="template-store-grid">
            <TemplateCard v-for="card in cards" :key="card.id" :item="card" :installed="installedById.has(card.id)"
              :busy-action="busy[card.id]" @get="selectTemplate($event)" @run="selectTemplate($event, true)" />
          </div>
          <div v-else class="template-store-state template-store-state--compact">
            <Icon name="roxy-agent/rx-ic-templates" size="32" />
            <strong>{{ $t(labelIds.length ? '没有找到匹配的模板' : '暂无官方模板') }}</strong>
            <span v-if="labelIds.length">{{ $t('请尝试选择其他标签。') }}</span>
          </div>
        </template>
      </div>
    </section>
  </PageLayout>
</template>
