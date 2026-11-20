<script setup>
import { h } from 'vue';
import { pi as isWindows } from './utils-BIWenCnY.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vRipple } from './ripple-DKjDc6yC.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Switch } from './toggleswitch-DKDK40Mk.js';
import Menubar from './sync-menubar.js';
import { useSyncActionState } from './sync-action-state.js';

const desktop = globalThis.electronAPI;
function command(channel, options) {
  return () => desktop.send(channel, options).catch(error => globalThis.__localUiError(error.message));
}

function makeMenu(preferences) {
  const shortcut = preferences.value.shortcutKey[isWindows ? 'windows' : 'mac'];
  function delayToggle(key) {
    return () => h(Switch, {
      modelValue: preferences.value.simulate[key],
      'onUpdate:modelValue': value => { preferences.value.simulate[key] = value; },
    });
  }
  return [{
    label: translate('窗口布局'), icon: 'base/rx_ic_layout', items: [
      { label: translate('宫格布局'), shortcutKey: shortcut.gridLayout, command: command('syncControl:doLayout', { type: 'grid' }) },
      { label: translate('堆叠布局'), shortcutKey: shortcut.stackLayout, command: command('syncControl:doLayout', { type: 'stack' }) },
      { separator: true },
      { label: translate('自定义'), command: command('syncControl:openPreferencesDialog', { tab: 'customLayout' }) },
    ],
  }, {
    label: translate('批量输入'), icon: 'base/rx_ic_keyboard', command: command('syncControl:openBatchInputsDialog'),
  }, {
    label: translate('标签控制'), icon: 'base/rx_ic_tabs', items: [
      { id: 'unifyTabs', label: translate('统一标签页'), hidden: true, shortcutKey: shortcut.unifiedTabs, command: command('syncControl:unifyTabs') },
      { label: translate('关闭其他标签页'), shortcutKey: shortcut.closeOtherTabs, command: command('syncControl:closeOtherTabs') },
      { label: translate('关闭当前标签页'), shortcutKey: shortcut.closeCurrentTab, command: command('syncControl:closeCurrentTab') },
      { id: 'closeBlankTabs', label: translate('关闭空白标签页'), shortcutKey: shortcut.closeBlankTabs, command: command('syncControl:closeBlankTabs') },
      { separator: true },
      { id: 'openOpenSitesDialog', label: translate('打开网址'), shortcutKey: shortcut.openSites, command: command('syncControl:openOpenSitesDialog') },
    ],
  }, {
    label: translate('仿真操作'), icon: 'base/rx_ic_finger_tap', items: [
      { label: translate('点击延迟'), labelTip: translate('点击延迟'), suffix: delayToggle('enableClickDelay') },
      { label: translate('输入延迟'), suffix: delayToggle('enableInputDelay') },
      { separator: true },
      { label: translate('仿真参数设置'), command: command('syncControl:openPreferencesDialog', { tab: 'simulate' }) },
    ],
  }];
}

const {
  active, count, toggleIcon, menu, mixedCoreVersions, listTooltip, settingsTooltip,
  enter, leave, showTools, toggle, showAll, stop, openSettings, openList,
} = useSyncActionState(makeMenu);
</script>

<template>
  <div ref="actionBar" class="action-bar" @mouseenter="enter" @mouseleave="leave">
    <div class="top-bar">
      <div class="sync-text" :style="{ color: active ? '#0cef4c' : '#898989' }" @mouseenter="showTools">
        {{ active ? translate('{count} 个窗口正在同步中', { count }) : translate('已暂停同步') }}<div class="dots"></div>
      </div>
      <div class="actions">
        <div class="action-item" @click="showAll"><Icon name="base/rx_ic_show_profile" />{{ ' ' + translate('显示所有窗口') }}</div>
        <div class="action-item" @click="toggle"><Icon :name="toggleIcon" />{{ ' ' + (active ? translate('暂停同步') : translate('恢复同步')) }}</div>
        <div class="action-item stop" @click="stop"><Icon name="base/rx_ic_shut_down" />{{ ' ' + translate('停止同步') }}</div>
      </div>
    </div>
    <div ref="bottomBar" class="bottom-bar">
      <div class="menubar-container">
        <Menubar :model="menu">
          <template #item="{ item, props, hasSubmenu }">
            <a v-ripple :href="item.url" :target="item.target" v-bind="props.action">
              <Icon v-if="item.icon" :name="item.icon" size="16px" />
              <span class="operation-label">{{ item.label }}</span>
              <span v-if="item.suffix" @click.stop><component :is="item.suffix" /></span>
              <span v-if="item.shortcutKey" class="shortcut-key">{{ item.shortcutKey }}</span>
              <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down"></span>
            </a>
          </template>
        </Menubar>
        <div class="split-line"></div>
        <div v-tooltip.top="{ value: listTooltip, pt: { text: '!whitespace-nowrap !break-keep' } }" class="other-item" @click="openList">
          <Icon name="base/rx_ic_list_2" />
        </div>
        <div v-tooltip.top="settingsTooltip" class="other-item" @click="openSettings">
          <Icon name="base/rx_ic_gear" />
        </div>
      </div>
      <div v-if="mixedCoreVersions" class="tips">{{ translate('注意：窗口的内核不一致可能会影响同步操作的效果') }}</div>
    </div>
  </div>
</template>
