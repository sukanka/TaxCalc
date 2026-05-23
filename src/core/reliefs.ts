import { d, fmt, min, max, ZERO } from './decimal';
import type { ReliefPolicy, ReliefApplyResult } from '@/types';

export interface ApplyReliefInput {
  taxAmount: string;
  accumulatedReduced: string;
  policy: ReliefPolicy;
}

export function applyRelief(input: ApplyReliefInput): ReliefApplyResult {
  const tax = max(d(input.taxAmount), ZERO);
  const acc = max(d(input.accumulatedReduced), ZERO);
  const { policy } = input;

  let reduced = ZERO;
  let remainingCap: string | null = null;

  switch (policy.mode) {
    case 'ratio': {
      const ratio = policy.ratio ?? 0;
      reduced = tax.mul(ratio);
      if (policy.annualCap !== undefined) {
        const cap = max(d(policy.annualCap).sub(acc), ZERO);
        reduced = min(reduced, cap);
        remainingCap = fmt(cap.sub(reduced));
      }
      reduced = min(reduced, tax);
      break;
    }
    case 'cap': {
      const cap = max(d(policy.annualCap ?? 0).sub(acc), ZERO);
      reduced = min(tax, cap);
      remainingCap = fmt(cap.sub(reduced));
      break;
    }
    case 'monthly_cap': {
      reduced = min(tax, d(policy.monthlyCap ?? 0));
      remainingCap = null;
      break;
    }
  }

  return { reduced: fmt(reduced), remainingCap };
}

export interface BatchInput {
  taxAmount: string;
  policies: { policy: ReliefPolicy; accumulatedReduced: string }[];
}

export interface BatchResult {
  totalReduced: string;
  taxAfterRelief: string;
  perPolicy: { policyId: string; reduced: string }[];
}

export function applyReliefBatch(input: BatchInput): BatchResult {
  let remaining = max(d(input.taxAmount), ZERO);
  let totalReduced = ZERO;
  const perPolicy: { policyId: string; reduced: string }[] = [];

  for (const item of input.policies) {
    const r = applyRelief({
      taxAmount: remaining.toFixed(2),
      accumulatedReduced: item.accumulatedReduced,
      policy: item.policy,
    });
    totalReduced = totalReduced.add(r.reduced);
    remaining = remaining.sub(r.reduced);
    perPolicy.push({ policyId: item.policy.id, reduced: r.reduced });
  }

  return {
    totalReduced: fmt(totalReduced),
    taxAfterRelief: fmt(remaining),
    perPolicy,
  };
}
