import type { CityConfig } from '@/types';
import { guangzhou } from './guangzhou';

export const shenzhen: CityConfig = {
  ...guangzhou,
  id: 'shenzhen',
  name: '深圳',
  socialInsurance: {
    baseLower: 2360,
    baseUpper: 28770,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.003 },
  },
  housingFund: {
    baseLower: 2360,
    baseUpper: 41497,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '深圳市 2024 年社会保险缴费基数',
    url: 'http://hrss.sz.gov.cn/',
  },
};
