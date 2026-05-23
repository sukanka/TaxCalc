import type { CityConfig, ReliefPolicy } from '@/types';

const gdSource = {
  title: '广东省财政厅 国家税务总局广东省税务局关于残疾、孤老人员和烈属所得减征个人所得税政策',
  url: 'https://guangdong.chinatax.gov.cn/gdsw/ssfggds/2022-03/03/content_2cae6ba9eac44d5cbf93d09a73aa890a.shtml',
};

const gdBase = (id: string, category: ReliefPolicy['category'], desc: string): ReliefPolicy => ({
  id,
  region: 'guangdong',
  category,
  mode: 'ratio',
  ratio: 0.9,
  annualCap: 90000,
  scope: 'comprehensive',
  description: desc,
  source: gdSource,
});

export const guangzhou: CityConfig = {
  id: 'guangzhou',
  name: '广州',
  region: 'guangdong',
  effectiveYear: 2026,
  socialInsurance: {
    baseLower: 4492,
    baseUpper: 28770,
    pension: { rate: 0.08, ratioRange: [0, 0.12] },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.002 },
  },
  housingFund: {
    baseLower: 2300,
    baseUpper: 41497,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '广州市 2024 年社会保险缴费基数',
    url: 'http://hrss.gz.gov.cn/',
  },
  reliefPolicies: [
    gdBase('guangdong-disability', 'disability', '广东省残疾人个税减征 90%，年度限额 90,000 元'),
    gdBase('guangdong-elderly-alone', 'elderly_alone', '广东省孤老人员个税减征 90%，年度限额 90,000 元'),
    gdBase('guangdong-martyr-family', 'martyr_family', '广东省烈属个税减征 90%，年度限额 90,000 元'),
  ],
};
