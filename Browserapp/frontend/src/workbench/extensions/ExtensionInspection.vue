<script setup>
import { onMounted, ref } from 'vue';
import { gr as asset } from './utils-BIWenCnY.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useToast } from './usetoast-DphSlejX.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { useExtensionText } from './extension-labels.js';

const props = defineProps({ extensionInfo: { type: Object, required: true } });
const text = useExtensionText();
const ready = ref(false);
const toast = useToast();
const scanners = [
  { name: 'VirusTotal', icon: asset('shield/virustotal.png'), link: 'virustotal.com',
    description: translate('由谷歌运营的知名在线病毒检测平台，被全球安全专家广泛信赖。') },
  { name: 'Metadefender', icon: asset('shield/metadefender.png'), link: 'metadefender.com',
    description: translate('以多重扫描技术和恶意软件检测能力享誉业界，获国际安全机构认可。') },
  { name: 'Kaspersky', icon: asset('shield/kaspersky.png'), link: 'opentip.kaspersky.com',
    description: translate('依托卡巴斯基在网络安全领域的深厚技术，提供实时恶意文件分析服务。') },
];

const desktop = globalThis.electronAPI;
onMounted(async () => {
  try {
    await desktop.send('extension:getExtensionInfo', props.extensionInfo.pluginDir);
    ready.value = true;
  } catch {
    await desktop.send('extension:download', [{ ...props.extensionInfo }]).catch(report);
  }
});
desktop.on('extension:download-progress', event => {
  if (event.extID !== props.extensionInfo.pluginDir) return;
  ready.value = event.percent === 100;
  if (event.errorTips) report({ message: event.errorTips });
});

function report(error) {
  toast.add({ severity: 'error', summary: error.message, life: 3000 });
}

function openDirectory() {
  void desktop.send('extension:showExtensionDir', props.extensionInfo.pluginDir).catch(report);
}
</script>

<template>
  <div class="shield-dialog">
    <div class="extension-info">
      <div class="extension-info-icon"><img :src="extensionInfo.pluginIcon" alt=""></div>
      <div class="extension-info-content">
        <div class="extension-info-name">{{ extensionInfo.pluginName }}</div>
        <div class="extension-info-version"> v{{ extensionInfo.pluginVersion }}</div>
      </div>
    </div>
    <Alert class="whitespace-pre-wrap w-full" :closable="false" type="info" :title="text.securityAlertTitle" />
    <div class="extension-info-step">
      <div class="extension-info-step-title">{{ text.openFolderStep }}</div>
      <Button icon="base/rx_ic_folder" outlined :label="ready ? text.itemFolder : text.itemLoading" :loading="!ready" @click="openDirectory" />
    </div>
    <div class="extension-info-step">
      <div class="extension-info-step-title">{{ translate('2. 将文件上传至下列任意权威渠道进行安全性检查') }}</div>
      <div class="extension-info-step-list">
        <div v-for="scanner in scanners" :key="scanner.name" class="extension-info-step-item">
          <div class="extension-info-step-item-icon"><img :src="scanner.icon" alt=""></div>
          <div class="extension-info-step-item-content">
            <div class="extension-info-step-item-name">
              {{ scanner.name + ' ' }}<a :href="'https://' + scanner.link" target="_blank" class="extension-info-step-item-link">
                <Icon name="base/rx_ic_link" size="14px" />{{ ' ' + scanner.link }}
              </a>
            </div>
            <div class="extension-info-step-item-desc">{{ scanner.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
