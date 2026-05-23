import type { CityConfig, ReliefPolicy } from '@/types';

const shanghaiBase = (id: string, category: ReliefPolicy['category'], categoryName: string): ReliefPolicy => ({
  id,
  region: 'shanghai',
  category,
  mode: 'cap',
  annualCap: 10500,
  scope: 'comprehensive',
  description: `上海市${categoryName}人员个人所得税年度减征上限 10,500 元`,
  source: {
    title: '上海市税务局关于残疾、孤老、烈属人员所得减征个人所得税政策',
    url: 'https://shanghai.chinatax.gov.cn/zcfw/zcfgk/grsds/202601/t478928.html',
  },
});

export const shanghai: CityConfig = {
  id: 'shanghai',
  name: '上海',
  region: 'shanghai',
  effectiveYear: 2026,
  socialInsurance: {
    baseLower: 7384,
    baseUpper: 36921,
    pension: { rate: 0.08, ratioRange: [0, 0.12] },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2690,
    baseUpper: 37302,
    ratioRange: [0.05, 0.07],
    defaultRatio: 0.07,
  },
  socialInsuranceSource: {
    title: '上海市 2024 年度社会保险缴费基数',
    url: 'https://rsj.sh.gov.cn/',
  },
  housingFundSource: {
    title: '上海市公积金管理中心 · 2025 年度缴存基数上下限通知（37302/2690 元）',
    url: 'https://www.shzfgjj.cn/html/newxxgk/zcwj/gfxwj/228051.html',
  },
  reliefPolicies: [
    shanghaiBase('shanghai-disability', 'disability', '残疾'),
    shanghaiBase('shanghai-elderly-alone', 'elderly_alone', '孤老'),
    shanghaiBase('shanghai-martyr-family', 'martyr_family', '烈属'),
  ],
};
