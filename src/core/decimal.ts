import Decimal from 'decimal.js';

Decimal.set({
  precision: 30,
  rounding: Decimal.ROUND_HALF_UP,
});

export type Money = Decimal;

export function d(value: string | number | Decimal | null | undefined): Money {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  return new Decimal(value);
}

/** 保留 2 位小数（四舍五入），返回字符串 */
export function fmt(value: Decimal | string | number): string {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function max(a: Money, b: Money): Money {
  return a.gte(b) ? a : b;
}

export function min(a: Money, b: Money): Money {
  return a.lte(b) ? a : b;
}

export const ZERO = new Decimal(0);

export { Decimal };
