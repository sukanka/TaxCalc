import { describe, it, expect } from 'vitest';
import { computeMonthlyWithholding } from '@/core/tax';

describe('computeMonthlyWithholding — 月度累计预扣', () => {
  it('单月 1 月：月薪 10000 五险一金 2000 专项 3000 → 累计应纳税所得 0，无税', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '10000',
      cumulativeSocialInsurance: '2000',
      cumulativeDeductions: '3000',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '0',
    });
    expect(r.cumulativeTaxableIncome).toBe('0.00');
    expect(r.monthlyTax).toBe('0.00');
  });

  it('单月 1 月：月薪 30000 五险一金 5000 专项 0 → 累计 20000，3% 档税 600', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '30000',
      cumulativeSocialInsurance: '5000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '0',
    });
    expect(r.cumulativeTaxableIncome).toBe('20000.00');
    expect(r.monthlyTax).toBe('600.00');
  });

  it('累计跨档：累计应纳税所得 120000，已缴 1080 → 当月税 8400', () => {
    const r = computeMonthlyWithholding({
      month: 6,
      cumulativeIncome: '180000',
      cumulativeSocialInsurance: '30000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '1080',
    });
    expect(r.cumulativeTaxableIncome).toBe('120000.00');
    expect(r.cumulativeTaxBeforeRelief).toBe('9480.00');
    expect(r.monthlyTax).toBe('8400.00');
  });

  it('减征已扣 500：当月税 = 累计税 - 累计减征 - 已缴', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '30000',
      cumulativeSocialInsurance: '5000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '500',
      previousTaxPaid: '0',
    });
    expect(r.cumulativeTaxAfterRelief).toBe('100.00');
    expect(r.monthlyTax).toBe('100.00');
  });

  it('当月计算结果为负时（预缴大于应缴）返回 0', () => {
    const r = computeMonthlyWithholding({
      month: 12,
      cumulativeIncome: '120000',
      cumulativeSocialInsurance: '20000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '5000',
    });
    expect(r.monthlyTax).toBe('0.00');
  });

  it('到手 = 当月毛收入 - 当月社保 - 当月预扣（要求传当月数）', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '30000',
      cumulativeSocialInsurance: '5000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '0',
      monthlyIncome: '30000',
      monthlySocialInsurance: '5000',
    });
    expect(r.netSalary).toBe('24400.00');
  });
});
