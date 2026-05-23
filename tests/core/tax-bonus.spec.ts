import { describe, it, expect } from 'vitest';
import { computeBonusSeparateTax, detectBonusTrap } from '@/core/tax';

describe('computeBonusSeparateTax — 年终奖单独计税', () => {
  it('年终奖 36000 → 36000 ÷ 12 = 3000，3% 档，税 1080', () => {
    const r = computeBonusSeparateTax('36000');
    expect(r.bracket.rate).toBe(0.03);
    expect(r.taxBeforeRelief).toBe('1080.00');
  });

  it('年终奖 36000.01 → 跳到 10% 档，税 ≈ 3390.00', () => {
    const r = computeBonusSeparateTax('36000.01');
    expect(r.bracket.rate).toBe(0.10);
    expect(r.taxBeforeRelief).toBe('3390.00');
  });

  it('年终奖 38566.67 → 单独计税 ≈ 3646.67', () => {
    const r = computeBonusSeparateTax('38566.67');
    expect(r.bracket.rate).toBe(0.10);
    expect(r.taxBeforeRelief).toBe('3646.67');
  });
});

describe('detectBonusTrap — 陷阱区间检测', () => {
  it('36000 不是陷阱（边界含）', () => {
    expect(detectBonusTrap('36000')).toBeNull();
  });

  it('36500 落入第一个陷阱', () => {
    const w = detectBonusTrap('36500');
    expect(w).not.toBeNull();
    expect(w!.triggerAmount).toBe(36000);
    expect(w!.suggestedAmount).toBe(36000);
    // 36500*0.10 - 210 = 3440； 36000 单独 = 1080；saving = 2360
    expect(w!.potentialSaving).toBe('2360.00');
  });

  it('38566.67 边界不算陷阱（端点不含）', () => {
    expect(detectBonusTrap('38566.67')).toBeNull();
  });

  it('150000 落入第二个陷阱（144000 区间）', () => {
    const w = detectBonusTrap('150000');
    expect(w).not.toBeNull();
    expect(w!.triggerAmount).toBe(144000);
  });

  it('1000000 落入第六个陷阱', () => {
    const w = detectBonusTrap('1000000');
    expect(w).not.toBeNull();
    expect(w!.triggerAmount).toBe(960000);
  });

  it('5000000 不在任何陷阱区间', () => {
    expect(detectBonusTrap('5000000')).toBeNull();
  });
});
