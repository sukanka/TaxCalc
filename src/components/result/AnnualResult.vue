<script setup lang="ts">
import { computed } from 'vue';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';
import BonusComparison from './BonusComparison.vue';
import SocialInsuranceDetail from './SocialInsuranceDetail.vue';

const result = useResultStore();
const summary = computed(() => result.summary);

const bonusStrategyLabel = computed(() => {
  const s = result.summary?.bonusComparison.best.strategy;
  return s === 'merge' ? '并入综合所得' : s === 'separate' ? '单独计税' : '拆分优化';
});
</script>

<template>
  <div v-if="summary" class="space-y-16px">
    <section class="card">
      <p class="text-11px text-mute uppercase tracking-wide">全年综合所得（工资 + 年终奖）</p>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-16px mt-12px">
        <div>
          <p class="text-11px text-mute">工资收入</p>
          <h3 class="text-20px font-bold text-ink mt-4px tracking-tight">
            ¥<AnimatedNumber :value="summary.annualGross" />
          </h3>
        </div>
        <div>
          <p class="text-11px text-mute">年终奖</p>
          <h3 class="text-20px font-bold text-ink mt-4px tracking-tight">
            ¥<AnimatedNumber :value="summary.annualBonusGross" />
          </h3>
        </div>
        <div>
          <p class="text-11px text-mute">税前总收入</p>
          <h2 class="text-22px font-bold text-primary mt-4px tracking-tight">
            ¥<AnimatedNumber :value="summary.annualTotalGross" />
          </h2>
        </div>
        <div>
          <p class="text-11px text-mute">年度净到手</p>
          <h3 class="text-22px font-bold text-success mt-4px tracking-tight">
            ¥<AnimatedNumber :value="summary.annualNetIncome" />
          </h3>
        </div>
      </div>

      <div class="mt-12px flex flex-wrap gap-12px text-12px text-mute">
        <span>五险一金 −¥{{ summary.annualSocialInsurance }}</span>
        <span>个税 −¥{{ summary.annualTotalTax }}</span>
        <span v-if="parseFloat(summary.annualReliefDeducted) > 0" class="text-success">
          ✓ 已减征 ¥{{ summary.annualReliefDeducted }}
        </span>
      </div>
    </section>

    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">年度税负总览</h3>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-12px">
        <div>
          <p class="text-11px text-mute uppercase tracking-wide">工资扣税</p>
          <p class="text-18px font-bold text-danger mt-4px font-mono">
            ¥<AnimatedNumber :value="summary.annualSalaryTax" />
          </p>
          <p v-if="parseFloat(summary.annualSalaryTaxBeforeRelief) !== parseFloat(summary.annualSalaryTax)" class="text-10px text-mute mt-2px">
            减征前 ¥{{ summary.annualSalaryTaxBeforeRelief }}
          </p>
        </div>

        <div>
          <p class="text-11px text-mute uppercase tracking-wide">年终奖扣税</p>
          <p class="text-18px font-bold text-danger mt-4px font-mono">
            ¥<AnimatedNumber :value="summary.annualBonusTax" />
          </p>
          <p class="text-10px text-mute mt-2px">
            按推荐方案 · {{ bonusStrategyLabel }}
          </p>
        </div>

        <div>
          <p class="text-11px text-mute uppercase tracking-wide">税收优惠</p>
          <p class="text-18px font-bold mt-4px font-mono" :class="parseFloat(summary.annualReliefDeducted) > 0 ? 'text-success' : 'text-mute'">
            −¥<AnimatedNumber :value="summary.annualReliefDeducted" />
          </p>
          <p class="text-10px text-mute mt-2px">
            {{ parseFloat(summary.annualReliefDeducted) > 0 ? '已减征' : '未启用减征' }}
          </p>
        </div>

        <div>
          <p class="text-11px text-mute uppercase tracking-wide">总扣税</p>
          <p class="text-18px font-bold text-ink mt-4px font-mono">
            ¥<AnimatedNumber :value="summary.annualTotalTax" />
          </p>
          <p class="text-10px text-mute mt-2px">
            工资 + 年终奖
          </p>
        </div>
      </div>
    </section>

    <SocialInsuranceDetail />

    <BonusComparison />
  </div>
</template>
