import { describe, it, expect } from 'vitest';
import { computeAnnualSummary } from '@/core/annual';
import { CITIES } from '@/data/cities';
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

describe('端到端场景验证', () => {
  it('北京月薪 30000 + 1 孩 + 房贷 + 残疾人减征 50%：12 月累计预扣 ≈ 年度汇算', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: CITIES.beijing,
      housingFundRatio: 0.12,
      deductions: {
        ...empty,
        childEducation: { enabled: true, count: 1 },
        housingLoan: { enabled: true },
      },
      reliefs: ['beijing-disability'],
    });
    const sum = r.monthly.reduce((a, m) => a + parseFloat(m.monthlyTax), 0);
    expect(sum).toBeCloseTo(parseFloat(r.annualSalaryTax), 1);
  });

  it('上海月薪 50000 年终奖 200000：上海年限额 10500 应在年度内用完', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '50000',
      annualBonus: '200000',
      city: CITIES.shanghai,
      housingFundRatio: 0.07,
      deductions: empty,
      reliefs: ['shanghai-disability'],
    });
    expect(parseFloat(r.annualReliefDeducted)).toBeCloseTo(10500, 0);
  });

  it('广州月薪 40000 + 残疾人减征 90%：累计税额按 90% 减征', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '40000',
      annualBonus: '0',
      city: CITIES.guangzhou,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: ['guangdong-disability'],
    });
    const noRelief = computeAnnualSummary({
      monthlyIncome: '40000',
      annualBonus: '0',
      city: { ...CITIES.guangzhou, reliefPolicies: [] },
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: [],
    });
    const noTax = parseFloat(noRelief.annualSalaryTax);
    const withTax = parseFloat(r.annualSalaryTax);
    if (noTax * 0.9 < 90000) {
      expect(withTax).toBeCloseTo(noTax * 0.1, 1);
    } else {
      expect(noTax - withTax).toBeCloseTo(90000, 1);
    }
  });

  it('杭州月薪 20000 + 残疾人 monthly_cap 500：每月最多减 500', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '20000',
      annualBonus: '0',
      city: CITIES.hangzhou,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: ['zhejiang-disability'],
    });
    for (const m of r.monthly) {
      const taxBeforeRelief = parseFloat(m.cumulativeTaxBeforeRelief);
      const reliefTotal = parseFloat(m.cumulativeReliefDeducted);
      expect(reliefTotal).toBeLessThanOrEqual(500 * m.month + 0.01);
      expect(reliefTotal).toBeLessThanOrEqual(taxBeforeRelief + 0.01);
    }
  });

  it('深圳月薪 80000 + 年终奖 36500 落入陷阱：best 不会是 separate', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '80000',
      annualBonus: '36500',
      city: CITIES.shenzhen,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: [],
    });
    expect(r.bonusComparison.trapWarning).toBeDefined();
    expect(r.bonusComparison.best.strategy).not.toBe('separate');
  });

  it('成都年限额 12000 + 高薪 100000/月：减征达上限', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '100000',
      annualBonus: '0',
      city: CITIES.chengdu,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: ['sichuan-disability'],
    });
    expect(parseFloat(r.annualReliefDeducted)).toBeCloseTo(12000, 0);
  });
});
