<script setup>
import { computed, ref, toRaw, useTemplateRef } from './workbench-vue.js';
import { t as Menu } from './menu-WG3IuJIC.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vRipple } from './ripple-DKjDc6yC.js';
import { t as usePreventMask } from './usePreventMask-Cud6gNnu.js';
import MenuSelectionItem from './workbench-menu-selection-item.js';

const props = defineProps({ mode: Object, model: Array, menuProps: { type: Object, default: () => ({}) } });
const classes = { root: '_root_7j351_1', item: '_item_7j351_6', button: '_button_7j351_13' };
const { showPreventMask, hidePreventMask } = usePreventMask();
const menu = useTemplateRef('menu');
const value = ref(props.mode?.value);
const options = computed(() => {
  const items = props.mode?.options || props.model;
  return items && [...items];
});
const bindings = computed(() => {
  const { onHide, ...attrs } = props.menuProps;
  return attrs;
});

function onHide() {
  hidePreventMask();
  props.menuProps.onHide?.({ type: props.mode?.type, value: toRaw(value.value) });
}

async function execute(event, item) {
  // Keep the legacy command payload free of rendering details.
  const { render, ...data } = item;
  await data.command?.({ originalEvent: event, item: data });
  menu.value?.hide();
}

defineExpose({ toggle: event => menu.value?.toggle(event) });
</script>

<template>
  <Menu ref="menu" v-bind="bindings" :model="options" popup
    :pt="{ root: classes.root, item: classes.item, list: 'overflow-y-auto max-h-80' }"
    @hide="onHide" @show="showPreventMask">
    <template #item="{ item, props: itemProps }">
      <MenuSelectionItem v-if="mode" v-ripple v-bind="itemProps.action" v-model="value" :type="mode.type"
        :field="mode.field" :item="item" @click.stop>
        <component v-if="item.render" :is="item.render" :item="item" :props="itemProps" />
      </MenuSelectionItem>
      <a v-else v-bind="itemProps.action" class="max-w-80 !pa-0">
        <component v-if="item.render" :is="item.render" :item="item" :props="itemProps"
          :btn-pt="{ root: classes.button }" @click.stop="execute($event, item)" />
        <Button v-else class="w-full !justify-start" :disabled="item.disabled" :icon="item.icon"
          :label="item.label" severity="secondary" text :pt="{ root: classes.button }"
          @click.stop="execute($event, item)" />
      </a>
    </template>
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </Menu>
</template>
