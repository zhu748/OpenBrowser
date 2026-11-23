<script setup>
import { computed, ref, watch } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { gi as supportsVersion } from './utils-BIWenCnY.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import MenuItem from './workbench-sidebar-menu-item.js';

defineOptions({ name: 'SidebarLinks', inheritAttrs: false });
const props = defineProps({
  items: { type: Array, default: () => [] }, collapsed: Boolean,
  collapsedChildren: { type: Boolean, default: undefined }, level: { default: 0 },
});
const badgeMap = defineModel('badgeMap');
const route = useRoute();
const collapsedItems = ref({});
const collapsible = computed(() => props.collapsedChildren != null);
const isGroup = item => item.meta?.type === 'group';
const isFlat = item => item.meta?.type === 'flat';
const nestedLevel = item => isGroup(item) || isFlat(item) ? props.level : props.level + 1;

function isFolded(item) {
  return !isFlat(item) && !(isGroup(item) && props.collapsed) && item.name !== undefined && Boolean(collapsedItems.value[item.name]);
}
function toggleGroup(item) {
  if (item.name !== undefined) collapsedItems.value[item.name] = !collapsedItems.value[item.name];
}
watch(() => route.matched, matched => {
  const active = new Set(matched.map(record => record.name));
  for (const item of props.items) {
    if (isGroup(item) && item.name && (active.has(item.name) || item.children?.some(child => active.has(child.name))))
      collapsedItems.value[item.name] = false;
  }
}, { immediate: true });
useCssVars(() => ({ v44afe9a0: props.level }));
</script>

<template>
  <div v-if="items.length" v-bind="$attrs" class="sub-menu-wrap" :class="['level-' + level, { collapsed, collapsible, folded: !!collapsedChildren }]"
    :style="{ '--child-count': items.length }" :inert="collapsedChildren || undefined">
    <div class="sub-menu-clip">
      <div class="sub-menu">
        <template v-for="item in items" :key="item.name">
          <template v-if="isGroup(item)">
            <div v-if="collapsed" class="line"></div>
            <button v-else type="button" class="group-title" @click="toggleGroup(item)">
              <span class="group-title-text">{{ item.meta?.title }}</span>
              <Icon name="base/rx_ic_chevron_up" class="group-chevron" :class="{ collapsed: collapsedItems[item.name] }" :size="16" />
            </button>
          </template>
          <MenuItem v-else-if="!isFlat(item) && (!item.meta?.version || supportsVersion($appVersion, ...item.meta.version))"
            v-model:open="collapsedItems[item.name]" v-model:badge-map="badgeMap" :class="'menu_' + item.name?.toString()"
            :item="item" :collapsed="collapsed" />
          <SidebarLinks v-if="item.children?.length" v-model:badge-map="badgeMap" :items="item.children" :level="nestedLevel(item)"
            :collapsed="collapsed" :collapsed-children="isFolded(item)" />
        </template>
      </div>
    </div>
  </div>
</template>
