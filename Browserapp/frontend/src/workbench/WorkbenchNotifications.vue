<script setup>
import { computed, onBeforeMount, ref, useTemplateRef } from './workbench-vue.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as OverlayBadge } from './overlaybadge-B-go4u-h.js';
import { n as Badge } from './button-BKeo7L17.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Avatar } from './rx-avatar-h90aIpxl.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { a as Tabs, i as TabPanels, n as TabList, r as TabPanel, t as Tab } from './tab-6bJNMvq4.js';
import { r as Popover } from './contextmenu-BBjizTDn.js';
import { createNotifications } from './workbench-notifications.js';

const { groups, selectedGroup, selectedItems, unreadCount, toggle, markRead, markAllRead, preventDefault, showDetails } = createNotifications({
  templateRef: useTemplateRef, ref, computed, onMounted: onBeforeMount, translate: $t,
});
</script>

<template>
  <div v-tooltip.left="{ value: $t('通知'), showDelay: 600 }" class="flex justify-center">
    <OverlayBadge :value="unreadCount" severity="danger" size="small" :class="unreadCount ? '' : '_empty_12ftq_14'">
      <Button severity="secondary" icon="base/rx_ic_mail" :aria-label="$t('通知')" outlined size="xs" @click="toggle" />
    </OverlayBadge>
    <Popover ref="pop">
      <div class="w-95">
        <div class="flex py-1 px-4 justify-between items-center gap-3.5">
          <div class="_title_12ftq_1">{{ $t('通知') }}</div>
          <Button severity="secondary" size="sm" text icon="base/rx_ic_done" :label="$t('全部已读')" @click="markAllRead" />
        </div>
        <Tabs v-model:value="selectedGroup">
          <TabList :pt="{ tablist: 'px-4 gap-4 h-[40px] !border-[var(--colors-border-border-subtle)]', activeBar: '!h-[2px]' }">
            <Tab v-for="group in groups" :key="group.title" :value="group.value" class="flex flex-1 justify-center items-center gap-1.5">
              <span>{{ group.title }}</span>
              <Badge v-if="group.noRead" :value="group.noRead" severity="danger" size="small" />
            </Tab>
          </TabList>
          <TabPanels class="!pa-0 min-h-[100px] max-h-[280px] overflow-auto">
            <TabPanel v-for="group in groups" :key="group.title" :value="group.value">
              <template v-if="group.list?.length">
                <div v-for="row in group.list" :key="row.id" class="flex gap-2.5 py-3 px-4 items-start _item_12ftq_6"
                  :class="{ _noRead_12ftq_29: !row.status }" @click="markRead(row)">
                  <Icon v-if="row._icon" class="w-5 h-5" :name="row._icon" />
                  <Avatar v-else class="relative cursor-pointer aspect-square" :class="{ _badge_12ftq_18: !row.status }"
                    :avatar="row.avatar || (row.messageModule === 'sys' && row.sysType === 1 ? '/images/system-notice-avatar.png' : '')"
                    :name="row.userName?.slice(0, 2)" :color="row.avatarColor" :size="24" :font-size="12" />
                  <div class="flex-1 flex flex-col gap-1.5">
                    <div class="_text_12ftq_33" :class="group.value" v-html="row.notify" @click="preventDefault"></div>
                    <div class="flex justify-between items-center">
                      <div class="_time_12ftq_49">{{ row.createTime }}</div>
                      <div v-if="row.paramData || selectedItems.has(row.type) || row.windowTransferNo"
                        class="flex items-center gap-1 select-none cursor-pointer _detail_12ftq_55" @click="showDetails(row)">
                        <span>{{ $t('查看详情') }}</span>
                        <Icon name="base/rx_ic_chevron_right" />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="flex justify-center items-center min-h-[150px] max-h-[280px] text-4">{{ $t('暂无消息') }}</div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Popover>
  </div>
</template>
