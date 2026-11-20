<script setup>
import { h } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { o as useDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import ProxyFilterDrawer from './workbench-proxy-filter-drawer.js';

const props = defineProps({ title: { default: () => $t('筛选代理 IP') }, filter: { type: Object, required: true } });
const { showDrawer, hideDrawer } = useDrawer();
function open() {
  props.filter.openDrawer();
  showDrawer({
    title: props.title, dismissable: false,
    slots: { container: () => h(ProxyFilterDrawer, {
      filter: props.filter, onApply() { props.filter.apply(); hideDrawer(); },
    }) },
  });
}
function clear() { props.filter.clearApplied(); hideDrawer(); }
</script>

<template>
  <div class="proxy-filter">
    <Button size="xxs" variant="outlined" :severity="filter.hasActiveFilters.value ? 'primary' : 'secondary'" @click.stop="open">
      <Icon name="base/rx_ic_filter" :size="14" />
      <template v-if="filter.activeFilterSummary.value">
        <span v-tooltip.top="{ value: filter.activeFilterTooltip.value, class: 'proxy-filter-summary-tooltip' }" class="proxy-filter__summary">
          {{ filter.activeFilterSummary.value }}
        </span>
        <span v-tooltip.top="$t('重置')" class="proxy-filter__clear" :aria-label="$t('重置')" @mousedown.stop @click.stop="clear">
          <Icon name="base/rx_ic_delete" :size="12" />
        </span>
      </template>
      <span v-else>{{ $t('筛选') }}</span>
    </Button>
  </div>
</template>
