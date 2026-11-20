<script setup>
import { ref, resolveComponent } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as GridLoader } from './grid-loader-BbJvp9z6.js';
import { t as Popover } from './AgentPopover-BDVkdMHH.js';

const props = defineProps({
  activeConversationId: String, conversations: { type: Array, required: true }, loadingMore: Boolean,
  pendingApprovalConversationIds: { type: Array, required: true },
});
const emit = defineEmits(['delete', 'rename', 'select']);
const RouterLink = resolveComponent('RouterLink');
const openAction = ref('');
const focusedConversation = ref('');
const hoveredConversation = ref('');

function clearFocus(id) {
  if (focusedConversation.value === id) focusedConversation.value = '';
}
function clearHover(id) {
  if (hoveredConversation.value === id) hoveredConversation.value = '';
}
function choose(action, id) {
  openAction.value = '';
  emit(action, id);
}
function activity(conversation) {
  if (conversation.runningRunIds.length || ['queued', 'streaming'].includes(conversation.latestRunStatus)) return 'running';
  if (['completed', 'failed', 'cancelled'].includes(conversation.latestRunStatus)) return 'ended';
  return 'idle';
}
function actionVisible(conversation) {
  return activity(conversation) !== 'running' && [openAction.value, focusedConversation.value, hoveredConversation.value].includes(conversation.id);
}
function showEnded(conversation) {
  return activity(conversation) === 'ended' && conversation.unread && props.activeConversationId !== conversation.id && !actionVisible(conversation);
}
function statusLabel(conversation) {
  if (activity(conversation) === 'running') return $t('对话中');
  return $t(showEnded(conversation) ? '对话结束' : '删除');
}
</script>

<template>
  <section class="conversation-section">
    <div class="section-title">{{ $t('对话') }}</div>
    <div class="conversation-list">
      <RouterLink v-for="conversation in conversations" :key="conversation.id" custom
        :to="{ name: 'agent-console-conversation', params: { conversationId: conversation.id } }" v-slot="{ href }">
        <a :href="href" class="conversation-item" :class="[`conversation-item--${activity(conversation)}`, {
          active: activeConversationId === conversation.id, 'conversation-item--action-visible': actionVisible(conversation),
          'delete-menu-open': openAction === conversation.id }]"
          @mouseenter="hoveredConversation = conversation.id" @mouseleave="clearHover(conversation.id)"
          @click.prevent="choose('select', conversation.id)" @focus="focusedConversation = conversation.id"
          @blur="!$event.currentTarget.contains($event.relatedTarget) && clearFocus(conversation.id)">
          <span class="conversation-content">
            <span class="conversation-title">{{ conversation.title }}</span>
            <span v-if="pendingApprovalConversationIds.includes(conversation.id)" class="conversation-approval-badge" role="status">{{ $t('等待批准') }}</span>
          </span>
          <span class="conversation-meta" :aria-label="statusLabel(conversation)">
            <span v-if="activity(conversation) === 'running'" class="conversation-status conversation-status--running" :title="$t('对话中')" role="status"><GridLoader /></span>
            <Popover v-if="actionVisible(conversation)" :open="openAction === conversation.id" trigger-class="conversation-delete"
              content-class="conversation-action-menu" placement="top-end" :offset="8" role="button" tabindex="0" :title="$t('删除')"
              :aria-label="$t('删除')" :aria-expanded="openAction === conversation.id"
              @update:open="openAction = $event ? conversation.id : ''"
              @focus="focusedConversation = conversation.id" @blur="clearFocus(conversation.id)">
              <template #content="{ close }">
                <button type="button" class="conversation-action-menu__action" @click.stop.prevent="close(); choose('rename', conversation.id)">
                  <Icon name="base/rx_ic_agent_edit" size="16" aria-hidden="true" /><span>{{ $t('重命名对话') }}</span>
                </button>
                <button type="button" class="conversation-action-menu__action conversation-action-menu__action--danger"
                  @click.stop.prevent="close(); choose('delete', conversation.id)">
                  <Icon name="base/rx_ic_bin_1" size="16" aria-hidden="true" /><span>{{ $t('删除') }}</span>
                </button>
              </template>
              <Icon name="base/rx_ic_more-h" size="12" />
            </Popover>
            <span v-if="showEnded(conversation)" class="conversation-status conversation-status--ended" :title="$t('对话结束')" aria-hidden="true"></span>
          </span>
        </a>
      </RouterLink>
      <div v-if="loadingMore" class="conversation-loading-more" role="status">{{ $t('加载中...') }}</div>
    </div>
  </section>
</template>
