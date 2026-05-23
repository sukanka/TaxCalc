import { describe, it, expect } from 'vitest';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
  findBracket,
} from '@/data/taxBrackets';

describe('税率表结构', () => {
  it('综合所得有 7 档', () => {
    expect(ANNUAL_COMPREHENSIVE_BRACKETS).toHaveLength(7);
  });

  it('月度奖金表有 7 档', () => {
    expect(MONTHLY_BONUS_BRACKETS).toHaveLength(7);
  });

  it('综合所得边界值连续', () => {
    for (let i = 1; i < ANNUAL_COMPREHENSIVE_BRACKETS.length; i++) {
      expect(ANNUAL_COMPREHENSIVE_BRACKETS[i].lower).toBe(
        ANNUAL_COMPREHENSIVE_BRACKETS[i - 1].upper
      );
    }
  });

  it('税率单调递增', () => {
    for (let i = 1; i < ANNUAL_COMPREHENSIVE_BRACKETS.length; i++) {
      expect(ANNUAL_COMPREHENSIVE_BRACKETS[i].rate).toBeGreaterThan(
        ANNUAL_COMPREHENSIVE_BRACKETS[i - 1].rate
      );
    }
  });
});

describe('findBracket', () => {
  it('在第一档边界 36000 取第一档（含上限）', () => {
    expect(findBracket(36000, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.03);
  });

  it('在第二档边界 36000.01 取第二档', () => {
    expect(findBracket(36000.01, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.1);
  });

  it('960000 取第 6 档（rate 0.35），960000.01 取第 7 档', () => {
    expect(findBracket(960000, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.35);
    expect(findBracket(960000.01, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.45);
  });

  it('0 或负数取第一档', () => {
    expect(findBracket(0, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.03);
    expect(findBracket(-100, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.03);
  });
});
