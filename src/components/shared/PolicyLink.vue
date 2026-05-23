<script setup lang="ts">
defineProps<{ title: string; url: string; description?: string }>();
</script>

<template>
  <div class="bg-primary/5 rounded-8px p-12px">
    <p v-if="description" class="text-12px text-ink leading-relaxed mb-6px">{{ description }}</p>
    <a
      :href="url"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-4px text-12px text-primary hover:underline"
    >
      <span>查看政策原文</span>
      <span>↗</span>
    </a>
    <div class="text-11px text-mute mt-4px">{{ title }}</div>
  </div>
</template>
