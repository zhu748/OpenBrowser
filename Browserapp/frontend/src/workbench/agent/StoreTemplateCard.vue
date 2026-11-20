<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { H as isImage, K as themedValue } from './CreateTemplateDialog-Bpq9OLTG.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import { t as Card } from './rx-card-De8gGY1x.js';

const props = defineProps({ item: { type: Object, required: true }, installed: Boolean, busyAction: String });
const emit = defineEmits(['get', 'run']);
const theme = useTheme();
const titleElement = useTemplateRef('titleRef');
const descriptionElement = useTemplateRef('descriptionRef');
const longTitle = ref(false);
const longDescription = ref(false);
let observer;

const kind = computed(() => ({
  script: { label: $t('脚本'), name: 'roxy-agent/rx-ic-scripts', color: '#175cd3' },
  skill: { label: 'Skill', name: 'roxy-agent/rx-ic-skills', color: '#c11574' },
  prompt: { label: $t('提示词'), name: 'roxy-agent/rx-ic-prompts', color: '#b54708' },
})[props.item.kind]);
const icon = computed(() => themedValue(props.item.iconInfo?.icon, theme.realTheme === 'dark'));
const description = computed(() => props.item.description || $t('暂无描述'));
const version = computed(() => {
  const value = props.item.version?.trim();
  return value && (value.startsWith('v') ? value : 'v' + value);
});

function measure() {
  const title = titleElement.value;
  const details = descriptionElement.value;
  longTitle.value = Boolean(title && title.scrollWidth > title.clientWidth + 1);
  longDescription.value = Boolean(details && (details.scrollHeight > details.clientHeight + 1 || details.scrollWidth > details.clientWidth + 1));
}
watch([() => props.item.title, description], () => nextTick(measure), { flush: 'post' });
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (titleElement.value) observer.observe(titleElement.value);
  if (descriptionElement.value) observer.observe(descriptionElement.value);
  measure();
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <Card :closable="false" class="template-store-card">
    <header class="template-store-card__header">
      <div class="template-store-card__identity">
        <div class="template-store-card__avatar">
          <img v-if="icon && isImage(icon)" :src="icon" :alt="item.title">
          <Icon v-else-if="icon" :name="icon" size="44" color="var(--color-text-primary)" aria-hidden="true" />
          <Icon v-else :name="kind.name" size="32" :color="kind.color" aria-hidden="true" />
        </div>
        <div class="template-store-card__title-group">
          <div class="template-store-card__title-row">
            <Tooltip :content="item.title" :disabled="!longTitle" content-class="template-store-card__title-tooltip" placement="top" trigger-class="template-store-card__title-trigger">
              <h2 ref="titleRef">{{ item.title }}</h2>
            </Tooltip>
            <Icon v-if="item.isHot" class="template-store-card__hot" name="base/fire" size="16" />
          </div>
          <span v-if="version" class="template-store-card__version">{{ version }}</span>
        </div>
      </div>
    </header>
    <div class="template-store-card__divider"></div>
    <div class="template-store-card__tags">
      <Tag class="template-store-card__kind" :label="kind.label" readonly />
      <Tag v-for="tag in item.labels" :key="tag.id" :label="tag.label" readonly />
    </div>
    <Tooltip :content="description" :disabled="!longDescription" content-class="template-store-card__description-tooltip" placement="top-start" trigger-class="template-store-card__description-trigger">
      <p ref="descriptionRef" class="template-store-card__description">{{ description }}</p>
    </Tooltip>
    <div class="template-store-card__actions">
      <div class="template-store-card__action-buttons">
        <button class="template-store-card__get-button" type="button" :disabled="installed || Boolean(busyAction)" :aria-busy="busyAction === 'get'"
          @click="!installed && emit('get', item.id)">{{ $t(installed ? '已获取' : busyAction === 'get' ? '获取中...' : '获取') }}</button>
        <button class="template-store-card__run-button" type="button" :disabled="Boolean(busyAction)" :aria-busy="busyAction === 'run'"
          @click="emit('run', item.id)">{{ $t(busyAction === 'run' ? '准备中...' : installed ? '运行' : '获取并运行') }}</button>
      </div>
    </div>
  </Card>
</template>
