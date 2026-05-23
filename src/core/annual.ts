import { d, fmt, ZERO, max } from './decimal';
import { computeMonthlyWithholding, computeComprehensiveTax } from './tax';
import { computeSocialInsurance } from './socialInsurance';
import { computeMonthlyDeductions } from './deductions';
import { applyReliefBatch } from './reliefs';
import { compareBonusPlans } from './bonusOptimizer';
import { ANNUAL_BASIC_DEDUCTION } from '@/data/constants';
import type {
  CityConfig,
  DeductionsInput,
  MonthlyWithholding,
  BonusComparison,
} from '@/types';

export interface AnnualSummaryInput {
  monthlyIncome: string;
  annualBonus: string;
  city: CityConfig;
  housingFundRatio: number;
  customSocialBase?: string | null;
  customHousingFundBase?: string | null;
  deductions: DeductionsInput;
  reliefs: string[];
}

export interface AnnualSummary {
  monthly: MonthlyWithholding[];
  annualGross: string;
  annualSocialInsurance: string;
  annualDeductions: string;
  annualReliefDeducted: string;
  annualSalaryTaxBeforeRelief: string;
  annualSalaryTax: string;
  annualNetIncome: string;
  bonusComparison: BonusComparison;
}

export function computeAnnualSummary(input: AnnualSummaryInput): AnnualSummary {
  const si = computeSocialInsurance({
    monthlyIncome: input.monthlyIncome,
    customSocialBase: input.customSocialBase,
    customHousingFundBase: input.customHousingFundBase,
    city: input.city,
    housingFundRatio: input.housingFundRatio,
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

  const annualNet = annualGross.sub(annualSI).sub(annualSalaryTax);

  const bonusComparison = compareBonusPlans({
    annualSalaryAfterBaseDeductions: salaryTI.toFixed(2),
    annualBonus: input.annualBonus,
  });

  return {
    monthly,
    annualGross: fmt(annualGross),
    annualSocialInsurance: fmt(annualSI),
    annualDeductions: fmt(annualDed),
    annualReliefDeducted: fmt(cumRelief),
    annualSalaryTaxBeforeRelief: taxComp.taxBeforeRelief,
    annualSalaryTax: fmt(annualSalaryTax),
    annualNetIncome: fmt(annualNet),
    bonusComparison,
  };
}
