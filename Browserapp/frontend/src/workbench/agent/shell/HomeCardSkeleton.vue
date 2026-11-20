<script setup>
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
defineProps({ count: { type: Number, default: 8 } });
</script>

<template>
  <article v-for="index in count" :key="index" class="home-template-card-skeleton" role="status" aria-busy="true">
    <span class="sr-only">{{ $t('加载中...') }}</span>
    <div class="home-template-card-skeleton__main" aria-hidden="true">
      <Skeleton width="44px" height="44px" border-radius="10px" />
      <div class="home-template-card-skeleton__copy">
        <Skeleton width="56%" height="18px" border-radius="6px" /><Skeleton width="84%" height="14px" border-radius="4px" />
      </div>
    </div>
    <div class="home-template-card-skeleton__footer" aria-hidden="true">
      <div class="home-template-card-skeleton__tags">
        <Skeleton v-for="width in ['44px', '58px', '52px']" :key="width" :width="width" height="24px" border-radius="8px" />
      </div>
      <Skeleton width="38px" height="24px" border-radius="999px" />
    </div>
  </article>
</template>
