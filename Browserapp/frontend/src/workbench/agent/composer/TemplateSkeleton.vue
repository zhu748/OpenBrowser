<script setup>
import { o as Field } from './ScriptSchemaForm-z_48GvPJ.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
defineProps({ templateType: String, scope: { type: String, default: 'content' } });
</script>

<template>
  <template v-if="scope === 'full'">
    <Field :label="$t('模板名称')"><Skeleton width="100%" height="32px" border-radius="10px" /></Field>
    <Field :label="$t('模板内容')">
      <div class="ctf-skeleton__types"><Skeleton v-for="index in 3" :key="index" width="100%" height="32px" border-radius="10px" /></div>
    </Field>
  </template>
  <template v-if="templateType === 'prompt'">
    <Field v-if="scope === 'full'" :label="$t('提示词内容')"><Skeleton width="100%" height="176px" border-radius="10px" /></Field>
  </template>
  <section v-else class="ctf-skeleton__content-panel" aria-hidden="true">
    <Field :label="$t(templateType === 'script' ? '选择脚本' : '选择 Skill')">
      <div class="ctf-skeleton__source-row">
        <Skeleton width="100%" height="32px" border-radius="10px" /><Skeleton width="96px" height="32px" border-radius="10px" />
      </div>
    </Field>
    <div class="ctf-skeleton__details">
      <div class="ctf-skeleton__details-title"><Skeleton width="80px" height="14px" border-radius="4px" /><Skeleton width="40px" height="12px" border-radius="4px" /></div>
      <Skeleton width="100%" height="14px" border-radius="4px" /><Skeleton width="68%" height="14px" border-radius="4px" />
    </div>
    <div v-if="templateType === 'script'" class="ctf-skeleton__parameters">
      <div class="ctf-skeleton__details-title"><Skeleton width="64px" height="14px" border-radius="4px" /><Skeleton width="56px" height="12px" border-radius="4px" /></div>
      <div class="ctf-skeleton__parameter-fields">
        <div v-for="width in ['72px', '56px']" :key="width" class="ctf-skeleton__parameter-field">
          <Skeleton :width="width" height="14px" border-radius="4px" /><Skeleton width="100%" height="32px" border-radius="10px" />
        </div>
      </div>
    </div>
    <Field v-else>
      <template #label><div class="ctf-skeleton__prompt-label"><Skeleton width="48px" height="14px" border-radius="4px" /><Skeleton width="120px" height="12px" border-radius="4px" /></div></template>
      <Skeleton width="100%" height="76px" border-radius="10px" />
    </Field>
  </section>
</template>
