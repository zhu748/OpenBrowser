<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from './workbench-vue.js';
import { createWaveNoise } from './workbench-profile-wave-noise.js';

const props = defineProps({
  customClass: { type: String, default: '' },
  containerClass: { type: String, default: '' },
  colors: { type: Array, default: () => ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee'] },
  waveWidth: { type: Number, default: 50 },
  backgroundFill: { type: String, default: 'transparent' },
  blur: { type: Number, default: 10 },
  speed: { type: String, default: 'fast' },
  waveOpacity: { type: Number, default: 1 },
  animate: { type: Boolean, default: true },
});
const canvas = useTemplateRef('canvas');
const safari = ref(false);
const noise = createWaveNoise();
const width = 200;
const height = 48;
let drawing;
let frame;
let phase = 0;

function draw() {
  frame = undefined;
  if (!drawing) return;
  drawing.clearRect(0, 0, width, height);
  drawing.globalAlpha = props.waveOpacity;
  if (props.backgroundFill !== 'transparent') {
    drawing.fillStyle = props.backgroundFill;
    drawing.fillRect(0, 0, width, height);
  }
  if (props.animate) phase += props.speed === 'slow' ? .008 : .009;
  for (let line = 0; line < 5; line++) {
    drawing.beginPath();
    drawing.lineWidth = props.waveWidth;
    drawing.strokeStyle = props.colors[line % props.colors.length];
    for (let x = 0; x < width; x += 5) {
      drawing.lineTo(x, noise(x / 80, .4 * line, phase) * 4 + height * .25);
    }
    drawing.stroke();
    drawing.closePath();
  }
  if (props.animate) frame = requestAnimationFrame(draw);
}

function stop() {
  if (frame === undefined) return;
  cancelAnimationFrame(frame);
  frame = undefined;
}

onMounted(() => {
  safari.value = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  drawing = canvas.value?.getContext('2d');
  if (!drawing) return;
  Object.assign(canvas.value.style, { width: '100px', height: '24px' });
  canvas.value.width = width;
  canvas.value.height = height;
  drawing.scale(2, 2);
  drawing.filter = `blur(${props.blur}px)`;
  draw();
});
onBeforeUnmount(stop);
watch(() => props.animate, animate => {
  if (animate && frame === undefined) draw();
  else if (!animate) stop();
});
</script>

<template>
  <div class="flex flex-col items-center justify-center" :class="containerClass">
    <canvas id="canvas" ref="canvas" class="absolute z-0" :style="{ filter: safari ? `blur(${blur}px)` : undefined }"></canvas>
    <div class="relative z-10" :class="customClass"><slot /></div>
  </div>
</template>
