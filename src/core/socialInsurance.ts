import { d, fmt, max, min } from './decimal';
import type { CityConfig } from '@/types';

export interface SocialInsuranceInput {
  monthlyIncome: string;
  customSocialBase?: string | null;
  customHousingFundBase?: string | null;
  city: CityConfig;
  housingFundRatio: number;
}

export interface SocialInsuranceResult {
  pension: string;
  medical: string;
  unemployment: string;
  housingFund: string;
  total: string;
  socialBaseUsed: string;
  housingFundBaseUsed: string;
}

function clamp(value: number, lo: number, hi: number) {
  return Math.min(Math.max(value, lo), hi);
}

export function computeSocialInsurance(input: SocialInsuranceInput): SocialInsuranceResult {
  const { city, housingFundRatio } = input;
  const income = max(d(input.monthlyIncome), d(0));

  const siCfg = city.socialInsurance;
  const hfCfg = city.housingFund;

  const rawSocialBase = input.customSocialBase != null && input.customSocialBase !== ''
    ? d(input.customSocialBase)
    : income;
  const socialBase = min(max(rawSocialBase, d(siCfg.baseLower)), d(siCfg.baseUpper));

  const rawHfBase = input.customHousingFundBase != null && input.customHousingFundBase !== ''
    ? d(input.customHousingFundBase)
    : income;
  const hfBase = min(max(rawHfBase, d(hfCfg.baseLower)), d(hfCfg.baseUpper));

  const ratio = clamp(housingFundRatio, hfCfg.ratioRange[0], hfCfg.ratioRange[1]);

  const pension = socialBase.mul(siCfg.pension.rate);
  const medical = socialBase.mul(siCfg.medical.rate);
  const unemployment = socialBase.mul(siCfg.unemployment.rate);
  const housingFund = hfBase.mul(ratio);
  const total = pension.add(medical).add(unemployment).add(housingFund);

  return {
    pension: fmt(pension),
    medical: fmt(medical),
    unemployment: fmt(unemployment),
    housingFund: fmt(housingFund),
    total: fmt(total),
    socialBaseUsed: fmt(socialBase),
    housingFundBaseUsed: fmt(hfBase),
  };
}
