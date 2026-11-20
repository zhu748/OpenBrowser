export const chatProps = {
  activeConversationId: null,
  composerFocusKey: null,
  conversationTitle: null,
  hitlRequest: null,
  hasEarlierMessages: Boolean,
  loadingEarlierMessages: Boolean,
  messages: null,
  onboardingCompletionVisible: Boolean,
  pendingAttachments: null,
  queuedPrompts: null,
  thinking: Boolean,
  todoProgress: null,
};

export const chatEvents = [
  'addAttachments', 'addFolder', 'addPathAttachment', 'loadEarlierMessages', 'onboardingComplete',
  'onboardingCompletionDismiss', 'onboardingReset', 'onboardingRun', 'removeAttachment',
  'removeQueuedPrompt', 'reorderQueuedPrompt', 'restoreQueuedPrompt', 'saveTemplate', 'send', 'stop', 'submitHitl',
];
