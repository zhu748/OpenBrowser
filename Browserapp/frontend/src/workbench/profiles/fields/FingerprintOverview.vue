<script setup>
import { computed } from 'vue';
import { gr as image, i as selectFields } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { r as Panel } from './choose-panel-CC3iR_nA.js';
import { n as motion } from './motion-BwnyBP9B.js';
import { t as AnimatePresence } from './AnimatePresence-d-29l3Fb.js';
import { t as useOnboarding } from './hooks-BozaoB_u.js';
import { t as TutorialVideo } from './tutorial-video-Cb-jkf_V.js';

const props = defineProps({
  inputsGroup: { type: Array, default: () => [] }, createCount: null, isBatch: Boolean, isImport: Boolean,
  isEdit: Boolean, choosePreset: Function, onShuffle: Function,
});
const collapsed = defineModel('collapsed', { type: Boolean, default: false });
const { onboardingTaskStatus, closeGuideTipsAndUpdateTaskStatus } = useOnboarding();
const transition = { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] };
const animation = {
  left: { visible: { opacity: 0.4, x: 0, transition }, hidden: { opacity: 0, x: -60, transition } },
  center: { visible: { opacity: 1, x: 0, y: 0, transition }, hidden: { opacity: 0, x: 0, y: 40, transition } },
  right: { visible: { opacity: 0.4, x: 0, transition }, hidden: { opacity: 0, x: 60, transition } },
};
const banners = Object.fromEntries(Object.entries({ macos: 'mac', ios: 'ios', android: 'android', windows: 'windows', linux: 'linux' })
  .map(([system, file]) => [system, image('systeam/' + file + '.webp')]));
const previewFields = computed(() => props.inputsGroup.flat().flatMap(field => field.preview ? [field] : (field.items ?? []).filter(child => child.preview))
  .map(({ options, value, preview }) => {
    const raw = value?.value ?? value;
    return { ...preview, value: options?.find(option => option.value === raw)?.label ?? raw };
  }));
const overview = computed(() => {
  const [system, proxy, accounts] = selectFields(props.inputsGroup[0] ?? [], ['os', 'proxyInfoList', 'windowPlatformList']);
  const bindings = accounts?.value ?? [];
  const os = system?.value?.value?.toLowerCase();
  return { os, banner: banners[os], icons: [
    { key: 'system', icon: system?.value?.icon || 'base/rx_ic_plus' },
    { key: 'proxy', icon: proxy?.value?.length ? 'country-code/' + proxy.value[0].lastCountry : '', fallback: 'base/rx_ic_earth' },
    { key: 'account', icon: bindings.length ? 'base/rx_ic_user_key' : 'base/rx_ic_plus', image: bindings[0]?.platformIcon,
      subIcon: bindings.length > 2 ? 'base/rx_ic_more-h' : bindings.length === 2 ? 'base/rx_ic_user_key' : '', subImage: bindings.length === 2 ? bindings[1].platformIcon : '' },
  ] };
});
</script>

<template>
  <Panel v-model:collapsed="collapsed" :title="$t('概要')">
    <template #before>
      <TutorialVideo v-if="!onboardingTaskStatus?.createProfileVideoEntryStatus" video-type="create_profile" :autoplay="false" v-slot="{ onPlay }">
        <div class="flex items-center justify-start pa-3 gap-2.5 rounded-xl video" @click="onPlay">
          <div class="flex items-center pa-2 rounded-md video-icon"><Icon name="base/rx_ic_play" color="var(--pattern-tutorial-video-bg-icon)" /></div>
          <div class="flex-1 cursor-pointer">
            <div class="flex justify-between items-center">
              <span class="video-title">{{ $t('窗口教程') }}</span>
              <Icon class="cursor-pointer" name="base/rx_ic_delete" color="var(--colors-icon-icon-tertiary)"
                @click.stop="closeGuideTipsAndUpdateTaskStatus('createProfileVideoEntryStatus')" />
            </div>
            <div class="video-desc">{{ $t('了解窗口和窗口指纹') }}</div>
          </div>
        </div>
      </TutorialVideo>
    </template>
    <template #footer>
      <Button class="w-full" size="lg" :label="$t('一键随机指纹')" icon="base/rx_ic_shuffle" outlined @click="onShuffle()" />
    </template>
    <div v-if="!isImport" class="relative flex flex-col mb-2 pt-6 items-center overflow-hidden pointer-events-none select-none overview">
      <div class="flex items-center gap-3">
        <div class="w-34 flex items-center justify-between relative">
          <div class="line"></div>
          <template v-for="item in overview.icons" :key="item.key">
            <div v-if="item.icon" class="relative icon">
              <img v-if="item.image" class="w-full h-full" :src="item.image">
              <Icon v-else class="shrink-0" :name="item.icon" color="#7d8387" :fallback="item.fallback" />
              <div v-if="item.subIcon || item.subImage" class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 scale-70 icon">
                <img v-if="item.subImage" class="w-full h-full" :src="item.subImage">
                <Icon v-else class="shrink-0" :name="item.subIcon" color="#7d8387" />
              </div>
            </div>
          </template>
        </div>
      </div>
      <div v-if="overview.os" class="absolute top-20 left-1/2 -translate-x-1/2 flex gap-6">
        <AnimatePresence v-if="isBatch" :initial="false" mode="wait">
          <component :is="motion.div" :key="overview.os" class="flex justify-end opacity-40 overview-banner"
            :variants="animation.left" initial="hidden" animate="visible" exit="hidden"><img :src="overview.banner" class="block h-full object-contain"></component>
        </AnimatePresence>
        <AnimatePresence :initial="false" mode="wait">
          <component :is="motion.div" :key="overview.os" class="overview-banner" :variants="animation.center" initial="hidden" animate="visible" exit="hidden">
            <img :src="overview.banner" class="block h-full w-full object-contain">
          </component>
        </AnimatePresence>
        <AnimatePresence v-if="isBatch" :initial="false" mode="wait">
          <component :is="motion.div" :key="overview.os" class="flex justify-start opacity-40 overview-banner"
            :variants="animation.right" initial="hidden" animate="visible" exit="hidden"><img :src="overview.banner" class="block h-full object-contain"></component>
        </AnimatePresence>
      </div>
    </div>
    <div v-for="(field, index) in previewFields" :key="index" class="flex items-start self-stretch py-1 px-3 gap-1 select-none">
      <div class="label">{{ field.label }}</div><div class="value">{{ field.value }}</div>
    </div>
  </Panel>
</template>
