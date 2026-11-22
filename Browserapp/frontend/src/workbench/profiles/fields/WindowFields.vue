<script setup>
import { computed, toRaw } from 'vue';
import { a as findField, or as copy } from './utils-BIWenCnY.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Label } from './input-label-qeCNGFwS.js';
import { t as Text } from './rx-input-text-CytLc5Og.js';
import { t as SystemSwitch } from './os-switch-BtW3PZYG.js';
import { i as Select } from './contextmenu-BBjizTDn.js';
import { t as Message } from './message-SBZQdXpt.js';
import { t as NumberField } from './inputnumber-BD6BwCgc.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { n as InputGroup, t as Addon } from './inputgroupaddon-BbIAxQsK.js';
import { i as CookieField, s as useNameAutofill, ProfileProxyField, ProfileAccountsField, ProfilePositionField, ProfileUrlsField } from './useAsyncGate-D7VA7DLY.js';
import FieldList from './workbench-profile-field-list.js';
import UserAgent from './workbench-profile-user-agent-field.js';

const props = defineProps({
  inputs: { type: Array, default: () => [] }, inputsGroup: { type: Array, default: () => [] },
  variant: { type: String, default: 'settings' }, excludedFields: { type: Array, default: () => [] },
});
const [notice] = useNotice();
const fields = computed(() => {
  const visible = props.inputs.filter(field => !props.excludedFields.includes(field.name));
  while (visible[0]?.separator) visible.shift();
  while (visible.at(-1)?.separator) visible.pop();
  return visible;
});
const name = computed(() => fields.value.find(field => field.name === 'windowName'));
useNameAutofill({ serialOnly: true, enabled: () => Boolean(name.value && !name.value.dirId), getNameInput: () => name.value,
  getAccounts: () => [], getProxyList: () => [] });
const platformUrls = computed(() => (findField(props.inputsGroup[0] ?? [], 'windowPlatformList')?.value ?? [])
  .map(account => account.platformUrl).filter(Boolean));
function copyId(id) {
  copy(id);
  notice(0, translate('复制成功'));
}
</script>

<template>
  <FieldList v-if="fields.length" class="min-w-0 w-full max-w-full" :class="{ 'profile-info': variant === 'window' }"
    label-position="left" :inputs="fields">
    <template #name="{ input }">
      <div class="flex min-w-0 w-full flex-col gap-2">
        <div v-if="input.dirId" class="flex items-center justify-end gap-2.5">
          <span class="text-3 font-[JetBrains_Mono]">ID:{{ input.dirId }}</span>
          <span class="text-3 font-[JetBrains_Mono] color-blue cursor-pointer" @click="copyId(input.dirId)">{{ translate('复制') }}</span>
        </div>
        <div class="flex min-w-0 w-full items-start">
          <Label class="shrink-0" v-bind="input" />
          <div class="min-w-0 flex-1 flex flex-col gap-1">
            <Text v-model="input.value" class="min-w-0 flex-1" v-bind="input" />
            <span v-if="!input.dirId" class="text-2.75 tt-inactive">{{ translate('* 系统自动生成窗口名称，也可手动修改。') }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #system="{ input }">
      <div class="flex min-w-0 w-full items-center">
        <Label class="shrink-0" v-bind="input" />
        <div class="min-w-0 flex-1 flex gap-2 overflow-hidden">
          <SystemSwitch v-model="input.items[0].value" class="min-w-0 flex-1" :options="input.items[0].options"
            @change="input.items[0].change?.(input.items[0], input.items)">
            <template #item="{ item }"><Icon :name="item.icon" /></template>
          </SystemSwitch>
          <Select v-bind="input.items[1]" v-model="input.items[1].value" class="min-w-0 flex-1"
            @change="input.items[1].change?.(input.items[1], input.items)" />
        </div>
      </div>
    </template>
    <template #kernel="{ input }">
      <div class="flex min-w-0 w-full items-center">
        <Label class="shrink-0" v-bind="input" />
        <div class="min-w-0 flex-1 flex flex-col gap-2 overflow-hidden">
          <div class="min-w-0 flex flex-1 gap-2 overflow-hidden">
            <SystemSwitch v-model="input.items[0].value" class="min-w-0 flex-1" :disabled="input.items[0].disabled"
              :disabled-tooltip="input.items[0].disabled ? translate('内核不支持修改') : undefined" :options="input.items[0].options"
              @change="input.items[0].change?.(input.items[0], input.items)">
              <template #item="{ item }"><div class="flex items-center gap-1.5"><Icon :name="item.icon" /><span>{{ item.label }}</span></div></template>
            </SystemSwitch>
            <Select v-bind="input.items[1]" v-model="input.items[1].value" class="min-w-0 flex-1"
              @change="input.items[1].change?.(input.items[1], input.items)" />
          </div>
          <Message v-if="input.items[0].help" severity="secondary" size="small" variant="simple">{{ input.items[0].help }}</Message>
          <Message v-if="input.items[1].help" severity="error" size="small" variant="simple">{{ input.items[1].help }}</Message>
        </div>
      </div>
    </template>
    <template #userAgent="{ input }"><UserAgent :input="input" :inputs-group="inputsGroup" /></template>
    <template #cookies="{ input }"><CookieField v-model="input.value" v-model:invalid="input.invalid" :platform-urls="platformUrls" v-bind="input" /></template>
    <template #proxy="{ input }"><div class="-mt-5 px-4 py-6 w-full dashed-border"><ProfileProxyField v-model="input.value" v-bind="input" /></div></template>
    <template #accounts="{ input }"><div class="-mt-5 px-4 py-6 w-full dashed-border">
      <ProfileAccountsField v-model="input.value" v-model:type="input.platformBindType" v-bind="input" />
    </div></template>
    <template #urls="{ input }"><ProfileUrlsField v-model="input.value" v-model:invalid="input.invalid" v-bind="input" /></template>
    <template #windowOpenSize="{ input }">
      <div class="flex">
        <Label v-bind="toRaw(input)" />
        <div class="flex gap-2">
          <InputGroup v-for="(item, index) in input.items" :key="item.name">
            <Addon class="text-3.5">{{ translate(index === 0 ? '宽' : '高') }}</Addon>
            <Text v-bind="item" v-model="item.value" class="!w-25" />
          </InputGroup>
        </div>
      </div>
    </template>
    <template #windowRatioPosition="{ input }">
      <div class="flex py-4"><Label v-bind="toRaw(input)" /><ProfilePositionField v-model="input.value" /></div>
    </template>
    <template #forbiddenPictureSize="{ input }">
      <div class="flex">
        <Label v-bind="toRaw(input)" />
        <div>
          <div class="tip-text">{{ translate('禁止加载超过以下大小的图片（如果设置为0则不加载任何图片，为避免无法显示验证码，建议填写10KB）') }}</div>
          <div class="w-[105px] mt-2">
            <IconField><NumberField v-model="input.value" input-class="w-full !pr-[28px]" size="small" /><InputIcon class="tip-text"> KB </InputIcon></IconField>
          </div>
        </div>
      </div>
    </template>
  </FieldList>
</template>
