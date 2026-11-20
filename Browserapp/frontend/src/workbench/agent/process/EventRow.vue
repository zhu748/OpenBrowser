<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import Collapse from './workbench-agent-collapse.js';
import ScriptLog from './workbench-agent-script-log.js';
import WebSearchLabel from './workbench-agent-web-search-label.js';

defineProps({ event: { type: Object, required: true }, state: { type: Object, required: true }, compact: Boolean, grouped: Boolean, highlight: Boolean });
</script>

<template>
  <div v-if="event.type === 'thinking'" class="process-event">
    <button class="event-trigger" type="button" @click="state.toggle(event)">
      <Icon name="roxy-agent/rx-ic-thinking" size="16" /><span :class="{ 'process-running-text': highlight }">{{ event.title }}</span>
    </button>
  </div>
  <div v-else-if="event.type === 'script_log'" class="process-event">
    <button class="event-trigger" type="button" @click="state.toggle(event)">
      <Icon name="roxy-agent/rx-ic-scripts" size="16" /><span :class="{ 'process-running-text': highlight }">{{ state.eventTitle(event) }}</span>
      <Icon name="base/rx_ic_chevron_down" size="12" :class="{ collapsed: !state.isExpanded(event) }" />
    </button>
    <Collapse :expanded="state.isExpanded(event)">
      <div class="event-detail-content"><ScriptLog class="script-log-panel--single" :compact="compact" :event="event" :window-label="state.windowLabel(event, 0)" /></div>
    </Collapse>
  </div>
  <div v-else-if="event.type === 'hitl' && !grouped" class="process-event">
    <button class="event-trigger" type="button" @click="state.toggle(event)">
      <Icon :name="state.eventIcon(event)" size="16" /><span :class="{ 'process-running-text': highlight }">{{ event.title }}</span>
      <Icon name="base/rx_ic_chevron_down" size="12" :class="{ collapsed: !state.isExpanded(event) }" />
    </button>
    <Collapse :expanded="state.isExpanded(event)">
      <div class="event-detail-content">
        <div v-if="event.clarificationAnswers?.length" class="hitl-event__answers">
          <div v-for="answer in event.clarificationAnswers" :key="answer.id" class="hitl-event__answer">
            <p>{{ answer.question }}</p><p class="hitl-event__detail">{{ answer.answer }}<span v-if="answer.recommended"> ({{ $t('Recommended') }})</span></p>
          </div>
        </div>
        <div v-else class="hitl-event__body">
          <p>{{ event.prompt }}</p><p v-if="event.detail || event.description" class="hitl-event__detail">{{ event.detail || event.description }}</p>
        </div>
      </div>
    </Collapse>
  </div>
  <div v-else class="inline-event">
    <Icon :name="state.eventIcon(event)" size="16" />
    <WebSearchLabel v-if="state.isWebSearch(event)" :event="event" :highlight="highlight" />
    <span v-else :class="{ 'process-running-text': highlight }">{{ state.eventTitle(event) }}</span>
  </div>
</template>
