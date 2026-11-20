<script setup>
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
defineProps({ count: { type: Number, default: 6 } });
</script>

<template>
  <div v-for="index in count" :key="index" class="my-template-card-skeleton" role="status" aria-busy="true">
    <span class="sr-only">{{ $t('加载中...') }}</span>
    <div class="my-template-card-skeleton__header" aria-hidden="true">
      <div class="my-template-card-skeleton__identity">
        <Skeleton width="44px" height="44px" border-radius="7px" />
        <div class="my-template-card-skeleton__copy">
          <Skeleton width="58%" height="20px" border-radius="6px" /><Skeleton width="33px" height="16px" border-radius="4px" />
        </div>
      </div>
    </div>
    <div class="my-template-card-skeleton__divider" aria-hidden="true"></div>
    <div class="my-template-card-skeleton__tags" aria-hidden="true">
      <Skeleton width="39px" height="24px" border-radius="8px" /><Skeleton width="40px" height="24px" border-radius="8px" /><Skeleton width="55px" height="24px" border-radius="8px" />
    </div>
    <div class="my-template-card-skeleton__description" aria-hidden="true">
      <Skeleton width="94%" height="14px" border-radius="4px" /><Skeleton width="76%" height="14px" border-radius="4px" />
    </div>
    <div class="my-template-card-skeleton__actions" aria-hidden="true">
      <Skeleton width="32px" height="32px" border-radius="10px" />
      <div class="my-template-card-skeleton__primary-actions">
        <Skeleton height="32px" border-radius="10px" /><Skeleton height="32px" border-radius="10px" />
      </div>
    </div>
  </div>
</template>
