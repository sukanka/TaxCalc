import type { BracketTable } from '@/types';

/**
 * 综合所得年度税率表（适用于年度汇算和方案 A 并入计税）。
 * 来源：《个人所得税法》附表一。
 */
export const ANNUAL_COMPREHENSIVE_BRACKETS: BracketTable = [
  { lower: 0,       upper: 36000,     rate: 0.03, quickDeduction: 0 },
  { lower: 36000,   upper: 144000,    rate: 0.10, quickDeduction: 2520 },
  { lower: 144000,  upper: 300000,    rate: 0.20, quickDeduction: 16920 },
  { lower: 300000,  upper: 420000,    rate: 0.25, quickDeduction: 31920 },
  { lower: 420000,  upper: 660000,    rate: 0.30, quickDeduction: 52920 },
  { lower: 660000,  upper: 960000,    rate: 0.35, quickDeduction: 85920 },
  { lower: 960000,  upper: Infinity,  rate: 0.45, quickDeduction: 181920 },
];

/**
 * 月度税率表（适用于全年一次性奖金单独计税：以年终奖 ÷ 12 查表）。
 * 来源：《关于全年一次性奖金等个人所得税计算方法的通知》。
 */
export const MONTHLY_BONUS_BRACKETS: BracketTable = [
  { lower: 0,     upper: 3000,     rate: 0.03, quickDeduction: 0 },
  { lower: 3000,  upper: 12000,    rate: 0.10, quickDeduction: 210 },
  { lower: 12000, upper: 25000,    rate: 0.20, quickDeduction: 1410 },
  { lower: 25000, upper: 35000,    rate: 0.25, quickDeduction: 2660 },
  { lower: 35000, upper: 55000,    rate: 0.30, quickDeduction: 4410 },
  { lower: 55000, upper: 80000,    rate: 0.35, quickDeduction: 7160 },
  { lower: 80000, upper: Infinity, rate: 0.45, quickDeduction: 15160 },
];

/**
 * 月度累计预扣预缴税率表（按累计应纳税所得额分档，与年度税率表数值一致）。
 */
export const MONTHLY_WITHHOLDING_BRACKETS: BracketTable = ANNUAL_COMPREHENSIVE_BRACKETS;

/**
 * 在税率表中查找某金额对应的税档。
 * @param amount 应纳税所得额（元）
 * @param table 税率表
 */
export function findBracket(amount: number, table: BracketTable) {
  for (const b of table) {
    if (amount > b.lower && amount <= b.upper) return b;
  }
  if (amount <= 0) return table[0];
  return table[table.length - 1];
}
