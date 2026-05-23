export interface DeductionsInput {
  childEducation: { enabled: boolean; count: number };
  infantCare: { enabled: boolean; count: number };
  continuingEducation: { enabled: boolean; type: 'degree' | 'professional' };
  seriousIllness: { enabled: boolean; amount: string };
  housingLoan: { enabled: boolean };
  housingRent: { enabled: boolean; cityTier: 'tier1' | 'tier2' | 'tier3' };
  elderlyCare: { enabled: boolean; isOnlyChild: boolean; sharedAmount: string };
}

export interface DeductionsValidation {
  valid: boolean;
  conflicts: string[];
}

export interface MonthlyDeductionBreakdown {
  childEducation: string;
  infantCare: string;
  continuingEducation: string;
  seriousIllness: string;
  housingLoan: string;
  housingRent: string;
  elderlyCare: string;
  total: string;
}
