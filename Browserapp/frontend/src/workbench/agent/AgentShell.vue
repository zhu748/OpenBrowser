<script setup>
import { resolveComponent } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { agentShellRuntime } from './hook-CnJE4hRq.js';
import { useAgentShell } from './workbench-agent-shell-state.js';

const RouterLink = resolveComponent('RouterLink');
const RouterView = resolveComponent('RouterView');
const { DeleteConfirm, Sidebar, ProfileMonitor, Guide } = agentShellRuntime;
const {
  LiveChat, showLiveChat, monitorOpen, settings, isRoxyClaw, layoutStyle, backRoute,
  sidebarWidth, maxSidebarWidth, stepSidebar, resizeSidebar, sidebarRef, activeConversationId, activeConversation, conversations,
  hasMoreConversations, loadingConversations, approvalIds, deleteConversation, newChat, renameConversation,
  selectConversation, loadMoreConversations, hasTaskPageProps, isChatRoute, isTemplateRoute, prompt, thinking,
  send, composerFocus, hitlRequest, messages, onboardingCompleteVisible, hasEarlier, loadingEarlier, attachments, queuedPrompts,
  todoProgress, addAttachments, addFolder, addPath, removeAttachment, removeQueuedPrompt, reorderPrompt, restorePrompt, loadEarlier,
  saveTemplate, onboardingComplete, resetOnboarding, runOnboarding, stop, submitHitl, monitorGroups, maxMonitorWidth, monitorWidth,
  runningCount, monitorEnabled, resizeMonitor, stepMonitor, toggleMonitorGroup, guideTarget, guideVisible, hideGuide,
  minimumMonitorWidth, minimumSidebarWidth,
} = useAgentShell();
</script>

<template>
  <div class="agent-console" :class="{ 'agent-console--monitor-open': monitorOpen && !settings, 'agent-console--settings': settings }" :style="layoutStyle">
    <DeleteConfirm />
    <aside v-if="settings" class="agent-settings-sidebar">
      <RouterLink custom :to="backRoute" v-slot="{ href, navigate }">
        <a :href="href" class="agent-settings-nav-item" @click="navigate"><Icon name="base/rx_ic_arrow_left" size="18" /><span>{{ $t('返回应用') }}</span></a>
      </RouterLink>
      <RouterLink custom :to="{ name: 'agent-console-roxyclaw' }" v-slot="{ href, isActive, navigate }">
        <a :href="href" class="agent-settings-nav-item" :class="{ active: isActive }" @click="navigate">
          <Icon name="roxy-agent/rx-ic-roxyclaw" size="18" /><span>Agent 设置</span>
        </a>
      </RouterLink>
      <RouterLink custom :to="{ name: 'agent-console-settings' }" v-slot="{ href, isExactActive, navigate }">
        <a :href="href" class="agent-settings-nav-item" :class="{ active: isExactActive }" @click="navigate">
          <Icon name="base/rx_ic_mcp" size="18" /><span>{{ $t('MCP 服务') }}</span>
        </a>
      </RouterLink>
      <div class="agent-settings-sidebar-resize-handle" role="separator" aria-orientation="vertical" :aria-label="$t('调整会话栏宽度')"
        :aria-valuemax="maxSidebarWidth()" :aria-valuemin="minimumSidebarWidth" :aria-valuenow="sidebarWidth" tabindex="0"
        @keydown.left.prevent="stepSidebar(-16)" @keydown.right.prevent="stepSidebar(16)" @pointerdown="resizeSidebar"></div>
    </aside>
    <Sidebar v-else ref="sidebarRef" :active-conversation-id="activeConversationId" :conversations="conversations" :has-more-conversations="hasMoreConversations"
      :loading-more-conversations="loadingConversations" :max-width="maxSidebarWidth()" :pending-approval-conversation-ids="approvalIds" :min-width="minimumSidebarWidth"
      :sidebar-width="sidebarWidth" @delete-conversation="deleteConversation" @new-chat="newChat"
      @rename-conversation="renameConversation" @resize-start="resizeSidebar" @resize-step="stepSidebar"
      @select-conversation="selectConversation" @load-more-conversations="loadMoreConversations" />
    <RouterView v-slot="{ Component, route }">
      <main v-if="settings" class="agent-settings-content-shell" :class="{ 'agent-settings-content-shell--roxyclaw': isRoxyClaw }">
        <section class="agent-settings-panel" :class="{ 'agent-settings-panel--roxyclaw': isRoxyClaw }">
          <component :is="Component" v-if="hasTaskPageProps(route.name)" v-model:prompt="prompt"
            :active-conversation-id="activeConversationId" :route-title="route.meta.title" :thinking="thinking" @send="send" />
          <component :is="Component" v-else />
        </section>
      </main>
      <component :is="Component" v-else-if="isChatRoute(route.name)" v-model:prompt="prompt" :active-conversation-id="activeConversationId"
        :conversation-title="activeConversation?.title" :composer-focus-key="composerFocus" :hitl-request="hitlRequest" :messages="messages"
        :onboarding-completion-visible="onboardingCompleteVisible" :has-earlier-messages="hasEarlier" :loading-earlier-messages="loadingEarlier"
        :pending-attachments="attachments" :queued-prompts="queuedPrompts" :route-title="route.meta.title" :thinking="thinking" :todo-progress="todoProgress"
        @add-attachments="addAttachments" @add-folder="addFolder" @add-path-attachment="addPath" @remove-attachment="removeAttachment"
        @remove-queued-prompt="removeQueuedPrompt" @reorder-queued-prompt="reorderPrompt" @restore-queued-prompt="restorePrompt"
        @load-earlier-messages="loadEarlier" @save-template="saveTemplate" @onboarding-complete="onboardingComplete"
        @onboarding-completion-dismiss="onboardingCompleteVisible = false" @onboarding-reset="resetOnboarding" @onboarding-run="runOnboarding"
        @send="send" @stop="stop" @submit-hitl="submitHitl" />
      <component :is="Component" v-else-if="hasTaskPageProps(route.name)" v-model:prompt="prompt"
        :active-conversation-id="activeConversationId" :route-title="route.meta.title" :thinking="thinking" />
      <component :is="Component" v-else-if="isTemplateRoute(route.name)" v-model:prompt="prompt" />
      <component :is="Component" v-else />
    </RouterView>
    <ProfileMonitor v-if="monitorOpen && !settings" :groups="monitorGroups" :max-width="maxMonitorWidth()" :min-width="minimumMonitorWidth"
      :monitor-width="monitorWidth" :running-count="runningCount" @close="monitorEnabled = false" @resize-start="resizeMonitor" @resize-step="stepMonitor" @toggle-group="toggleMonitorGroup" />
    <Guide callout-below-target interactive-target :label="$t('点击新对话继续体验')" :target="guideTarget" :visible="guideVisible" @dismiss="hideGuide" />
    <LiveChat v-if="showLiveChat" />
  </div>
</template>
