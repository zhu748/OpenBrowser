<script setup>
import { computed } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { t as AgentInput } from './AgentInput-CVahkFed.js';
import { a as AgentSelect, o as Field, t as ParameterForm } from './ScriptSchemaForm-z_48GvPJ.js';
import { u as Markdown, TemplateDialogSkeleton } from './CreateTemplateDialog-Bpq9OLTG.js';
import ChatComposer from './workbench-chat-composer.js';
import { useTemplateDialog } from './workbench-agent-template-dialog-state.js';

const {
  options, locale, kind, name, prompt, selectedSource, uploaded, parameterDraft, showValidation, schemaError, loadingSources, loadingDetail,
  detailError, uploading, dragging, saving, skillInput, editing, readonly, lockedSource, showSourceSkeleton, canSave, kinds, sourceOptions,
  selectedOfficial, metadata, sourceLabel, errorMessage, detailDescription, schema, updateParameters, retryDetail, cannotChangeKind,
  changeKind, openScriptUpload, onSkillChange, dragEnter, dragLeave, dragOver, dropSkill, close, save,
} = useTemplateDialog();
const sourcePlaceholder = computed(() => {
  if (kind.value === 'script' && !selectedSource.value) return $t('上传本地脚本');
  if (loadingSources.value) return $t('正在加载官方模板...');
  return $t(kind.value === 'script' ? '请选择官方脚本模板' : '请选择官方 Skill 模板');
});
const submitLabel = computed(() => {
  if (saving.value) return $t('保存中...');
  if (options.submitMode === 'save') return $t('添加模板');
  return $t(options.submitMode === 'run' ? '添加并创建任务' : '保存并运行');
});
</script>

