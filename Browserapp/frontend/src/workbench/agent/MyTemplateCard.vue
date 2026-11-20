<script setup>
import { computed, ref } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { H as isImage, K as themedValue } from './CreateTemplateDialog-Bpq9OLTG.js';
import { i as Button } from './ScriptSchemaForm-z_48GvPJ.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { t as Popover } from './AgentPopover-BDVkdMHH.js';

const props = defineProps({ item: { type: Object, required: true }, unread: Boolean, creatingTask: Boolean, editDisabled: Boolean, deleting: Boolean, topping: Boolean });
const emit = defineEmits(['edit', 'delete', 'createTask', 'runInChat', 'toggleTop']);
const theme = useTheme();
const menu = ref(false);
const kind = computed(() => ({
  script: { label: $t('脚本'), icon: 'roxy-agent/rx-ic-scripts' },
  skill: { label: 'Skill', icon: 'roxy-agent/rx-ic-skills' },
  prompt: { label: $t('提示词'), icon: 'roxy-agent/rx-ic-prompts' },
})[props.item.kind]);
const icon = computed(() => themedValue(props.item.iconInfo?.icon, theme.realTheme === 'dark'));
const color = computed(() => themedValue(props.item.iconInfo?.primaryColor, theme.realTheme === 'dark') || 'var(--color-text-primary)');
const version = computed(() => {
  const value = props.item.metadata.version;
  const number = typeof value === 'string' ? value.trim().replace(/^v/i, '') : Number.isFinite(value) ? String(value) : '';
  return 'v' + (number || '1.0.0');
});
const tags = computed(() => {
  const { labels, tags, skillMetadata } = props.item.metadata;
  const values = labels ?? tags ?? skillMetadata?.tags;
  const text = Array.isArray(values) ? values.map(value => {
    const label = typeof value === 'string' ? value : value?.label ?? value?.name ?? value?.slug;
    return typeof label === 'string' ? label.trim() : '';
  }).filter(Boolean) : [];
  return [...new Set([kind.value.label, ...text])].slice(0, 3);
});
function edit() {
  if (!props.editDisabled) operate('edit');
}
function operate(action) {
  menu.value = false;
  emit(action, props.item);
}
</script>

<template>
  <article class="my-template-card">
    <header class="my-template-card__header">
      <div class="my-template-card__identity" role="button" :tabindex="editDisabled ? -1 : 0" :aria-disabled="editDisabled"
        @click="edit" @keydown.enter.prevent="edit" @keydown.space.prevent="edit">
        <div class="my-template-card__avatar">
          <span v-if="unread" class="my-template-card__unread" aria-hidden="true"></span>
          <img v-if="icon && isImage(icon)" :src="icon" :alt="item.name">
          <Icon v-else-if="icon" :name="icon" size="44" :color="color" aria-hidden="true" />
          <Icon v-else :name="kind.icon" size="32" color="var(--color-fg-tertiary)" aria-hidden="true" />
        </div>
        <div class="my-template-card__copy"><h2 :title="item.name">{{ item.name }}</h2><p>{{ version }}</p></div>
      </div>
    </header>
    <div class="my-template-card__divider"></div>
    <div class="my-template-card__tags"><span v-for="tag in tags" :key="tag" class="my-template-card__tag">{{ tag }}</span></div>
    <Tooltip :content="item.description || $t('暂无描述')" placement="top-start" :disabled="!item.description" trigger-class="my-template-card__description-trigger">
      <p class="my-template-card__description">{{ item.description || $t('暂无描述') }}</p>
    </Tooltip>
    <footer class="my-template-card__actions">
      <Popover v-model:open="menu" content-class="my-template-card-action-popover" placement="bottom-start" :offset="6" :z-index="90">
        <template #content>
          <button type="button" :disabled="editDisabled" @click="edit"><Icon name="base/rx_ic_agent_edit" size="16" aria-hidden="true" /><span>{{ $t('编辑') }}</span></button>
          <button type="button" :disabled="topping" @click="operate('toggleTop')">
            <Icon :name="item.isTopped ? 'base/rx_ic_pin_solid' : 'base/rx_ic_pin_line'" size="16" aria-hidden="true" />
            <span>{{ $t(item.isTopped ? '取消置顶' : '置顶') }}</span>
          </button>
          <button class="danger" type="button" :disabled="deleting" @click="operate('delete')"><Icon name="base/rx_ic_bin_1" size="16" aria-hidden="true" /><span>{{ $t('删除') }}</span></button>
        </template>
        <button class="my-template-card__more-button" type="button" :aria-label="$t('更多操作')" :aria-expanded="menu"><Icon name="base/rx_ic_more-h" size="18" aria-hidden="true" /></button>
      </Popover>
      <div class="my-template-card__primary-actions">
        <Button class="my-template-card__create-task" variant="secondary" :icon="false" :disabled="creatingTask" :aria-busy="creatingTask"
          @click="emit('createTask', item)">{{ $t(creatingTask ? '准备中...' : '创建任务') }}</Button>
        <Button class="my-template-card__run-in-chat" variant="secondary" :icon="false" :disabled="creatingTask"
          @click="emit('runInChat', item)">{{ $t(item.kind === 'script' ? '运行脚本' : '去对话运行') }}</Button>
      </div>
    </footer>
  </article>
</template>
