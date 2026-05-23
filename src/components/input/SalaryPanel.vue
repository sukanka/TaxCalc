<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import NumberInput from '../shared/NumberInput.vue';

const input = useInputStore();
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
        </div>
      </details>
    </div>
  </section>
</template>
