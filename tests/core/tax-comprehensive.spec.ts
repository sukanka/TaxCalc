import { describe, it, expect } from 'vitest';
import { computeComprehensiveTax } from '@/core/tax';

describe('computeComprehensiveTax — 综合所得年度税额', () => {
  it('应纳税所得额为 0 时税额为 0', () => {
    const r = computeComprehensiveTax('0');
    expect(r.taxBeforeRelief).toBe('0.00');
    expect(r.bracket.rate).toBe(0.03);
  });

  it('应纳税所得额 36000 时（边界含），税率 3%，税额 1080', () => {
    const r = computeComprehensiveTax('36000');
    expect(r.bracket.rate).toBe(0.03);
    expect(r.taxBeforeRelief).toBe('1080.00');
  });

  it('应纳税所得额 36000.01 时跳到 10% 档', () => {
    const r = computeComprehensiveTax('36000.01');
    expect(r.bracket.rate).toBe(0.10);
    expect(r.taxBeforeRelief).toBe('1080.00');
  });

  it('应纳税所得额 144000 适用 10% 档，税额 11880', () => {
    const r = computeComprehensiveTax('144000');
    expect(r.taxBeforeRelief).toBe('11880.00');
  });

  it('应纳税所得额 1000000 适用 45% 档', () => {
    const r = computeComprehensiveTax('1000000');
    expect(r.bracket.rate).toBe(0.45);
    expect(r.taxBeforeRelief).toBe('268080.00');
  });

  it('负数应纳税所得额返回 0', () => {
    const r = computeComprehensiveTax('-1000');
    expect(r.taxBeforeRelief).toBe('0.00');
  });
});
