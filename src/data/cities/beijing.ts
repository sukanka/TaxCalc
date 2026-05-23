import type { CityConfig, ReliefPolicy } from '@/types';

const beijingDisability: ReliefPolicy = {
  id: 'beijing-disability',
  region: 'beijing',
  category: 'disability',
  mode: 'ratio',
  ratio: 0.5,
  scope: 'comprehensive',
  description: '北京市残疾人个人所得税减征 50%（无年度限额），含工资薪金、劳务报酬、稿酬等综合所得；本计算器仅工资薪金部分。',
  source: {
    title: '北京市税务局关于残疾、孤老、烈属人员减征个人所得税通知',
    url: 'http://beijing.chinatax.gov.cn/bjswj/c105384/202207/7eb27639aea5468194ab7fd90d799043.shtml',
  },
  effectiveFrom: '2022-07-01',
};

const beijingElderlyAlone: ReliefPolicy = {
  ...beijingDisability,
  id: 'beijing-elderly-alone',
  category: 'elderly_alone',
  description: '北京市孤老人员个人所得税减征 50%（无年度限额）',
};

const beijingMartyrFamily: ReliefPolicy = {
  ...beijingDisability,
  id: 'beijing-martyr-family',
  category: 'martyr_family',
  description: '北京市烈属个人所得税减征 50%（无年度限额）',
};

export const beijing: CityConfig = {
  id: 'beijing',
  name: '北京',
  region: 'beijing',
  effectiveYear: 2026,
  socialInsurance: {
    baseLower: 6821,
    baseUpper: 35811,
    pension: { rate: 0.08, ratioRange: [0, 0.12] },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2540,
    baseUpper: 35811,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '北京市 2025 年度社会保险缴费工资基数（上限 35811 元，与公积金同源）',
    url: 'https://rsj.beijing.gov.cn/',
  },
  housingFundSource: {
    title: '北京住房公积金管理中心 · 2025 住房公积金年度政策解读（缴存基数 2540-35811 元）',
    url: 'https://gjj.beijing.gov.cn/web/zwgk61/2024zcjd/743765478/index.html',
  },
  reliefPolicies: [beijingDisability, beijingElderlyAlone, beijingMartyrFamily],
};
