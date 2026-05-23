<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const sanitize = (raw: string) => {
  let v = raw.replace(/[^\d.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  return v;
};

const onInput = (e: Event) => {
  const v = sanitize((e.target as HTMLInputElement).value);
  emit('update:modelValue', v);
};

const display = computed(() => props.modelValue ?? '');
</script>

<template>
  <label class="block">
    <span v-if="label" class="text-12px text-mute mb-4px block">{{ label }}</span>
    <div class="flex items-center gap-6px px-12px py-10px bg-stone-50 rounded-8px focus-within:bg-white focus-within:ring-2 ring-primary/20 transition">
      <span v-if="prefix" class="text-mute text-14px">{{ prefix }}</span>
      <input
        type="text"
        inputmode="decimal"
        :value="display"
        :placeholder="placeholder"
        class="flex-1 bg-transparent outline-none text-14px text-ink"
        @input="onInput"
      />
      <span v-if="suffix" class="text-mute text-12px">{{ suffix }}</span>
    </div>
  </label>
</template>
