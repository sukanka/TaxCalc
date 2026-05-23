<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInputStore } from '@/stores/inputStore';
import { useResultStore } from '@/stores/resultStore';
import CityPicker from '@/components/input/CityPicker.vue';
import MonthlyView from '@/views/MonthlyView.vue';
import AnnualView from '@/views/AnnualView.vue';

const settings = useSettingsStore();
const input = useInputStore();
const result = useResultStore();
const { activeTab } = storeToRefs(settings);

let timer: number | undefined;
const recompute = () => {
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(() => result.compute(), 200);
};

onMounted(() => result.compute());

watch(
  () => [
    input.monthlySalary,
    input.annualBonus,
    input.customSocialBase,
    input.customHousingFundBase,
    JSON.stringify(input.deductions),
    JSON.stringify(input.reliefs),
    settings.cityId,
    settings.housingFundRatio,
    settings.pensionRatio,
  ],
  recompute,
  { deep: true }
);
</script>

<template>
  <div class="min-h-screen bg-bg text-ink font-sans">
    <header class="bg-white border-b border-stone-100 sticky top-0 z-10">
      <div class="max-w-1280px mx-auto px-24px py-14px flex items-center justify-between gap-16px">
        <div class="flex items-center gap-16px">
          <h1 class="text-18px font-bold tracking-tight">
            <span class="text-primary">Tax</span>Calc
          </h1>
          <nav class="flex bg-stone-100 rounded-8px p-2px">
            <button
              v-for="t in (['monthly', 'annual'] as const)"
              :key="t"
              class="px-14px py-6px text-13px rounded-6px transition"
              :class="activeTab === t ? 'bg-white text-ink shadow-sm font-medium' : 'text-mute'"
              @click="activeTab = t"
            >
              {{ t === 'monthly' ? '月度预扣' : '年度汇算' }}
            </button>
          </nav>
        </div>
        <CityPicker />
      </div>
    </header>

    <main class="max-w-1280px mx-auto px-24px py-24px">
      <MonthlyView v-if="activeTab === 'monthly'" />
      <AnnualView v-else />
    </main>

    <footer class="text-center text-11px text-mute py-24px">
      数据仅供参考。实际申报以当地税务机关核定为准。
    </footer>
  </div>
</template>
