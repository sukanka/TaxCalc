import { describe, it, expect } from 'vitest';
import {
  computeMonthlyDeductions,
  validateDeductions,
} from '@/core/deductions';
import type { DeductionsInput } from '@/types';

const empty: DeductionsInput = {
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
};

describe('computeMonthlyDeductions', () => {
  it('全关闭：每项 0', () => {
    const r = computeMonthlyDeductions(empty);
    expect(r.total).toBe('0.00');
  });

  it('两个孩子教育：4000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      childEducation: { enabled: true, count: 2 },
    });
    expect(r.childEducation).toBe('4000.00');
    expect(r.total).toBe('4000.00');
  });

  it('1 孩 + 婴幼儿照护 1：2000+2000=4000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      childEducation: { enabled: true, count: 1 },
      infantCare: { enabled: true, count: 1 },
    });
    expect(r.total).toBe('4000.00');
  });

  it('继续教育（学历）400/月', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      continuingEducation: { enabled: true, type: 'degree' },
    });
    expect(r.continuingEducation).toBe('400.00');
  });

  it('继续教育（职业资格 3600 一次性）按月分摊为 0（非月度）', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      continuingEducation: { enabled: true, type: 'professional' },
    });
    expect(r.continuingEducation).toBe('0.00');
  });

  it('住房贷款 1000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      housingLoan: { enabled: true },
    });
    expect(r.housingLoan).toBe('1000.00');
  });

  it('住房租金 tier1=1500 / tier2=1100 / tier3=800', () => {
    expect(computeMonthlyDeductions({ ...empty, housingRent: { enabled: true, cityTier: 'tier1' } }).housingRent).toBe('1500.00');
    expect(computeMonthlyDeductions({ ...empty, housingRent: { enabled: true, cityTier: 'tier2' } }).housingRent).toBe('1100.00');
    expect(computeMonthlyDeductions({ ...empty, housingRent: { enabled: true, cityTier: 'tier3' } }).housingRent).toBe('800.00');
  });

  it('赡养老人独生子女 3000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: true, sharedAmount: '0' },
    });
    expect(r.elderlyCare).toBe('3000.00');
  });

  it('赡养老人非独生子女分摊 1500（最大）', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: false, sharedAmount: '1500' },
    });
    expect(r.elderlyCare).toBe('1500.00');
  });

  it('赡养老人非独生子女分摊超 1500：截断到 1500', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: false, sharedAmount: '2000' },
    });
    expect(r.elderlyCare).toBe('1500.00');
  });

  it('大病医疗：超过 15000 部分按月平摊到 12 个月，封顶 80000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      seriousIllness: { enabled: true, amount: '27000' },
    });
    expect(r.seriousIllness).toBe('1000.00');
  });
});

describe('validateDeductions', () => {
  it('住房贷款 + 住房租金同时开 → 冲突', () => {
    const r = validateDeductions({
      ...empty,
      housingLoan: { enabled: true },
      housingRent: { enabled: true, cityTier: 'tier1' },
    });
    expect(r.valid).toBe(false);
    expect(r.conflicts.length).toBeGreaterThan(0);
  });

  it('赡养老人非独生分摊 > 1500 → 警告', () => {
    const r = validateDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: false, sharedAmount: '2000' },
    });
    expect(r.valid).toBe(false);
  });

  it('全合法 → valid=true', () => {
    const r = validateDeductions({
      ...empty,
      childEducation: { enabled: true, count: 1 },
    });
    expect(r.valid).toBe(true);
  });
});
