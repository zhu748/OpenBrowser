<script setup>
import { resolveComponent } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { chatWorkspaceRuntime } from './hook-CnJE4hRq.js';
import { chatEvents, chatProps } from './workbench-chat-contract.js';
import { useChatWorkspace } from './workbench-chat-state.js';
import MessageList from './workbench-chat-message-list.js';

const props = defineProps(chatProps);
const emit = defineEmits(chatEvents);
const prompt = defineModel('prompt', { required: true });
const RouterLink = resolveComponent('RouterLink');
const { PageLayout, ProfileMonitor, TemplateSkeleton, TableText, Composer, Guide, Onboarding } = chatWorkspaceRuntime;
const {
  composerRef, home, containerStyle, title, cardsLoading, templateCards, openingTemplate, openTemplate, composerFocus, recommendedTemplates,
  windowGuideLabel, windowGuideTarget, windowGuideVisible, hideWindowGuide, windowLimitLabel, windowLimitTarget, windowLimitVisible, hideWindowLimit,
  templateGuideLabel, templateGuideTarget, templateGuideVisible, hideTemplateGuide, promptGuideLabel, promptGuideTarget, promptGuideVisible, hidePromptGuide,
  scenarioTemplates, onboardingSessionKey, onboardingVisible, continueOnboarding, restartOnboarding, runOnboarding, dragging, dragEnter,
  dragLeave, dragOver, drop, showOnboarding, addToChat, savePrompt, reloadTemplates,
} = useChatWorkspace(props, emit, prompt);
</script>

<template>
  <PageLayout class="chat-workspace" :class="{ 'chat-workspace--home': home }" padding="0" :show-profile-monitor-toggle="false">
    <div class="chat-container" :class="{ 'chat-container--conversation': !home, 'chat-container--awaiting-approval': hitlRequest }"
      :style="containerStyle" @dragenter="dragEnter" @dragleave="dragLeave" @dragover="dragOver" @drop="drop">
      <header v-if="!home" class="chat-header">
        <div class="chat-header__title" :title="title">{{ title }}</div>
        <ProfileMonitor variant="pill" />
      </header>
      <div v-if="home" class="chat-home-actions">
        <button class="chat-home-onboarding" type="button" :aria-label="$t('打开新手引导')" @click="showOnboarding"><span>?</span> {{ $t('新手引导') }}</button>
        <ProfileMonitor class="chat-home-monitor" variant="pill" />
      </div>
      <section v-if="home" class="home-scroll-shell">
        <div class="home-scroll">
          <div class="home-hero">
            <div class="home-intro">
              <div class="home-brand-orb"><Icon class="home-brand-logo" name="roxy-agent/rx-ic-logo" size="56" /></div>
              <div class="home-copy">
                <h1>{{ $t('有什么我能帮你的吗？') }}</h1><p>{{ $t('直接与我聊天，或选择模板一键开始。') }}</p>
              </div>
            </div>
            <div v-if="cardsLoading" class="template-grid"><TemplateSkeleton :count="8" /></div>
            <div v-else-if="templateCards.length" class="template-grid">
              <article v-for="card in templateCards" :key="card.id" class="template-card">
                <div class="template-card__main">
                  <div class="template-card__icon" aria-hidden="true">
                    <img v-if="card.imageIcon" :src="card.imageIcon" :alt="card.title">
                    <Icon v-else :name="card.iconName" :size="card.iconSize" :color="card.iconColor" />
                  </div>
                  <div class="template-card__copy">
                    <h2><TableText :content="card.title" placement="top" /></h2>
                    <p><TableText :content="card.description" placement="top" /></p>
                  </div>
                </div>
                <div class="template-card__footer">
                  <div class="template-tags">
                    <span v-for="tag in card.tags" :key="tag.id" class="template-tag"
                      :class="{ 'template-tag--script': tag.tone === 'script', 'template-tag--ai': tag.tone === 'ai' }">{{ tag.label }}</span>
                  </div>
                  <button class="template-run" type="button" :disabled="openingTemplate !== undefined" @click="openTemplate(card)">{{ $t('使用') }}</button>
                </div>
              </article>
            </div>
            <RouterLink custom :to="{ name: 'agent-console-template-store' }" v-slot="{ href, navigate }">
              <a class="more-templates" :href="href" @click="navigate"><Icon name="roxy-agent/rx-ic-templates-store" size="18" /><span>{{ $t('更多模板') }}</span></a>
            </RouterLink>
          </div>
        </div>
      </section>
      <MessageList v-else :active-conversation-id="activeConversationId" :has-earlier-messages="hasEarlierMessages" has-header
        :loading-earlier-messages="loadingEarlierMessages" :messages="messages" @add-to-chat="addToChat" @save-as-prompt="savePrompt"
        @load-earlier-messages="emit('loadEarlierMessages')" @save-template="emit('saveTemplate', $event)" />
      <div class="composer-scroll-mask" aria-hidden="true"></div>
      <div v-if="hitlRequest" class="hitl-overlay" aria-hidden="true"></div>
      <Composer ref="composerRef" v-model="prompt" auto-focus :content-key="activeConversationId ?? 'home'" :focus-key="composerFocus"
        :hitl-request="hitlRequest" :pending-attachments="pendingAttachments" :queued-prompts="queuedPrompts" :recommended-template-items="recommendedTemplates"
        :show-glow="home" :thinking="thinking" :todo-progress="todoProgress" @add-attachments="emit('addAttachments', $event)"
        @add-folder="emit('addFolder', $event)" @add-path-attachment="emit('addPathAttachment', $event)" @official-template-top-changed="reloadTemplates"
        @remove-attachment="emit('removeAttachment', $event)" @remove-queued-prompt="emit('removeQueuedPrompt', $event)"
        @reorder-queued-prompt="emit('reorderQueuedPrompt', $event)" @restore-queued-prompt="emit('restoreQueuedPrompt', $event)"
        @send="emit('send', $event)" @stop="emit('stop')" @submit-hitl="emit('submitHitl', $event)" />
      <Guide :label="windowGuideLabel" :target="windowGuideTarget" :visible="windowGuideVisible" @dismiss="hideWindowGuide" />
      <Guide :label="windowLimitLabel" :target="windowLimitTarget" :visible="windowLimitVisible" @dismiss="hideWindowLimit" />
      <Guide callout-above-container :label="templateGuideLabel" :target="templateGuideTarget" :visible="templateGuideVisible" @dismiss="hideTemplateGuide" />
      <Guide :label="promptGuideLabel" :target="promptGuideTarget" :visible="promptGuideVisible" @dismiss="hidePromptGuide" />
      <Onboarding :completion-visible="onboardingCompletionVisible" :scenario-templates="scenarioTemplates" :session-key="onboardingSessionKey"
        :visible="onboardingVisible" @close="onboardingVisible = false" @completion-continue="continueOnboarding"
        @completion-restart="restartOnboarding" @experience="runOnboarding" />
      <div v-if="dragging" class="chat-drop-overlay" aria-hidden="true"></div>
      <div v-if="dragging" class="chat-drop-label" aria-hidden="true">{{ $t('拖动上传') }}</div>
    </div>
  </PageLayout>
</template>
