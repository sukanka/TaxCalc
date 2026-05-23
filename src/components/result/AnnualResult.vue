<script setup lang="ts">
import { computed } from 'vue';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';
import BonusComparison from './BonusComparison.vue';

const result = useResultStore();
const summary = computed(() => result.summary);
</script>

<template>
  <div v-if="summary" class="space-y-16px">
    <section class="card">
      <p class="text-11px text-mute uppercase tracking-wide">全年综合所得 (工资 + 年终奖)</p>
      <div class="flex items-baseline gap-16px mt-6px">
        <div>
          <p class="text-11px text-mute">税前总收入</p>
          <h2 class="text-28px font-bold text-ink tracking-tight">
            ¥<AnimatedNumber :value="summary.annualGross" />
          </h2>
        </div>
        <div>
          <p class="text-11px text-mute">五险一金合计</p>
          <h3 class="text-18px font-semibold text-mute">
            ¥<AnimatedNumber :value="summary.annualSocialInsurance" />
          </h3>
        </div>
        <div>
          <p class="text-11px text-mute">年度净到手（仅工资部分）</p>
          <h3 class="text-18px font-semibold text-success">
            ¥<AnimatedNumber :value="summary.annualNetIncome" />
          </h3>
        </div>
      </div>
      <div v-if="parseFloat(summary.annualReliefDeducted) > 0" class="mt-12px text-12px text-success">
        ✓ 已减征：¥{{ summary.annualReliefDeducted }}
      </div>
    </section>

    <BonusComparison />
  </div>
</template>
