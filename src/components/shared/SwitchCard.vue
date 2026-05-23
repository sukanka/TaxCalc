<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; title: string; subtitle?: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();

const toggle = () => emit('update:modelValue', !props.modelValue);
</script>

<template>
  <div class="card transition cursor-pointer" :class="modelValue ? 'ring-2 ring-primary/30' : ''">
    <div class="flex items-center justify-between gap-12px" @click="toggle">
      <div>
        <div class="text-14px font-semibold text-ink">{{ title }}</div>
        <div v-if="subtitle" class="text-12px text-mute mt-2px">{{ subtitle }}</div>
      </div>
      <div
        class="w-44px h-24px rounded-full relative transition"
        :class="modelValue ? 'bg-primary' : 'bg-stone-300'"
      >
        <div
          class="w-20px h-20px rounded-full bg-white absolute top-2px transition-all shadow"
          :class="modelValue ? 'left-22px' : 'left-2px'"
        />
      </div>
    </div>
    <div v-if="modelValue" class="mt-12px pt-12px border-t border-stone-100">
      <slot />
    </div>
  </div>
</template>
