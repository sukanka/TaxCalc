import { describe, it, expect } from 'vitest';
import { computeSocialInsurance } from '@/core/socialInsurance';
import type { CityConfig } from '@/types';

const fakeCity: CityConfig = {
  id: 'beijing',
  name: '北京',
  region: 'beijing',
  effectiveYear: 2026,
  socialInsuranceSource: { title: 'test', url: 'http://example.com' },
  socialInsurance: {
    baseLower: 6000,
    baseUpper: 36000,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2000,
    baseUpper: 30000,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  reliefPolicies: [],
};

describe('computeSocialInsurance', () => {
  it('月薪 20000 在区间内：按 20000 计算', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '20000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    expect(r.pension).toBe('1600.00');
    expect(r.medical).toBe('400.00');
    expect(r.unemployment).toBe('100.00');
    expect(r.housingFund).toBe('2400.00');
    expect(r.total).toBe('4500.00');
  });

  it('月薪 5000 低于下限 6000：按下限计算', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '5000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    expect(r.pension).toBe('480.00');
    expect(r.housingFund).toBe('600.00');
  });

  it('月薪 50000 高于上限：社保按 36000，公积金按 30000', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '50000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    expect(r.pension).toBe('2880.00');
    expect(r.housingFund).toBe('3600.00');
    expect(r.total).toBe('7380.00');
  });

  it('自定义社保基数 15000 + 自定义公积金基数 10000', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '20000',
      customSocialBase: '15000',
      customHousingFundBase: '10000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    expect(r.pension).toBe('1200.00');
    expect(r.housingFund).toBe('1200.00');
  });

  it('公积金比例越界：clamp 到 [0.05, 0.12]', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '10000',
      city: fakeCity,
      housingFundRatio: 0.20,
    });
    expect(r.housingFund).toBe('1200.00');
  });
});
