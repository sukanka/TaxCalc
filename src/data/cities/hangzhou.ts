import type { CityConfig, ReliefPolicy } from '@/types';

const zjSource = {
  title: '国家税务总局浙江省税务局关于残疾、孤老人员和烈属所得减征个人所得税政策',
  url: 'https://zhejiang.chinatax.gov.cn/art/2023/2/8/art_25980_1144.html',
};

const zjBase = (id: string, category: ReliefPolicy['category'], desc: string): ReliefPolicy => ({
  id,
  region: 'zhejiang',
  category,
  mode: 'monthly_cap',
  monthlyCap: 500,
  scope: 'comprehensive',
  description: desc,
  source: zjSource,
});

export const hangzhou: CityConfig = {
  id: 'hangzhou',
  name: '杭州',
  region: 'zhejiang',
  effectiveYear: 2026,
  socialInsurance: {
    baseLower: 4812,
    baseUpper: 40694,
    pension: { rate: 0.08, ratioRange: [0, 0.12] },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2490,
    baseUpper: 40694,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '杭州市 2025 年度社会保险缴费基数（上限 40694 元，与公积金同源）',
    url: 'http://hrss.zj.gov.cn/',
  },
  housingFundSource: {
    title: '杭州住房公积金管理中心 · 2025 年度缴存基数上下限（40694/2490 元，市区）',
    url: 'https://hz.bendibao.com/live/2025730/165668.shtm',
  },
  reliefPolicies: [
    zjBase('zhejiang-disability', 'disability', '浙江省残疾人个税每月减免最高 500 元'),
    zjBase('zhejiang-elderly-alone', 'elderly_alone', '浙江省孤老人员个税每月减免最高 500 元'),
    zjBase('zhejiang-martyr-family', 'martyr_family', '浙江省烈属个税每月减免最高 500 元'),
  ],
};
