import { d, fmt, ZERO, max } from './decimal';
import { computeMonthlyWithholding, computeComprehensiveTax } from './tax';
import { computeSocialInsurance } from './socialInsurance';
import { computeMonthlyDeductions } from './deductions';
import { applyReliefBatch } from './reliefs';
import { compareBonusPlans } from './bonusOptimizer';
import { ANNUAL_BASIC_DEDUCTION } from '@/data/constants';
import type { SocialInsuranceResult } from './socialInsurance';
import type {
  CityConfig,
  DeductionsInput,
  MonthlyWithholding,
  BonusComparison,
  BonusPlanResult,
} from '@/types';

export interface AnnualSummaryInput {
  monthlyIncome: string;
  annualBonus: string;
  city: CityConfig;
  housingFundRatio: number;
  pensionRatio?: number;
  customSocialBase?: string | null;
  customHousingFundBase?: string | null;
  deductions: DeductionsInput;
  reliefs: string[];
}

export interface AnnualSummary {
  monthly: MonthlyWithholding[];
  /** 仅工资部分（保持向后兼容） */
  annualGross: string;
  /** 年终奖税前金额 */
  annualBonusGross: string;
  /** 工资 + 年终奖 */
  annualTotalGross: string;
  annualSocialInsurance: string;
  annualDeductions: string;
  annualReliefDeducted: string;
  annualSalaryTaxBeforeRelief: string;
  annualSalaryTax: string;
  /** 年终奖部分扣税（最优方案下） */
  annualBonusTax: string;
  /** 年度总扣税 = 工资税(含减征) + 年终奖税 */
  annualTotalTax: string;
  annualNetIncome: string;
  bonusComparison: BonusComparison;
  socialInsurance: SocialInsuranceResult;
}

