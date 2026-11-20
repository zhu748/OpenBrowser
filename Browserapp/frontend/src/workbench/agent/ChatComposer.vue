<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { r as Tooltip } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { a as EditorContent } from './dist-BAPiYeUN.js';
import { h as FileCard, ComposerToolbar, QueuedPrompts, SuggestionsPopover } from './CreateTemplateDialog-Bpq9OLTG.js';
import { useChatComposer } from './workbench-chat-composer-state.js';

const props = defineProps({
  autoFocus: Boolean, contentKey: null, focusKey: null, hitlRequest: null, pendingAttachments: { type: Array, default: () => [] },
  queuedPrompts: null, placeholder: null, promptMinHeight: null, readonly: Boolean,
  recommendedTemplateItems: null, thinking: Boolean, showGlow: Boolean, todoProgress: null, variant: null,
});
const emit = defineEmits([
  'addAttachments', 'addFolder', 'addPathAttachment', 'removeAttachment', 'removeQueuedPrompt', 'reorderQueuedPrompt',
  'restoreQueuedPrompt', 'send', 'stop', 'submitHitl', 'officialTemplateTopChanged',
]);
const model = defineModel({ required: true });
const {
  exposed, inline, fieldPlaceholder, fieldStyle, shellRef, composerRef, fileInputRef, attachmentStripRef, canScrollLeft,
  canScrollRight, tokenInputRef, tokenPopoverRef, tokenActionsRef, tokenValue, urlProtocol, composing, expandedInput,
  warning, popoverStyle, popoverSide, questionIndex, allMentionItemsSelected, cancelMentionSelection, chooseItem,
  cancelInputTokenEdit, editor, focusEditor, confirmMentionSelection, inputEditor, isEmpty, markSuggestionItemRead,
  toggleSuggestionItemTop, navigateSuggestion, profileHasMore, profileLoadError, profileLoadingMore, profileReloading,
  profileSelectingAll, projectOptions, loadMoreProfiles, selectedMentionCount, selectedMentionIds, selectedProjectId,
  retryLoadProfiles, suggestion, toggleAllMentionItems, updateSelectedProject, updateSuggestionQuery, tokenProjects,
  uploading, canSend, canStop, previewUrl, onPaste, onFileChange, onFolderChange, hoverSuggestion, activateSend,
  restoreQueuedPrompt, saveToken, chooseTokenProject, pasteUrl, handleTokenKey, startTokenResize, dismissSuggestions,
  runToolbarAction, submittingApproval, questions, hasQuestions, answerKey, answerSuggestions, showClarification,
  approvalActions, approvalFields, answerPlaceholder, approvalPrompt, readAnswer, updateAnswer, submitChoiceAnswer,
  previousQuestion, nextQuestion, chooseAnswer, skipAnswer, handleAnswerKey, answerTitle, answerDescription,
  isChosenAnswer, isDescriptionClipped, bindDescription, updateAttachmentScroll, scrollAttachments,
} = useChatComposer(props, emit, model);
defineExpose(exposed);
</script>

