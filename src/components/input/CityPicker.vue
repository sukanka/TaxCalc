<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore';
import { CITY_LIST } from '@/data/cities';
import type { CityId } from '@/types';

const settings = useSettingsStore();
const { cityId } = storeToRefs(settings);

const onChange = (e: Event) => {
  cityId.value = (e.target as HTMLSelectElement).value as CityId;
};
</script>

<template>
  <select
    :value="cityId"
    class="px-12px py-8px bg-white rounded-8px outline-none text-14px border border-stone-200"
    @change="onChange"
  >
    <option v-for="c in CITY_LIST" :key="c.id" :value="c.id">{{ c.name }}</option>
  </select>
</template>
