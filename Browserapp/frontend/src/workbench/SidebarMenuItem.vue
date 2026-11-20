<script setup>
import { computed } from './workbench-vue.js';
import { ct as watchEffect } from './runtime-core.esm-bundler-CBj16o9G.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vRipple } from './ripple-DKjDc6yC.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { m as menuCommands } from './hook-CnJE4hRq.js';
import { n as useRoxyClaw } from './roxy-claw-1j3mqM_d.js';

const props = defineProps({ item: { type: Object, required: true }, collapsed: Boolean });
const folded = defineModel('open', { type: Boolean, default: false });
const badgeMap = defineModel('badgeMap', { default: () => ({}) });
const route = useRoute();
const claw = useRoxyClaw();
const meta = computed(() => props.item.meta ?? {});
const hasChildren = computed(() => props.item.children?.some(child => !child.meta?.hideInMenu));
const parentActive = computed(() => !!meta.value.activeWithChildren && props.item.name != null
  && route.matched.some(record => record.name === props.item.name));
if (hasChildren.value) {
  folded.value = true;
  watchEffect(() => {
    if (route.matched.some(record => record.name === props.item.name)) folded.value = false;
    if (props.collapsed) folded.value = true;
  });
}
function select(event, navigate) {
  if (meta.value.type === 'button') {
    (menuCommands[meta.value.menuAction] ?? meta.value.onClick)?.(event);
  } else if (!hasChildren.value || props.item.redirect) navigate();
  if (badgeMap.value?.[props.item.name]) {
    badgeMap.value[props.item.name] = false;
    localStorage.setItem('badgeMapCache', JSON.stringify(badgeMap.value));
  }
}
</script>

<template>
  <div class="menu-item-content" :class="{ collapsed }">
    <RouterLink v-slot="{ navigate, href, isActive }" :to="{ name: item.name, params: meta.params, query: { title: meta.title } }" custom>
      <a v-ripple v-tooltip="{ value: meta.title, disabled: !collapsed }" class="menu-item"
        :class="{ active: isActive || parentActive, 'roxy-agent': meta.isRoxyAgent, 'roxy-claw': meta.isRoxyClaw }"
        :href="hasChildren || meta.type === 'button' ? undefined : href" @click.prevent="select($event, navigate)">
        <template v-if="meta.isRoxyClaw">
          <Icon v-if="meta.icon" :name="meta.icon" class="menu-icon" :size="18" />
          <div class="flex items-center justify-between w-full menu-title">
            <div class="min-w-0" :title="meta.title"><span class="roxy-agent-title ellipsis-1">{{ meta.title }}</span></div>
            <svg v-if="claw.isEnabled" v-tooltip="$t('RoxyClaw 已启动')" class="text-3" width="1em" height="1em" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="6" fill="var(--colors-icon-icon-success)" />
              <circle cx="10" cy="10" r="8" stroke="rgba(28, 201, 77, 0.40)" stroke-opacity="0.4" stroke-width="4" />
            </svg>
          </div>
        </template>
        <template v-else-if="meta.isRoxyAgent">
          <Icon v-if="meta.icon" :name="meta.icon" class="menu-icon" :size="18" />
          <div class="flex items-center gap-2 menu-title">
            <span class="roxy-agent-title ellipsis-1">{{ meta.title }}</span>
            <span v-if="meta.showNewBadge" class="new-badge">{{ $t('自动化') }}</span>
          </div>
        </template>
        <template v-else>
          <Icon v-if="meta.icon" :name="meta.icon" class="menu-icon rounded-0.75" :size="18" />
          <div class="relative flex items-center gap-1.5 overflow-hidden menu-title" :title="meta.title">
            <span class="min-w-0 ellipsis-1">{{ meta.title }}</span>
            <Icon v-if="meta.showNewBadge" class="new-badge-icon" name="base/new_badge" />
          </div>
          <Icon v-if="meta.external && !collapsed" name="base/rx_ic_arrow_top_right" class="menu-icon external" :size="12" />
        </template>
        <Icon v-if="hasChildren" :name="folded ? 'base/rx_ic_plus' : 'base/rx_ic_minus'" class="menu-icon plus" @click.stop="folded = !folded" />
      </a>
    </RouterLink>
  </div>
</template>
