import { defineStore } from 'pinia';
import { computeAnnualSummary } from '@/core/annual';
import { CITIES } from '@/data/cities';
import { useInputStore } from './inputStore';
import { useSettingsStore } from './settingsStore';
import type { AnnualSummary } from '@/core/annual';

interface ResultState {
  summary: AnnualSummary | null;
}

export const useResultStore = defineStore('result', {
  state: (): ResultState => ({ summary: null }),
  actions: {
    compute() {
      const input = useInputStore();
      const settings = useSettingsStore();
      const city = CITIES[settings.cityId];
      this.summary = computeAnnualSummary({
        monthlyIncome: input.monthlySalary,
        annualBonus: input.annualBonus,
        city,
        housingFundRatio: settings.housingFundRatio,
        pensionRatio: settings.pensionRatio,
        customSocialBase: input.customSocialBase,
        customHousingFundBase: input.customHousingFundBase,
        deductions: input.deductions,
        reliefs: input.reliefs,
      });
    },
  },
});
