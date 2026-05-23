import { d, fmt, max, ZERO } from './decimal';
import {
  computeComprehensiveTax,
  computeBonusSeparateTax,
  detectBonusTrap,
} from './tax';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
} from '@/data/taxBrackets';
import type { BonusComparison, BonusPlanResult } from '@/types';

export interface BonusOptimizerInput {
  /** 年度工资部分应纳税所得额（已扣除基本减除/五险一金/专项附加） */
  annualSalaryAfterBaseDeductions: string;
  /** 年终奖总额 */
  annualBonus: string;
}

/**
 * 在 [0, totalBonus] 范围内寻找最优拆分点。
 * 候选点 = 月度税档断点 × 12 ∪ 年度税档断点 - 工资部分应纳税所得额 ∪ {0, totalBonus}。
 */
function generateCandidates(salaryTI: number, totalBonus: number): number[] {
  const set = new Set<number>([0, totalBonus]);
  for (const b of MONTHLY_BONUS_BRACKETS) {
    if (Number.isFinite(b.upper)) {
      const cand = b.upper * 12;
      if (cand <= totalBonus) set.add(cand);
    }
  }
  for (const b of ANNUAL_COMPREHENSIVE_BRACKETS) {
    if (Number.isFinite(b.upper)) {
      const room = b.upper - salaryTI;
      if (room > 0 && room <= totalBonus) {
        set.add(totalBonus - room);
      }
    }
  }
  return Array.from(set).filter(v => v >= 0 && v <= totalBonus).sort((a, b) => a - b);
}

function planMerge(salaryTI: string, bonus: string): BonusPlanResult {
  const ti = d(salaryTI).add(d(bonus));
  const taxMerge = computeComprehensiveTax(ti.toFixed(2));
  return {
    strategy: 'merge',
    description: '全额并入综合所得',
    bonusForSeparate: '0.00',
    bonusForMerge: fmt(d(bonus)),
    taxFromSeparate: '0.00',
    taxFromMerge: taxMerge.taxBeforeRelief,
    totalTax: taxMerge.taxBeforeRelief,
  };
}

function planSeparate(salaryTI: string, bonus: string): BonusPlanResult {
  const taxSalary = computeComprehensiveTax(salaryTI);
  const taxBonus = computeBonusSeparateTax(bonus);
  const total = d(taxSalary.taxBeforeRelief).add(taxBonus.taxBeforeRelief);
  return {
    strategy: 'separate',
    description: '全额单独计税',
    bonusForSeparate: fmt(d(bonus)),
    bonusForMerge: '0.00',
    taxFromSeparate: taxBonus.taxBeforeRelief,
    taxFromMerge: taxSalary.taxBeforeRelief,
    totalTax: fmt(total),
  };
}

function planSplitAt(salaryTI: string, bonus: string, separateAmount: number): BonusPlanResult {
  const sep = d(separateAmount);
  const merge = d(bonus).sub(sep);
  const taxBonus = computeBonusSeparateTax(sep.toFixed(2));
  const taxSalary = computeComprehensiveTax(d(salaryTI).add(merge).toFixed(2));
  const total = d(taxBonus.taxBeforeRelief).add(taxSalary.taxBeforeRelief);
  return {
    strategy: 'split',
    description: '拆分一部分单独计税，余下并入工资',
    bonusForSeparate: fmt(sep),
    bonusForMerge: fmt(merge),
    taxFromSeparate: taxBonus.taxBeforeRelief,
    taxFromMerge: taxSalary.taxBeforeRelief,
    totalTax: fmt(total),
  };
}

export function compareBonusPlans(input: BonusOptimizerInput): BonusComparison {
  const salaryTI = max(d(input.annualSalaryAfterBaseDeductions), ZERO).toFixed(2);
  const bonus = max(d(input.annualBonus), ZERO).toFixed(2);
  const bonusNum = parseFloat(bonus);
  const salaryNum = parseFloat(salaryTI);

  const merge = planMerge(salaryTI, bonus);
  const separate = planSeparate(salaryTI, bonus);

  let best: BonusPlanResult = merge;
  if (parseFloat(separate.totalTax) < parseFloat(best.totalTax)) best = separate;

  const candidates = generateCandidates(salaryNum, bonusNum);
  let bestSplit = best;
  for (const c of candidates) {
    const p = planSplitAt(salaryTI, bonus, c);
    if (parseFloat(p.totalTax) < parseFloat(bestSplit.totalTax)) bestSplit = p;
  }
  // 标记为 split 即便最优解恰好等于 merge/separate
  const split: BonusPlanResult = bestSplit.strategy === 'split'
    ? bestSplit
    : { ...bestSplit, strategy: 'split', description: '拆分优化（与上述方案相同最优）' };

  const plans: BonusPlanResult[] = [merge, separate, split];
  const sorted = [...plans].sort((a, b) => parseFloat(a.totalTax) - parseFloat(b.totalTax));
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];
  const saved = d(loser.totalTax).sub(winner.totalTax);

  const trapWarning = detectBonusTrap(bonus) ?? undefined;

  return {
    plans,
    best: winner,
    worst: loser,
    savedVsWorst: fmt(saved),
    trapWarning,
  };
}
