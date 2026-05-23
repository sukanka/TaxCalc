<script setup lang="ts">
import { computed } from 'vue';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';
import SocialInsuranceDetail from './SocialInsuranceDetail.vue';

const result = useResultStore();

const firstMonth = computed(() => result.summary?.monthly[0]);
const lastMonth = computed(() => result.summary?.monthly[11]);
</script>

<template>
  <div v-if="result.summary" class="space-y-16px">
    <section class="card">
      <p class="text-11px text-mute uppercase tracking-wide">本月（1月）到手</p>
      <h2 class="text-32px font-bold text-ink mt-4px tracking-tight">
        <span class="text-16px text-mute mr-4px">¥</span>
        <AnimatedNumber :value="firstMonth?.netSalary ?? '0'" />
      </h2>
      <div class="flex gap-12px mt-12px text-12px">
        <span class="px-8px py-2px bg-success/10 text-success rounded-full">
          12 月累计已预扣 ¥{{ lastMonth?.cumulativeTaxAfterRelief ?? '0' }}
        </span>
      </div>
    </section>

    <SocialInsuranceDetail />

    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">1 月扣税明细</h3>
      <div class="space-y-8px text-13px">
        <div class="flex justify-between"><span class="text-mute">税前月薪</span><span class="font-mono">¥ {{ firstMonth?.cumulativeIncome }}</span></div>
        <div class="flex justify-between"><span class="text-mute">五险一金</span><span class="font-mono text-danger">− ¥ {{ firstMonth?.cumulativeSocialInsurance }}</span></div>
        <div class="flex justify-between"><span class="text-mute">专项附加扣除</span><span class="font-mono text-danger">− ¥ {{ firstMonth?.cumulativeDeductions }}</span></div>
        <div class="flex justify-between"><span class="text-mute">基本减除</span><span class="font-mono text-danger">− ¥ {{ firstMonth?.cumulativeBasicDeduction }}</span></div>
        <div class="flex justify-between border-t border-stone-100 pt-8px">
          <span class="text-ink font-medium">应纳税所得额</span>
          <span class="font-mono">¥ {{ firstMonth?.cumulativeTaxableIncome }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-mute">适用税率 / 速算扣除</span>
          <span class="font-mono">{{ ((firstMonth?.bracket.rate ?? 0) * 100).toFixed(0) }}% / {{ firstMonth?.bracket.quickDeduction.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between border-t border-stone-100 pt-8px">
          <span class="text-ink font-semibold">本月预扣税</span>
          <span class="font-mono text-warn font-semibold">¥ {{ firstMonth?.monthlyTax }}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">12 月累计预扣进度</h3>
      <div class="overflow-x-auto -mx-16px px-16px">
        <table class="w-full text-12px">
          <thead>
            <tr class="text-mute text-left">
              <th class="py-6px font-normal">月份</th>
              <th class="py-6px font-normal text-right">累计应纳税所得</th>
              <th class="py-6px font-normal text-right">累计税额</th>
              <th class="py-6px font-normal text-right">当月预扣</th>
              <th class="py-6px font-normal text-right">到手</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in result.summary.monthly" :key="m.month" class="border-t border-stone-50">
              <td class="py-6px">{{ m.month }} 月</td>
              <td class="py-6px text-right font-mono">{{ m.cumulativeTaxableIncome }}</td>
              <td class="py-6px text-right font-mono">{{ m.cumulativeTaxAfterRelief }}</td>
              <td class="py-6px text-right font-mono text-warn">{{ m.monthlyTax }}</td>
              <td class="py-6px text-right font-mono">{{ m.netSalary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
