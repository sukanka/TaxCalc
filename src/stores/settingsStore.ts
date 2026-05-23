import { defineStore } from 'pinia';
import type { CityId } from '@/types';

interface SettingsState {
  cityId: CityId;
  activeTab: 'monthly' | 'annual';
  housingFundRatio: number;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    cityId: 'beijing',
    activeTab: 'monthly',
    housingFundRatio: 0.12,
  }),
  persist: {
    key: 'tax-calc-settings',
  },
});
