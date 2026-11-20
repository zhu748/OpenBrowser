<script setup>
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
const groups = [
  { width: '56px', pills: ['48px', '72px', '60px', '84px', '56px'] },
  { width: '72px', pills: ['48px', '64px', '80px', '56px'] },
];
</script>
<template>
  <div class="template-filter-skeleton" role="status" aria-busy="true">
    <span class="sr-only">{{ $t('加载中...') }}</span>
    <section v-for="group in groups" :key="group.width" class="template-filter-skeleton__group" aria-hidden="true">
      <Skeleton class="template-filter-skeleton__title" :width="group.width" height="14px" border-radius="4px" />
      <div class="template-filter-skeleton__pills">
        <Skeleton v-for="width in group.pills" :key="width" :width="width" height="28px" border-radius="999px" />
      </div>
    </section>
  </div>
</template>