export function computeAnnualSummary(input: AnnualSummaryInput): AnnualSummary {
  const si = computeSocialInsurance({
    monthlyIncome: input.monthlyIncome,
    customSocialBase: input.customSocialBase,
    customHousingFundBase: input.customHousingFundBase,
    city: input.city,
    housingFundRatio: input.housingFundRatio,
    pensionRatio: input.pensionRatio,
  });
  const monthlyDed = computeMonthlyDeductions(input.deductions);

  const activePolicies = input.city.reliefPolicies.filter(p => input.reliefs.includes(p.id));

  const monthly: MonthlyWithholding[] = [];
  let cumIncome = ZERO;
  let cumSI = ZERO;
  let cumDed = ZERO;
  let cumRelief = ZERO;
  let prevPaid = ZERO;
  const policyAccumulators = new Map<string, string>();
  for (const p of activePolicies) policyAccumulators.set(p.id, '0');

  for (let m = 1; m <= 12; m++) {
    cumIncome = cumIncome.add(input.monthlyIncome);
    cumSI = cumSI.add(si.total);
    cumDed = cumDed.add(monthlyDed.total);

    const provisional = computeMonthlyWithholding({
      month: m,
      cumulativeIncome: cumIncome.toFixed(2),
      cumulativeSocialInsurance: cumSI.toFixed(2),
      cumulativeDeductions: cumDed.toFixed(2),
      cumulativeReliefDeducted: cumRelief.toFixed(2),
      previousTaxPaid: prevPaid.toFixed(2),
      monthlyIncome: input.monthlyIncome,
      monthlySocialInsurance: si.total,
    });

    let monthlyTax = d(provisional.monthlyTax);
    if (activePolicies.length > 0 && monthlyTax.gt(0)) {
      const r = applyReliefBatch({
        taxAmount: monthlyTax.toFixed(2),
        policies: activePolicies.map(p => ({
          policy: p,
          accumulatedReduced: policyAccumulators.get(p.id)!,
        })),
      });
      for (const pp of r.perPolicy) {
        const prev = d(policyAccumulators.get(pp.policyId)!);
        policyAccumulators.set(pp.policyId, fmt(prev.add(pp.reduced)));
      }
      cumRelief = cumRelief.add(r.totalReduced);
      monthlyTax = d(r.taxAfterRelief);
    }

    const netSalary = d(input.monthlyIncome).sub(si.total).sub(monthlyTax);

    monthly.push({
      ...provisional,
      cumulativeReliefDeducted: fmt(cumRelief),
      cumulativeTaxAfterRelief: fmt(d(provisional.cumulativeTaxBeforeRelief).sub(cumRelief)),
      monthlyTax: fmt(monthlyTax),
      netSalary: fmt(netSalary),
    });

    prevPaid = prevPaid.add(monthlyTax);
  }

  const annualGross = cumIncome;
  const annualSI = cumSI;
  const annualDed = cumDed;
  const salaryTI = max(annualGross.sub(annualSI).sub(annualDed).sub(ANNUAL_BASIC_DEDUCTION), ZERO);
  const taxComp = computeComprehensiveTax(salaryTI.toFixed(2));
  const annualSalaryTax = max(d(taxComp.taxBeforeRelief).sub(cumRelief), ZERO);

  const rawComparison = compareBonusPlans({
    annualSalaryAfterBaseDeductions: salaryTI.toFixed(2),
    annualBonus: input.annualBonus,
  });

  // 对每个方案的年终奖部分应用减征（共用 12 月用完后的剩余额度）
  const policySnap = activePolicies.map(p => ({
    policy: p,
    accumulatedReduced: policyAccumulators.get(p.id)!,
  }));
  const adjustedPlans: BonusPlanResult[] = rawComparison.plans.map(plan => {
    const bonusPart = max(d(plan.totalTax).sub(taxComp.taxBeforeRelief), ZERO);
    if (activePolicies.length === 0 || bonusPart.lte(0)) {
      return { ...plan, totalTaxBeforeRelief: plan.totalTax, reliefReduced: '0.00' };
    }
    const r = applyReliefBatch({
      taxAmount: bonusPart.toFixed(2),
      policies: policySnap.map(s => ({ ...s })),
    });
    return {
      ...plan,
      totalTaxBeforeRelief: plan.totalTax,
      totalTax: fmt(d(plan.totalTax).sub(r.totalReduced)),
      reliefReduced: r.totalReduced,
    };
  });

  // 重新排序找 best/worst（基于减征后 totalTax）
  const adjustedSorted = [...adjustedPlans].sort(
    (a, b) => parseFloat(a.totalTax) - parseFloat(b.totalTax)
  );
  const adjustedBest = adjustedSorted[0];
  const adjustedWorst = adjustedSorted[adjustedSorted.length - 1];
  const adjustedSaved = d(adjustedWorst.totalTax).sub(adjustedBest.totalTax);

  const bonusComparison: BonusComparison = {
    plans: adjustedPlans,
    best: adjustedBest,
    worst: adjustedWorst,
    savedVsWorst: fmt(adjustedSaved),
    trapWarning: rawComparison.trapWarning,
  };

  const annualBonusTax = max(d(bonusComparison.best.totalTax).sub(taxComp.taxBeforeRelief), ZERO);
  const totalReliefDeducted = cumRelief.add(bonusComparison.best.reliefReduced ?? '0');
  const annualTotalTax = d(annualSalaryTax).add(annualBonusTax);

  const bonusGross = max(d(input.annualBonus), ZERO);
  const totalGross = annualGross.add(bonusGross);
  const annualNet = totalGross.sub(annualSI).sub(annualTotalTax);

  return {
    monthly,
    annualGross: fmt(annualGross),
    annualBonusGross: fmt(bonusGross),
    annualTotalGross: fmt(totalGross),
    annualSocialInsurance: fmt(annualSI),
    annualDeductions: fmt(annualDed),
    annualReliefDeducted: fmt(totalReliefDeducted),
    annualSalaryTaxBeforeRelief: taxComp.taxBeforeRelief,
    annualSalaryTax: fmt(annualSalaryTax),
    annualBonusTax: fmt(annualBonusTax),
    annualTotalTax: fmt(annualTotalTax),
    annualNetIncome: fmt(annualNet),
    bonusComparison,
    socialInsurance: si,
  };
}
