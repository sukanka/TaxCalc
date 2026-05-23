import { describe, it, expect } from 'vitest';
import { computeAnnualSummary } from '@/core/annual';
import type { CityConfig, DeductionsInput } from '@/types';

const beijing: CityConfig = {
  id: 'beijing',
  name: '北京',
  region: 'beijing',
  effectiveYear: 2026,
  socialInsuranceSource: { title: 't', url: 'http://x' },
  socialInsurance: {
    baseLower: 6000,
    baseUpper: 36000,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: { baseLower: 2000, baseUpper: 30000, ratioRange: [0.05, 0.12], defaultRatio: 0.12 },
  reliefPolicies: [],
};

const noDeductions: DeductionsInput = {
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
};

describe('computeAnnualSummary', () => {
  it('月薪 30000 无年终奖 — 12 月累计预扣总和 = 年度汇算应缴', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    const sumWithholding = r.monthly.reduce((a, m) => a + parseFloat(m.monthlyTax), 0);
    expect(sumWithholding).toBeCloseTo(parseFloat(r.annualSalaryTax), 2);
  });

  it('月薪 30000 + 年终奖 60000 — 三方案对比可用', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '60000',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    expect(r.bonusComparison.plans.length).toBe(3);
  });

  it('月薪 30000 + 北京残疾人减征 50% — 年度税额减半', () => {
    const noRelief = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    const withRelief = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: { ...beijing, reliefPolicies: [{
        id: 'beijing-disability',
        region: 'beijing',
        category: 'disability',
        mode: 'ratio',
        ratio: 0.5,
        scope: 'comprehensive',
        description: 't',
        source: { title: 't', url: 'http://x' },
      }] },
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: ['beijing-disability'],
    });
    const noTax = parseFloat(noRelief.annualSalaryTax);
    const withTax = parseFloat(withRelief.annualSalaryTax);
    expect(withTax).toBeCloseTo(noTax * 0.5, 1);
  });

  it('返回 annualBonusTax 和 annualTotalTax 字段', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '60000',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    expect(r.annualBonusTax).toBeDefined();
    expect(r.annualTotalTax).toBeDefined();
    // 总税 = 工资税 + 年终奖税
    const sum = parseFloat(r.annualSalaryTax) + parseFloat(r.annualBonusTax);
    expect(parseFloat(r.annualTotalTax)).toBeCloseTo(sum, 2);
  });

  it('无年终奖时 annualBonusTax = 0', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    expect(parseFloat(r.annualBonusTax)).toBe(0);
  });

  it('annualNet = annualGross − 五险一金 − annualTotalTax', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '60000',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    const expected =
      parseFloat(r.annualGross) - parseFloat(r.annualSocialInsurance) - parseFloat(r.annualTotalTax);
    expect(parseFloat(r.annualNetIncome)).toBeCloseTo(expected, 2);
  });

  it('年终奖也享受减征：北京 50% + 月薪 30000 + 年终奖 60000', () => {
    const beijingDisability = {
      id: 'beijing-disability',
      region: 'beijing' as const,
      category: 'disability' as const,
      mode: 'ratio' as const,
      ratio: 0.5,
      scope: 'comprehensive' as const,
      description: 't',
      source: { title: 't', url: 'http://x' },
    };
    const noRelief = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '60000',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    const withRelief = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '60000',
      city: { ...beijing, reliefPolicies: [beijingDisability] },
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: ['beijing-disability'],
    });
    // 总税应约为不减征版本的 50%
    expect(parseFloat(withRelief.annualTotalTax)).toBeCloseTo(
      parseFloat(noRelief.annualTotalTax) * 0.5,
      0
    );
    // best 方案下 reliefReduced 非零
    expect(parseFloat(withRelief.bonusComparison.best.reliefReduced ?? '0')).toBeGreaterThan(0);
  });
});
