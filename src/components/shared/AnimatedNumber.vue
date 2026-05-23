<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ value: string | number; duration?: number }>();
const display = ref(0);

const animate = (from: number, to: number, duration: number) => {
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    display.value = from + (to - from) * eased;
    if (t < 1) requestAnimationFrame(tick);
    else display.value = to;
  };
  requestAnimationFrame(tick);
};

watch(
  () => props.value,
  (v) => {
    const next = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(next)) return;
    animate(display.value, next, props.duration ?? 300);
  },
  { immediate: true }
);

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<template>
  <span class="font-mono">{{ fmt(display) }}</span>
</template>
