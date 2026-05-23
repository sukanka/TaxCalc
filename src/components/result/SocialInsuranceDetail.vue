<script setup lang="ts">
import { computed } from 'vue';
import { useResultStore } from '@/stores/resultStore';

const result = useResultStore();
const si = computed(() => result.summary?.socialInsurance);

const fmtPercent = (r: number) => `${(r * 100).toFixed(1)}%`;
</script>

<template>
  <section v-if="si" class="card">
    <div class="flex items-center justify-between mb-12px">
      <h3 class="text-14px font-semibold text-ink">五险一金明细（月度）</h3>
      <span class="text-13px font-mono text-ink">合计 ¥{{ si.total }}</span>
    </div>

    <div class="space-y-8px text-13px">
      <div class="grid grid-cols-[1fr_auto_auto_auto] gap-8px items-baseline">
        <span class="text-mute">养老保险</span>
        <span class="text-11px text-mute font-mono">基数 ¥{{ si.details.pension.base }}</span>
        <span class="text-11px text-mute font-mono">× {{ fmtPercent(si.details.pension.rate) }}</span>
        <span class="font-mono text-danger">− ¥{{ si.details.pension.amount }}</span>
      </div>
      <div class="grid grid-cols-[1fr_auto_auto_auto] gap-8px items-baseline">
        <span class="text-mute">医疗保险</span>
        <span class="text-11px text-mute font-mono">基数 ¥{{ si.details.medical.base }}</span>
        <span class="text-11px text-mute font-mono">× {{ fmtPercent(si.details.medical.rate) }}</span>
        <span class="font-mono text-danger">− ¥{{ si.details.medical.amount }}</span>
      </div>
      <div class="grid grid-cols-[1fr_auto_auto_auto] gap-8px items-baseline">
        <span class="text-mute">失业保险</span>
        <span class="text-11px text-mute font-mono">基数 ¥{{ si.details.unemployment.base }}</span>
        <span class="text-11px text-mute font-mono">× {{ fmtPercent(si.details.unemployment.rate) }}</span>
        <span class="font-mono text-danger">− ¥{{ si.details.unemployment.amount }}</span>
      </div>
      <div class="grid grid-cols-[1fr_auto_auto_auto] gap-8px items-baseline">
        <span class="text-mute">住房公积金</span>
        <span class="text-11px text-mute font-mono">基数 ¥{{ si.details.housingFund.base }}</span>
        <span class="text-11px text-mute font-mono">× {{ fmtPercent(si.details.housingFund.rate) }}</span>
        <span class="font-mono text-danger">− ¥{{ si.details.housingFund.amount }}</span>
      </div>
    </div>

    <div class="mt-12px flex flex-wrap gap-8px">
      <span v-if="si.socialBaseCapped" class="text-11px px-8px py-2px bg-warn/10 text-warn rounded-full">
        ⚠ 社保基数已按上限封顶（¥{{ si.socialBaseUsed }}）
      </span>
      <span v-if="si.housingFundBaseCapped" class="text-11px px-8px py-2px bg-warn/10 text-warn rounded-full">
        ⚠ 公积金基数已按上限封顶（¥{{ si.housingFundBaseUsed }}）
      </span>
      <span v-if="!si.socialBaseCapped && !si.housingFundBaseCapped" class="text-11px text-mute">
        基数未触发上限
      </span>
    </div>
  </section>
</template>
