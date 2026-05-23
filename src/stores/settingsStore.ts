import { defineStore } from 'pinia';
import type { CityId } from '@/types';

interface SettingsState {
  cityId: CityId;
  activeTab: 'monthly' | 'annual';
  housingFundRatio: number;
  pensionRatio: number;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    cityId: 'beijing',
    activeTab: 'monthly',
    housingFundRatio: 0.12,
    pensionRatio: 0.08,
  }),
  persist: {
    key: 'tax-calc-settings',
  },
});
