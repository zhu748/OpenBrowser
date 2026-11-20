<script setup>
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
defineProps({ count: { type: Number, default: 6 } });
</script>
<template>
  <div v-for="index in count" :key="index" class="template-store-card-skeleton" role="status" aria-busy="true">
    <span class="sr-only">{{ $t('加载中...') }}</span>
    <div class="template-store-card-skeleton__header" aria-hidden="true">
      <div class="template-store-card-skeleton__identity">
        <Skeleton width="44px" height="44px" border-radius="10px" /><Skeleton width="60%" height="20px" border-radius="6px" />
      </div>
      <Skeleton width="42px" height="20px" border-radius="4px" />
    </div>
    <div class="template-store-card-skeleton__divider" aria-hidden="true"></div>
    <div class="template-store-card-skeleton__tags" aria-hidden="true">
      <Skeleton width="52px" height="24px" border-radius="8px" /><Skeleton width="68px" height="24px" border-radius="8px" /><Skeleton width="44px" height="24px" border-radius="8px" />
    </div>
    <div class="template-store-card-skeleton__description" aria-hidden="true">
      <Skeleton width="100%" height="14px" border-radius="4px" /><Skeleton width="100%" height="14px" border-radius="4px" />
    </div>
    <div class="template-store-card-skeleton__actions" aria-hidden="true">
      <Skeleton width="86px" height="20px" border-radius="4px" />
      <div class="template-store-card-skeleton__action-buttons">
        <Skeleton height="32px" border-radius="10px" /><Skeleton height="32px" border-radius="10px" />
      </div>
    </div>
  </div>
</template>
