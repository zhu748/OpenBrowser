<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, resolveComponent, watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { sn as useLocale } from './utils-BIWenCnY.js';
import { agentShellRuntime } from './hook-CnJE4hRq.js';
import AgentNavigation from './workbench-agent-navigation.js';
import ConversationList from './workbench-agent-conversation-list.js';
import SidebarFooter from './workbench-agent-sidebar-footer.js';
import MyTemplatesLink from './workbench-agent-templates-link.js';

const props = defineProps({
  activeConversationId: String, conversations: { type: Array, required: true }, hasMoreConversations: Boolean,
  loadingMoreConversations: Boolean, maxWidth: Number, minWidth: Number, pendingApprovalConversationIds: Array, sidebarWidth: Number,
});
const emit = defineEmits(['newChat', 'deleteConversation', 'renameConversation', 'resizeStart', 'resizeStep', 'selectConversation', 'loadMoreConversations']);
const RouterLink = resolveComponent('RouterLink');
const { Brand } = agentShellRuntime;
const locale = useLocale();
const newChatLabel = computed(() => locale.currentLocale.startsWith('zh') ? '新对话' : $t('新建对话'));
const storeItems = [{ id: 'template-store', label: '模板商城', icon: 'roxy-agent/rx-ic-templates-store', route: 'agent-console-template-store' }];
const taskItems = [{ id: 'task-manager', label: '任务管理', icon: 'roxy-agent/rx-ic-task-manager', route: 'agent-console-task-manager' }];
const newChatElement = ref(null);
const scrollArea = ref(null);
const canScrollUp = ref(false);
const canScrollDown = ref(false);
let observer;

function updateScroll() {
  const area = scrollArea.value;
  if (!area) {
    canScrollUp.value = false;
    canScrollDown.value = false;
    return;
  }
  const limit = area.scrollHeight - area.clientHeight;
  canScrollUp.value = limit > 1 && area.scrollTop > 1;
  canScrollDown.value = limit > 1 && area.scrollTop < limit - 1;
  if (props.hasMoreConversations && !props.loadingMoreConversations && area.scrollTop >= limit - 80) emit('loadMoreConversations');
}

watch(() => [props.conversations.map(conversation => `${conversation.id}:${conversation.title}`).join('|'),
  props.hasMoreConversations, props.loadingMoreConversations], () => nextTick(updateScroll), { immediate: true });
onMounted(async () => {
  await nextTick();
  updateScroll();
  if (!scrollArea.value || typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(updateScroll);
  observer.observe(scrollArea.value);
  for (const child of scrollArea.value.children) observer.observe(child);
});
onBeforeUnmount(() => observer?.disconnect());
defineExpose({ getNewChatElement: () => newChatElement.value });
</script>

<template>
  <aside class="agent-sidebar">
    <Brand class="sidebar-brand" />
    <div class="sidebar-new-chat-wrap">
      <RouterLink custom :to="{ name: 'agent-console-chat' }" v-slot="{ href, isExactActive }">
        <a ref="newChatElement" :href="href" class="sidebar-new-chat" :class="{ active: isExactActive }" @click.prevent="emit('newChat')">
          <Icon name="roxy-agent/rx-ic-new-chat" size="18" /><span>{{ newChatLabel }}</span>
        </a>
      </RouterLink>
    </div>
    <div ref="scrollArea" class="sidebar-scroll" :class="{ 'sidebar-scroll--can-scroll-up': canScrollUp, 'sidebar-scroll--can-scroll-down': canScrollDown }"
      @scroll.passive="updateScroll">
      <div class="sidebar-menu">
        <AgentNavigation :items="storeItems" />
        <AgentNavigation :items="taskItems" />
        <MyTemplatesLink />
      </div>
      <ConversationList :active-conversation-id="activeConversationId" :pending-approval-conversation-ids="pendingApprovalConversationIds"
        :conversations="conversations" :loading-more="loadingMoreConversations" @delete="emit('deleteConversation', $event)"
        @rename="emit('renameConversation', $event)" @select="emit('selectConversation', $event)" />
    </div>
    <SidebarFooter />
    <div class="agent-sidebar-resize-handle" role="separator" aria-orientation="vertical" :aria-label="$t('调整会话栏宽度')"
      :aria-valuemax="maxWidth" :aria-valuemin="minWidth" :aria-valuenow="sidebarWidth" tabindex="0"
      @keydown.left.prevent="emit('resizeStep', -16)" @keydown.right.prevent="emit('resizeStep', 16)" @pointerdown="emit('resizeStart', $event)"></div>
  </aside>
</template>
