<script setup lang="ts">
import { computed, onMounted, watch, ref, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const result = useResultStore();
const cmp = computed(() => result.summary?.bonusComparison);
const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const labelOf = (s: string) =>
  s === 'merge' ? '并入综合所得' : s === 'separate' ? '单独计税' : '拆分优化';

const renderChart = () => {
  if (!chart || !cmp.value) return;
  const plans = cmp.value.plans;
  chart.setOption({
    grid: { left: 60, right: 20, top: 24, bottom: 32 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: plans.map(p => labelOf(p.strategy)),
      axisLabel: { color: '#78716c', fontSize: 12 },
      axisLine: { lineStyle: { color: '#e7e5e4' } },
    },
    yAxis: {
      type: 'value',
      name: '元',
      axisLabel: { color: '#78716c', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f5f5f4' } },
    },
    series: [{
      type: 'bar',
      data: plans.map(p => ({
        value: parseFloat(p.totalTax),
        itemStyle: {
          color: p.strategy === cmp.value!.best.strategy ? '#10b981' : '#94a3b8',
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: 40,
      label: { show: true, position: 'top', formatter: (params: any) => `¥${params.value.toLocaleString()}` },
    }],
  });
};

const resize = () => chart?.resize();

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value);
    renderChart();
    window.addEventListener('resize', resize);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
});

watch(cmp, renderChart, { deep: true });
</script>

<template>
  <div v-if="cmp" class="space-y-16px">
    <div
      v-if="cmp.trapWarning"
      class="card bg-danger/5 border border-danger/20"
    >
      <p class="text-13px text-danger font-medium">
        ⚠ 您的年终奖落入"多发不如少发"陷阱区
      </p>
      <p class="text-12px text-ink mt-6px">
        建议下调至 <b class="text-danger">¥{{ cmp.trapWarning.suggestedAmount.toLocaleString() }}</b>，
        可少缴税 <b class="text-success">¥{{ cmp.trapWarning.potentialSaving }}</b>
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-12px">
      <div
        v-for="p in cmp.plans"
        :key="p.strategy"
        class="card relative transition"
        :class="p.strategy === cmp.best.strategy ? 'ring-2 ring-success bg-success/5' : ''"
      >
        <div v-if="p.strategy === cmp.best.strategy" class="absolute -top-8px right-12px text-11px px-8px py-2px bg-success text-white rounded-full">
          推荐 · 省 ¥{{ cmp.savedVsWorst }}
        </div>
        <div class="text-12px text-mute uppercase tracking-wide">
          {{ labelOf(p.strategy) }}
        </div>
        <h3 class="text-22px font-bold text-ink mt-6px">
          ¥<AnimatedNumber :value="p.totalTax" />
        </h3>
        <p class="text-11px text-mute mt-2px">{{ p.description }}</p>
        <p v-if="p.totalTaxBeforeRelief && p.totalTaxBeforeRelief !== p.totalTax" class="text-10px text-mute mt-2px">
          减征前 ¥{{ p.totalTaxBeforeRelief }}
        </p>
        <div class="mt-12px space-y-4px text-12px">
          <div class="flex justify-between">
            <span class="text-mute">单独计税部分</span>
            <span class="font-mono">¥{{ p.bonusForSeparate }} → 税 {{ p.taxFromSeparate }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-mute">并入工资部分</span>
            <span class="font-mono">¥{{ p.bonusForMerge }} → 税 {{ p.taxFromMerge }}</span>
          </div>
        </div>
      </div>
    </div>

    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">税负对比</h3>
      <div ref="chartEl" class="h-260px" />
    </section>
  </div>
</template>
