export type ReliefMode = 'ratio' | 'cap' | 'monthly_cap';
export type ReliefCategory = 'disability' | 'elderly_alone' | 'martyr_family';
export type ReliefRegion = 'beijing' | 'shanghai' | 'guangdong' | 'zhejiang' | 'sichuan';

export interface ReliefSource {
  title: string;
  url: string;
  docNo?: string;
}

export interface ReliefPolicy {
  id: string;
  region: ReliefRegion;
  category: ReliefCategory;
  mode: ReliefMode;
  ratio?: number;
  annualCap?: number;
  monthlyCap?: number;
  scope: 'comprehensive' | 'salary_only';
  description: string;
  source: ReliefSource;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface ReliefApplyResult {
  reduced: string;
  remainingCap: string | null;
}
