import { d, fmt, min, max, ZERO } from './decimal';
import { DEDUCTION_STANDARDS } from '@/data/constants';
import type {
  DeductionsInput,
  DeductionsValidation,
  MonthlyDeductionBreakdown,
} from '@/types';

const S = DEDUCTION_STANDARDS;

export function computeMonthlyDeductions(input: DeductionsInput): MonthlyDeductionBreakdown {
  const childEducation = input.childEducation.enabled
    ? d(S.childEducation).mul(Math.max(input.childEducation.count, 0))
    : ZERO;

  const infantCare = input.infantCare.enabled
    ? d(S.infantCare).mul(Math.max(input.infantCare.count, 0))
    : ZERO;

  const continuingEducation = input.continuingEducation.enabled
    ? input.continuingEducation.type === 'degree'
      ? d(S.continuingEducationDegree)
      : ZERO
    : ZERO;

  const seriousIllness = input.seriousIllness.enabled
    ? min(
        max(d(input.seriousIllness.amount).sub(S.seriousIllnessThreshold), ZERO),
        d(S.seriousIllnessAnnualCap),
      ).div(12)
    : ZERO;

  const housingLoan = input.housingLoan.enabled ? d(S.housingLoan) : ZERO;

  const housingRent = input.housingRent.enabled
    ? d(
        input.housingRent.cityTier === 'tier1'
          ? S.housingRentTier1
          : input.housingRent.cityTier === 'tier2'
          ? S.housingRentTier2
          : S.housingRentTier3,
      )
    : ZERO;

  const elderlyCare = input.elderlyCare.enabled
    ? input.elderlyCare.isOnlyChild
      ? d(S.elderlyCareOnlyChild)
      : min(d(input.elderlyCare.sharedAmount), d(S.elderlyCareSharedMax))
    : ZERO;

  const total = childEducation
    .add(infantCare)
    .add(continuingEducation)
    .add(seriousIllness)
    .add(housingLoan)
    .add(housingRent)
    .add(elderlyCare);

  return {
    childEducation: fmt(childEducation),
    infantCare: fmt(infantCare),
    continuingEducation: fmt(continuingEducation),
    seriousIllness: fmt(seriousIllness),
    housingLoan: fmt(housingLoan),
    housingRent: fmt(housingRent),
    elderlyCare: fmt(elderlyCare),
    total: fmt(total),
  };
}

export function validateDeductions(input: DeductionsInput): DeductionsValidation {
  const conflicts: string[] = [];

  if (input.housingLoan.enabled && input.housingRent.enabled) {
    conflicts.push('住房贷款利息 和 住房租金 不可同时享受');
  }

  if (input.elderlyCare.enabled && !input.elderlyCare.isOnlyChild) {
    if (d(input.elderlyCare.sharedAmount).gt(S.elderlyCareSharedMax)) {
      conflicts.push('非独生子女赡养老人分摊金额不得超过 1500 元/月');
    }
  }

  if (input.childEducation.enabled && input.childEducation.count <= 0) {
    conflicts.push('已开启子女教育，请填写子女数量');
  }
  if (input.infantCare.enabled && input.infantCare.count <= 0) {
    conflicts.push('已开启婴幼儿照护，请填写婴幼儿数量');
  }

  return { valid: conflicts.length === 0, conflicts };
}
