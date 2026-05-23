import { describe, it, expect } from 'vitest';
import { compareBonusPlans } from '@/core/bonusOptimizer';

describe('compareBonusPlans — 三方案对比', () => {
  it('低年终奖（10000）：三方案对比', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '60000',
      annualBonus: '10000',
    });
    expect(r.plans).toHaveLength(3);
    expect(r.best).toBeDefined();
    expect(r.worst).toBeDefined();
    const merge = r.plans.find(p => p.strategy === 'merge')!;
    const sep = r.plans.find(p => p.strategy === 'separate')!;
    const split = r.plans.find(p => p.strategy === 'split')!;
    expect(parseFloat(split.totalTax)).toBeLessThanOrEqual(parseFloat(merge.totalTax));
    expect(parseFloat(split.totalTax)).toBeLessThanOrEqual(parseFloat(sep.totalTax));
  });

  it('高年终奖（500000）+ 中等工资：split 优于其他', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '100000',
      annualBonus: '500000',
    });
    const split = r.plans.find(p => p.strategy === 'split')!;
    expect(parseFloat(split.totalTax)).toBeLessThanOrEqual(parseFloat(r.worst.totalTax));
  });

  it('年终奖 0：所有方案税额相同', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '60000',
      annualBonus: '0',
    });
    const taxes = r.plans.map(p => p.totalTax);
    expect(new Set(taxes).size).toBe(1);
  });

  it('split 方案的拆分参数：bonusForSeparate + bonusForMerge = 总年终奖', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '120000',
      annualBonus: '200000',
    });
    const split = r.plans.find(p => p.strategy === 'split')!;
    const sum = parseFloat(split.bonusForSeparate) + parseFloat(split.bonusForMerge);
    expect(sum).toBeCloseTo(200000, 2);
  });

  it('陷阱区间触发：年终奖 36500 → trapWarning 非空', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '60000',
      annualBonus: '36500',
    });
    expect(r.trapWarning).not.toBeUndefined();
    expect(r.trapWarning!.suggestedAmount).toBe(36000);
  });
});
