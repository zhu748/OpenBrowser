<script setup>
import { computed } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { i as AccordionContent, n as AccordionPanel, r as AccordionHeader, t as Accordion } from './rx-accordion-BvZbJmSm.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import WindowFields from './workbench-profile-window-fields.js';

const props = defineProps({ accordions: Object, inputsGroup: { type: Array, default: () => [] } });
const outside = computed(() => props.accordions?.panels.filter(panel => panel.placement === 'outside') ?? []);
const collapsible = computed(() => props.accordions?.panels.filter(panel => panel.placement === 'accordion') ?? []);
function groups(panel) {
  return [panel.groupIndex, ...(panel.extraGroupIndexes ?? [])];
}
</script>

<template>
  <div class="flex-ovh-1 min-h-0 min-w-0 w-full flex-col">
    <div v-if="accordions" class="content min-h-0 min-w-0 flex-1 overflow-y-auto pb-4">
      <slot name="before"></slot>
      <WindowFields v-for="panel in outside" :key="panel.value" class="px-4" :inputs="inputsGroup[panel.groupIndex]"
        :inputs-group="inputsGroup" :variant="panel.variant" :excluded-fields="panel.excludedFields" />
      <Accordion :value="accordions.value" multiple>
        <AccordionPanel v-for="panel in collapsible" :key="panel.value" :value="panel.value" :pt="{ root: '!border-dashed' }">
          <AccordionHeader as="div" v-slot="{ active }">
            <div class="flex items-center gap-3 header">
              <Icon class="header-icon" :name="active ? 'base/rx_ic_minus' : 'base/rx_ic_plus'" size="20" />
              <span class="inline-flex items-center gap-1">
                <span>{{ panel.title }}</span>
                <Icon v-if="panel.tooltip" v-tooltip.top="{ value: panel.tooltip, showDelay: 500 }"
                  name="base/rx_ic_info" size="14" color="var(--colors-icon-icon-note)" />
              </span>
            </div>
          </AccordionHeader>
          <AccordionContent>
            <div class="flex flex-col gap-4">
              <WindowFields v-for="(index, order) in groups(panel)" :key="`${panel.value}-${index}`"
                :inputs="inputsGroup[index]" :inputs-group="inputsGroup" :variant="order === 0 ? panel.variant : 'settings'"
                :excluded-fields="order === 0 ? panel.excludedFields : undefined" />
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </div>
</template>
