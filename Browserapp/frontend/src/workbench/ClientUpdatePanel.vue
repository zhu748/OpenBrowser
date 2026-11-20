<script setup>
import { h } from './workbench-vue.js';
import { v as useUser } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';

const user = useUser();
const [openDialog] = useDialog();
function showLog() {
  openDialog({
    header: $t('更新日志'),
    slots: { default: () => h('div', { class: 'pa-4 tt-secondary' }, [
      'OpenBrowser v' + user.appVersion, ' — ' + $t('客户端随本地安装包更新'),
    ]) },
  });
}
</script>

<template>
  <div class="flex flex-col items-start self-stretch gap-3 min-h-65">
    <div class="client-no-data">
      <div class="box">
        <Icon name="base/logo" class="w-12 h-12" />
        <div class="flex flex-col items-center gap-1 self-stretch">
          <div class="version">v{{ user.appVersion }}</div>
          <div class="text-center tips">{{ $t('您的客户端已是最新版本') }}</div>
        </div>
        <div class="flex items-center gap-3">
          <a class="log" href="#" @click.prevent="showLog">{{ $t('上次更新') }}</a>
          <span class="color-[var(--component-dropdown-divider)]">|</span>
          <a class="log" href="#" @click.prevent="showLog">{{ $t('更新日志') }}</a>
        </div>
      </div>
    </div>
  </div>
</template>
