/** 综合所得基本减除费用，元/年 */
export const ANNUAL_BASIC_DEDUCTION = 60000;

/** 月度基本减除费用，元/月 */
export const MONTHLY_BASIC_DEDUCTION = 5000;

/**
 * 全年一次性奖金单独计税"多发不如少发"陷阱区间。
 * 当年终奖落入 [rangeStart, rangeEnd) 时，建议下调到 trigger。
 */
export const BONUS_TRAP_RANGES = [
  { trigger: 36000, rangeStart: 36000.01, rangeEnd: 38566.67 },
  { trigger: 144000, rangeStart: 144000.01, rangeEnd: 160500 },
  { trigger: 300000, rangeStart: 300000.01, rangeEnd: 318333.33 },
  { trigger: 420000, rangeStart: 420000.01, rangeEnd: 447500 },
  { trigger: 660000, rangeStart: 660000.01, rangeEnd: 706538.46 },
  { trigger: 960000, rangeStart: 960000.01, rangeEnd: 1120000 },
] as const;

/** 专项附加扣除月度标准（元/月） */
export const DEDUCTION_STANDARDS = {
  childEducation: 2000,
  infantCare: 2000,
  continuingEducationDegree: 400,
  continuingEducationProfessional: 3600,
  seriousIllnessAnnualCap: 80000,
  seriousIllnessThreshold: 15000,
  housingLoan: 1000,
  housingRentTier1: 1500,
  housingRentTier2: 1100,
  housingRentTier3: 800,
  elderlyCareOnlyChild: 3000,
  elderlyCareSharedMax: 1500,
} as const;
