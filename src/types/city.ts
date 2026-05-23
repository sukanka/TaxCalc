import type { ReliefPolicy, ReliefRegion } from './relief';

export type CityId = 'beijing' | 'shanghai' | 'guangzhou' | 'shenzhen' | 'hangzhou' | 'chengdu';

export interface InsuranceItem {
  /** 个人缴纳比例，如 0.08 */
  rate: number;
  /** 可调比例区间 [min, max]，省略表示固定为 rate */
  ratioRange?: [number, number];
}

export interface SocialInsuranceConfig {
  /** 缴费基数下限（元/月） */
  baseLower: number;
  /** 缴费基数上限（元/月） */
  baseUpper: number;
  pension: InsuranceItem;
  medical: InsuranceItem;
  unemployment: InsuranceItem;
}

export interface HousingFundConfig {
  baseLower: number;
  baseUpper: number;
  /** 个人缴存比例区间 [min, max] */
  ratioRange: [number, number];
  /** 默认比例，如 0.12 */
  defaultRatio: number;
}

export interface CityConfig {
  id: CityId;
  name: string;
  region: ReliefRegion;
  socialInsurance: SocialInsuranceConfig;
  housingFund: HousingFundConfig;
  reliefPolicies: ReliefPolicy[];
  /** 数据基准年度，例：2026 */
  effectiveYear: number;
  /** 社保基数政策来源 */
  socialInsuranceSource: { title: string; url: string };
  /** 公积金基数政策来源 */
  housingFundSource: { title: string; url: string };
}
