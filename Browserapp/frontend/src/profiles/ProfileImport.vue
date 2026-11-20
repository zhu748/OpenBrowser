<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue';
import { message, request } from '../desktop';

interface ImportRow extends Record<string, unknown> {
  rowNum: number;
  windowName: string;
  os: string;
  coreType?: string;
  coreVersion?: string;
}
interface Preview { fileName: string; excelData: ImportRow[]; count: number }

const preview = shallowRef<Preview | null>(null);
const busy = ref<'pick' | 'save' | null>(null);
const error = ref('');
const success = ref('');
let alive = true;

async function choose() {
  if (busy.value) return;
  busy.value = 'pick';
  error.value = '';
  success.value = '';
  try {
    const file = await request<Preview | null>('profiles:read-import');
    if (alive && file) preview.value = file;
  } catch (failure) {
    if (alive) { preview.value = null; error.value = message(failure); }
  } finally { if (alive) busy.value = null; }
}

async function save() {
  const file = preview.value;
  if (!file || busy.value) return;
  busy.value = 'save';
  error.value = '';
  try {
    const { successCount } = await request<{ successCount: number }>('profiles:import', {
      fileName: file.fileName, excelData: file.excelData,
    });
    if (alive) {
      preview.value = null;
      success.value = `已导入 ${successCount} 个窗口`;
    }
  } catch (failure) {
    if (alive) error.value = message(failure);
  } finally { if (alive) busy.value = null; }
}

onBeforeUnmount(() => { alive = false; });
</script>

<template>
  <section class="workspace-page" aria-labelledby="import-title">
    <header class="page-header">
      <h1 id="import-title">导入窗口</h1>
      <a href="#/profiles">返回窗口</a>
    </header>
    <p v-if="error" class="callout danger" role="alert">{{ error }}</p>
    <p v-if="success" class="callout" role="status">{{ success }}</p>
    <div class="panel import-controls">
      <div class="toolbar">
        <button class="primary" type="button" :disabled="!!busy" @click="choose">选择 TXT / XLSX 文件</button>
        <button v-if="preview" type="button" :disabled="!!busy" @click="save">确认导入</button>
      </div>
      <p v-if="busy" role="status">{{ busy === 'pick' ? '等待选择或验证文件…' : '正在保存窗口…' }}</p>
      <details v-else>
        <summary>查看文件格式</summary>
        <p>每次最多导入 200 个窗口，文件不超过 5 MiB。</p>
        <p>TXT 使用 <code>windowName=名称</code> 和 <code>os=Linux</code> 等字段，每个窗口用单独一行 <code>####</code> 分隔。</p>
        <p>XLSX 首行需要 <code>windowName</code> 和 <code>os</code> 列，或对应的「窗口名称」「操作系统」。可添加 <code>coreType</code>、<code>coreVersion</code> 和 <code>windowRemark</code>。</p>
      </details>
    </div>
    <section v-if="preview" class="panel" aria-labelledby="preview-title">
      <h2 id="preview-title" class="import-title">{{ preview.fileName }} · {{ preview.count }} 个窗口待导入</h2>
      <div class="table-scroll">
        <table class="profiles-table">
          <thead><tr><th>行号</th><th>窗口名称</th><th>操作系统</th><th>浏览器内核</th></tr></thead>
          <tbody>
            <tr v-for="(row, index) in preview.excelData" :key="index">
              <td>{{ row.rowNum }}</td><th scope="row">{{ row.windowName }}</th><td>{{ row.os }}</td>
              <td>{{ row.coreType || 'Chrome' }} · {{ row.coreVersion || '自动' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
