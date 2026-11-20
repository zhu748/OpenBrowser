<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
const router = useRouter();
</script>

<template>
  <div class="sidebar-footer">
    <button class="feedback-button" type="button" @click="router.push('/browser/list')">
      <Icon name="base/rx_ic_browser" :size="18" /><span>窗口管理</span>
    </button>
    <div class="footer-actions">
      <button class="settings-button" type="button" @click="router.push('/agent-console/settings')">
        <Icon name="roxy-agent/rx-ic-settings" :size="18" /><span>设置</span>
      </button>
    </div>
  </div>
</template>
