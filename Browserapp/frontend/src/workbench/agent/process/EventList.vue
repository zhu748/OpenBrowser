<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { u as Markdown } from './CreateTemplateDialog-Bpq9OLTG.js';
import Collapse from './workbench-agent-collapse.js';
import EventRow from './workbench-agent-process-event-row.js';
import ScriptLog from './workbench-agent-script-log.js';
import WebSearchLabel from './workbench-agent-web-search-label.js';
import { useEventList } from './workbench-agent-process-event-state.js';

const props = defineProps({ events: { type: Array, required: true }, running: Boolean, scope: { type: String, default: 'events' }, compact: Boolean });
const state = useEventList(props);
const { items, itemKey, logRegion, isExpanded, toggle, active, isWebSearch, windowLabel, logsTitle,
  groupTitle, groupIcon, lastMeaningfulEvent, scrollMask, measure, bindRegion } = state;
</script>

<template>
  <div class="agent-event-list" :class="{ 'agent-event-list--compact': compact }">
    <template v-for="item in items" :key="itemKey(item)">
      <div v-if="item.type === 'content'" class="process-content"><Markdown :content="item.event.content" :streaming="running && active(item)" variant="answer" /></div>
      <EventRow v-else-if="item.type === 'event'" :state="state" :event="item.event" :compact="compact" :highlight="active(item)" />
      <div v-else-if="item.type === 'script_logs'" class="process-event">
        <button class="event-trigger" type="button" @click="toggle(item)">
          <Icon name="roxy-agent/rx-ic-scripts" size="16" /><span :class="{ 'process-running-text': active(item) }">{{ logsTitle(item) }}</span>
          <Icon name="base/rx_ic_chevron_down" size="12" :class="{ collapsed: !isExpanded(item) }" />
        </button>
        <Collapse :expanded="isExpanded(item)">
          <div class="event-detail-content">
            <div :ref="element => bindRegion(logRegion(item), element)" class="script-log-grid-scroll"
              :class="{ 'scroll-mask--top': scrollMask(logRegion(item)).canScrollUp, 'scroll-mask--bottom': scrollMask(logRegion(item)).canScrollDown }"
              style="--event-group-max-height: 308px" @scroll.passive="measure(logRegion(item))">
              <div class="script-log-grid">
                <ScriptLog v-for="(event, index) in item.events" :key="event.id" :compact="compact" :event="event" :window-label="windowLabel(event, index)" />
              </div>
            </div>
          </div>
        </Collapse>
      </div>
      <div v-else class="process-event-group">
        <button class="event-trigger" type="button" @click="toggle(item)">
          <Icon :name="groupIcon(item)" size="16" />
          <WebSearchLabel v-if="isWebSearch(lastMeaningfulEvent(item.events))" :event="lastMeaningfulEvent(item.events)" :highlight="active(item)" />
          <span v-else :class="{ 'process-running-text': active(item) }">{{ groupTitle(item) }}</span>
          <Icon name="base/rx_ic_chevron_down" size="12" :class="{ collapsed: !isExpanded(item) }" />
        </button>
        <Collapse :expanded="isExpanded(item)">
          <div :ref="element => bindRegion(item.id, element)" class="event-group-body"
            :class="{ 'event-group-body--scrollable': item.events.length > 10, 'scroll-mask--top': scrollMask(item.id).canScrollUp,
              'scroll-mask--bottom': scrollMask(item.id).canScrollDown }" style="--event-group-max-height: 308px" @scroll.passive="measure(item.id)">
            <div class="event-group-items">
              <EventRow v-for="event in item.events" :key="event.id" :state="state" :event="event" :compact="compact" grouped />
            </div>
          </div>
        </Collapse>
      </div>
    </template>
  </div>
</template>
