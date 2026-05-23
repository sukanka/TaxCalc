export interface TaxBracket {
  /** 累计应纳税所得额下限（含），单位元 */
  lower: number;
  /** 累计应纳税所得额上限（不含，Infinity 表示无上限），单位元 */
  upper: number;
  /** 税率，如 0.03 表示 3% */
  rate: number;
  /** 速算扣除数，单位元 */
  quickDeduction: number;
}

export type BracketTable = readonly TaxBracket[];

export interface TaxComputation {
  taxableIncome: string;
  bracket: TaxBracket;
  taxBeforeRelief: string;
  reliefDeducted: string;
  taxFinal: string;
}

export interface MonthlyWithholding {
  month: number;
  cumulativeIncome: string;
  cumulativeSocialInsurance: string;
  cumulativeDeductions: string;
  cumulativeBasicDeduction: string;
  cumulativeReliefAccumulated: string;
  cumulativeTaxableIncome: string;
  cumulativeTaxBeforeRelief: string;
  cumulativeReliefDeducted: string;
  cumulativeTaxAfterRelief: string;
  monthlyTax: string;
  netSalary: string;
  bracket: TaxBracket;
}

export type BonusStrategy = 'auto' | 'merge' | 'separate' | 'split';

export interface BonusPlanResult {
  strategy: 'merge' | 'separate' | 'split';
  description: string;
  bonusForSeparate: string;
  bonusForMerge: string;
  taxFromSeparate: string;
  taxFromMerge: string;
  totalTax: string;
}

export interface BonusComparison {
  plans: BonusPlanResult[];
  best: BonusPlanResult;
  worst: BonusPlanResult;
  savedVsWorst: string;
  trapWarning?: TrapWarning;
}

export interface TrapWarning {
  triggerAmount: number;
  suggestedAmount: number;
  potentialSaving: string;
  rangeStart: number;
  rangeEnd: number;
}
