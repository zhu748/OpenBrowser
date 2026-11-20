import { usePromptEditor } from './workbench-prompt-editor.js';
import UploadScript from './workbench-agent-upload-script.js';
import { localizedText, readTemplatePrompt, parseTemplate, unwrapResult, parseOfficialTemplates, unwrapUpload,
  reservedSlug, normalizeSlug } from './workbench-agent-template-catalog.js';
import { clipboardFiles, partitionPastedFiles, pathAttachment, shouldAttachPastedText, collectClarificationAnswers,
  selectClarificationAnswer } from './workbench-agent-prompt-actions.js';
import { invalidTemplateReferences, missingInputs, parseUrlInput } from './workbench-agent-prompt-document.js';
import { watchContainer } from './workbench-markdown-links.js';
import { registerToken, registerCodeCopy, registerTableCopy } from './workbench-markdown-elements.js';
import { renderMarkdown } from './workbench-render-markdown.js';
import { labelsRevision, parsePromptTokens, referencedProfileIds, updateProfileLabels } from './workbench-profile-token-labels.js';
import { resolveProfiles } from './workbench-agent-profile-options.js';

export const promptEditorRuntime = { usePromptEditor, partitionPastedFiles, pathAttachment, clipboardFiles,
  shouldAttachPastedText, missingInputs, invalidTemplateReferences, parseUrlInput, collectClarificationAnswers,
  selectClarificationAnswer, trackComposerSize: watchContainer };

export const templateDialogRuntime = { localizedText, readTemplatePrompt, parseTemplate, unwrapResult,
  parseOfficialTemplates, unwrapUpload, reservedSlug, normalizeSlug, UploadScript };

export const markdownRuntime = { registerToken, registerCodeCopy, registerTableCopy, renderMarkdown, labelsRevision,
  watchContainer, parsePromptTokens, referencedProfileIds, resolveProfiles, updateProfileLabels };

export { default as h } from './workbench-agent-file-card.js';
export { default as u } from './workbench-agent-markdown.js';
export { default as g } from './workbench-agent-overflow-tooltip.js';
export { default as TemplateDialogSkeleton } from './workbench-agent-template-skeleton.js';
export { default as QueuedPrompts } from './workbench-agent-prompt-queue.js';
export { default as ComposerToolbar } from './workbench-agent-composer-toolbar.js';
export { default as SuggestionsPopover } from './workbench-agent-suggestions.js';
export { default as t } from './workbench-agent-template-dialog.js';
export { default as n } from './workbench-chat-composer.js';

export { setInstalledSkillRoot as c, getInstalledSkillRoot as r, userTemplateSuggestion as a,
  recommendedTemplateSuggestion as i, formatUserTemplatePrompt as l, formatOfficialTemplatePrompt as s } from './workbench-prompt-editor-support.js';
export { expectResult as A, createTemplate as C, templateKind as D, parseTemplate as E, readTemplatePrompt as G, isImageSource as H,
  queryString as J, themedValue as K, unwrapResult as O, installedTemplates as T, officialTemplateCard as U, localizedText as W,
  sortTemplates as j, readTemplatePage as k, parseOfficialTemplates as q, patchTemplate as w, readTemplatePage as officialTemplatePage,
  readTemplatePage as userTemplatePage, localizedText, readTemplatePrompt } from './workbench-agent-template-catalog.js';
export { readHomeTemplates as B, loadTemplateUnread as S, storeHomeTemplates as V, markTemplateRead as b, markTemplateUnread as x,
  userTemplateIsUnread as y, markUserTemplateRead, loadUserTemplateReadState, userTemplateIsUnread } from './workbench-agent-template-read-state.js';
export { restoreWindowCodes as F, windowManager as I, resolveProfiles as N, loadWindowOptions as P, windowDisplayInfo,
  fetchOpenWindows, markOpenWindow, resolveProfiles } from './workbench-agent-profile-options.js';
export { labelsRevision as L, updateProfileLabels as R, windowNames as z, parsePromptTokens, ensureTokenTooltipElements,
  loadProfileLabels, payloadAttributes } from './workbench-profile-token-labels.js';
export { useApproval as M, removeQueuedPrompt as X, makeQueuedPrompt as Y, reorderQueuedPrompt as Z, formatQueuedPrompt } from './workbench-agent-prompt-actions.js';
export { promptNormalizedTokens as _, formatTemplatePrompt as v, formatTemplatePrompt as formatSuggestionPrompt,
  filterSuggestions, buildProfileToken, serializeToken, promptNormalizedTokens, hasPromptTokens, formatTemplatePrompt,
  suggestionProfileIds, replaceInputTokensByLabel, serializePromptDocument, parsePromptDocument, suggestionTokenNode } from './workbench-agent-prompt-document.js';
export { faviconForLink as $, fallbackIcon as Q, faviconForLink } from './workbench-markdown-links.js';
export { copyIcon as d, resetDelay as f, copyText as m, successIcon as p } from './workbench-markdown-elements.js';
