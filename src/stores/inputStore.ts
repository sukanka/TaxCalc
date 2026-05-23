import { defineStore } from 'pinia';
import type { DeductionsInput, BonusStrategy } from '@/types';

interface InputState {
  monthlySalary: string;
  customSocialBase: string | null;
  customHousingFundBase: string | null;
  deductions: DeductionsInput;
  reliefs: string[];
  annualBonus: string;
  bonusStrategy: BonusStrategy;
}

const defaultDeductions = (): DeductionsInput => ({
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
});

export const useInputStore = defineStore('input', {
  state: (): InputState => ({
    monthlySalary: '20000',
    customSocialBase: null,
    customHousingFundBase: null,
    deductions: defaultDeductions(),
    reliefs: [],
    annualBonus: '0',
    bonusStrategy: 'auto',
  }),
  persist: {
    key: 'tax-calc-input',
  },
});
