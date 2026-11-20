<script setup>
import { Teleport } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { chatMessageRuntime } from './hook-CnJE4hRq.js';
import { useMessageList } from './workbench-chat-message-state.js';
import ChatMessage from './workbench-chat-message.js';

const props = defineProps({
  activeConversationId: null, hasEarlierMessages: Boolean, hasHeader: Boolean, loadingEarlierMessages: Boolean, messages: null,
});
const emit = defineEmits(['addToChat', 'loadEarlierMessages', 'saveAsPrompt', 'saveTemplate']);
const { CopyNotification } = chatMessageRuntime;
const {
  notificationRef, listRef, innerRef, showScrollButton, selectionMenuRef, selectionMenu, onPointerUp, onContextMenu,
  onScroll, onTouchMove, onTouchStart, onWheel, copyMessage, jumpToBottom, copySelection, addSelectionToChat, saveSelectionAsPrompt,
} = useMessageList(props, emit);
</script>

<template>
  <CopyNotification ref="notificationRef" />
  <div class="message-list-shell" :class="{ 'message-list-shell--with-header': hasHeader }">
    <div ref="listRef" class="message-list" :aria-busy="loadingEarlierMessages" @pointerup="onPointerUp" @contextmenu="onContextMenu"
      @scroll="onScroll" @touchmove.passive="onTouchMove" @touchstart.passive="onTouchStart" @wheel.passive="onWheel">
      <div ref="innerRef" class="message-list__inner">
        <ChatMessage v-for="message in messages" :key="message.id" :message="message" @copy="copyMessage" @save-template="emit('saveTemplate', $event)" />
      </div>
    </div>
    <button v-if="showScrollButton" class="scroll-to-bottom" type="button" :aria-label="$t('滚动到底部')" @click="jumpToBottom">
      <Icon name="roxy-agent/rx-ic-arrow" />
    </button>
  </div>
  <Teleport to="body">
    <div v-if="selectionMenu" ref="selectionMenuRef" class="selection-action-menu" role="menu" :aria-label="$t('选中文字操作')"
      :style="{ left: selectionMenu.left + 'px', top: selectionMenu.top + 'px' }" @pointerdown.prevent>
      <button type="button" role="menuitem" @click="copySelection">{{ $t('复制') }}</button>
      <button type="button" role="menuitem" @click="addSelectionToChat">{{ $t('添加到当前对话') }}</button>
      <button type="button" role="menuitem" @click="saveSelectionAsPrompt">{{ $t('保存为提示词') }}</button>
    </div>
  </Teleport>
</template>
