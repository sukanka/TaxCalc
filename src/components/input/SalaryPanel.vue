<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import { useSettingsStore } from '@/stores/settingsStore';
import NumberInput from '../shared/NumberInput.vue';

const input = useInputStore();
const settings = useSettingsStore();
const { monthlySalary, customSocialBase, customHousingFundBase, annualBonus } = storeToRefs(input);
</script>

<template>
  <section class="card">
    <h3 class="text-14px font-semibold text-ink mb-12px">收入与基数</h3>
    <div class="space-y-12px">
      <NumberInput v-model="monthlySalary" label="税前月薪" prefix="¥" suffix="元/月" />
      <NumberInput v-model="annualBonus" label="年终奖（全年一次性奖金）" prefix="¥" suffix="元" />
      <details class="text-12px">
        <summary class="text-mute cursor-pointer">自定义社保 / 公积金基数（高级）</summary>
        <div class="mt-12px space-y-12px">
          <NumberInput
            :model-value="customSocialBase ?? ''"
            @update:model-value="customSocialBase = $event || null"
            label="自定义社保基数"
            placeholder="留空则按月薪"
            prefix="¥"
          />
          <NumberInput
            :model-value="customHousingFundBase ?? ''"
            @update:model-value="customHousingFundBase = $event || null"
            label="自定义公积金基数"
            placeholder="留空则按月薪"
            prefix="¥"
          />
          <div class="grid grid-cols-2 gap-12px mt-4px">
            <label class="block">
              <span class="text-12px text-mute mb-4px block">养老保险个人比例</span>
              <div class="flex items-center gap-6px px-12px py-10px bg-stone-50 rounded-8px">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.12"
                  :value="settings.pensionRatio"
                  class="flex-1 bg-transparent outline-none text-14px text-ink"
                  @input="settings.pensionRatio = parseFloat(($event.target as HTMLInputElement).value) || 0"
                />
                <span class="text-mute text-12px">{{ ((settings.pensionRatio ?? 0) * 100).toFixed(1) }}%</span>
              </div>
            </label>
            <label class="block">
              <span class="text-12px text-mute mb-4px block">公积金个人比例</span>
              <div class="flex items-center gap-6px px-12px py-10px bg-stone-50 rounded-8px">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.25"
                  :value="settings.housingFundRatio"
                  class="flex-1 bg-transparent outline-none text-14px text-ink"
                  @input="settings.housingFundRatio = parseFloat(($event.target as HTMLInputElement).value) || 0"
                />
                <span class="text-mute text-12px">{{ ((settings.housingFundRatio ?? 0) * 100).toFixed(1) }}%</span>
              </div>
            </label>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>
