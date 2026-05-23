import { d, fmt, max, ZERO } from './decimal';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
  findBracket,
} from '@/data/taxBrackets';
import type { TaxComputation, TaxBracket } from '@/types';

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
