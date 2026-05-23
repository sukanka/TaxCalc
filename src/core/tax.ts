import { d, fmt, max, ZERO } from './decimal';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
  findBracket,
} from '@/data/taxBrackets';
import { MONTHLY_BASIC_DEDUCTION } from '@/data/constants';
import type { TaxComputation, TaxBracket, MonthlyWithholding } from '@/types';

/**
 * 综合所得税额计算（公式：应纳税所得额 × 税率 − 速算扣除数）。
 * 应纳税所得额为非正时返回 0。
 */
export function computeComprehensiveTax(taxableIncome: string | number): TaxComputation {
  const ti = max(d(taxableIncome), ZERO);
  const bracket = findBracket(ti.toNumber(), ANNUAL_COMPREHENSIVE_BRACKETS);
  const tax = max(ti.mul(bracket.rate).sub(bracket.quickDeduction), ZERO);
  return {
    taxableIncome: fmt(ti),
    bracket,
    taxBeforeRelief: fmt(tax),
    reliefDeducted: '0.00',
    taxFinal: fmt(tax),
  };
}

/**
 * 全年一次性奖金单独计税：以 (年终奖 ÷ 12) 查月度税率表，得税率与速算扣除数。
 */
export function computeBonusSeparateTax(bonusAmount: string | number): TaxComputation {
  const bonus = max(d(bonusAmount), ZERO);
  const avg = bonus.div(12).toNumber();
  const bracket = findBracket(avg, MONTHLY_BONUS_BRACKETS);
  const tax = max(bonus.mul(bracket.rate).sub(bracket.quickDeduction), ZERO);
  return {
    taxableIncome: fmt(bonus),
    bracket,
    taxBeforeRelief: fmt(tax),
    reliefDeducted: '0.00',
    taxFinal: fmt(tax),
  };
}

export type { TaxBracket };

export interface MonthlyWithholdingInput {
  month: number; // 1-12
  cumulativeIncome: string;
  cumulativeSocialInsurance: string;
  cumulativeDeductions: string;
  cumulativeReliefDeducted: string;
  previousTaxPaid: string;
  monthlyIncome?: string;
  monthlySocialInsurance?: string;
}

export function computeMonthlyWithholding(input: MonthlyWithholdingInput): MonthlyWithholding {
  const cumIncome = max(d(input.cumulativeIncome), ZERO);
  const cumSI = max(d(input.cumulativeSocialInsurance), ZERO);
  const cumDed = max(d(input.cumulativeDeductions), ZERO);
  const cumBasic = d(MONTHLY_BASIC_DEDUCTION).mul(input.month);
  const cumRelief = max(d(input.cumulativeReliefDeducted), ZERO);
  const prevPaid = max(d(input.previousTaxPaid), ZERO);

  const cumTI = max(cumIncome.sub(cumSI).sub(cumDed).sub(cumBasic), ZERO);

  const bracket = findBracket(cumTI.toNumber(), ANNUAL_COMPREHENSIVE_BRACKETS);
  const cumTaxBeforeRelief = max(cumTI.mul(bracket.rate).sub(bracket.quickDeduction), ZERO);
  const cumTaxAfterRelief = max(cumTaxBeforeRelief.sub(cumRelief), ZERO);
  const monthlyTax = max(cumTaxAfterRelief.sub(prevPaid), ZERO);

  let netSalary = '';
  if (input.monthlyIncome !== undefined && input.monthlySocialInsurance !== undefined) {
    const ns = d(input.monthlyIncome).sub(d(input.monthlySocialInsurance)).sub(monthlyTax);
    netSalary = fmt(ns);
  }

  return {
    month: input.month,
    cumulativeIncome: fmt(cumIncome),
    cumulativeSocialInsurance: fmt(cumSI),
    cumulativeDeductions: fmt(cumDed),
    cumulativeBasicDeduction: fmt(cumBasic),
    cumulativeReliefAccumulated: fmt(cumRelief),
    cumulativeTaxableIncome: fmt(cumTI),
    cumulativeTaxBeforeRelief: fmt(cumTaxBeforeRelief),
    cumulativeReliefDeducted: fmt(cumRelief),
    cumulativeTaxAfterRelief: fmt(cumTaxAfterRelief),
    monthlyTax: fmt(monthlyTax),
    netSalary,
    bracket,
  };
}
