<script setup>
import { ref, watch } from 'vue';
import { n as motion } from './motion-BwnyBP9B.js';

const model = defineModel();
const width = 228;
const height = 140;
const inset = 4;
const transition = { duration: 0.35, ease: [0, 0.71, 0.2, 1.01] };
const anchors = ['tl', 'tl', 'tr', 'tl', 'tl', 'tr', 'bl', 'bl', 'br'];
const points = anchors.map((angle, index) => ({ id: index + 1, x: index % 3 * width / 2, y: Math.floor(index / 3) * height / 2, angle }));
const selected = ref(0);
const x = ref(inset);
const y = ref(inset);
function choose(point) {
  selected.value = point.id;
  x.value = Math.min(point.x + inset, 154);
  y.value = Math.min(point.y + inset, 96);
  const value = [point.x / width, point.y / height, point.angle].join(',');
  if (model.value !== value) model.value = value;
}
watch(model, value => {
  if (!value) return;
  const [ratioX, ratioY] = value.split(',').map(Number);
  const point = points.find(item => Math.abs(item.x / width - ratioX) < 1e-4 && Math.abs(item.y / height - ratioY) < 1e-4);
  if (point) choose(point);
}, { immediate: true });
</script>

<template>
  <div>
    <div class="box" :style="{ width: width + 'px', height: height + 'px' }">
      <div v-for="point in points" :key="point.id" class="point" :style="{ left: point.x + 'px', top: point.y + 'px' }" @click="choose(point)">
        <div class="point-mark" :class="{ active: selected === point.id }"></div>
      </div>
      <component :is="motion.div" class="relative z-10" :style="{ width: '70px', height: '40px' }" :animate="{ x, y }" :transition="transition">
        <img style="width: 70px; height: 40px" src="/images/mini_browser.svg">
      </component>
    </div>
  </div>
</template>
