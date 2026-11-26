<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message, type DesktopEvent } from '../desktop';
import type { Family, KernelActions, KernelRow } from './api';

type FilterTab = 'all' | Family;

interface DownloadProgress {
  active: boolean;
  phase: string;
  message: string;
  percent: number | null;
  received: number | null;
  total: number | null;
  speed: number | null;
  version: string;
}

const { actions } = defineProps<{ actions: KernelActions }>();
const rows = ref<KernelRow[]>([]);
const loaded = ref(false);
const filterTab = ref<FilterTab>('all');
const family = ref<Family>('chromium');
const versions = ref<string[]>([]);
const historicalVersions = ref<string[]>([]);
const showHistorical = ref(false);
const version = ref('');
const custom = ref('');
const busy = ref<'read' | 'change' | 'download' | null>(null);
const checkingId = ref<string | null>(null);
const verifiedKeys = ref<Record<string, boolean>>({});
const finding = ref(false);
const cancelling = ref(false);
const error = ref('');
const catalogError = ref('');
const status = ref('');
const confirmDelete = ref<KernelRow | null>(null);
const progress = ref<DownloadProgress>({
  active: false,
  phase: '',
  message: '',
  percent: null,
  received: null,
  total: null,
  speed: null,
  version: '',
});

let active = true;
let catalogRequest = 0;
let inventoryChanged = false;
let unsubscribe: (() => void) | undefined;

const rowKey = (row: KernelRow) => row.id ?? row.path ?? `${row.engine}:${row.version}`;
const engineLabel = (engine: Family) => (engine === 'firefox' ? 'Firefox' : 'Chrome');

const chromeRows = computed(() => rows.value.filter(row => row.engine === 'chromium'));
const firefoxRows = computed(() => rows.value.filter(row => row.engine === 'firefox'));
const defaultKernel = computed(() => rows.value.find(row => row.primary) ?? rows.value[0] ?? null);
const filteredRows = computed(() => {
  if (filterTab.value === 'all') return rows.value;
  return rows.value.filter(row => row.engine === filterTab.value);
});

const showProgressCard = computed(() => busy.value === 'download' || progress.value.active);

const phaseLabel = computed(() => {
  const labels: Record<string, string> = {
    bootstrap: '准备内核',
    meta: '查询目录',
    download: '正在下载',
    extract: '正在解压',
    validate: '校验兼容',
    check: '检测中',
    canceled: '已取消',
    done: '已完成',
  };
  return labels[progress.value.phase] ?? '处理中';
});

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    'chrome-for-testing': 'Chrome for Testing',
    cft: 'Chrome for Testing',
    mozilla: 'Mozilla 官方',
    'chrome-stable': 'Google Stable',
    stable: 'Google Stable',
    custom: '本地自定义',
    bundled: '内置内核',
    wayfern: '内置内核',
    openbrowser: '内置内核',
    system: '系统浏览器',
  };
  return map[source.toLowerCase()] ?? (source || '本地内核');
}

