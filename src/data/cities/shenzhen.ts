import type { CityConfig } from '@/types';
import { guangzhou } from './guangzhou';

export const shenzhen: CityConfig = {
  ...guangzhou,
  id: 'shenzhen',
  name: '深圳',
  socialInsurance: {
    baseLower: 2360,
    baseUpper: 44265,
    pension: { rate: 0.08, ratioRange: [0, 0.12] },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.003 },
  },
  housingFund: {
    baseLower: 2360,
    baseUpper: 44265,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '深圳市 2025 年度社会保险缴费基数（上限 44265 元，与公积金同源）',
    url: 'http://hrss.sz.gov.cn/',
  },
  housingFundSource: {
    title: '深圳住房公积金管理中心 · 2025 年度缴存基数（44265/2360 元，周期 2025-07~2026-06）',
    url: 'http://bsy.sz.bendibao.com/bsyDetail/636403.html',
  },
};
