<script setup lang="ts">
import SalaryPanel from '@/components/input/SalaryPanel.vue';
import DeductionsPanel from '@/components/input/DeductionsPanel.vue';
import ReliefSelector from '@/components/input/ReliefSelector.vue';
import AnnualResult from '@/components/result/AnnualResult.vue';
</script>

<template>
  <div class="grid gap-16px lg:grid-cols-[2fr_3fr]">
    <div class="space-y-16px">
      <SalaryPanel />
      <DeductionsPanel />
      <ReliefSelector />
    </div>
    <AnnualResult />
  </div>
</template>