function formatBytes(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatSpeed(speed: number | null): string {
  if (speed == null || !Number.isFinite(speed) || speed <= 0) return '';
  return `${formatBytes(speed)}/s`;
}

const progressDetailText = computed(() => {
  const parts: string[] = [];
  if (progress.value.received != null && progress.value.total != null && progress.value.total > 0) {
    parts.push(`${formatBytes(progress.value.received)} / ${formatBytes(progress.value.total)}`);
  } else if (progress.value.received != null && progress.value.received > 0) {
    parts.push(formatBytes(progress.value.received));
  }
  const speed = formatSpeed(progress.value.speed);
  if (speed) parts.push(speed);
  return parts.join(' · ');
});

watch(family, () => {
  catalogRequest += 1;
  finding.value = false;
  catalogError.value = '';
  versions.value = [];
  historicalVersions.value = [];
  showHistorical.value = false;
  version.value = '';
}, { flush: 'sync' });

async function findVersions() {
  if (finding.value) return;
  const id = ++catalogRequest;
  finding.value = true;
  catalogError.value = '';
  try {
    const result = await actions.versions(family.value);
    if (active && id === catalogRequest) {
      versions.value = result.versions;
      historicalVersions.value = result.historicalVersions;
      showHistorical.value = showHistorical.value && historicalVersions.value.length > 0;
      if (!versions.value.includes(version.value) &&
        !(showHistorical.value && historicalVersions.value.includes(version.value))) {
        version.value = versions.value[0] ?? '';
      }
      if (!versions.value.length) catalogError.value = '没有可下载的版本';
    }
  } catch (failure) {
    if (active && id === catalogRequest) catalogError.value = message(failure);
  } finally {
    if (active && id === catalogRequest) finding.value = false;
  }
}

function toggleHistorical() {
  showHistorical.value = !showHistorical.value;
  if (!showHistorical.value && historicalVersions.value.includes(version.value)) {
    version.value = versions.value[0] ?? '';
  }
}

async function load() {
  const result = await actions.list();
  if (!active) return;
  rows.value = result;
  loaded.value = true;
}

function resetProgress() {
  progress.value = {
    active: false,
    phase: '',
    message: '',
    percent: null,
    received: null,
    total: null,
    speed: null,
    version: '',
  };
}

async function run(kind: NonNullable<typeof busy.value>, operation: () => Promise<unknown>) {
  if (!active || busy.value) return;
  busy.value = kind;
  error.value = '';
  if (kind !== 'read') status.value = '';
  if (kind === 'download') {
    progress.value = {
      active: true,
      phase: 'bootstrap',
      message: '正在准备下载任务…',
      percent: null,
      received: null,
      total: null,
      speed: null,
      version: '',
    };
  }
  try {
    await operation();
  } catch (failure) {
    if (active) error.value = message(failure);
  } finally {
    if (active) {
      if (kind === 'download') resetProgress();
      busy.value = null;
      refreshAfterEvent();
    }
  }
}

function refreshAfterEvent() {
  if (!inventoryChanged || busy.value) return;
  inventoryChanged = false;
  void run('read', load);
}

function change(kind: 'change' | 'download', operation: () => Promise<unknown>, success: string) {
  return run(kind, async () => {
    await operation();
    if (!active) return;
    status.value = success;
    await load();
  });
}

function choose() {
  return run('change', async () => {
    const result = await actions.choose();
    if (!active || result.canceled) return;
    status.value = '已添加本地内核';
    await load();
  });
}

async function cancel() {
  if (cancelling.value) return;
  cancelling.value = true;
  try {
    const result = await actions.cancel();
    if (active) status.value = result.canceled ? '已请求取消下载' : '当前没有正在进行的下载';
  } catch (failure) {
    if (active) error.value = message(failure);
  } finally {
    if (active) cancelling.value = false;
  }
}

function check(row: KernelRow) {
  const key = rowKey(row);
  return run('change', async () => {
    checkingId.value = key;
    try {
      const result = await actions.check(row.engine, row.version);
      if (active) {
        verifiedKeys.value = { ...verifiedKeys.value, [key]: true };
        status.value = `${result.version ?? row.version} 内核检测通过`;
      }
    } finally {
      if (active) checkingId.value = null;
    }
  });
}

function remove(row: KernelRow) {
  return change('change', async () => {
    await actions.remove(row.engine, row.version);
    if (active) confirmDelete.value = null;
  }, `已删除 ${row.version}`);
}

function handleKernelEvent(event: DesktopEvent) {
  if (!active || !['kernel-progress', 'kernel-status', 'kernel-ready'].includes(event.type ?? '')) return;

  const phase = event.phase ?? '';
  const activePhases = ['bootstrap', 'meta', 'download', 'extract', 'validate'];
  const terminalPhases = ['installed', 'done', 'deleted', 'canceled'];

  if (event.type === 'kernel-progress' && activePhases.includes(phase)) {
    const nextPercent = typeof event.percent === 'number' && Number.isFinite(event.percent)
      ? Math.max(0, Math.min(100, Math.round(event.percent)))
      : (phase === 'download' ? progress.value.percent : null);
    progress.value = {
      active: true,
      phase,
      message: event.message || progress.value.message,
      percent: nextPercent,
      received: typeof event.received === 'number' ? event.received : (phase === 'download' ? progress.value.received : null),
      total: typeof event.total === 'number' ? event.total : (phase === 'download' ? progress.value.total : null),
      speed: typeof event.speed === 'number' ? event.speed : (phase === 'download' ? progress.value.speed : null),
      version: event.version || progress.value.version,
    };
  } else if (event.type === 'kernel-ready' || terminalPhases.includes(phase)) {
    resetProgress();
  }

  if (event.message) status.value = event.message;
  if (event.type === 'kernel-ready' || ['installed', 'done', 'deleted'].includes(phase)) {
    inventoryChanged = true;
    refreshAfterEvent();
  }
}

onMounted(() => {
  unsubscribe = actions.subscribe(handleKernelEvent);
  void run('read', load);
});
onBeforeUnmount(() => { active = false; unsubscribe?.(); });
</script>

<template>
  <section class="kernel-page" aria-labelledby="kernel-title">
    <header class="km-header">
      <div class="km-header-main">
        <div class="km-header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
          </svg>
        </div>
        <div class="km-header-copy">
          <h1 id="kernel-title">内核管理</h1>
          <p class="km-subtitle">统一管理本地 Chrome / Firefox 独立浏览器内核、设置默认版本或导入本机可执行程序</p>
        </div>
      </div>
      <div class="km-header-actions">
        <button type="button" class="km-btn km-btn-secondary" :disabled="!!busy" @click="run('read', load)">
          <svg class="km-btn-icon" :class="{ 'is-spinning': busy === 'read' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <span>刷新</span>
        </button>
        <button type="button" class="km-btn km-btn-primary" :disabled="!!busy" @click="change('download', actions.download, 'Chrome 内核已就绪')">
          <svg class="km-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>下载 Chrome Stable</span>
        </button>
      </div>
    </header>

    <section class="km-summary-grid" aria-label="内核概览">
      <article class="km-summary-card km-summary-default">
        <div class="km-summary-label">当前默认内核</div>
        <div v-if="defaultKernel" class="km-summary-content">
          <span class="km-mini-badge" :class="defaultKernel.engine === 'firefox' ? 'is-firefox' : 'is-chrome'" aria-hidden="true">
            <svg v-if="defaultKernel.engine === 'firefox'" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9.5" fill="url(#km-ff-mini)" />
              <path d="M16.8 8.3c-1.1-1.7-3-2.5-5-2.2-2.7.4-4.7 2.8-4.5 5.6.2 2.9 2.7 5.1 5.6 4.9 2.3-.1 4.2-1.7 4.7-3.9-.8 1-2.1 1.5-3.4 1.3-1.8-.3-3-2-2.7-3.8.2-1.2 1-2.1 2.1-2.4-.2 1.1.4 2.2 1.4 2.6.9.3 1.9-.1 2.3-1 .1-.3.1-.7-.5-1.1Z" fill="#fff" fill-opacity=".92" />
              <defs>
                <linearGradient id="km-ff-mini" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#ff9400" />
                  <stop offset=".55" stop-color="#ff3b5c" />
                  <stop offset="1" stop-color="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9.5" fill="#fbbc05" />
              <path d="M12 2.5A9.5 9.5 0 0 1 20.23 7.25H12a4.75 4.75 0 0 0-4.11 2.38L3.77 7.25A9.5 9.5 0 0 1 12 2.5Z" fill="#ea4335" />
              <path d="M3.77 7.25 7.89 14.38A4.75 4.75 0 0 0 12 16.75l-4.11 4.13A9.5 9.5 0 0 1 3.77 7.25Z" fill="#34a853" />
              <path d="M12 16.75A4.75 4.75 0 0 0 16.11 14.38L12 21.5a9.5 9.5 0 0 1-4.11-.62L12 16.75Z" fill="#34a853" />
              <circle cx="12" cy="12" r="4.6" fill="#ffffff" />
              <circle cx="12" cy="12" r="3.4" fill="#1a73e8" />
            </svg>
          </span>
          <div class="km-summary-text">
            <strong class="km-summary-value">{{ engineLabel(defaultKernel.engine) }} {{ defaultKernel.version }}</strong>
            <span class="km-summary-meta">{{ sourceLabel(defaultKernel.source) }}</span>
          </div>
        </div>
        <div v-else class="km-summary-empty">尚未安装内核</div>
      </article>

      <article class="km-summary-card">
        <div class="km-summary-label">已安装 Chrome</div>
        <div class="km-summary-stat-row">
          <strong class="km-summary-number">{{ chromeRows.length }}</strong>
          <span class="km-summary-unit">个版本</span>
          <span v-if="chromeRows.length" class="km-summary-pill">最新 {{ chromeRows[0].version.split('.')[0] }}</span>
        </div>
      </article>

      <article class="km-summary-card">
        <div class="km-summary-label">已安装 Firefox</div>
        <div class="km-summary-stat-row">
          <strong class="km-summary-number">{{ firefoxRows.length }}</strong>
          <span class="km-summary-unit">个版本</span>
          <span v-if="firefoxRows.length" class="km-summary-pill">最新 {{ firefoxRows[0].version.split('.')[0] }}</span>
        </div>
      </article>
    </section>

    <section v-if="showProgressCard" class="km-progress-card" role="status" aria-live="polite">
      <div class="km-progress-top">
        <div class="km-progress-info">
          <span class="km-phase-pill">{{ phaseLabel }}</span>
          <span class="km-progress-message">{{ progress.message || '正在下载浏览器内核…' }}</span>
        </div>
        <div class="km-progress-right">
          <span v-if="progressDetailText" class="km-progress-detail">{{ progressDetailText }}</span>
          <span v-if="progress.percent != null" class="km-progress-percent">{{ progress.percent }}%</span>
          <button type="button" class="km-btn km-btn-ghost-danger km-btn-sm" :disabled="cancelling" @click="cancel">
            取消下载
          </button>
        </div>
      </div>
      <div class="km-progress-track" aria-hidden="true">
        <div
          class="km-progress-fill"
          :class="{ 'is-indeterminate': progress.percent == null }"
          :style="progress.percent != null ? { width: `${progress.percent}%` } : undefined"
        />
      </div>
    </section>

    <div v-if="error" class="km-banner km-banner-error" role="alert">
      <svg class="km-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span class="km-banner-text">{{ error }}</span>
      <button type="button" class="km-banner-close" aria-label="关闭提示" @click="error = ''">×</button>
    </div>

    <div v-else-if="status && !showProgressCard" class="km-banner km-banner-status" role="status">
      <svg class="km-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <span class="km-banner-text">{{ status }}</span>
      <button type="button" class="km-banner-close" aria-label="关闭提示" @click="status = ''">×</button>
    </div>

    <section class="km-card km-installed-section" aria-labelledby="installed-title" :aria-busy="!!busy">
      <div class="km-card-header">
        <div class="km-card-title-group">
          <h2 id="installed-title">已安装内核</h2>
          <span class="km-count-badge">{{ rows.length }}</span>
        </div>
        <div class="km-segmented" role="tablist" aria-label="按内核类型筛选">
          <button
            type="button"
            role="tab"
            class="km-segment-btn"
            :class="{ 'is-active': filterTab === 'all' }"
            :aria-selected="filterTab === 'all'"
            @click="filterTab = 'all'"
          >
            全部 <span>{{ rows.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="km-segment-btn"
            :class="{ 'is-active': filterTab === 'chromium' }"
            :aria-selected="filterTab === 'chromium'"
            @click="filterTab = 'chromium'"
          >
            Chrome <span>{{ chromeRows.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="km-segment-btn"
            :class="{ 'is-active': filterTab === 'firefox' }"
            :aria-selected="filterTab === 'firefox'"
            @click="filterTab = 'firefox'"
          >
            Firefox <span>{{ firefoxRows.length }}</span>
          </button>
        </div>
      </div>

      <div v-if="!loaded && !error" class="km-empty-state" role="status">
        <div class="km-spinner" aria-hidden="true" />
        <p>正在读取内核列表…</p>
      </div>

      <div v-else-if="loaded && !rows.length" class="km-empty-state">
        <div class="km-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M8 21h8M12 18v3" />
          </svg>
        </div>
        <p class="km-empty-title">尚无可用内核。请下载内核，或选择本地可执行文件。</p>
        <div class="km-empty-actions">
          <button type="button" class="km-btn km-btn-primary km-btn-sm" :disabled="!!busy" @click="change('download', actions.download, 'Chrome 内核已就绪')">
            立即下载 Chrome Stable
          </button>
          <button type="button" class="km-btn km-btn-secondary km-btn-sm" :disabled="!!busy" @click="choose">
            选择本地可执行文件
          </button>
        </div>
      </div>

      <div v-else-if="rows.length && !filteredRows.length" class="km-empty-state km-empty-compact">
        <p>当前引擎分类下暂无已安装内核</p>
      </div>

      <ul v-else class="km-list">
        <li
          v-for="row in filteredRows"
          :key="rowKey(row)"
          class="km-row"
          :class="{ 'is-primary': row.primary, 'is-confirming': confirmDelete === row }"
        >
          <div class="km-row-main">
            <div class="km-engine-icon" :class="row.engine === 'firefox' ? 'is-firefox' : 'is-chrome'" aria-hidden="true">
              <svg v-if="row.engine === 'firefox'" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9.5" fill="url(#km-ff-row)" />
                <path d="M16.8 8.3c-1.1-1.7-3-2.5-5-2.2-2.7.4-4.7 2.8-4.5 5.6.2 2.9 2.7 5.1 5.6 4.9 2.3-.1 4.2-1.7 4.7-3.9-.8 1-2.1 1.5-3.4 1.3-1.8-.3-3-2-2.7-3.8.2-1.2 1-2.1 2.1-2.4-.2 1.1.4 2.2 1.4 2.6.9.3 1.9-.1 2.3-1 .1-.3.1-.7-.5-1.1Z" fill="#fff" fill-opacity=".92" />
                <defs>
                  <linearGradient id="km-ff-row" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#ff9400" />
                    <stop offset=".55" stop-color="#ff3b5c" />
                    <stop offset="1" stop-color="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9.5" fill="#fbbc05" />
                <path d="M12 2.5A9.5 9.5 0 0 1 20.23 7.25H12a4.75 4.75 0 0 0-4.11 2.38L3.77 7.25A9.5 9.5 0 0 1 12 2.5Z" fill="#ea4335" />
                <path d="M3.77 7.25 7.89 14.38A4.75 4.75 0 0 0 12 16.75l-4.11 4.13A9.5 9.5 0 0 1 3.77 7.25Z" fill="#34a853" />
                <path d="M12 16.75A4.75 4.75 0 0 0 16.11 14.38L12 21.5a9.5 9.5 0 0 1-4.11-.62L12 16.75Z" fill="#34a853" />
                <circle cx="12" cy="12" r="4.6" fill="#ffffff" />
                <circle cx="12" cy="12" r="3.4" fill="#1a73e8" />
              </svg>
            </div>
            <div class="km-row-info">
              <div class="km-row-headline">
                <strong class="km-row-name">{{ engineLabel(row.engine) }} {{ row.version }}</strong>
                <span v-if="row.primary" class="km-tag km-tag-primary">默认内核</span>
                <span class="km-tag km-tag-neutral">{{ sourceLabel(row.source) }}</span>
                <span v-if="verifiedKeys[rowKey(row)]" class="km-tag km-tag-success">检测通过</span>
              </div>
              <div v-if="row.path" class="km-row-path" :title="row.path">{{ row.path }}</div>
            </div>
          </div>

          <div v-if="confirmDelete === row" class="km-confirm-bar">
            <span class="km-confirm-text">确认删除此版本？</span>
            <button type="button" class="km-btn km-btn-secondary km-btn-sm" :disabled="!!busy" @click="confirmDelete = null">取消</button>
            <button type="button" class="km-btn km-btn-danger km-btn-sm" :disabled="!!busy" @click="remove(row)">确认删除</button>
          </div>

          <div v-else class="km-row-actions">
            <button
              type="button"
              class="km-btn km-btn-secondary km-btn-sm"
              :disabled="!!busy"
              :aria-busy="checkingId === rowKey(row) || undefined"
              @click="check(row)"
            >
              <span v-if="checkingId === rowKey(row)" class="km-btn-spinner" aria-hidden="true" />
              <span>检测</span>
            </button>
            <button
              type="button"
              class="km-btn km-btn-secondary km-btn-sm"
              :disabled="!!busy || row.primary"
              @click="change('change', () => actions.pin(row.engine, row.version), '默认内核已更新')"
            >
              设为默认
            </button>
            <button
              type="button"
              class="km-btn km-btn-ghost-danger km-btn-sm"
              :disabled="!!busy || row.primary"
              :title="row.primary ? '默认内核不可删除，请先切换默认版本' : '删除此内核'"
              @click="confirmDelete = row"
            >
              删除
            </button>
          </div>
        </li>
      </ul>
    </section>

    <div class="km-acquire-grid">
      <section class="km-card" aria-labelledby="download-title">
        <div class="km-card-header km-card-header-stack">
          <h2 id="download-title">下载内核</h2>
          <p class="km-card-desc">从官方发布目录拉取指定版本的 Chrome 或 Firefox 独立内核并自动校验安装</p>
        </div>

        <div class="km-form-body">
          <div class="km-field-row">
            <div class="km-field km-field-engine">
              <label class="km-field-label" for="km-family-select">内核引擎</label>
              <div class="km-select-wrap">
                <select id="km-family-select" v-model="family" class="km-select" aria-label="内核类型" :disabled="busy === 'download'">
                  <option value="chromium">Chrome</option>
                  <option value="firefox">Firefox</option>
                </select>
              </div>
            </div>
            <div class="km-field-action-align">
              <button
                type="button"
                class="km-btn km-btn-secondary"
                :disabled="finding || !!busy"
                :aria-busy="finding || undefined"
                @click="findVersions"
              >
                <span v-if="finding" class="km-btn-spinner" aria-hidden="true" />
                <span>获取可下载版本</span>
              </button>
            </div>
          </div>

          <div class="km-field-row">
            <div class="km-field km-field-version">
              <label class="km-field-label" for="km-version-select">目标版本</label>
              <div class="km-select-wrap" :class="{ 'is-empty': !versions.length }">
                <select
                  id="km-version-select"
                  v-model="version"
                  class="km-select"
                  aria-label="内核版本"
                  :disabled="finding || !!busy || !versions.length"
                >
                  <option v-for="value in versions" :key="value" :value="value">{{ value }}</option>
                  <optgroup v-if="showHistorical" label="历史版本">
                    <option v-for="value in historicalVersions" :key="value" :value="value">{{ value }}</option>
                  </optgroup>
                </select>
                <span v-if="!versions.length" class="km-select-placeholder" aria-hidden="true">
                  {{ finding ? '正在加载官方版本目录…' : '请先获取可下载版本' }}
                </span>
              </div>
            </div>
            <div class="km-field-action-align">
              <button
                type="button"
                class="km-btn km-btn-primary"
                :disabled="!!busy || finding || !version"
                @click="change('download', () => actions.install(family, version), '所选内核已安装')"
              >
                安装所选版本
              </button>
            </div>
          </div>

          <div v-if="historicalVersions.length || versions.length" class="km-catalog-meta">
            <span v-if="versions.length" class="km-meta-hint">已加载 {{ versions.length }} 个近期版本</span>
            <button
              v-if="historicalVersions.length"
              type="button"
              class="km-link-btn"
              :disabled="finding || !!busy"
              :aria-expanded="showHistorical"
              @click="toggleHistorical"
            >
              {{ showHistorical ? '收起历史版本' : `显示历史版本（${historicalVersions.length}）` }}
            </button>
          </div>

          <p v-if="catalogError" class="km-inline-alert" role="alert">{{ catalogError }}</p>
        </div>
      </section>

      <section class="km-card" aria-labelledby="local-title">
        <div class="km-card-header km-card-header-stack">
          <h2 id="local-title">添加本地可执行文件</h2>
          <p class="km-card-desc">选择本机已安装的 Chrome / Firefox 可执行程序快速注册</p>
        </div>

        <div class="km-form-body">
          <div class="km-field">
            <label class="km-field-label" for="km-custom-path">可执行文件路径</label>
            <input
              id="km-custom-path"
              v-model="custom"
              class="km-input"
              aria-label="内核路径"
              placeholder="选择或输入 Chrome / Firefox 可执行文件路径"
            />
          </div>
          <div class="km-local-actions">
            <button type="button" class="km-btn km-btn-secondary" :disabled="!!busy" @click="choose">选择文件</button>
            <button
              type="button"
              class="km-btn km-btn-primary"
              :disabled="!!busy || !custom.trim()"
              @click="change('change', () => actions.setCustom(custom.trim()), '已添加本地内核')"
            >
              使用此内核
            </button>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
