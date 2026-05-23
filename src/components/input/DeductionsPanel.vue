<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { validateDeductions } from '@/core/deductions';
import SwitchCard from '../shared/SwitchCard.vue';
import NumberInput from '../shared/NumberInput.vue';

const input = useInputStore();
const { deductions } = storeToRefs(input);
const settings = useSettingsStore();

const TIER_BY_CITY: Record<string, 'tier1' | 'tier2' | 'tier3'> = {
  beijing: 'tier1',
  shanghai: 'tier1',
  guangzhou: 'tier1',
  shenzhen: 'tier1',
  hangzhou: 'tier2',
  chengdu: 'tier2',
};

const validation = computed(() => validateDeductions(deductions.value));

watch(
  () => settings.cityId,
  (id) => {
    deductions.value.housingRent.cityTier = TIER_BY_CITY[id] ?? 'tier1';
  },
  { immediate: true }
);
</script>

<template>
  <section class="card">
    <h3 class="text-14px font-semibold text-ink mb-12px">专项附加扣除</h3>

    <div class="space-y-10px">
      <SwitchCard v-model="deductions.childEducation.enabled" title="子女教育" subtitle="2,000 元/月/孩">
        <NumberInput
          :model-value="String(deductions.childEducation.count)"
          @update:model-value="deductions.childEducation.count = parseInt($event || '0')"
          label="子女数量"
          suffix="人"
        />
      </SwitchCard>

      <SwitchCard v-model="deductions.infantCare.enabled" title="3岁以下婴幼儿照护" subtitle="2,000 元/月/孩">
        <NumberInput
          :model-value="String(deductions.infantCare.count)"
          @update:model-value="deductions.infantCare.count = parseInt($event || '0')"
          label="婴幼儿数量"
          suffix="人"
        />
      </SwitchCard>

      <SwitchCard v-model="deductions.continuingEducation.enabled" title="继续教育" subtitle="学历 400 元/月">
        <select
          v-model="deductions.continuingEducation.type"
          class="w-full px-12px py-10px bg-stone-50 rounded-8px outline-none text-14px"
        >
          <option value="degree">学历继续教育（400元/月）</option>
          <option value="professional">职业资格证书（3600元/年一次性）</option>
        </select>
      </SwitchCard>

      <SwitchCard v-model="deductions.seriousIllness.enabled" title="大病医疗" subtitle="超 1.5 万部分，年度上限 8 万">
        <NumberInput
          v-model="deductions.seriousIllness.amount"
          label="全年自付医疗费用"
          prefix="¥"
        />
      </SwitchCard>

      <SwitchCard v-model="deductions.housingLoan.enabled" title="住房贷款利息" subtitle="1,000 元/月" />

      <SwitchCard v-model="deductions.housingRent.enabled" title="住房租金" subtitle="按城市分级 800/1100/1500 元/月">
        <select
          v-model="deductions.housingRent.cityTier"
          class="w-full px-12px py-10px bg-stone-50 rounded-8px outline-none text-14px"
        >
          <option value="tier1">一线城市（1,500/月）</option>
          <option value="tier2">省会/百万人口城市（1,100/月）</option>
          <option value="tier3">其他城市（800/月）</option>
        </select>
      </SwitchCard>

      <SwitchCard v-model="deductions.elderlyCare.enabled" title="赡养老人" subtitle="独生 3,000；非独生分摊 ≤ 1,500">
        <div class="space-y-10px">
          <label class="flex items-center gap-8px text-12px text-ink">
            <input v-model="deductions.elderlyCare.isOnlyChild" type="checkbox" /> 我是独生子女
          </label>
          <NumberInput
            v-if="!deductions.elderlyCare.isOnlyChild"
            v-model="deductions.elderlyCare.sharedAmount"
            label="本人分摊金额"
            prefix="¥"
            suffix="元/月（≤1500）"
          />
        </div>
      </SwitchCard>
    </div>

    <div v-if="!validation.valid" class="mt-12px p-10px bg-warn/10 rounded-8px">
      <p v-for="c in validation.conflicts" :key="c" class="text-12px text-warn">⚠ {{ c }}</p>
    </div>
  </section>
</template>
