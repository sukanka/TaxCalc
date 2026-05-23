import { d, fmt, max, min } from './decimal';
import type { CityConfig } from '@/types';

export interface SocialInsuranceInput {
  monthlyIncome: string;
  customSocialBase?: string | null;
  customHousingFundBase?: string | null;
  city: CityConfig;
  housingFundRatio: number;
  /** 养老保险个人比例。省略时使用城市配置默认值 */
  pensionRatio?: number;
}

export interface SocialInsuranceItemDetail {
  /** 缴费基数（已 clamp 到上下限） */
  base: string;
  /** 应用比例 */
  rate: number;
  /** 计算金额 */
  amount: string;
}

export interface SocialInsuranceResult {
  pension: string;
  medical: string;
  unemployment: string;
  housingFund: string;
  total: string;
  socialBaseUsed: string;
  housingFundBaseUsed: string;
  /** 社保基数是否被上限封顶 */
  socialBaseCapped: boolean;
  /** 公积金基数是否被上限封顶 */
  housingFundBaseCapped: boolean;
  /** 详细明细（含每项比例） */
  details: {
    pension: SocialInsuranceItemDetail;
    medical: SocialInsuranceItemDetail;
    unemployment: SocialInsuranceItemDetail;
    housingFund: SocialInsuranceItemDetail;
  };
}

function clamp(value: number, lo: number, hi: number) {
  return Math.min(Math.max(value, lo), hi);
}

function clampRatio(value: number | undefined, fallback: number, range?: [number, number]): number {
  const v = value ?? fallback;
  if (range) return clamp(v, range[0], range[1]);
  return v;
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
  const socialBaseCapped = rawSocialBase.gt(siCfg.baseUpper);

  const rawHfBase = input.customHousingFundBase != null && input.customHousingFundBase !== ''
    ? d(input.customHousingFundBase)
    : income;
  const hfBase = min(max(rawHfBase, d(hfCfg.baseLower)), d(hfCfg.baseUpper));
  const housingFundBaseCapped = rawHfBase.gt(hfCfg.baseUpper);

  const pensionRate = clampRatio(input.pensionRatio, siCfg.pension.rate, siCfg.pension.ratioRange);
  const medicalRate = clampRatio(undefined, siCfg.medical.rate, siCfg.medical.ratioRange);
  const unemploymentRate = clampRatio(undefined, siCfg.unemployment.rate, siCfg.unemployment.ratioRange);
  const hfRate = clamp(housingFundRatio, hfCfg.ratioRange[0], hfCfg.ratioRange[1]);

  const pension = socialBase.mul(pensionRate);
  const medical = socialBase.mul(medicalRate);
  const unemployment = socialBase.mul(unemploymentRate);
  const housingFund = hfBase.mul(hfRate);
  const total = pension.add(medical).add(unemployment).add(housingFund);

  return {
    pension: fmt(pension),
    medical: fmt(medical),
    unemployment: fmt(unemployment),
    housingFund: fmt(housingFund),
    total: fmt(total),
    socialBaseUsed: fmt(socialBase),
    housingFundBaseUsed: fmt(hfBase),
    socialBaseCapped,
    housingFundBaseCapped,
    details: {
      pension: { base: fmt(socialBase), rate: pensionRate, amount: fmt(pension) },
      medical: { base: fmt(socialBase), rate: medicalRate, amount: fmt(medical) },
      unemployment: { base: fmt(socialBase), rate: unemploymentRate, amount: fmt(unemployment) },
      housingFund: { base: fmt(hfBase), rate: hfRate, amount: fmt(housingFund) },
    },
  };
}
