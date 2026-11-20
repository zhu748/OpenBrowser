import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from './workbench-vue.js';
import { L as windowDirectory, z as windowNames } from './CreateTemplateDialog-Bpq9OLTG.js';
import { processEventRuntime } from './hook-CnJE4hRq.js';

const fallbackScroll = { canScrollUp: false, canScrollDown: false };
const defaultToolIcon = 'roxy-agent/rx-ic-tool';

export function useEventList(props) {
  const { groupEvents, scrollSignatures, lastMeaningfulEvent, toolLabel, patchLabel, toolFamily,
    parseSearch, isSkillPath, retryIcon, summarizeTools } = processEventRuntime;
  const expanded = ref({});
  const masks = ref({});
  const regions = new Map();
  const regionIds = new WeakMap();
  const items = computed(() => groupEvents(props.events, props.scope));
  const signatures = computed(() => scrollSignatures(items.value, expanded.value));
  let observer;

  function itemKey(item) {
    return item.type === 'group' || item.type === 'script_logs' ? item.id : item.event.id;
  }
  function logRegion(item) {
    return 'script-grid:' + item.id;
  }
  function isExpanded(item) {
    return expanded.value[item.id] ?? item.expanded === true;
  }
  function toggle(item) {
    expanded.value = { ...expanded.value, [item.id]: !isExpanded(item) };
  }
  function active(item) {
    const lastItem = items.value.at(-1);
    return Boolean(props.running && lastItem && itemKey(lastItem) === itemKey(item));
  }
  function isWebSearch(event) {
    return event?.type === 'tool_call' && toolFamily(event.toolName) === 'web_search' && parseSearch(event.input) !== undefined;
  }
  function describeTool(event) {
    if (event.label) return event.label;
    const metadata = { finished: event.finished, patchType: event.patchType, target: event.target };
    const label = toolLabel(event.toolName, event.status, event.input, metadata);
    if (patchLabel(event.toolName, event.input, metadata)?.kind === 'entries') return label;
    return ['apply_patch', 'read_file', 'exec_command'].includes(toolFamily(event.toolName)) || !event.target ? label : label + ' ' + event.target;
  }
  function scriptTitle(event) {
    if (!event.scriptName) return event.title || $t('运行脚本');
    const name = event.scriptName;
    const absolute = name.startsWith('/') || /^[a-z]:[\\/]/i.test(name) || name.startsWith('\\\\');
    return $t('运行脚本') + ' ' + (absolute ? name.split(/[\\/]/).filter(Boolean).at(-1) || name : name);
  }
  function windowLabel(event, index) {
    // The directory is reactive even when the display helper returns a plain string.
    windowDirectory.value;
    const name = event.dirId ? windowNames([event.dirId])[0] : '';
    return name?.replace(/^@+/, '') || $t('窗口 {index}', { index: index + 1 });
  }
  function logsTitle(item) {
    return item.events[0] ? scriptTitle(item.events[0]) : $t('运行脚本');
  }
  function eventTitle(event) {
    if (event.type === 'tool_call') return describeTool(event);
    if (event.type === 'script_log') return scriptTitle(event);
    if (event.type === 'skill_load') return (event.status === 'success' ? '已加载 skill：' : '加载 skill：') + event.skillPath;
    if (['thinking', 'context_compacted', 'retrying', 'hitl'].includes(event.type)) return event.title;
    return event.title || $t('执行过程');
  }
  function eventIcon(event) {
    switch (event.type) {
      case 'thinking': return 'roxy-agent/rx-ic-thinking';
      case 'script_log': return 'roxy-agent/rx-ic-scripts';
      case 'skill_load': return 'roxy-agent/rx-ic-skills';
      case 'retrying': return retryIcon(event.status);
      case 'hitl': return event.requestKind === 'clarification' ? 'base/rx_ic_ask' : 'roxy-agent/rx-ic-ask';
      case 'tool_call': {
        const target = event.target || (typeof event.input?.path === 'string' ? event.input.path : undefined);
        if (toolFamily(event.toolName) === 'read_file' && isSkillPath(target)) return 'roxy-agent/rx-ic-skills';
        if (isWebSearch(event)) return 'roxy-agent/rx-ic-search';
      }
    }
    return defaultToolIcon;
  }
  function groupTitle(group) {
    const tools = group.events.filter(event => event.type === 'tool_call');
    if (tools.length && group.events.every(event => event.type === 'thinking' || event.type === 'tool_call')) {
      const summary = summarizeTools(tools);
      if (summary) return summary;
    }
    const event = lastMeaningfulEvent(group.events);
    return event ? eventTitle(event) : $t('执行过程');
  }
  function groupIcon(group) {
    const event = lastMeaningfulEvent(group.events);
    return event ? eventIcon(event) : defaultToolIcon;
  }
  function scrollMask(id) {
    return masks.value[id] ?? fallbackScroll;
  }
  function measure(id) {
    const element = regions.get(id);
    if (!element) return;
    const limit = element.scrollHeight - element.clientHeight;
    const next = { canScrollUp: limit > 1 && element.scrollTop > 1, canScrollDown: limit > 1 && element.scrollTop < limit - 1 };
    const old = masks.value[id];
    if (old?.canScrollUp !== next.canScrollUp || old.canScrollDown !== next.canScrollDown) masks.value = { ...masks.value, [id]: next };
  }
  function bindRegion(id, element) {
    const old = regions.get(id);
    if (old === element) return;
    if (old) {
      observer?.unobserve(old);
      regionIds.delete(old);
    }
    if (!element) {
      regions.delete(id);
      return;
    }
    regions.set(id, element);
    regionIds.set(element, id);
    observer?.observe(element);
    requestAnimationFrame(() => {
      if (id.startsWith('thinking:') || id.startsWith('script:')) element.scrollTop = element.scrollHeight;
      measure(id);
    });
  }
  function measureAll() {
    for (const id of regions.keys()) measure(id);
  }
  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') return;
    observer = new ResizeObserver(entries => {
      for (const { target } of entries) {
        const id = regionIds.get(target);
        if (id) measure(id);
      }
    });
    for (const element of regions.values()) observer.observe(element);
    nextTick(measureAll);
  });
  watch(expanded, () => nextTick(measureAll), { flush: 'post' });
  watch(signatures, async (current, previous) => {
    const affected = Object.entries(current).filter(([id, signature]) => previous[id] !== undefined && previous[id] !== signature
      && expanded.value[id.replace(/^(?:thinking|script-grid):/, '')] === true);
    if (!affected.length) return;
    await nextTick();
    for (const [id] of affected) {
      const element = regions.get(id);
      if (!element) continue;
      element.scrollTop = element.scrollHeight;
      measure(id);
    }
  }, { flush: 'post' });
  onBeforeUnmount(() => {
    observer?.disconnect();
    regions.clear();
  });
  return { items, itemKey, logRegion, isExpanded, toggle, active, isWebSearch, windowLabel, logsTitle, eventTitle, eventIcon,
    groupTitle, groupIcon, lastMeaningfulEvent, scrollMask, measure, bindRegion };
}
