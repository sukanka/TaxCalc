import type { CityConfig, ReliefPolicy } from '@/types';

const scSource = {
  title: '四川省财政厅 国家税务总局四川省税务局关于个人所得税减征事项的政策',
  url: 'https://dzsgxjscyy.sczwfw.gov.cn/art/2025/2/21/art_44457_280795.html?areaCode=511771000000',
};

const scBase = (id: string, category: ReliefPolicy['category'], desc: string): ReliefPolicy => ({
  id,
  region: 'sichuan',
  category,
  mode: 'cap',
  annualCap: 12000,
  scope: 'comprehensive',
  description: desc,
  source: scSource,
});

export const chengdu: CityConfig = {
  id: 'chengdu',
  name: '成都',
  region: 'sichuan',
  effectiveYear: 2026,
  socialInsurance: {
    baseLower: 4511,
    baseUpper: 22555,
    pension: { rate: 0.08, ratioRange: [0, 0.12] },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.004 },
  },
  housingFund: {
    baseLower: 2100,
    baseUpper: 31378,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '成都市 2024 年社保缴费基数',
    url: 'http://cdhrss.chengdu.gov.cn/',
  },
  housingFundSource: {
    title: '成都住房公积金管理中心 · 2025 年度缴存基数（31378/2100 元，中心城区）',
    url: 'https://cd.bendibao.com/live/202577/199527.shtm',
  },
  reliefPolicies: [
    scBase('sichuan-disability', 'disability', '四川省残疾人个税年度减免上限 12,000 元'),
    scBase('sichuan-elderly-alone', 'elderly_alone', '四川省孤老人员个税年度减免上限 12,000 元'),
    scBase('sichuan-martyr-family', 'martyr_family', '四川省烈属个税年度减免上限 12,000 元'),
  ],
};
