import { describe, it, expect } from 'vitest';
import { applyRelief, applyReliefBatch } from '@/core/reliefs';
import type { ReliefPolicy } from '@/types';

const beijing: ReliefPolicy = {
  id: 'beijing-disability',
  region: 'beijing',
  category: 'disability',
  mode: 'ratio',
  ratio: 0.5,
  scope: 'comprehensive',
  description: '北京残疾人减征 50%（无年限额）',
  source: { title: '北京税务局', url: 'http://example.com' },
};

const guangdong: ReliefPolicy = {
  id: 'guangdong-disability',
  region: 'guangdong',
  category: 'disability',
  mode: 'ratio',
  ratio: 0.9,
  annualCap: 90000,
  scope: 'comprehensive',
  description: '广东残疾人减征 90%，年度上限 9 万元',
  source: { title: '广东税务局', url: 'http://example.com' },
};

const shanghai: ReliefPolicy = {
  id: 'shanghai-disability',
  region: 'shanghai',
  category: 'disability',
  mode: 'cap',
  annualCap: 10500,
  scope: 'comprehensive',
  description: '上海年度限额 10500',
  source: { title: '上海税务局', url: 'http://example.com' },
};

const hangzhou: ReliefPolicy = {
  id: 'zhejiang-disability',
  region: 'zhejiang',
  category: 'disability',
  mode: 'monthly_cap',
  monthlyCap: 500,
  scope: 'comprehensive',
  description: '浙江每月减免最高 500 元',
  source: { title: '浙江税务局', url: 'http://example.com' },
};

describe('applyRelief — 三种 mode', () => {
  it('ratio 无限额：北京 50% — 应缴 1000，减 500', () => {
    const r = applyRelief({ taxAmount: '1000', accumulatedReduced: '0', policy: beijing });
    expect(r.reduced).toBe('500.00');
  });

  it('ratio 有限额：广东 90% 应缴 200000 → 计算 180000，但累计已扣 80000，剩余可扣 10000', () => {
    const r = applyRelief({ taxAmount: '200000', accumulatedReduced: '80000', policy: guangdong });
    expect(r.reduced).toBe('10000.00');
  });

  it('cap：上海年度 10500，已扣 8000，应缴 5000 → 减 2500', () => {
    const r = applyRelief({ taxAmount: '5000', accumulatedReduced: '8000', policy: shanghai });
    expect(r.reduced).toBe('2500.00');
  });

  it('monthly_cap：杭州当月 500 上限，应缴 800 → 减 500', () => {
    const r = applyRelief({ taxAmount: '800', accumulatedReduced: '0', policy: hangzhou });
    expect(r.reduced).toBe('500.00');
  });

  it('应缴税小于减征额时：减额取税额本身', () => {
    const r = applyRelief({ taxAmount: '100', accumulatedReduced: '0', policy: beijing });
    expect(r.reduced).toBe('50.00');
  });

  it('累计已达年限额：返回 0', () => {
    const r = applyRelief({ taxAmount: '5000', accumulatedReduced: '90000', policy: guangdong });
    expect(r.reduced).toBe('0.00');
  });
});

describe('applyReliefBatch — 多政策叠加', () => {
  it('多政策按顺序应用，每个政策独立维护累计', () => {
    const r = applyReliefBatch({
      taxAmount: '5000',
      policies: [
        { policy: beijing, accumulatedReduced: '0' },
      ],
    });
    expect(r.totalReduced).toBe('2500.00');
    expect(r.taxAfterRelief).toBe('2500.00');
  });
});