<template>
  <div ref="shellRef" class="composer-shell" :class="{ 'composer-shell--glow': showGlow, 'composer-shell--inline': inline,
    'composer-shell--shadow': !showGlow && !inline }" :style="fieldStyle">
    <QueuedPrompts v-if="!inline && !hitlRequest" :prompts="queuedPrompts ?? []"
      @remove="emit('removeQueuedPrompt', $event)" @reorder="emit('reorderQueuedPrompt', $event)" @restore="restoreQueuedPrompt" />
    <div v-if="hitlRequest" class="hitl-card" role="group" :aria-label="hitlRequest.title">
      <div class="hitl-card__header">
        <span>{{ hitlRequest.title }}</span>
        <div v-if="hasQuestions" class="hitl-card__clarification-nav">
          <span class="hitl-card__clarification-position">{{ questionIndex + 1 }} / {{ questions.length }}</span>
          <button class="hitl-card__clarification-nav-button" type="button" :title="$t('上一题')" :aria-label="$t('上一题')"
            :disabled="submittingApproval || questionIndex === 0" @click="previousQuestion">
            <Icon name="base/rx_ic_arrow_left" size="16" color="currentColor" />
          </button>
          <button class="hitl-card__clarification-nav-button" type="button" :title="$t(questionIndex === questions.length - 1 ? '提交回答' : '下一题')"
            :aria-label="$t(questionIndex === questions.length - 1 ? '提交回答' : '下一题')" :disabled="submittingApproval" @click="nextQuestion">
            <Icon name="base/rx_ic_arrow_right_2" size="16" color="currentColor" />
          </button>
        </div>
      </div>
      <p class="hitl-card__prompt">{{ approvalPrompt }}</p>
      <div v-if="hitlRequest.subjects.length" class="hitl-card__subjects">
        <article v-for="subject in hitlRequest.subjects" :key="subject.id" class="hitl-card__subject">
          <div class="hitl-card__subject-title">{{ subject.title }}</div>
          <pre v-if="subject.diff" class="hitl-card__diff">{{ subject.diff }}</pre>
        </article>
      </div>
      <div v-if="showClarification" class="hitl-card__clarification">
        <button v-for="(option, index) in answerSuggestions" :key="option.id" class="hitl-card__suggestion" type="button"
          :class="{ 'hitl-card__suggestion--selected': isChosenAnswer(option) }" :aria-pressed="isChosenAnswer(option)"
          :disabled="submittingApproval" @click="chooseAnswer(option)">
          <span class="hitl-card__badge">{{ index + 1 }}</span>
          <span class="hitl-card__suggestion-copy">
            <span class="hitl-card__suggestion-title">{{ answerTitle(option) }}</span>
            <Tooltip v-if="answerDescription(option)" :content="answerDescription(option)" :disabled="!isDescriptionClipped(option.id)"
              placement="top" trigger-class="hitl-card__suggestion-description-wrap">
              <span :ref="element => bindDescription(option.id, element)" class="hitl-card__suggestion-description">{{ answerDescription(option) }}</span>
            </Tooltip>
          </span>
          <Icon class="hitl-card__suggestion-arrow" name="base/rx_ic_arrow_right_2" size="18" color="currentColor" />
        </button>
        <label class="hitl-card__freeform">
          <span class="hitl-card__badge hitl-card__badge--edit"><Icon name="base/rx_ic_agent_edit" size="14" color="currentColor" /></span>
          <input type="text" :value="readAnswer(answerKey)" :placeholder="answerPlaceholder" :disabled="submittingApproval"
            @input="updateAnswer(answerKey, $event)" @keydown="handleAnswerKey">
          <button class="hitl-card__skip" type="button" :disabled="submittingApproval" @click="skipAnswer">{{ $t('跳过') }}</button>
        </label>
      </div>
      <div v-if="approvalFields.length" class="hitl-card__inputs">
        <label v-for="field in approvalFields" :key="field.id" class="hitl-card__field">
          <span v-if="field.label">{{ field.label }}</span>
          <textarea v-if="field.kind === 'textarea'" :value="readAnswer(field.id)" :placeholder="field.placeholder"
            :disabled="submittingApproval" @input="updateAnswer(field.id, $event)"></textarea>
          <input v-else type="text" :value="readAnswer(field.id)" :placeholder="field.placeholder"
            :disabled="submittingApproval" @input="updateAnswer(field.id, $event)">
        </label>
      </div>
      <div v-if="approvalActions.length" class="hitl-card__actions">
        <template v-for="choice in approvalActions" :key="choice.id">
          <button v-for="option in choice.options" :key="option.id" class="hitl-card__button"
            :class="`hitl-card__button--${option.variant ?? 'secondary'}`" type="button" :disabled="submittingApproval"
            @click="submitChoiceAnswer(choice, option.value)">{{ option.label }}</button>
        </template>
      </div>
    </div>
    <div v-else ref="composerRef" class="composer" :class="{ 'composer--prompt-field': inline, 'composer--readonly': readonly }"
      :aria-readonly="readonly || undefined" @click="focusEditor" @paste.capture="onPaste">
      <input v-if="!inline" ref="fileInputRef" class="composer-file-input" type="file" multiple @change="onFileChange">
      <input v-if="!inline" class="composer-file-input" type="file" multiple webkitdirectory directory @change="onFolderChange">
      <div class="composer-editor-area">
        <div v-if="!inline && pendingAttachments.length" class="attachment-strip-wrap"
          :class="{ 'attachment-strip-wrap--ping-start': canScrollLeft, 'attachment-strip-wrap--ping-end': canScrollRight }">
          <div ref="attachmentStripRef" class="attachment-strip" @scroll="updateAttachmentScroll">
            <FileCard v-for="attachment in pendingAttachments" :key="attachment.fileId" :attachment="attachment"
              :preview-url="previewUrl(attachment)" removable :remove-label="$t('移除附件')" size="composer"
              @remove="emit('removeAttachment', attachment.fileId)" />
          </div>
          <button type="button" class="attachment-strip__scroll-button attachment-strip__scroll-button--prev"
            :class="{ 'attachment-strip__scroll-button--visible': canScrollLeft }" aria-label="Scroll attachments left"
            :tabindex="canScrollLeft ? 0 : -1" @click.stop="scrollAttachments(-1)">
            <Icon name="base/rx_ic_chevron_left" size="14" color="currentColor" />
          </button>
          <button type="button" class="attachment-strip__scroll-button attachment-strip__scroll-button--next"
            :class="{ 'attachment-strip__scroll-button--visible': canScrollRight }" aria-label="Scroll attachments right"
            :tabindex="canScrollRight ? 0 : -1" @click.stop="scrollAttachments(1)">
            <Icon name="base/rx_ic_chevron_right" size="14" color="currentColor" />
          </button>
        </div>
        <div class="editor-wrap">
          <div v-if="isEmpty" class="composer-placeholder">{{ inline ? fieldPlaceholder : $t('直接对我说出您的需求，输入 {at} 选择窗口，/ 使用模板', { at: '@' }) }}</div>
          <EditorContent v-if="editor" :editor="editor" />
        </div>
      </div>
      <div v-if="!inline && warning" class="composer-warning">{{ warning }}</div>
      <div v-if="!inline" class="composer-row">
        <ComposerToolbar @select="runToolbarAction" />
        <Tooltip :content="$t('停止')" placement="top" :disabled="!canStop">
          <button class="send-button" :class="{ thinking: canStop, loading: uploading }" type="button" :aria-busy="uploading || undefined"
            :aria-label="canStop ? $t('停止') : uploading ? $t('上传中') : 'Send'" :disabled="!canStop && !canSend"
            :title="canStop ? undefined : 'Send'" @click="activateSend">
            <span v-if="canStop" class="send-button__pause" aria-hidden="true"></span>
            <span v-else-if="uploading" class="send-button__spinner" aria-hidden="true"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M7.33332 12.6667V4.49221C6.95089 4.8352 6.52102 5.29457 6.10806 5.7702C5.68411 6.2585 5.29087 6.74911 5.00259 7.11851C4.8588 7.30277 4.7416 7.45619 4.6608 7.56317C4.62041 7.61665 4.58874 7.65864 4.5677 7.68687C4.55723 7.70092 4.54948 7.71173 4.54426 7.71877C4.54165 7.72229 4.53964 7.72491 4.5384 7.72658L4.5371 7.72854L4.49348 7.78127C4.26672 8.03171 3.88276 8.07497 3.60481 7.87046C3.30842 7.65219 3.24476 7.23462 3.46288 6.93817H3.46353V6.93752L3.46418 6.93687C3.46462 6.93627 3.46539 6.93527 3.46614 6.93427C3.46772 6.93213 3.46979 6.92901 3.47265 6.92515C3.47863 6.91708 3.48737 6.90518 3.49869 6.88999C3.52129 6.85967 3.5542 6.81558 3.59635 6.75979C3.68076 6.64802 3.80239 6.48884 3.95116 6.2982C4.24817 5.91761 4.65733 5.40815 5.10155 4.8965C5.54288 4.3882 6.03209 3.86267 6.48892 3.459C6.71652 3.2579 6.9516 3.07257 7.18098 2.93427C7.39214 2.80697 7.68257 2.66669 7.99999 2.66669C8.31741 2.66669 8.60786 2.80698 8.819 2.93427C9.04838 3.07257 9.28347 3.25791 9.51106 3.459C9.96789 3.86266 10.4571 4.38821 10.8984 4.8965C11.3427 5.40815 11.7518 5.91762 12.0488 6.2982C12.1976 6.48884 12.3192 6.64803 12.4036 6.75979C12.4458 6.81558 12.4787 6.85967 12.5013 6.88999C12.5126 6.90517 12.5214 6.91708 12.5273 6.92515C12.5302 6.92901 12.5323 6.93213 12.5338 6.93427C12.5346 6.93528 12.5354 6.93627 12.5358 6.93687L12.5364 6.93752V6.93817H12.5371C12.7552 7.23462 12.6916 7.65218 12.3952 7.87046C12.0987 8.08858 11.6812 8.02492 11.4629 7.72854L11.4616 7.72658C11.4603 7.72491 11.4583 7.7223 11.4557 7.71877C11.4505 7.71173 11.4428 7.70092 11.4323 7.68687C11.4112 7.65864 11.3796 7.61665 11.3392 7.56317C11.2584 7.45619 11.1412 7.30277 10.9974 7.11851C10.7091 6.74911 10.3159 6.2585 9.89192 5.7702C9.47896 5.29458 9.04909 4.8352 8.66666 4.49221V12.6667C8.66666 13.0349 8.36818 13.3334 7.99999 13.3334C7.6318 13.3334 7.33332 13.0349 7.33332 12.6667Z" fill="white" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
    <SuggestionsPopover :anchor="composerRef" :all-selected="allMentionItemsSelected" :has-more="profileHasMore" :load-error="profileLoadError"
      :loading-more="profileLoadingMore" :project-options="projectOptions" :selected-count="selectedMentionCount"
      :selected-ids="selectedMentionIds" :selected-project-id="selectedProjectId" :select-all-loading="profileSelectingAll || profileReloading"
      :state="suggestion" @cancel="cancelMentionSelection" @choose="chooseItem" @confirm="confirmMentionSelection"
      @dismiss="dismissSuggestions" @hover="hoverSuggestion" @load-more="loadMoreProfiles" @navigate="navigateSuggestion"
      @project-change="updateSelectedProject" @read="markSuggestionItemRead" @retry="retryLoadProfiles" @search="updateSuggestionQuery"
      @toggle-all="toggleAllMentionItems" @toggle-top="toggleSuggestionItemTop" />
    <Teleport to="body">
      <div v-if="inputEditor.open" ref="tokenPopoverRef" class="input-token-popover" :class="`input-token-popover--${popoverSide}`"
        :style="popoverStyle" @click.stop="() => {}">
        <div class="input-token-popover__label">{{ inputEditor.label }}</div>
        <div v-if="inputEditor.kind === 'project'" class="input-token-popover__project-list" role="listbox" :aria-label="inputEditor.label">
          <button v-for="project in tokenProjects" :key="project.value" type="button" class="input-token-popover__project-option"
            :class="{ 'input-token-popover__project-option--selected': project.value === inputEditor.value }"
            role="option" :aria-selected="project.value === inputEditor.value" @click="chooseTokenProject(project.value)">{{ project.label }}</button>
          <div v-if="!tokenProjects.length" class="input-token-popover__project-empty">{{ $t('暂无项目') }}</div>
        </div>
        <div v-else class="input-token-popover__row" :class="{ 'input-token-popover__row--textarea': inputEditor.kind === 'textarea',
          'input-token-popover__row--textarea-multiline': inputEditor.kind === 'textarea' && expandedInput }">
          <div class="input-token-popover__input" :class="{ 'input-token-popover__input--url': inputEditor.kind === 'url',
            'input-token-popover__input--textarea': inputEditor.kind === 'textarea' }">
            <span v-if="inputEditor.kind === 'url'" class="input-token-popover__protocol">{{ urlProtocol }}</span>
            <div v-if="inputEditor.kind === 'textarea'" class="input-token-popover__resize-handle" @pointerdown.stop="startTokenResize"></div>
            <textarea v-if="inputEditor.kind === 'textarea'" ref="tokenInputRef" v-model="tokenValue" rows="1" :placeholder="$t('请输入内容')"
              @compositionend="composing = false" @compositionstart="composing = true" @keydown="handleTokenKey"></textarea>
            <input v-else ref="tokenInputRef" v-model="tokenValue" type="text"
              :placeholder="inputEditor.kind === 'url' ? 'example.com' : $t('请输入内容')" @compositionend="composing = false"
              @compositionstart="composing = true" @keydown="handleTokenKey" @paste="inputEditor.kind === 'url' && pasteUrl($event)">
          </div>
          <div ref="tokenActionsRef" class="input-token-popover__actions">
            <button type="button" class="input-token-popover__button" @click="cancelInputTokenEdit">{{ $t('取消') }}</button>
            <button type="button" class="input-token-popover__button input-token-popover__button--primary" @click="saveToken">{{ $t('确定') }}</button>
          </div>
        </div>
        <span class="input-token-popover__arrow" aria-hidden="true"></span>
      </div>
    </Teleport>
  </div>
</template>
