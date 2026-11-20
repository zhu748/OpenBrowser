<script setup>
import { computed, ref } from './workbench-vue.js';
import { Pr as isValidUrl } from './utils-BIWenCnY.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { n as workspaceCode } from './workspace-CNvgSgaH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as NumberInput } from './m-input-number-BOH1hUUB.js';
import { n as InputGroup, t as InputUnit } from './inputicon-Bn1KerIx.js';
import { t as Switch } from './rx-toggle-switch-BI8eb18U.js';
import { t as Textarea } from './m-input-textarea-33WQDaSq.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

const props = defineProps({ data: { type: Array, required: true }, onConfirm: Function });
const emit = defineEmits(['close']);
const labels = useProfileLabels();
const [, showError] = useToast();
const expanded = ref(false);
const running = ref(false);
const urls = ref('');
const scrollRange = ref([]);
const delayRange = ref([]);
const forbidImage = ref(true);
const forbidMedia = ref(true);
const closeProfile = ref(false);
const startupParam = ref(false);
const urlHelp = computed(() => $t('2、如需要打开多个网址, 请按每行一个特定的网址的格式填写'));
const ranges = computed(() => [
  { label: $t('单次滚动范围'), values: scrollRange.value, min: 100, upper: '500', unit: 'px' },
  { label: $t('停留时长'), values: delayRange.value, min: 0, upper: '500', unit: 'ms' },
]);

async function run() {
  if (running.value) return;
  const cookieRobotUrls = urls.value.split('\n').map(url => url.trim()).filter(Boolean);
  if (!cookieRobotUrls.length || cookieRobotUrls.some(url => !isValidUrl(url))) {
    showError(-1, $t('请输入正确的网址'));
    return;
  }
  running.value = true;
  try {
    await props.onConfirm?.({
      customParams: { $keepOriginOpenUrl: true, openWorkbench: 0, forbidImage: forbidImage.value, forbidMedia: forbidMedia.value, startupParam: startupParam.value },
      robotParams: {
        cookieRobotUrls, delayRange: delayRange.value.length ? delayRange.value.slice() : undefined,
        scrollRange: scrollRange.value.length ? scrollRange.value.slice() : undefined, closeProfile: closeProfile.value,
      },
    });
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <div class="relative w-140 flex flex-col gap-5 pa-6 rounded-2 overflow-hidden overflow-y-auto popup">
    <div class="flex flex-col gap-1 pb-2">
      <div class="flex justify-between items-center">
        <div class="title">{{ $t('Cookie 机器人') }} 🤖 </div>
        <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" @click="emit('close')" />
      </div>
      <div class="desc">{{ labels.cookieRobotHelp }}</div>
    </div>
    <div class="grid gap-4 items-center list">
      <div class="text !self-start pt-1">{{ $t('编号') }}</div>
      <div class="flex items-end gap-3 flex-wrap overflow-hidden text">
        <div v-for="profile in data" :key="profile.dirId" class="shrink-0 py-1 px-1.5 rounded-1 _tag_bipxx_2">
          {{ workspaceCode(profile.workspaceName) }}-{{ profile.windowSortNum }}
        </div>
      </div>
      <div class="text !self-start pt-1">{{ $t('目标网站') }}</div>
      <div class="self-stretch flex flex-col gap-2 text">
        <Textarea v-model="urls" size="md" :rows="6" :placeholder="`${$t('示例')}:\nhttps://www.google.com\nhttps://facebook.com`" />
        <div class="_description_bipxx_12">
          <div>{{ $t('1、请输入完整的网址, 需要包括 https:// 或 http://') }}</div>
          <div>{{ urlHelp }}</div>
        </div>
      </div>
      <template v-if="expanded">
        <div class="subtitle">{{ $t('滚动速度') }}</div>
        <template v-for="range in ranges" :key="range.unit">
          <div class="text">{{ range.label }}</div>
          <div class="flex items-center gap-3 text">
            <InputGroup class="w-30"><NumberInput v-model="range.values[0]" :min="range.min" :placeholder="String(range.min)" /><InputUnit class="tip-text">{{ range.unit }}</InputUnit></InputGroup>
            <div>~</div>
            <InputGroup class="w-30"><NumberInput v-model="range.values[1]" :min="range.min" :placeholder="range.upper" /><InputUnit class="tip-text">{{ range.unit }}</InputUnit></InputGroup>
          </div>
        </template>
        <div class="subtitle">{{ $t('更多设置') }}</div>
        <div class="text">{{ $t('不加载图片') }}</div>
        <div class="flex items-center gap-3 text"><Switch v-model="forbidImage" :true-value="false" :false-value="true" /><div>{{ $t('开启') }}</div></div>
        <div class="text">{{ $t('不加载视频') }}</div>
        <div class="flex items-center gap-3 text"><Switch v-model="forbidMedia" :true-value="false" :false-value="true" /><div>{{ $t('开启') }}</div></div>
        <div class="text">{{ labels.closeEntity }}</div>
        <div class="flex items-center gap-3 text"><Switch v-model="closeProfile" /><div>{{ labels.closeEntityAfterComplete }}</div></div>
        <div class="text">{{ $t('无头模式') }}</div>
        <div class="flex items-center gap-3 text"><Switch v-model="startupParam" true-value="--headless=new" false-value="" /><div>{{ $t('开启后不显示浏览器界面，后台自动操作网页') }}</div></div>
      </template>
    </div>
    <div v-if="!expanded" class="flex items-center justify-center gap-1 cursor-pointer" @click="expanded = true">
      <div class="more">{{ $t('更多设置') }}</div><Icon name="base/rx_ic_chevron_down" />
    </div>
    <Button class="shrink-0" size="lg" :label="$t('开始生成 Cookie')" :loading="running" @click="run" />
  </div>
</template>