<template>
  <div class="agent-console-dialog__shell create-template-dialog" :class="{ 'create-template-dialog--readonly': readonly }">
    <header class="agent-console-dialog__header">
      <h2 class="agent-console-dialog__title">{{ $t(readonly ? '查看模板' : editing ? '编辑模板' : '创建模板') }}</h2>
      <button class="agent-console-dialog__close" type="button" :aria-label="$t('关闭模板弹窗')" @click="close"></button>
    </header>
    <main class="agent-console-dialog__body create-template-dialog__body">
      <div v-if="loadingDetail" class="create-template-dialog__loading" role="status" aria-busy="true">
        <span class="sr-only">{{ $t('加载中...') }}</span>
        <TemplateDialogSkeleton :template-type="kind" scope="full" />
      </div>
      <div v-else-if="detailError" class="create-template-dialog__state" role="alert">
        <Icon name="roxy-agent/rx-ic-templates" size="32" />
        <strong>{{ $t('加载我的模板失败') }}</strong><span>{{ detailError }}</span>
        <button class="create-template-dialog__retry" type="button" @click="retryDetail">{{ $t('重试') }}</button>
      </div>
      <template v-else>
        <Field :label="$t('模板名称')">
          <AgentInput v-model="name" type="text" :placeholder="$t('请输入模板名称')" :disabled="readonly || saving" />
        </Field>
        <Field v-if="!readonly" :label="$t('模板内容')">
          <div class="create-template-dialog__types">
            <Tooltip v-for="option in kinds" :key="option.value" :content="option.tooltip" :disabled="!option.tooltip || lockedSource || options.lockKind || saving"
              :show-delay="500" placement="top" :z-index="1300" trigger-class="create-template-dialog__type-tooltip">
              <button type="button" :class="{ active: kind === option.value }" :disabled="cannotChangeKind()" :aria-disabled="cannotChangeKind()"
                :aria-pressed="kind === option.value" @click="changeKind(option.value)"><span>{{ option.label }}</span></button>
            </Tooltip>
          </div>
        </Field>
        <TemplateDialogSkeleton v-if="kind !== 'prompt' && showSourceSkeleton" :template-type="kind" scope="content" />
        <section v-else-if="kind === 'prompt'" class="create-template-dialog__content-panel">
          <Field :label="$t('提示词内容')">
            <ChatComposer v-model="prompt" class="create-template-dialog__textarea create-template-dialog__textarea--prompt" variant="prompt-field"
              :placeholder="$t('请输入提示词内容')" prompt-min-height="176px" :pending-attachments="[]" :readonly="readonly || saving" :thinking="false" />
          </Field>
        </section>
        <section v-else class="create-template-dialog__content-panel" :class="{ 'is-skill-dragging': dragging }" @dragenter="dragEnter"
          @dragleave="dragLeave" @dragover="dragOver" @drop="dropSkill">
          <div v-if="dragging" class="create-template-dialog__skill-drop-prompt" aria-hidden="true">
            <Icon name="extension/rx_ic_upload" size="20" /><span>{{ $t('拖拽到此处上传 Skill') }}</span>
            <small>{{ $t('仅支持 .zip 格式的 Skill 包') }}</small>
          </div>
          <Field :label="$t(kind === 'script' ? '选择脚本' : '选择 Skill')">
            <div class="create-template-dialog__source-row">
              <AgentInput v-if="lockedSource" :model-value="sourceLabel" disabled />
              <AgentSelect v-else v-model="selectedSource" :options="sourceOptions" :placeholder="sourcePlaceholder"
                :loading="loadingSources" :disabled="saving || loadingSources" />
              <button v-if="!lockedSource" class="create-template-dialog__upload" type="button" :disabled="saving || uploading"
                @click="kind === 'script' ? openScriptUpload() : skillInput?.click()">
                <Icon name="extension/rx_ic_upload" size="16" />
                {{ $t(uploading ? '上传中...' : kind === 'script' ? '上传脚本' : '上传 Skill') }}
              </button>
              <input ref="skillInput" type="file" accept=".zip,application/zip" hidden @change="onSkillChange">
            </div>
          </Field>
          <div class="create-template-dialog__details">
            <div class="create-template-dialog__details-title">
              <span>{{ $t(kind === 'script' ? '脚本详情' : 'Skill 详情') }}</span><small>{{ $t('仅查看') }}</small>
            </div>
            <Markdown v-if="kind === 'script' && detailDescription" class="create-template-dialog__description" :content="detailDescription" />
            <p v-else>{{ detailDescription || $t('选择来源后展示详情') }}</p>
            <template v-if="kind === 'skill' && Array.isArray(metadata.files)">
              <div class="create-template-dialog__parameters-title">{{ $t('包含文件') }}</div>
              <p class="create-template-dialog__files">{{ metadata.files.join('、') }}</p>
            </template>
          </div>
          <section v-if="kind === 'script' && (selectedOfficial || uploaded || editing)" class="create-template-dialog__script-parameters">
            <div class="create-template-dialog__details-title"><span>{{ $t('脚本参数') }}</span><small>{{ $t('根据脚本自动生成') }}</small></div>
            <div v-if="schema" class="create-template-dialog__script-parameters-fields">
              <ParameterForm :schema="schema" :data="parameterDraft" draft :locale="locale.currentLocale" :readonly="readonly || saving"
                :show-validation-errors="showValidation" @change="updateParameters" @schema-error="schemaError = $event" />
            </div>
            <p v-else class="create-template-dialog__no-parameters">{{ $t('此脚本无需额外参数') }}</p>
          </section>
          <Field v-if="kind === 'skill'">
            <template #label><label class="create-template-dialog__label">{{ $t('提示词') }} <span>{{ $t('选填，将与此 Skill 一起使用') }}</span></label></template>
            <ChatComposer v-model="prompt" class="create-template-dialog__textarea" variant="prompt-field" prompt-min-height="76px"
              :placeholder="$t('请输入使用此 Skill 时的提示词')" :pending-attachments="[]" :readonly="readonly || saving" :thinking="false" />
          </Field>
        </section>
      </template>
    </main>
    <p v-if="errorMessage" class="create-template-dialog__error" role="alert">{{ errorMessage }}</p>
    <footer class="agent-console-dialog__footer">
      <div class="agent-console-dialog__actions">
        <button class="agent-console-dialog__button" type="button" :disabled="saving" @click="close">{{ $t(readonly ? '关闭' : '取消') }}</button>
        <button v-if="!readonly && !options.submitMode" class="agent-console-dialog__button" type="button" :disabled="saving || !canSave"
          @click="save(false)">{{ $t(saving ? '保存中...' : '仅保存') }}</button>
        <button v-if="!readonly" class="agent-console-dialog__button primary" type="button" :disabled="saving || !canSave"
          @click="save(options.submitMode === 'run' || !options.submitMode)">{{ submitLabel }}</button>
      </div>
    </footer>
  </div>
</template>
