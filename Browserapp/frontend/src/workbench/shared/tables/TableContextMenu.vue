<script setup>
import { ref, toRaw, useTemplateRef } from './workbench-vue.js';
import { t as ContextMenu } from './contextmenu-BBjizTDn.js';
import { t as usePreventMask } from './usePreventMask-Cud6gNnu.js';
import { t as Radio } from './radiobutton-B3i1EP5M.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { t as vRipple } from './ripple-DKjDc6yC.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

const props = defineProps({
  type: { type: String, default: 'default' },
  operation: { type: Array, default: () => [] },
  operationHandler: Function, selected: Array, onChange: Function, onHide: Function,
});
const menu = useTemplateRef('ctxMenu');
const selection = ref(props.selected);
const { showPreventMask, hidePreventMask } = usePreventMask();
function label(item) {
  return typeof item.label === 'function' ? item.label() : item.label;
}
function hide() {
  props.onHide?.(toRaw(selection.value));
  selection.value = undefined;
  hidePreventMask();
}
function change() {
  props.onChange?.(toRaw(selection.value));
}
function run(item) {
  if (!item.disabled) props.operationHandler?.(item);
}
defineExpose({
  show: event => menu.value?.show(event),
  hide: () => menu.value?.hide(),
});
</script>
<template>
  <ContextMenu ref="ctxMenu" :model="operation" :pt="{ root: '!border-0.5' }" @before-hide="hide" @show="showPreventMask">
    <template #item="{ item, props: bindings }">
      <div v-if="item.render" class="_renderItem_jhtkl_10" @click.stop><component :is="item.render" /></div>
      <a v-else v-ripple v-tooltip="{ value: item.menuTooltip, delay: 300 }" class="!pa-0" v-bind="bindings.action">
        <label v-if="type === 'radio'" class="cursor-pointer _item_jhtkl_1" :for="item.value" @click.stop>
          <Radio v-model="selection" name="radio" :input-id="item.value" :value="item.value" @click.stop @change="change" />
          <span>{{ label(item) }}</span>
        </label>
        <label v-else-if="type === 'checkbox'" class="cursor-pointer _item_jhtkl_1" :for="item.value" @click.stop>
          <Checkbox v-model="selection" name="checkbox" :input-id="item.value" :value="item.value" @click.stop />
          <span>{{ label(item) }}</span>
        </label>
        <div v-else-if="type === 'default'" class="_item_jhtkl_1" :class="{ _disabled_jhtkl_15: item.disabled }" @click="run(item)">
          <Icon v-if="item.icon" :class="item.iconClass" :name="item.icon" />
          <span class="flex-1">{{ label(item) }}</span>
          <div v-if="item.suffixLabel || item.suffixIcon" class="flex items-center gap-1 shrink-0">
            <Icon v-if="item.suffixIcon" :class="item.iconClass" :name="item.suffixIcon" :size="item.suffixIconSize" />
            <span v-if="item.suffixLabel" :class="item.suffixLabelClass">{{ item.suffixLabel }}</span>
          </div>
          <Icon v-if="item.items && !item.hideSubmenuIcon" :class="item.iconClass" name="base/rx_ic_chevron_right" />
        </div>
      </a>
    </template>
  </ContextMenu>
</template>
