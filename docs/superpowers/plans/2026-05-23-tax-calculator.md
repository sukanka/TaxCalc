# 个人所得税计算器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款覆盖月度预扣预缴和年度汇算的个税计算器，支持六个城市，包含残疾、孤老、烈属减征政策，提供年终奖三方案对比与拆分优化能力。

**Architecture:** 严格分层 — `core/` 纯计算层（无 Vue 依赖、Vitest 全覆盖）+ `data/` 政策与税率配置 + `stores/` Pinia 状态层 + `components/views` 现代简约 UI。金额全程用 decimal.js 高精度计算，store 内以 `string` 序列化，避免 localStorage 与 Decimal 实例不兼容。

**Tech Stack:** Vue 3 + Vite + TypeScript + Pinia + pinia-plugin-persistedstate + UnoCSS + ECharts + decimal.js + Vitest + pnpm

---

## 任务总览

1. 项目脚手架与依赖
2. 核心类型定义
3. 税率表与基础常量
4. `core/tax.ts` — 综合所得税额计算
5. `core/tax.ts` — 月度累计预扣预缴
6. `core/tax.ts` — 年终奖单独计税与临界点
7. `core/bonusOptimizer.ts` — 拆分优化器
8. `core/socialInsurance.ts` — 五险一金计算
9. `core/deductions.ts` — 专项附加扣除聚合与互斥校验
10. `core/reliefs.ts` — 减征政策应用接口
11. `core/annual.ts` — 年度汇算编排器
12. `data/cities/*` — 六城市配置
13. Pinia stores + 持久化
14. UnoCSS 主题配置
15. 共享 UI 组件
16. 输入区组件群
17. 月度预扣视图
18. 年度汇算视图（方案对比 + ECharts）
19. 应用框架（顶部栏、Tab 切换、响应式）
20. 动效打磨与最终验证

---

## Task 1: 项目脚手架与依赖

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `uno.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/env.d.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`（追加内容）

- [ ] **Step 1: 安装依赖**

```bash
cd /tmp/tax-calculator
pnpm add vue@^3.5.0 pinia@^2.2.0 pinia-plugin-persistedstate@^4.1.0 decimal.js@^10.4.3 echarts@^5.5.0
pnpm add -D vite@^5.4.0 @vitejs/plugin-vue@^5.1.0 typescript@^5.6.0 vue-tsc@^2.1.0 unocss@^0.62.0 vitest@^2.1.0 @vue/test-utils@^2.4.0 jsdom@^25.0.0
```

预期：`package.json` 中出现上述依赖，`pnpm-lock.yaml` 已生成。

- [ ] **Step 2: 写入 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*", "*.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 写入 `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "uno.config.ts"]
}
```

- [ ] **Step 4: 写入 `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

- [ ] **Step 5: 写入 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

- [ ] **Step 6: 写入 `uno.config.ts`**

```ts
import { defineConfig, presetUno, presetIcons, presetTypography } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetIcons(), presetTypography()],
  theme: {
    colors: {
      primary: '#4f46e5',
      warn: '#f59e0b',
      danger: '#dc2626',
      success: '#10b981',
      bg: '#fafaf9',
      ink: '#1c1917',
      mute: '#78716c',
    },
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
      mono: '"SF Mono", Menlo, Consolas, monospace',
    },
  },
  shortcuts: {
    'card': 'bg-white rounded-12px shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-16px',
    'btn-primary': 'bg-primary text-white px-16px py-8px rounded-8px hover:opacity-90 transition',
  },
});
```

- [ ] **Step 7: 写入 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>个人所得税计算器</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 8: 写入 `src/env.d.ts`**

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

- [ ] **Step 9: 写入 `src/main.ts`**

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersistedstate from 'pinia-plugin-persistedstate';
import 'virtual:uno.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersistedstate);
app.use(pinia);
app.mount('#app');
```

- [ ] **Step 10: 写入占位 `src/App.vue`**

```vue
<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-bg text-ink font-sans">
    <h1 class="p-24px text-24px font-bold">个人所得税计算器</h1>
  </div>
</template>
```

- [ ] **Step 11: 修改 `package.json` 脚本**

将 `scripts` 段替换为：

```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 12: 追加 `.gitignore` 内容**

在原有 `.superpowers` 行后追加：

```
node_modules
dist
*.log
.DS_Store
.vite
```

- [ ] **Step 13: 验证脚手架可启动**

```bash
pnpm test
```

预期：vitest 报告 `No test files found` 但进程正常退出（exit code 0 — 用 `vitest run --passWithNoTests` 或先创建一个空测试通过即可）。先用如下命令验证 typescript 配置：

```bash
pnpm exec vue-tsc --noEmit
```

预期：无错误退出。

- [ ] **Step 14: 提交**

```bash
git add -A
git commit -m "chore: 初始化 Vite + Vue3 + TS + UnoCSS + Pinia 脚手架"
```

---
<!-- TASK1_END -->

## Task 2: 核心类型定义

**Files:**
- Create: `src/types/tax.ts`
- Create: `src/types/relief.ts`
- Create: `src/types/city.ts`
- Create: `src/types/deduction.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: 写入 `src/types/tax.ts`**

```ts
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
```

- [ ] **Step 2: 写入 `src/types/relief.ts`**

```ts
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
```

- [ ] **Step 3: 写入 `src/types/city.ts`**

```ts
import type { ReliefPolicy, ReliefRegion } from './relief';

export type CityId = 'beijing' | 'shanghai' | 'guangzhou' | 'shenzhen' | 'hangzhou' | 'chengdu';

export interface InsuranceItem {
  /** 个人缴纳比例，如 0.08 */
  rate: number;
}

export interface SocialInsuranceConfig {
  /** 缴费基数下限（元/月） */
  baseLower: number;
  /** 缴费基数上限（元/月） */
  baseUpper: number;
  pension: InsuranceItem;
  medical: InsuranceItem;
  unemployment: InsuranceItem;
}

export interface HousingFundConfig {
  baseLower: number;
  baseUpper: number;
  /** 个人缴存比例区间 [min, max] */
  ratioRange: [number, number];
  /** 默认比例，如 0.12 */
  defaultRatio: number;
}

export interface CityConfig {
  id: CityId;
  name: string;
  region: ReliefRegion;
  socialInsurance: SocialInsuranceConfig;
  housingFund: HousingFundConfig;
  reliefPolicies: ReliefPolicy[];
  /** 数据基准年度，例：2026 */
  effectiveYear: number;
  /** 政策来源链接（社保公积金基数） */
  socialInsuranceSource: { title: string; url: string };
}
```

- [ ] **Step 4: 写入 `src/types/deduction.ts`**

```ts
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
```

- [ ] **Step 5: 写入 `src/types/index.ts`**

```ts
export * from './tax';
export * from './relief';
export * from './city';
export * from './deduction';
```

- [ ] **Step 6: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

预期：无错误。

- [ ] **Step 7: 提交**

```bash
git add src/types/
git commit -m "feat: 添加核心类型定义（tax/relief/city/deduction）"
```

---
<!-- TASK2_END -->

## Task 3: 税率表与基础常量

**Files:**
- Create: `src/data/taxBrackets.ts`
- Create: `src/data/constants.ts`
- Test: `tests/data/taxBrackets.spec.ts`

- [ ] **Step 1: 写入 `src/data/constants.ts`**

```ts
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
```

- [ ] **Step 2: 写入 `src/data/taxBrackets.ts`**

```ts
import type { BracketTable } from '@/types';

/**
 * 综合所得年度税率表（适用于年度汇算和方案 A 并入计税）。
 * 来源：《个人所得税法》附表一。
 */
export const ANNUAL_COMPREHENSIVE_BRACKETS: BracketTable = [
  { lower: 0,       upper: 36000,     rate: 0.03, quickDeduction: 0 },
  { lower: 36000,   upper: 144000,    rate: 0.10, quickDeduction: 2520 },
  { lower: 144000,  upper: 300000,    rate: 0.20, quickDeduction: 16920 },
  { lower: 300000,  upper: 420000,    rate: 0.25, quickDeduction: 31920 },
  { lower: 420000,  upper: 660000,    rate: 0.30, quickDeduction: 52920 },
  { lower: 660000,  upper: 960000,    rate: 0.35, quickDeduction: 85920 },
  { lower: 960000,  upper: Infinity,  rate: 0.45, quickDeduction: 181920 },
];

/**
 * 月度税率表（适用于全年一次性奖金单独计税：以年终奖 ÷ 12 查表）。
 * 来源：《关于全年一次性奖金等个人所得税计算方法的通知》。
 */
export const MONTHLY_BONUS_BRACKETS: BracketTable = [
  { lower: 0,     upper: 3000,     rate: 0.03, quickDeduction: 0 },
  { lower: 3000,  upper: 12000,    rate: 0.10, quickDeduction: 210 },
  { lower: 12000, upper: 25000,    rate: 0.20, quickDeduction: 1410 },
  { lower: 25000, upper: 35000,    rate: 0.25, quickDeduction: 2660 },
  { lower: 35000, upper: 55000,    rate: 0.30, quickDeduction: 4410 },
  { lower: 55000, upper: 80000,    rate: 0.35, quickDeduction: 7160 },
  { lower: 80000, upper: Infinity, rate: 0.45, quickDeduction: 15160 },
];

/**
 * 月度累计预扣预缴税率表（按累计应纳税所得额分档，与年度税率表数值一致）。
 */
export const MONTHLY_WITHHOLDING_BRACKETS: BracketTable = ANNUAL_COMPREHENSIVE_BRACKETS;

/**
 * 在税率表中查找某金额对应的税档。
 * @param amount 应纳税所得额（元）
 * @param table 税率表
 */
export function findBracket(amount: number, table: BracketTable) {
  for (const b of table) {
    if (amount > b.lower && amount <= b.upper) return b;
  }
  if (amount <= 0) return table[0];
  return table[table.length - 1];
}
```

- [ ] **Step 3: 写入测试 `tests/data/taxBrackets.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
  findBracket,
} from '@/data/taxBrackets';

describe('税率表结构', () => {
  it('综合所得有 7 档', () => {
    expect(ANNUAL_COMPREHENSIVE_BRACKETS).toHaveLength(7);
  });

  it('月度奖金表有 7 档', () => {
    expect(MONTHLY_BONUS_BRACKETS).toHaveLength(7);
  });

  it('综合所得边界值连续', () => {
    for (let i = 1; i < ANNUAL_COMPREHENSIVE_BRACKETS.length; i++) {
      expect(ANNUAL_COMPREHENSIVE_BRACKETS[i].lower).toBe(
        ANNUAL_COMPREHENSIVE_BRACKETS[i - 1].upper
      );
    }
  });

  it('税率单调递增', () => {
    for (let i = 1; i < ANNUAL_COMPREHENSIVE_BRACKETS.length; i++) {
      expect(ANNUAL_COMPREHENSIVE_BRACKETS[i].rate).toBeGreaterThan(
        ANNUAL_COMPREHENSIVE_BRACKETS[i - 1].rate
      );
    }
  });
});

describe('findBracket', () => {
  it('在第一档边界 36000 取第一档（含上限）', () => {
    expect(findBracket(36000, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.03);
  });

  it('在第二档边界 36000.01 取第二档', () => {
    expect(findBracket(36000.01, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.1);
  });

  it('960000 取第 6 档（rate 0.35），960000.01 取第 7 档', () => {
    expect(findBracket(960000, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.35);
    expect(findBracket(960000.01, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.45);
  });

  it('0 或负数取第一档', () => {
    expect(findBracket(0, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.03);
    expect(findBracket(-100, ANNUAL_COMPREHENSIVE_BRACKETS).rate).toBe(0.03);
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
pnpm test
```

预期：所有用例 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/data/ tests/data/
git commit -m "feat: 添加综合所得/月度/年终奖税率表与查档函数"
```

---
<!-- TASK3_END -->

## Task 4: `core/tax.ts` — 综合所得税额计算

**Files:**
- Create: `src/core/decimal.ts`
- Create: `src/core/tax.ts`
- Test: `tests/core/tax-comprehensive.spec.ts`

- [ ] **Step 1: 写入 `src/core/decimal.ts`**

封装 decimal.js，统一 4 舍 5 入到 2 位小数（HALF_UP）。

```ts
import Decimal from 'decimal.js';

Decimal.set({
  precision: 30,
  rounding: Decimal.ROUND_HALF_UP,
});

export type Money = Decimal;

export function d(value: string | number | Decimal | null | undefined): Money {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  return new Decimal(value);
}

/** 保留 2 位小数（四舍五入），返回字符串 */
export function fmt(value: Decimal | string | number): string {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function max(a: Money, b: Money): Money {
  return a.gte(b) ? a : b;
}

export function min(a: Money, b: Money): Money {
  return a.lte(b) ? a : b;
}

export const ZERO = new Decimal(0);

export { Decimal };
```

- [ ] **Step 2: 先写测试 `tests/core/tax-comprehensive.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeComprehensiveTax } from '@/core/tax';

describe('computeComprehensiveTax — 综合所得年度税额', () => {
  it('应纳税所得额为 0 时税额为 0', () => {
    const r = computeComprehensiveTax('0');
    expect(r.taxBeforeRelief).toBe('0.00');
    expect(r.bracket.rate).toBe(0.03);
  });

  it('应纳税所得额 36000 时（边界含），税率 3%，税额 1080', () => {
    const r = computeComprehensiveTax('36000');
    expect(r.bracket.rate).toBe(0.03);
    expect(r.taxBeforeRelief).toBe('1080.00');
  });

  it('应纳税所得额 36000.01 时跳到 10% 档', () => {
    const r = computeComprehensiveTax('36000.01');
    expect(r.bracket.rate).toBe(0.10);
    // 36000.01 × 0.10 - 2520 = 3600.001 - 2520 = 1080.001 ≈ 1080.00
    expect(r.taxBeforeRelief).toBe('1080.00');
  });

  it('应纳税所得额 144000 适用 10% 档，税额 11880', () => {
    const r = computeComprehensiveTax('144000');
    expect(r.taxBeforeRelief).toBe('11880.00');
  });

  it('应纳税所得额 1000000 适用 45% 档', () => {
    const r = computeComprehensiveTax('1000000');
    expect(r.bracket.rate).toBe(0.45);
    // 1000000 * 0.45 - 181920 = 450000 - 181920 = 268080
    expect(r.taxBeforeRelief).toBe('268080.00');
  });

  it('负数应纳税所得额返回 0', () => {
    const r = computeComprehensiveTax('-1000');
    expect(r.taxBeforeRelief).toBe('0.00');
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

```bash
pnpm test tests/core/tax-comprehensive.spec.ts
```

预期：FAIL，错误为找不到 `@/core/tax`。

- [ ] **Step 4: 写入实现 `src/core/tax.ts`**

```ts
import { d, fmt, max, ZERO } from './decimal';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
  findBracket,
} from '@/data/taxBrackets';
import type { TaxComputation, TaxBracket } from '@/types';

/**
 * 综合所得税额计算（公式：应纳税所得额 × 税率 − 速算扣除数）。
 * 应纳税所得额为非正时返回 0。
 */
export function computeComprehensiveTax(taxableIncome: string | number): TaxComputation {
  const ti = max(d(taxableIncome), ZERO);
  const bracket = findBracket(ti.toNumber(), ANNUAL_COMPREHENSIVE_BRACKETS);
  const tax = max(ti.mul(bracket.rate).sub(bracket.quickDeduction), ZERO);
  return {
    taxableIncome: fmt(ti),
    bracket,
    taxBeforeRelief: fmt(tax),
    reliefDeducted: '0.00',
    taxFinal: fmt(tax),
  };
}

/**
 * 全年一次性奖金单独计税：以 (年终奖 ÷ 12) 查月度税率表，得税率与速算扣除数。
 */
export function computeBonusSeparateTax(bonusAmount: string | number): TaxComputation {
  const bonus = max(d(bonusAmount), ZERO);
  const avg = bonus.div(12).toNumber();
  const bracket = findBracket(avg, MONTHLY_BONUS_BRACKETS);
  const tax = max(bonus.mul(bracket.rate).sub(bracket.quickDeduction), ZERO);
  return {
    taxableIncome: fmt(bonus),
    bracket,
    taxBeforeRelief: fmt(tax),
    reliefDeducted: '0.00',
    taxFinal: fmt(tax),
  };
}

export type { TaxBracket };
```

- [ ] **Step 5: 运行测试，确认全过**

```bash
pnpm test tests/core/tax-comprehensive.spec.ts
```

预期：所有用例 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/core/decimal.ts src/core/tax.ts tests/core/tax-comprehensive.spec.ts
git commit -m "feat: 综合所得税额与年终奖单独计税核心函数"
```

---
<!-- TASK4_END -->

## Task 5: `core/tax.ts` — 月度累计预扣预缴

**Files:**
- Modify: `src/core/tax.ts`
- Test: `tests/core/tax-monthly.spec.ts`

- [ ] **Step 1: 写入测试 `tests/core/tax-monthly.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeMonthlyWithholding } from '@/core/tax';

describe('computeMonthlyWithholding — 月度累计预扣', () => {
  it('单月 1 月：月薪 10000 五险一金 2000 专项 3000 → 累计应纳税所得 0，无税', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '10000',
      cumulativeSocialInsurance: '2000',
      cumulativeDeductions: '3000',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '0',
    });
    expect(r.cumulativeTaxableIncome).toBe('0.00');
    expect(r.monthlyTax).toBe('0.00');
  });

  it('单月 1 月：月薪 30000 五险一金 5000 专项 0 → 累计 20000，3% 档税 600', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '30000',
      cumulativeSocialInsurance: '5000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '0',
    });
    // 30000 - 5000 - 5000(基本) = 20000  → 20000 × 0.03 = 600
    expect(r.cumulativeTaxableIncome).toBe('20000.00');
    expect(r.monthlyTax).toBe('600.00');
  });

  it('累计跨档：累计应纳税所得 50000，已缴 1080 → 当月税 920', () => {
    // 累计 50000：50000×0.10 - 2520 = 2480 累计税
    // 已缴 1080，当月 = 2480 - 1080 = 1400... 调整数字
    const r = computeMonthlyWithholding({
      month: 6,
      cumulativeIncome: '180000',
      cumulativeSocialInsurance: '30000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '1080',
    });
    // 累计应纳税所得 = 180000 - 30000 - 5000*6 = 120000，第二档 10%
    // 累计税 = 120000 × 0.10 - 2520 = 9480
    // 当月预扣 = 9480 - 1080 = 8400
    expect(r.cumulativeTaxableIncome).toBe('120000.00');
    expect(r.cumulativeTaxBeforeRelief).toBe('9480.00');
    expect(r.monthlyTax).toBe('8400.00');
  });

  it('减征已扣 500：当月税 = 累计税 - 累计减征 - 已缴', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '30000',
      cumulativeSocialInsurance: '5000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '500',
      previousTaxPaid: '0',
    });
    // 累计税 600，减征 500，当月 = 100
    expect(r.cumulativeTaxAfterRelief).toBe('100.00');
    expect(r.monthlyTax).toBe('100.00');
  });

  it('当月计算结果为负时（预缴大于应缴）返回 0', () => {
    const r = computeMonthlyWithholding({
      month: 12,
      cumulativeIncome: '120000',
      cumulativeSocialInsurance: '20000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '5000',
    });
    // 累计应纳税所得 = 120000 - 20000 - 60000 = 40000
    // 累计税 = 40000 × 0.10 - 2520 = 1480
    // 已缴 5000 大于 1480，当月返回 0（预扣阶段不退税）
    expect(r.monthlyTax).toBe('0.00');
  });

  it('到手 = 当月毛收入 - 当月社保 - 当月预扣（要求传当月数）', () => {
    const r = computeMonthlyWithholding({
      month: 1,
      cumulativeIncome: '30000',
      cumulativeSocialInsurance: '5000',
      cumulativeDeductions: '0',
      cumulativeReliefDeducted: '0',
      previousTaxPaid: '0',
      monthlyIncome: '30000',
      monthlySocialInsurance: '5000',
    });
    // 30000 - 5000 - 600 = 24400
    expect(r.netSalary).toBe('24400.00');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test tests/core/tax-monthly.spec.ts
```

预期：FAIL，找不到 `computeMonthlyWithholding`。

- [ ] **Step 3: 在 `src/core/tax.ts` 文件顶部增补 import，并在文件末尾追加实现**

文件顶部 import 段调整为：

```ts
import { d, fmt, max, ZERO } from './decimal';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
  findBracket,
} from '@/data/taxBrackets';
import { MONTHLY_BASIC_DEDUCTION } from '@/data/constants';
import type { TaxComputation, TaxBracket, MonthlyWithholding } from '@/types';
```

`computeComprehensiveTax` 和 `computeBonusSeparateTax` 实现保持不变。在文件末尾追加：

```ts
export interface MonthlyWithholdingInput {
  month: number; // 1-12
  cumulativeIncome: string;
  cumulativeSocialInsurance: string;
  cumulativeDeductions: string;
  cumulativeReliefDeducted: string;
  previousTaxPaid: string;
  monthlyIncome?: string;
  monthlySocialInsurance?: string;
}

export function computeMonthlyWithholding(input: MonthlyWithholdingInput): MonthlyWithholding {
  const cumIncome = max(d(input.cumulativeIncome), ZERO);
  const cumSI = max(d(input.cumulativeSocialInsurance), ZERO);
  const cumDed = max(d(input.cumulativeDeductions), ZERO);
  const cumBasic = d(MONTHLY_BASIC_DEDUCTION).mul(input.month);
  const cumRelief = max(d(input.cumulativeReliefDeducted), ZERO);
  const prevPaid = max(d(input.previousTaxPaid), ZERO);

  const cumTI = max(cumIncome.sub(cumSI).sub(cumDed).sub(cumBasic), ZERO);

  const bracket = findBracket(cumTI.toNumber(), ANNUAL_COMPREHENSIVE_BRACKETS);
  const cumTaxBeforeRelief = max(cumTI.mul(bracket.rate).sub(bracket.quickDeduction), ZERO);
  const cumTaxAfterRelief = max(cumTaxBeforeRelief.sub(cumRelief), ZERO);
  const monthlyTax = max(cumTaxAfterRelief.sub(prevPaid), ZERO);

  let netSalary = '';
  if (input.monthlyIncome !== undefined && input.monthlySocialInsurance !== undefined) {
    const ns = d(input.monthlyIncome).sub(d(input.monthlySocialInsurance)).sub(monthlyTax);
    netSalary = fmt(ns);
  }

  return {
    month: input.month,
    cumulativeIncome: fmt(cumIncome),
    cumulativeSocialInsurance: fmt(cumSI),
    cumulativeDeductions: fmt(cumDed),
    cumulativeBasicDeduction: fmt(cumBasic),
    cumulativeReliefAccumulated: fmt(cumRelief),
    cumulativeTaxableIncome: fmt(cumTI),
    cumulativeTaxBeforeRelief: fmt(cumTaxBeforeRelief),
    cumulativeReliefDeducted: fmt(cumRelief),
    cumulativeTaxAfterRelief: fmt(cumTaxAfterRelief),
    monthlyTax: fmt(monthlyTax),
    netSalary,
    bracket,
  };
}
```

注意：`MONTHLY_BASIC_DEDUCTION` 和 `MonthlyWithholding` 是新增 import，已合并在文件顶部 import 段中；不要重复导入 `findBracket` 等已存在的符号。

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/tax-monthly.spec.ts
```

预期：所有用例 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/tax.ts tests/core/tax-monthly.spec.ts
git commit -m "feat: 月度累计预扣预缴税额计算"
```

---
<!-- TASK5_END -->

## Task 6: `core/tax.ts` — 年终奖临界点检测

**Files:**
- Modify: `src/core/tax.ts`
- Test: `tests/core/tax-bonus.spec.ts`

- [ ] **Step 1: 写入测试 `tests/core/tax-bonus.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeBonusSeparateTax, detectBonusTrap } from '@/core/tax';

describe('computeBonusSeparateTax — 年终奖单独计税', () => {
  it('年终奖 36000 → 36000 ÷ 12 = 3000，3% 档，税 1080', () => {
    const r = computeBonusSeparateTax('36000');
    expect(r.bracket.rate).toBe(0.03);
    expect(r.taxBeforeRelief).toBe('1080.00');
  });

  it('年终奖 36000.01 → 跳到 10% 档，税 = 36000.01×0.10 - 210 = 3390.001 ≈ 3390.00', () => {
    const r = computeBonusSeparateTax('36000.01');
    expect(r.bracket.rate).toBe(0.10);
    expect(r.taxBeforeRelief).toBe('3390.00');
  });

  it('年终奖 38566.67 → 单独计税 ≈ 3646.667（与 36000 税额 1080 跳跃验证）', () => {
    const r = computeBonusSeparateTax('38566.67');
    expect(r.bracket.rate).toBe(0.10);
    expect(r.taxBeforeRelief).toBe('3646.67');
  });
});

describe('detectBonusTrap — 陷阱区间检测', () => {
  it('36000 不是陷阱（边界含）', () => {
    expect(detectBonusTrap('36000')).toBeNull();
  });

  it('36500 落入第一个陷阱', () => {
    const w = detectBonusTrap('36500');
    expect(w).not.toBeNull();
    expect(w!.triggerAmount).toBe(36000);
    expect(w!.suggestedAmount).toBe(36000);
    // 36500 单独计税 = 36500*0.10 - 210 = 3440
    // 36000 单独计税 = 1080
    // savings = 3440 - 1080 = 2360
    expect(w!.potentialSaving).toBe('2360.00');
  });

  it('38566.67 边界不算陷阱（端点不含）', () => {
    expect(detectBonusTrap('38566.67')).toBeNull();
  });

  it('150000 落入第二个陷阱（144000 区间）', () => {
    const w = detectBonusTrap('150000');
    expect(w).not.toBeNull();
    expect(w!.triggerAmount).toBe(144000);
  });

  it('1000000 落入第六个陷阱', () => {
    const w = detectBonusTrap('1000000');
    expect(w).not.toBeNull();
    expect(w!.triggerAmount).toBe(960000);
  });

  it('5000000 不在任何陷阱区间', () => {
    expect(detectBonusTrap('5000000')).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认 `detectBonusTrap` 用例失败**

```bash
pnpm test tests/core/tax-bonus.spec.ts
```

预期：`detectBonusTrap` 相关用例 FAIL（函数未定义）。

- [ ] **Step 3: 在 `src/core/tax.ts` 追加 `detectBonusTrap` 实现**

文件顶部 import 段补充：

```ts
import { BONUS_TRAP_RANGES } from '@/data/constants';
import type { TrapWarning } from '@/types';
```

文件末尾追加：

```ts
export function detectBonusTrap(bonusAmount: string | number): TrapWarning | null {
  const amount = d(bonusAmount).toNumber();
  for (const range of BONUS_TRAP_RANGES) {
    if (amount >= range.rangeStart && amount < range.rangeEnd) {
      const taxAtAmount = computeBonusSeparateTax(amount);
      const taxAtTrigger = computeBonusSeparateTax(range.trigger);
      const saving = d(taxAtAmount.taxBeforeRelief).sub(taxAtTrigger.taxBeforeRelief);
      return {
        triggerAmount: range.trigger,
        suggestedAmount: range.trigger,
        potentialSaving: fmt(saving),
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
      };
    }
  }
  return null;
}
```

补全 import 时只增加新符号，已有的 `d/fmt` 等不要重复导入。`TaxBracket` 类型已在 Task 4 通过 `export type { TaxBracket }` 导出，无需再次声明。

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/tax-bonus.spec.ts
```

预期：所有用例 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/tax.ts tests/core/tax-bonus.spec.ts
git commit -m "feat: 年终奖单独计税与陷阱区间检测"
```

---
<!-- TASK6_END -->

## Task 7: `core/bonusOptimizer.ts` — 拆分优化器

**Files:**
- Create: `src/core/bonusOptimizer.ts`
- Test: `tests/core/bonusOptimizer.spec.ts`

- [ ] **Step 1: 写入测试 `tests/core/bonusOptimizer.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { compareBonusPlans } from '@/core/bonusOptimizer';

describe('compareBonusPlans — 三方案对比', () => {
  it('低年终奖（10000）：三方案对比', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '60000', // 工资部分应纳税所得额
      annualBonus: '10000',
    });
    expect(r.plans).toHaveLength(3);
    expect(r.best).toBeDefined();
    expect(r.worst).toBeDefined();
    // 全部并入 vs 全部单独：低年终奖时往往单独更优
    const merge = r.plans.find(p => p.strategy === 'merge')!;
    const sep = r.plans.find(p => p.strategy === 'separate')!;
    const split = r.plans.find(p => p.strategy === 'split')!;
    // split 总不会比另外两者差
    expect(parseFloat(split.totalTax)).toBeLessThanOrEqual(parseFloat(merge.totalTax));
    expect(parseFloat(split.totalTax)).toBeLessThanOrEqual(parseFloat(sep.totalTax));
  });

  it('高年终奖（500000）+ 中等工资：split 优于其他', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '100000',
      annualBonus: '500000',
    });
    const split = r.plans.find(p => p.strategy === 'split')!;
    expect(parseFloat(split.totalTax)).toBeLessThanOrEqual(parseFloat(r.worst.totalTax));
  });

  it('年终奖 0：所有方案税额相同', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '60000',
      annualBonus: '0',
    });
    const taxes = r.plans.map(p => p.totalTax);
    expect(new Set(taxes).size).toBe(1);
  });

  it('split 方案的拆分参数：bonusForSeparate + bonusForMerge = 总年终奖', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '120000',
      annualBonus: '200000',
    });
    const split = r.plans.find(p => p.strategy === 'split')!;
    const sum = parseFloat(split.bonusForSeparate) + parseFloat(split.bonusForMerge);
    expect(sum).toBeCloseTo(200000, 2);
  });

  it('陷阱区间触发：年终奖 36500 → trapWarning 非空', () => {
    const r = compareBonusPlans({
      annualSalaryAfterBaseDeductions: '60000',
      annualBonus: '36500',
    });
    expect(r.trapWarning).not.toBeUndefined();
    expect(r.trapWarning!.suggestedAmount).toBe(36000);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test tests/core/bonusOptimizer.spec.ts
```

预期：FAIL，找不到 `@/core/bonusOptimizer`。

- [ ] **Step 3: 写入实现 `src/core/bonusOptimizer.ts`**

```ts
import { d, fmt, max, ZERO } from './decimal';
import {
  computeComprehensiveTax,
  computeBonusSeparateTax,
  detectBonusTrap,
} from './tax';
import {
  ANNUAL_COMPREHENSIVE_BRACKETS,
  MONTHLY_BONUS_BRACKETS,
} from '@/data/taxBrackets';
import type { BonusComparison, BonusPlanResult } from '@/types';

export interface BonusOptimizerInput {
  /** 年度工资部分应纳税所得额（已扣除基本减除/五险一金/专项附加） */
  annualSalaryAfterBaseDeductions: string;
  /** 年终奖总额 */
  annualBonus: string;
}

/**
 * 在 [0, totalBonus] 范围内寻找最优拆分点。
 * 候选点 = 月度税档断点 × 12 ∪ 年度税档断点 - 工资部分应纳税所得额 ∪ {0, totalBonus}。
 */
function generateCandidates(salaryTI: number, totalBonus: number): number[] {
  const set = new Set<number>([0, totalBonus]);
  for (const b of MONTHLY_BONUS_BRACKETS) {
    if (Number.isFinite(b.upper)) {
      const cand = b.upper * 12;
      if (cand <= totalBonus) set.add(cand);
    }
  }
  for (const b of ANNUAL_COMPREHENSIVE_BRACKETS) {
    if (Number.isFinite(b.upper)) {
      const room = b.upper - salaryTI;
      if (room > 0 && room <= totalBonus) {
        set.add(totalBonus - room);
      }
    }
  }
  return Array.from(set).filter(v => v >= 0 && v <= totalBonus).sort((a, b) => a - b);
}

function planMerge(salaryTI: string, bonus: string): BonusPlanResult {
  const ti = d(salaryTI).add(d(bonus));
  const taxMerge = computeComprehensiveTax(ti.toFixed(2));
  return {
    strategy: 'merge',
    description: '全额并入综合所得',
    bonusForSeparate: '0.00',
    bonusForMerge: fmt(d(bonus)),
    taxFromSeparate: '0.00',
    taxFromMerge: taxMerge.taxBeforeRelief,
    totalTax: taxMerge.taxBeforeRelief,
  };
}

function planSeparate(salaryTI: string, bonus: string): BonusPlanResult {
  const taxSalary = computeComprehensiveTax(salaryTI);
  const taxBonus = computeBonusSeparateTax(bonus);
  const total = d(taxSalary.taxBeforeRelief).add(taxBonus.taxBeforeRelief);
  return {
    strategy: 'separate',
    description: '全额单独计税',
    bonusForSeparate: fmt(d(bonus)),
    bonusForMerge: '0.00',
    taxFromSeparate: taxBonus.taxBeforeRelief,
    taxFromMerge: taxSalary.taxBeforeRelief,
    totalTax: fmt(total),
  };
}

function planSplitAt(salaryTI: string, bonus: string, separateAmount: number): BonusPlanResult {
  const sep = d(separateAmount);
  const merge = d(bonus).sub(sep);
  const taxBonus = computeBonusSeparateTax(sep.toFixed(2));
  const taxSalary = computeComprehensiveTax(d(salaryTI).add(merge).toFixed(2));
  const total = d(taxBonus.taxBeforeRelief).add(taxSalary.taxBeforeRelief);
  return {
    strategy: 'split',
    description: '拆分一部分单独计税，余下并入工资',
    bonusForSeparate: fmt(sep),
    bonusForMerge: fmt(merge),
    taxFromSeparate: taxBonus.taxBeforeRelief,
    taxFromMerge: taxSalary.taxBeforeRelief,
    totalTax: fmt(total),
  };
}

export function compareBonusPlans(input: BonusOptimizerInput): BonusComparison {
  const salaryTI = max(d(input.annualSalaryAfterBaseDeductions), ZERO).toFixed(2);
  const bonus = max(d(input.annualBonus), ZERO).toFixed(2);
  const bonusNum = parseFloat(bonus);
  const salaryNum = parseFloat(salaryTI);

  const merge = planMerge(salaryTI, bonus);
  const separate = planSeparate(salaryTI, bonus);

  let best: BonusPlanResult = merge;
  if (parseFloat(separate.totalTax) < parseFloat(best.totalTax)) best = separate;

  const candidates = generateCandidates(salaryNum, bonusNum);
  let bestSplit = best;
  for (const c of candidates) {
    const p = planSplitAt(salaryTI, bonus, c);
    if (parseFloat(p.totalTax) < parseFloat(bestSplit.totalTax)) bestSplit = p;
  }
  // 标记为 split 即便最优解恰好等于 merge/separate
  const split: BonusPlanResult = bestSplit.strategy === 'split'
    ? bestSplit
    : { ...bestSplit, strategy: 'split', description: '拆分优化（与上述方案相同最优）' };

  const plans: BonusPlanResult[] = [merge, separate, split];
  const sorted = [...plans].sort((a, b) => parseFloat(a.totalTax) - parseFloat(b.totalTax));
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];
  const saved = d(loser.totalTax).sub(winner.totalTax);

  const trapWarning = detectBonusTrap(bonus) ?? undefined;

  return {
    plans,
    best: winner,
    worst: loser,
    savedVsWorst: fmt(saved),
    trapWarning,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/bonusOptimizer.spec.ts
```

预期：所有用例 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/bonusOptimizer.ts tests/core/bonusOptimizer.spec.ts
git commit -m "feat: 年终奖三方案对比与拆分优化器"
```

---
<!-- TASK7_END -->

## Task 8: `core/socialInsurance.ts` — 五险一金计算

**Files:**
- Create: `src/core/socialInsurance.ts`
- Test: `tests/core/socialInsurance.spec.ts`

- [ ] **Step 1: 写入测试 `tests/core/socialInsurance.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeSocialInsurance } from '@/core/socialInsurance';
import type { CityConfig } from '@/types';

const fakeCity: CityConfig = {
  id: 'beijing',
  name: '北京',
  region: 'beijing',
  effectiveYear: 2026,
  socialInsuranceSource: { title: 'test', url: 'http://example.com' },
  socialInsurance: {
    baseLower: 6000,
    baseUpper: 36000,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2000,
    baseUpper: 30000,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  reliefPolicies: [],
};

describe('computeSocialInsurance', () => {
  it('月薪 20000 在区间内：按 20000 计算', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '20000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    // 养老 1600 + 医疗 400 + 失业 100 + 公积金 2400 = 4500
    expect(r.pension).toBe('1600.00');
    expect(r.medical).toBe('400.00');
    expect(r.unemployment).toBe('100.00');
    expect(r.housingFund).toBe('2400.00');
    expect(r.total).toBe('4500.00');
  });

  it('月薪 5000 低于下限 6000：按下限计算', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '5000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    // 社保按 6000：480+120+30=630；公积金 base 取 max(5000, 2000)=5000，5000*0.12=600
    expect(r.pension).toBe('480.00');
    expect(r.housingFund).toBe('600.00');
  });

  it('月薪 50000 高于上限：社保按 36000，公积金按 30000', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '50000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    // 社保 36000：2880+720+180=3780
    // 公积金 30000*0.12=3600
    expect(r.pension).toBe('2880.00');
    expect(r.housingFund).toBe('3600.00');
    expect(r.total).toBe('7380.00');
  });

  it('自定义社保基数 15000 + 自定义公积金基数 10000', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '20000',
      customSocialBase: '15000',
      customHousingFundBase: '10000',
      city: fakeCity,
      housingFundRatio: 0.12,
    });
    expect(r.pension).toBe('1200.00');
    expect(r.housingFund).toBe('1200.00');
  });

  it('公积金比例越界：clamp 到 [0.05, 0.12]', () => {
    const r = computeSocialInsurance({
      monthlyIncome: '10000',
      city: fakeCity,
      housingFundRatio: 0.20,
    });
    // 比例 clamp 到 0.12，10000*0.12=1200
    expect(r.housingFund).toBe('1200.00');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test tests/core/socialInsurance.spec.ts
```

- [ ] **Step 3: 写入实现 `src/core/socialInsurance.ts`**

```ts
import { d, fmt, max, min } from './decimal';
import type { CityConfig } from '@/types';

export interface SocialInsuranceInput {
  monthlyIncome: string;
  customSocialBase?: string | null;
  customHousingFundBase?: string | null;
  city: CityConfig;
  housingFundRatio: number;
}

export interface SocialInsuranceResult {
  pension: string;
  medical: string;
  unemployment: string;
  housingFund: string;
  total: string;
  socialBaseUsed: string;
  housingFundBaseUsed: string;
}

function clamp(value: number, lo: number, hi: number) {
  return Math.min(Math.max(value, lo), hi);
}

export function computeSocialInsurance(input: SocialInsuranceInput): SocialInsuranceResult {
  const { city, housingFundRatio } = input;
  const income = max(d(input.monthlyIncome), d(0));

  const siCfg = city.socialInsurance;
  const hfCfg = city.housingFund;

  const rawSocialBase = input.customSocialBase != null && input.customSocialBase !== ''
    ? d(input.customSocialBase)
    : income;
  const socialBase = min(max(rawSocialBase, d(siCfg.baseLower)), d(siCfg.baseUpper));

  const rawHfBase = input.customHousingFundBase != null && input.customHousingFundBase !== ''
    ? d(input.customHousingFundBase)
    : income;
  const hfBase = min(max(rawHfBase, d(hfCfg.baseLower)), d(hfCfg.baseUpper));

  const ratio = clamp(housingFundRatio, hfCfg.ratioRange[0], hfCfg.ratioRange[1]);

  const pension = socialBase.mul(siCfg.pension.rate);
  const medical = socialBase.mul(siCfg.medical.rate);
  const unemployment = socialBase.mul(siCfg.unemployment.rate);
  const housingFund = hfBase.mul(ratio);
  const total = pension.add(medical).add(unemployment).add(housingFund);

  return {
    pension: fmt(pension),
    medical: fmt(medical),
    unemployment: fmt(unemployment),
    housingFund: fmt(housingFund),
    total: fmt(total),
    socialBaseUsed: fmt(socialBase),
    housingFundBaseUsed: fmt(hfBase),
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/socialInsurance.spec.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/core/socialInsurance.ts tests/core/socialInsurance.spec.ts
git commit -m "feat: 五险一金计算（含基数上下限和公积金比例）"
```

---
<!-- TASK8_END -->

## Task 9: `core/deductions.ts` — 专项附加扣除聚合 + 互斥校验

**Files:**
- Create: `src/core/deductions.ts`
- Test: `tests/core/deductions.spec.ts`

- [ ] **Step 1: 写入测试 `tests/core/deductions.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  computeMonthlyDeductions,
  validateDeductions,
} from '@/core/deductions';
import type { DeductionsInput } from '@/types';

const empty: DeductionsInput = {
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
};

describe('computeMonthlyDeductions', () => {
  it('全关闭：每项 0', () => {
    const r = computeMonthlyDeductions(empty);
    expect(r.total).toBe('0.00');
  });

  it('两个孩子教育：4000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      childEducation: { enabled: true, count: 2 },
    });
    expect(r.childEducation).toBe('4000.00');
    expect(r.total).toBe('4000.00');
  });

  it('1 孩 + 婴幼儿照护 1：2000+2000=4000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      childEducation: { enabled: true, count: 1 },
      infantCare: { enabled: true, count: 1 },
    });
    expect(r.total).toBe('4000.00');
  });

  it('继续教育（学历）400/月', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      continuingEducation: { enabled: true, type: 'degree' },
    });
    expect(r.continuingEducation).toBe('400.00');
  });

  it('继续教育（职业资格 3600 一次性）按月分摊为 0（非月度）', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      continuingEducation: { enabled: true, type: 'professional' },
    });
    // 职业资格证书属一次性扣除，月度计算时返回 0；年度时单独处理
    expect(r.continuingEducation).toBe('0.00');
  });

  it('住房贷款 1000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      housingLoan: { enabled: true },
    });
    expect(r.housingLoan).toBe('1000.00');
  });

  it('住房租金 tier1=1500 / tier2=1100 / tier3=800', () => {
    expect(computeMonthlyDeductions({ ...empty, housingRent: { enabled: true, cityTier: 'tier1' } }).housingRent).toBe('1500.00');
    expect(computeMonthlyDeductions({ ...empty, housingRent: { enabled: true, cityTier: 'tier2' } }).housingRent).toBe('1100.00');
    expect(computeMonthlyDeductions({ ...empty, housingRent: { enabled: true, cityTier: 'tier3' } }).housingRent).toBe('800.00');
  });

  it('赡养老人独生子女 3000', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: true, sharedAmount: '0' },
    });
    expect(r.elderlyCare).toBe('3000.00');
  });

  it('赡养老人非独生子女分摊 1500（最大）', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: false, sharedAmount: '1500' },
    });
    expect(r.elderlyCare).toBe('1500.00');
  });

  it('赡养老人非独生子女分摊超 1500：截断到 1500', () => {
    const r = computeMonthlyDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: false, sharedAmount: '2000' },
    });
    expect(r.elderlyCare).toBe('1500.00');
  });

  it('大病医疗：超过 15000 部分按月平摊到 12 个月，封顶 80000', () => {
    // 全年 27000 → 超额 12000 → 月均 1000
    const r = computeMonthlyDeductions({
      ...empty,
      seriousIllness: { enabled: true, amount: '27000' },
    });
    expect(r.seriousIllness).toBe('1000.00');
  });
});

describe('validateDeductions', () => {
  it('住房贷款 + 住房租金同时开 → 冲突', () => {
    const r = validateDeductions({
      ...empty,
      housingLoan: { enabled: true },
      housingRent: { enabled: true, cityTier: 'tier1' },
    });
    expect(r.valid).toBe(false);
    expect(r.conflicts.length).toBeGreaterThan(0);
  });

  it('赡养老人非独生分摊 > 1500 → 警告', () => {
    const r = validateDeductions({
      ...empty,
      elderlyCare: { enabled: true, isOnlyChild: false, sharedAmount: '2000' },
    });
    expect(r.valid).toBe(false);
  });

  it('全合法 → valid=true', () => {
    const r = validateDeductions({
      ...empty,
      childEducation: { enabled: true, count: 1 },
    });
    expect(r.valid).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test tests/core/deductions.spec.ts
```

- [ ] **Step 3: 写入实现 `src/core/deductions.ts`**

```ts
import { d, fmt, min, max, ZERO } from './decimal';
import { DEDUCTION_STANDARDS } from '@/data/constants';
import type {
  DeductionsInput,
  DeductionsValidation,
  MonthlyDeductionBreakdown,
} from '@/types';

const S = DEDUCTION_STANDARDS;

export function computeMonthlyDeductions(input: DeductionsInput): MonthlyDeductionBreakdown {
  const childEducation = input.childEducation.enabled
    ? d(S.childEducation).mul(Math.max(input.childEducation.count, 0))
    : ZERO;

  const infantCare = input.infantCare.enabled
    ? d(S.infantCare).mul(Math.max(input.infantCare.count, 0))
    : ZERO;

  const continuingEducation = input.continuingEducation.enabled
    ? input.continuingEducation.type === 'degree'
      ? d(S.continuingEducationDegree)
      : ZERO
    : ZERO;

  const seriousIllness = input.seriousIllness.enabled
    ? min(
        max(d(input.seriousIllness.amount).sub(S.seriousIllnessThreshold), ZERO),
        d(S.seriousIllnessAnnualCap),
      ).div(12)
    : ZERO;

  const housingLoan = input.housingLoan.enabled ? d(S.housingLoan) : ZERO;

  const housingRent = input.housingRent.enabled
    ? d(
        input.housingRent.cityTier === 'tier1'
          ? S.housingRentTier1
          : input.housingRent.cityTier === 'tier2'
          ? S.housingRentTier2
          : S.housingRentTier3,
      )
    : ZERO;

  const elderlyCare = input.elderlyCare.enabled
    ? input.elderlyCare.isOnlyChild
      ? d(S.elderlyCareOnlyChild)
      : min(d(input.elderlyCare.sharedAmount), d(S.elderlyCareSharedMax))
    : ZERO;

  const total = childEducation
    .add(infantCare)
    .add(continuingEducation)
    .add(seriousIllness)
    .add(housingLoan)
    .add(housingRent)
    .add(elderlyCare);

  return {
    childEducation: fmt(childEducation),
    infantCare: fmt(infantCare),
    continuingEducation: fmt(continuingEducation),
    seriousIllness: fmt(seriousIllness),
    housingLoan: fmt(housingLoan),
    housingRent: fmt(housingRent),
    elderlyCare: fmt(elderlyCare),
    total: fmt(total),
  };
}

export function validateDeductions(input: DeductionsInput): DeductionsValidation {
  const conflicts: string[] = [];

  if (input.housingLoan.enabled && input.housingRent.enabled) {
    conflicts.push('住房贷款利息 和 住房租金 不可同时享受');
  }

  if (input.elderlyCare.enabled && !input.elderlyCare.isOnlyChild) {
    if (d(input.elderlyCare.sharedAmount).gt(S.elderlyCareSharedMax)) {
      conflicts.push('非独生子女赡养老人分摊金额不得超过 1500 元/月');
    }
  }

  if (input.childEducation.enabled && input.childEducation.count <= 0) {
    conflicts.push('已开启子女教育，请填写子女数量');
  }
  if (input.infantCare.enabled && input.infantCare.count <= 0) {
    conflicts.push('已开启婴幼儿照护，请填写婴幼儿数量');
  }

  return { valid: conflicts.length === 0, conflicts };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/deductions.spec.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/core/deductions.ts tests/core/deductions.spec.ts
git commit -m "feat: 专项附加扣除月度聚合与互斥校验"
```

---
<!-- TASK9_END -->

## Task 10: `core/reliefs.ts` — 减征政策应用

**Files:**
- Create: `src/core/reliefs.ts`
- Test: `tests/core/reliefs.spec.ts`

- [ ] **Step 1: 写入测试 `tests/core/reliefs.spec.ts`**

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test tests/core/reliefs.spec.ts
```

- [ ] **Step 3: 写入实现 `src/core/reliefs.ts`**

```ts
import { d, fmt, min, max, ZERO } from './decimal';
import type { ReliefPolicy, ReliefApplyResult } from '@/types';

export interface ApplyReliefInput {
  taxAmount: string;
  accumulatedReduced: string;
  policy: ReliefPolicy;
}

export function applyRelief(input: ApplyReliefInput): ReliefApplyResult {
  const tax = max(d(input.taxAmount), ZERO);
  const acc = max(d(input.accumulatedReduced), ZERO);
  const { policy } = input;

  let reduced = ZERO;
  let remainingCap: string | null = null;

  switch (policy.mode) {
    case 'ratio': {
      const ratio = policy.ratio ?? 0;
      reduced = tax.mul(ratio);
      if (policy.annualCap !== undefined) {
        const cap = max(d(policy.annualCap).sub(acc), ZERO);
        reduced = min(reduced, cap);
        remainingCap = fmt(cap.sub(reduced));
      }
      reduced = min(reduced, tax);
      break;
    }
    case 'cap': {
      const cap = max(d(policy.annualCap ?? 0).sub(acc), ZERO);
      reduced = min(tax, cap);
      remainingCap = fmt(cap.sub(reduced));
      break;
    }
    case 'monthly_cap': {
      reduced = min(tax, d(policy.monthlyCap ?? 0));
      remainingCap = null;
      break;
    }
  }

  return { reduced: fmt(reduced), remainingCap };
}

export interface BatchInput {
  taxAmount: string;
  policies: { policy: ReliefPolicy; accumulatedReduced: string }[];
}

export interface BatchResult {
  totalReduced: string;
  taxAfterRelief: string;
  perPolicy: { policyId: string; reduced: string }[];
}

export function applyReliefBatch(input: BatchInput): BatchResult {
  let remaining = max(d(input.taxAmount), ZERO);
  let totalReduced = ZERO;
  const perPolicy: { policyId: string; reduced: string }[] = [];

  for (const item of input.policies) {
    const r = applyRelief({
      taxAmount: remaining.toFixed(2),
      accumulatedReduced: item.accumulatedReduced,
      policy: item.policy,
    });
    totalReduced = totalReduced.add(r.reduced);
    remaining = remaining.sub(r.reduced);
    perPolicy.push({ policyId: item.policy.id, reduced: r.reduced });
  }

  return {
    totalReduced: fmt(totalReduced),
    taxAfterRelief: fmt(remaining),
    perPolicy,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/reliefs.spec.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/core/reliefs.ts tests/core/reliefs.spec.ts
git commit -m "feat: 减征政策应用接口（ratio/cap/monthly_cap 三种模式）"
```

---
<!-- TASK10_END -->

## Task 11: `core/annual.ts` — 年度汇算编排

**Files:**
- Create: `src/core/annual.ts`
- Test: `tests/core/annual.spec.ts`

整合月度预扣 12 个月、年度汇算、年终奖三方案、减征政策、专项附加扣除一体化的入口。

- [ ] **Step 1: 写入测试 `tests/core/annual.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeAnnualSummary } from '@/core/annual';
import type { CityConfig, DeductionsInput } from '@/types';

const beijing: CityConfig = {
  id: 'beijing',
  name: '北京',
  region: 'beijing',
  effectiveYear: 2026,
  socialInsuranceSource: { title: 't', url: 'http://x' },
  socialInsurance: {
    baseLower: 6000,
    baseUpper: 36000,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: { baseLower: 2000, baseUpper: 30000, ratioRange: [0.05, 0.12], defaultRatio: 0.12 },
  reliefPolicies: [],
};

const noDeductions: DeductionsInput = {
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
};

describe('computeAnnualSummary', () => {
  it('月薪 30000 无年终奖 — 12 月累计预扣总和 = 年度汇算应缴', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    const sumWithholding = r.monthly.reduce((a, m) => a + parseFloat(m.monthlyTax), 0);
    expect(sumWithholding).toBeCloseTo(parseFloat(r.annualSalaryTax), 2);
  });

  it('月薪 30000 + 年终奖 60000 — 三方案对比可用', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '60000',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    expect(r.bonusComparison.plans.length).toBe(3);
  });

  it('月薪 30000 + 北京残疾人减征 50% — 年度税额减半', () => {
    const noRelief = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: beijing,
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: [],
    });
    const withRelief = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: { ...beijing, reliefPolicies: [{
        id: 'beijing-disability',
        region: 'beijing',
        category: 'disability',
        mode: 'ratio',
        ratio: 0.5,
        scope: 'comprehensive',
        description: 't',
        source: { title: 't', url: 'http://x' },
      }] },
      housingFundRatio: 0.12,
      deductions: noDeductions,
      reliefs: ['beijing-disability'],
    });
    const noTax = parseFloat(noRelief.annualSalaryTax);
    const withTax = parseFloat(withRelief.annualSalaryTax);
    expect(withTax).toBeCloseTo(noTax * 0.5, 1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test tests/core/annual.spec.ts
```

- [ ] **Step 3: 写入实现 `src/core/annual.ts`**

```ts
import { d, fmt, ZERO, max } from './decimal';
import { computeMonthlyWithholding, computeComprehensiveTax } from './tax';
import { computeSocialInsurance } from './socialInsurance';
import { computeMonthlyDeductions } from './deductions';
import { applyReliefBatch } from './reliefs';
import { compareBonusPlans } from './bonusOptimizer';
import { ANNUAL_BASIC_DEDUCTION } from '@/data/constants';
import type {
  CityConfig,
  DeductionsInput,
  MonthlyWithholding,
  BonusComparison,
} from '@/types';

export interface AnnualSummaryInput {
  monthlyIncome: string;
  annualBonus: string;
  city: CityConfig;
  housingFundRatio: number;
  customSocialBase?: string | null;
  customHousingFundBase?: string | null;
  deductions: DeductionsInput;
  reliefs: string[];
}

export interface AnnualSummary {
  monthly: MonthlyWithholding[];
  annualGross: string;
  annualSocialInsurance: string;
  annualDeductions: string;
  annualReliefDeducted: string;
  annualSalaryTaxBeforeRelief: string;
  annualSalaryTax: string;
  annualNetIncome: string;
  bonusComparison: BonusComparison;
}

export function computeAnnualSummary(input: AnnualSummaryInput): AnnualSummary {
  const si = computeSocialInsurance({
    monthlyIncome: input.monthlyIncome,
    customSocialBase: input.customSocialBase,
    customHousingFundBase: input.customHousingFundBase,
    city: input.city,
    housingFundRatio: input.housingFundRatio,
  });
  const monthlyDed = computeMonthlyDeductions(input.deductions);

  const activePolicies = input.city.reliefPolicies.filter(p => input.reliefs.includes(p.id));

  const monthly: MonthlyWithholding[] = [];
  let cumIncome = ZERO;
  let cumSI = ZERO;
  let cumDed = ZERO;
  let cumRelief = ZERO;
  let prevPaid = ZERO;
  const policyAccumulators = new Map<string, string>();
  for (const p of activePolicies) policyAccumulators.set(p.id, '0');

  for (let m = 1; m <= 12; m++) {
    cumIncome = cumIncome.add(input.monthlyIncome);
    cumSI = cumSI.add(si.total);
    cumDed = cumDed.add(monthlyDed.total);

    const provisional = computeMonthlyWithholding({
      month: m,
      cumulativeIncome: cumIncome.toFixed(2),
      cumulativeSocialInsurance: cumSI.toFixed(2),
      cumulativeDeductions: cumDed.toFixed(2),
      cumulativeReliefDeducted: cumRelief.toFixed(2),
      previousTaxPaid: prevPaid.toFixed(2),
      monthlyIncome: input.monthlyIncome,
      monthlySocialInsurance: si.total,
    });

    let monthlyTax = d(provisional.monthlyTax);
    if (activePolicies.length > 0 && monthlyTax.gt(0)) {
      const r = applyReliefBatch({
        taxAmount: monthlyTax.toFixed(2),
        policies: activePolicies.map(p => ({
          policy: p,
          accumulatedReduced: policyAccumulators.get(p.id)!,
        })),
      });
      for (const pp of r.perPolicy) {
        const prev = d(policyAccumulators.get(pp.policyId)!);
        policyAccumulators.set(pp.policyId, fmt(prev.add(pp.reduced)));
      }
      cumRelief = cumRelief.add(r.totalReduced);
      monthlyTax = d(r.taxAfterRelief);
    }

    const netSalary = d(input.monthlyIncome).sub(si.total).sub(monthlyTax);

    monthly.push({
      ...provisional,
      cumulativeReliefDeducted: fmt(cumRelief),
      cumulativeTaxAfterRelief: fmt(d(provisional.cumulativeTaxBeforeRelief).sub(cumRelief)),
      monthlyTax: fmt(monthlyTax),
      netSalary: fmt(netSalary),
    });

    prevPaid = prevPaid.add(monthlyTax);
  }

  const annualGross = cumIncome;
  const annualSI = cumSI;
  const annualDed = cumDed;
  const salaryTI = max(annualGross.sub(annualSI).sub(annualDed).sub(ANNUAL_BASIC_DEDUCTION), ZERO);
  const taxComp = computeComprehensiveTax(salaryTI.toFixed(2));
  const annualSalaryTax = max(d(taxComp.taxBeforeRelief).sub(cumRelief), ZERO);

  const annualNet = annualGross.sub(annualSI).sub(annualSalaryTax);

  const bonusComparison = compareBonusPlans({
    annualSalaryAfterBaseDeductions: salaryTI.toFixed(2),
    annualBonus: input.annualBonus,
  });

  return {
    monthly,
    annualGross: fmt(annualGross),
    annualSocialInsurance: fmt(annualSI),
    annualDeductions: fmt(annualDed),
    annualReliefDeducted: fmt(cumRelief),
    annualSalaryTaxBeforeRelief: taxComp.taxBeforeRelief,
    annualSalaryTax: fmt(annualSalaryTax),
    annualNetIncome: fmt(annualNet),
    bonusComparison,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test tests/core/annual.spec.ts
```

- [ ] **Step 5: 运行整套测试**

```bash
pnpm test
```

预期：所有 spec 文件 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/core/annual.ts tests/core/annual.spec.ts
git commit -m "feat: 年度汇算编排器整合月度预扣/减征/年终奖方案"
```

---
<!-- TASK11_END -->

## Task 12: `data/cities/*` — 六城市配置

**Files:**
- Create: `src/data/cities/beijing.ts`
- Create: `src/data/cities/shanghai.ts`
- Create: `src/data/cities/guangzhou.ts`
- Create: `src/data/cities/shenzhen.ts`
- Create: `src/data/cities/hangzhou.ts`
- Create: `src/data/cities/chengdu.ts`
- Create: `src/data/cities/index.ts`

注：社保公积金基数采用 2025-2026 年度公开数据的常用值（用户主要关注税收优惠，不要求基数完全实时）。各城市具体数值在每条政策的 `socialInsuranceSource` 中标注来源。

- [ ] **Step 1: 写入 `src/data/cities/beijing.ts`**

```ts
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
    baseUpper: 35283,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2420,
    baseUpper: 35283,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '北京市 2024 年度社会保险缴费工资基数',
    url: 'https://rsj.beijing.gov.cn/',
  },
  reliefPolicies: [beijingDisability, beijingElderlyAlone, beijingMartyrFamily],
};
```

- [ ] **Step 2: 写入 `src/data/cities/shanghai.ts`**

```ts
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
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2690,
    baseUpper: 36921,
    ratioRange: [0.05, 0.07],
    defaultRatio: 0.07,
  },
  socialInsuranceSource: {
    title: '上海市 2024 年度社会保险缴费基数',
    url: 'https://rsj.sh.gov.cn/',
  },
  reliefPolicies: [
    shanghaiBase('shanghai-disability', 'disability', '残疾'),
    shanghaiBase('shanghai-elderly-alone', 'elderly_alone', '孤老'),
    shanghaiBase('shanghai-martyr-family', 'martyr_family', '烈属'),
  ],
};
```

- [ ] **Step 3: 写入 `src/data/cities/guangzhou.ts`**

```ts
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
    pension: { rate: 0.08 },
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
```

- [ ] **Step 4: 写入 `src/data/cities/shenzhen.ts`**

```ts
import type { CityConfig } from '@/types';
import { guangzhou } from './guangzhou';

export const shenzhen: CityConfig = {
  ...guangzhou,
  id: 'shenzhen',
  name: '深圳',
  socialInsurance: {
    baseLower: 2360,
    baseUpper: 28770,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.003 },
  },
  housingFund: {
    baseLower: 2360,
    baseUpper: 41497,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '深圳市 2024 年社会保险缴费基数',
    url: 'http://hrss.sz.gov.cn/',
  },
};
```

- [ ] **Step 5: 写入 `src/data/cities/hangzhou.ts`**

```ts
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
    baseUpper: 24930,
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.005 },
  },
  housingFund: {
    baseLower: 2280,
    baseUpper: 39687,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '杭州市 2024 年社保缴费基数',
    url: 'http://hrss.zj.gov.cn/',
  },
  reliefPolicies: [
    zjBase('zhejiang-disability', 'disability', '浙江省残疾人个税每月减免最高 500 元'),
    zjBase('zhejiang-elderly-alone', 'elderly_alone', '浙江省孤老人员个税每月减免最高 500 元'),
    zjBase('zhejiang-martyr-family', 'martyr_family', '浙江省烈属个税每月减免最高 500 元'),
  ],
};
```

- [ ] **Step 6: 写入 `src/data/cities/chengdu.ts`**

```ts
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
    pension: { rate: 0.08 },
    medical: { rate: 0.02 },
    unemployment: { rate: 0.004 },
  },
  housingFund: {
    baseLower: 2200,
    baseUpper: 27786,
    ratioRange: [0.05, 0.12],
    defaultRatio: 0.12,
  },
  socialInsuranceSource: {
    title: '成都市 2024 年社保缴费基数',
    url: 'http://cdhrss.chengdu.gov.cn/',
  },
  reliefPolicies: [
    scBase('sichuan-disability', 'disability', '四川省残疾人个税年度减免上限 12,000 元'),
    scBase('sichuan-elderly-alone', 'elderly_alone', '四川省孤老人员个税年度减免上限 12,000 元'),
    scBase('sichuan-martyr-family', 'martyr_family', '四川省烈属个税年度减免上限 12,000 元'),
  ],
};
```

- [ ] **Step 7: 写入 `src/data/cities/index.ts`**

```ts
import type { CityConfig, CityId } from '@/types';
import { beijing } from './beijing';
import { shanghai } from './shanghai';
import { guangzhou } from './guangzhou';
import { shenzhen } from './shenzhen';
import { hangzhou } from './hangzhou';
import { chengdu } from './chengdu';

export const CITIES: Record<CityId, CityConfig> = {
  beijing,
  shanghai,
  guangzhou,
  shenzhen,
  hangzhou,
  chengdu,
};

export const CITY_LIST: CityConfig[] = [beijing, shanghai, guangzhou, shenzhen, hangzhou, chengdu];

export function getCity(id: CityId): CityConfig {
  return CITIES[id];
}
```

- [ ] **Step 8: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

预期：无错误。

- [ ] **Step 9: 提交**

```bash
git add src/data/cities/
git commit -m "feat: 六城市配置（含残疾/孤老/烈属减征政策原文链接）"
```

---
<!-- TASK12_END -->

## Task 13: Pinia stores + 持久化

**Files:**
- Create: `src/stores/inputStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/stores/resultStore.ts`

- [ ] **Step 1: 写入 `src/stores/settingsStore.ts`**

```ts
import { defineStore } from 'pinia';
import type { CityId } from '@/types';

interface SettingsState {
  cityId: CityId;
  activeTab: 'monthly' | 'annual';
  housingFundRatio: number;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    cityId: 'beijing',
    activeTab: 'monthly',
    housingFundRatio: 0.12,
  }),
  persist: {
    key: 'tax-calc-settings',
  },
});
```

- [ ] **Step 2: 写入 `src/stores/inputStore.ts`**

```ts
import { defineStore } from 'pinia';
import type { DeductionsInput, BonusStrategy } from '@/types';

interface InputState {
  monthlySalary: string;
  customSocialBase: string | null;
  customHousingFundBase: string | null;
  deductions: DeductionsInput;
  reliefs: string[];
  annualBonus: string;
  bonusStrategy: BonusStrategy;
}

const defaultDeductions = (): DeductionsInput => ({
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
});

export const useInputStore = defineStore('input', {
  state: (): InputState => ({
    monthlySalary: '20000',
    customSocialBase: null,
    customHousingFundBase: null,
    deductions: defaultDeductions(),
    reliefs: [],
    annualBonus: '0',
    bonusStrategy: 'auto',
  }),
  persist: {
    key: 'tax-calc-input',
  },
});
```

- [ ] **Step 3: 写入 `src/stores/resultStore.ts`**

`resultStore` 仅作为缓存层，由 view 层调用 `compute()` 写入。

```ts
import { defineStore } from 'pinia';
import { computeAnnualSummary } from '@/core/annual';
import { CITIES } from '@/data/cities';
import { useInputStore } from './inputStore';
import { useSettingsStore } from './settingsStore';
import type { AnnualSummary } from '@/core/annual';

interface ResultState {
  summary: AnnualSummary | null;
}

export const useResultStore = defineStore('result', {
  state: (): ResultState => ({ summary: null }),
  actions: {
    compute() {
      const input = useInputStore();
      const settings = useSettingsStore();
      const city = CITIES[settings.cityId];
      this.summary = computeAnnualSummary({
        monthlyIncome: input.monthlySalary,
        annualBonus: input.annualBonus,
        city,
        housingFundRatio: settings.housingFundRatio,
        customSocialBase: input.customSocialBase,
        customHousingFundBase: input.customHousingFundBase,
        deductions: input.deductions,
        reliefs: input.reliefs,
      });
    },
  },
});
```

- [ ] **Step 4: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add src/stores/
git commit -m "feat: Pinia stores（input/settings/result）+ localStorage 持久化"
```

---
<!-- TASK13_END -->

## Task 14: 共享 UI 组件

**Files:**
- Create: `src/components/shared/NumberInput.vue`
- Create: `src/components/shared/SwitchCard.vue`
- Create: `src/components/shared/PolicyLink.vue`
- Create: `src/components/shared/AnimatedNumber.vue`

- [ ] **Step 1: 写入 `src/components/shared/NumberInput.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const sanitize = (raw: string) => {
  let v = raw.replace(/[^\d.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  return v;
};

const onInput = (e: Event) => {
  const v = sanitize((e.target as HTMLInputElement).value);
  emit('update:modelValue', v);
};

const display = computed(() => props.modelValue ?? '');
</script>

<template>
  <label class="block">
    <span v-if="label" class="text-12px text-mute mb-4px block">{{ label }}</span>
    <div class="flex items-center gap-6px px-12px py-10px bg-stone-50 rounded-8px focus-within:bg-white focus-within:ring-2 ring-primary/20 transition">
      <span v-if="prefix" class="text-mute text-14px">{{ prefix }}</span>
      <input
        type="text"
        inputmode="decimal"
        :value="display"
        :placeholder="placeholder"
        class="flex-1 bg-transparent outline-none text-14px text-ink"
        @input="onInput"
      />
      <span v-if="suffix" class="text-mute text-12px">{{ suffix }}</span>
    </div>
  </label>
</template>
```

- [ ] **Step 2: 写入 `src/components/shared/SwitchCard.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; title: string; subtitle?: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();

const toggle = () => emit('update:modelValue', !props.modelValue);
</script>

<template>
  <div class="card transition cursor-pointer" :class="modelValue ? 'ring-2 ring-primary/30' : ''">
    <div class="flex items-center justify-between gap-12px" @click="toggle">
      <div>
        <div class="text-14px font-semibold text-ink">{{ title }}</div>
        <div v-if="subtitle" class="text-12px text-mute mt-2px">{{ subtitle }}</div>
      </div>
      <div
        class="w-44px h-24px rounded-full relative transition"
        :class="modelValue ? 'bg-primary' : 'bg-stone-300'"
      >
        <div
          class="w-20px h-20px rounded-full bg-white absolute top-2px transition-all shadow"
          :class="modelValue ? 'left-22px' : 'left-2px'"
        />
      </div>
    </div>
    <div v-if="modelValue" class="mt-12px pt-12px border-t border-stone-100">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 3: 写入 `src/components/shared/PolicyLink.vue`**

```vue
<script setup lang="ts">
defineProps<{ title: string; url: string; description?: string }>();
</script>

<template>
  <div class="bg-primary/5 rounded-8px p-12px">
    <p v-if="description" class="text-12px text-ink leading-relaxed mb-6px">{{ description }}</p>
    <a
      :href="url"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-4px text-12px text-primary hover:underline"
    >
      <span>查看政策原文</span>
      <span>↗</span>
    </a>
    <div class="text-11px text-mute mt-4px">{{ title }}</div>
  </div>
</template>
```

- [ ] **Step 4: 写入 `src/components/shared/AnimatedNumber.vue`**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ value: string | number; duration?: number }>();
const display = ref(0);

const animate = (from: number, to: number, duration: number) => {
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    display.value = from + (to - from) * eased;
    if (t < 1) requestAnimationFrame(tick);
    else display.value = to;
  };
  requestAnimationFrame(tick);
};

watch(
  () => props.value,
  (v) => {
    const next = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(next)) return;
    animate(display.value, next, props.duration ?? 300);
  },
  { immediate: true }
);

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<template>
  <span class="font-mono">{{ fmt(display) }}</span>
</template>
```

- [ ] **Step 5: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add src/components/shared/
git commit -m "feat: 共享 UI 组件（NumberInput/SwitchCard/PolicyLink/AnimatedNumber）"
```

---
<!-- TASK14_END -->

## Task 15: 输入区组件群

**Files:**
- Create: `src/components/input/SalaryPanel.vue`
- Create: `src/components/input/DeductionsPanel.vue`
- Create: `src/components/input/ReliefSelector.vue`
- Create: `src/components/input/CityPicker.vue`

- [ ] **Step 1: 写入 `src/components/input/SalaryPanel.vue`**

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import NumberInput from '../shared/NumberInput.vue';

const input = useInputStore();
const { monthlySalary, customSocialBase, customHousingFundBase, annualBonus } = storeToRefs(input);
</script>

<template>
  <section class="card">
    <h3 class="text-14px font-semibold text-ink mb-12px">收入与基数</h3>
    <div class="space-y-12px">
      <NumberInput v-model="monthlySalary" label="税前月薪" prefix="¥" suffix="元/月" />
      <NumberInput v-model="annualBonus" label="年终奖（全年一次性奖金）" prefix="¥" suffix="元" />
      <details class="text-12px">
        <summary class="text-mute cursor-pointer">自定义社保 / 公积金基数（高级）</summary>
        <div class="mt-12px space-y-12px">
          <NumberInput
            :model-value="customSocialBase ?? ''"
            @update:model-value="customSocialBase = $event || null"
            label="自定义社保基数"
            placeholder="留空则按月薪"
            prefix="¥"
          />
          <NumberInput
            :model-value="customHousingFundBase ?? ''"
            @update:model-value="customHousingFundBase = $event || null"
            label="自定义公积金基数"
            placeholder="留空则按月薪"
            prefix="¥"
          />
        </div>
      </details>
    </div>
  </section>
</template>
```

- [ ] **Step 2: 写入 `src/components/input/DeductionsPanel.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { validateDeductions } from '@/core/deductions';
import SwitchCard from '../shared/SwitchCard.vue';
import NumberInput from '../shared/NumberInput.vue';

const input = useInputStore();
const { deductions } = storeToRefs(input);
const settings = useSettingsStore();

const TIER_BY_CITY: Record<string, 'tier1' | 'tier2' | 'tier3'> = {
  beijing: 'tier1',
  shanghai: 'tier1',
  guangzhou: 'tier1',
  shenzhen: 'tier1',
  hangzhou: 'tier2',
  chengdu: 'tier2',
};

const validation = computed(() => validateDeductions(deductions.value));

// auto-sync rent tier with city
const onMounted = () => {
  deductions.value.housingRent.cityTier = TIER_BY_CITY[settings.cityId] ?? 'tier1';
};
onMounted();
</script>

<template>
  <section class="card">
    <h3 class="text-14px font-semibold text-ink mb-12px">专项附加扣除</h3>

    <div class="space-y-10px">
      <SwitchCard v-model="deductions.childEducation.enabled" title="子女教育" subtitle="2,000 元/月/孩">
        <NumberInput
          :model-value="String(deductions.childEducation.count)"
          @update:model-value="deductions.childEducation.count = parseInt($event || '0')"
          label="子女数量"
          suffix="人"
        />
      </SwitchCard>

      <SwitchCard v-model="deductions.infantCare.enabled" title="3岁以下婴幼儿照护" subtitle="2,000 元/月/孩">
        <NumberInput
          :model-value="String(deductions.infantCare.count)"
          @update:model-value="deductions.infantCare.count = parseInt($event || '0')"
          label="婴幼儿数量"
          suffix="人"
        />
      </SwitchCard>

      <SwitchCard v-model="deductions.continuingEducation.enabled" title="继续教育" subtitle="学历 400 元/月">
        <select
          v-model="deductions.continuingEducation.type"
          class="w-full px-12px py-10px bg-stone-50 rounded-8px outline-none text-14px"
        >
          <option value="degree">学历继续教育（400元/月）</option>
          <option value="professional">职业资格证书（3600元/年一次性）</option>
        </select>
      </SwitchCard>

      <SwitchCard v-model="deductions.seriousIllness.enabled" title="大病医疗" subtitle="超 1.5 万部分，年度上限 8 万">
        <NumberInput
          v-model="deductions.seriousIllness.amount"
          label="全年自付医疗费用"
          prefix="¥"
        />
      </SwitchCard>

      <SwitchCard v-model="deductions.housingLoan.enabled" title="住房贷款利息" subtitle="1,000 元/月">
      </SwitchCard>

      <SwitchCard v-model="deductions.housingRent.enabled" title="住房租金" subtitle="按城市分级 800/1100/1500 元/月">
        <select
          v-model="deductions.housingRent.cityTier"
          class="w-full px-12px py-10px bg-stone-50 rounded-8px outline-none text-14px"
        >
          <option value="tier1">一线城市（1,500/月）</option>
          <option value="tier2">省会/百万人口城市（1,100/月）</option>
          <option value="tier3">其他城市（800/月）</option>
        </select>
      </SwitchCard>

      <SwitchCard v-model="deductions.elderlyCare.enabled" title="赡养老人" subtitle="独生 3,000；非独生分摊 ≤ 1,500">
        <div class="space-y-10px">
          <label class="flex items-center gap-8px text-12px text-ink">
            <input v-model="deductions.elderlyCare.isOnlyChild" type="checkbox" /> 我是独生子女
          </label>
          <NumberInput
            v-if="!deductions.elderlyCare.isOnlyChild"
            v-model="deductions.elderlyCare.sharedAmount"
            label="本人分摊金额"
            prefix="¥"
            suffix="元/月（≤1500）"
          />
        </div>
      </SwitchCard>
    </div>

    <div v-if="!validation.valid" class="mt-12px p-10px bg-warn/10 rounded-8px">
      <p v-for="c in validation.conflicts" :key="c" class="text-12px text-warn">⚠ {{ c }}</p>
    </div>
  </section>
</template>
```

- [ ] **Step 3: 写入 `src/components/input/ReliefSelector.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useInputStore } from '@/stores/inputStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { CITIES } from '@/data/cities';
import PolicyLink from '../shared/PolicyLink.vue';

const input = useInputStore();
const settings = useSettingsStore();
const { reliefs } = storeToRefs(input);

const policies = computed(() => CITIES[settings.cityId].reliefPolicies);

const labelByCategory: Record<string, string> = {
  disability: '残疾人',
  elderly_alone: '孤老',
  martyr_family: '烈属',
};

const toggle = (id: string) => {
  const idx = reliefs.value.indexOf(id);
  if (idx >= 0) reliefs.value.splice(idx, 1);
  else {
    // 同一类别互斥：先移除同类
    const policy = policies.value.find(p => p.id === id);
    if (policy) {
      const sameCat = policies.value.filter(p => p.category === policy.category).map(p => p.id);
      reliefs.value = reliefs.value.filter(r => !sameCat.includes(r));
    }
    reliefs.value.push(id);
  }
};

const isOn = (id: string) => reliefs.value.includes(id);
</script>

<template>
  <section class="card">
    <h3 class="text-14px font-semibold text-ink mb-4px">税收优惠（减征政策）</h3>
    <p class="text-11px text-mute mb-12px">同一类别多个政策互斥，不同类别可叠加</p>

    <div class="space-y-10px">
      <div
        v-for="p in policies"
        :key="p.id"
        class="border border-stone-100 rounded-10px p-12px transition"
        :class="isOn(p.id) ? 'ring-2 ring-primary/30 bg-primary/5' : 'bg-white'"
      >
        <div class="flex items-start justify-between gap-10px cursor-pointer" @click="toggle(p.id)">
          <div>
            <div class="flex items-center gap-6px">
              <span class="text-12px px-6px py-2px rounded-4px bg-stone-100 text-mute">
                {{ labelByCategory[p.category] }}
              </span>
              <span class="text-13px font-medium text-ink">{{ p.description }}</span>
            </div>
          </div>
          <input :checked="isOn(p.id)" type="checkbox" class="mt-2px" @click.stop="toggle(p.id)" />
        </div>
        <div v-if="isOn(p.id)" class="mt-10px">
          <PolicyLink :title="p.source.title" :url="p.source.url" />
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 4: 写入 `src/components/input/CityPicker.vue`**

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore';
import { CITY_LIST } from '@/data/cities';
import type { CityId } from '@/types';

const settings = useSettingsStore();
const { cityId } = storeToRefs(settings);

const onChange = (e: Event) => {
  cityId.value = (e.target as HTMLSelectElement).value as CityId;
};
</script>

<template>
  <select
    :value="cityId"
    class="px-12px py-8px bg-white rounded-8px outline-none text-14px border border-stone-200"
    @change="onChange"
  >
    <option v-for="c in CITY_LIST" :key="c.id" :value="c.id">{{ c.name }}</option>
  </select>
</template>
```

- [ ] **Step 5: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add src/components/input/
git commit -m "feat: 输入区组件（薪资/扣除/减征/城市选择）"
```

---
<!-- TASK15_END -->

## Task 16: 月度预扣视图

**Files:**
- Create: `src/components/result/MonthlyResult.vue`
- Create: `src/views/MonthlyView.vue`

- [ ] **Step 1: 写入 `src/components/result/MonthlyResult.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';

const result = useResultStore();

const firstMonth = computed(() => result.summary?.monthly[0]);
const lastMonth = computed(() => result.summary?.monthly[11]);
</script>

<template>
  <div v-if="result.summary" class="space-y-16px">
    <!-- 顶部到手金额大数字 -->
    <section class="card">
      <p class="text-11px text-mute uppercase tracking-wide">本月（1月）到手</p>
      <h2 class="text-32px font-bold text-ink mt-4px tracking-tight">
        <span class="text-16px text-mute mr-4px">¥</span>
        <AnimatedNumber :value="firstMonth?.netSalary ?? '0'" />
      </h2>
      <div class="flex gap-12px mt-12px text-12px">
        <span class="px-8px py-2px bg-success/10 text-success rounded-full">
          12 月累计已预扣 ¥{{ lastMonth?.cumulativeTaxAfterRelief ?? '0' }}
        </span>
      </div>
    </section>

    <!-- 当月明细 -->
    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">1 月扣税明细</h3>
      <div class="space-y-8px text-13px">
        <div class="flex justify-between"><span class="text-mute">税前月薪</span><span class="font-mono">¥ {{ firstMonth?.cumulativeIncome }}</span></div>
        <div class="flex justify-between"><span class="text-mute">五险一金</span><span class="font-mono text-danger">− ¥ {{ firstMonth?.cumulativeSocialInsurance }}</span></div>
        <div class="flex justify-between"><span class="text-mute">专项附加扣除</span><span class="font-mono text-danger">− ¥ {{ firstMonth?.cumulativeDeductions }}</span></div>
        <div class="flex justify-between"><span class="text-mute">基本减除</span><span class="font-mono text-danger">− ¥ {{ firstMonth?.cumulativeBasicDeduction }}</span></div>
        <div class="flex justify-between border-t border-stone-100 pt-8px">
          <span class="text-ink font-medium">应纳税所得额</span>
          <span class="font-mono">¥ {{ firstMonth?.cumulativeTaxableIncome }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-mute">适用税率 / 速算扣除</span>
          <span class="font-mono">{{ ((firstMonth?.bracket.rate ?? 0) * 100).toFixed(0) }}% / {{ firstMonth?.bracket.quickDeduction.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between border-t border-stone-100 pt-8px">
          <span class="text-ink font-semibold">本月预扣税</span>
          <span class="font-mono text-warn font-semibold">¥ {{ firstMonth?.monthlyTax }}</span>
        </div>
      </div>
    </section>

    <!-- 12 月预扣进度 -->
    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">12 月累计预扣进度</h3>
      <div class="overflow-x-auto -mx-16px px-16px">
        <table class="w-full text-12px">
          <thead>
            <tr class="text-mute text-left">
              <th class="py-6px font-normal">月份</th>
              <th class="py-6px font-normal text-right">累计应纳税所得</th>
              <th class="py-6px font-normal text-right">累计税额</th>
              <th class="py-6px font-normal text-right">当月预扣</th>
              <th class="py-6px font-normal text-right">到手</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in result.summary.monthly" :key="m.month" class="border-t border-stone-50">
              <td class="py-6px">{{ m.month }} 月</td>
              <td class="py-6px text-right font-mono">{{ m.cumulativeTaxableIncome }}</td>
              <td class="py-6px text-right font-mono">{{ m.cumulativeTaxAfterRelief }}</td>
              <td class="py-6px text-right font-mono text-warn">{{ m.monthlyTax }}</td>
              <td class="py-6px text-right font-mono">{{ m.netSalary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
```

- [ ] **Step 2: 写入 `src/views/MonthlyView.vue`**

```vue
<script setup lang="ts">
import SalaryPanel from '@/components/input/SalaryPanel.vue';
import DeductionsPanel from '@/components/input/DeductionsPanel.vue';
import ReliefSelector from '@/components/input/ReliefSelector.vue';
import MonthlyResult from '@/components/result/MonthlyResult.vue';
</script>

<template>
  <div class="grid gap-16px lg:grid-cols-[2fr_3fr]">
    <div class="space-y-16px">
      <SalaryPanel />
      <DeductionsPanel />
      <ReliefSelector />
    </div>
    <MonthlyResult />
  </div>
</template>
```

- [ ] **Step 3: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/result/MonthlyResult.vue src/views/MonthlyView.vue
git commit -m "feat: 月度预扣视图（输入 + 12月进度展示）"
```

---
<!-- TASK16_END -->

## Task 17: 年度汇算视图（方案对比 + ECharts）

**Files:**
- Create: `src/components/result/BonusComparison.vue`
- Create: `src/components/result/AnnualResult.vue`
- Create: `src/views/AnnualView.vue`

- [ ] **Step 1: 写入 `src/components/result/BonusComparison.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, watch, ref, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const result = useResultStore();
const cmp = computed(() => result.summary?.bonusComparison);
const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const labelOf = (s: string) =>
  s === 'merge' ? '并入综合所得' : s === 'separate' ? '单独计税' : '拆分优化';

const renderChart = () => {
  if (!chart || !cmp.value) return;
  const plans = cmp.value.plans;
  chart.setOption({
    grid: { left: 60, right: 20, top: 24, bottom: 32 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: plans.map(p => labelOf(p.strategy)),
      axisLabel: { color: '#78716c', fontSize: 12 },
      axisLine: { lineStyle: { color: '#e7e5e4' } },
    },
    yAxis: {
      type: 'value',
      name: '元',
      axisLabel: { color: '#78716c', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f5f5f4' } },
    },
    series: [{
      type: 'bar',
      data: plans.map(p => ({
        value: parseFloat(p.totalTax),
        itemStyle: {
          color: p.strategy === cmp.value!.best.strategy ? '#10b981' : '#94a3b8',
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: 40,
      label: { show: true, position: 'top', formatter: (params: any) => `¥${params.value.toLocaleString()}` },
    }],
  });
};

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value);
    renderChart();
    window.addEventListener('resize', resize);
  }
});

const resize = () => chart?.resize();

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
});

watch(cmp, renderChart, { deep: true });
</script>

<template>
  <div v-if="cmp" class="space-y-16px">
    <!-- 临界点警告 -->
    <div
      v-if="cmp.trapWarning"
      class="card bg-danger/5 border border-danger/20"
    >
      <p class="text-13px text-danger font-medium">
        ⚠ 您的年终奖落入"多发不如少发"陷阱区
      </p>
      <p class="text-12px text-ink mt-6px">
        建议下调至 <b class="text-danger">¥{{ cmp.trapWarning.suggestedAmount.toLocaleString() }}</b>，
        可少缴税 <b class="text-success">¥{{ cmp.trapWarning.potentialSaving }}</b>
      </p>
    </div>

    <!-- 三方案卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-12px">
      <div
        v-for="p in cmp.plans"
        :key="p.strategy"
        class="card relative transition"
        :class="p.strategy === cmp.best.strategy ? 'ring-2 ring-success bg-success/5' : ''"
      >
        <div v-if="p.strategy === cmp.best.strategy" class="absolute -top-8px right-12px text-11px px-8px py-2px bg-success text-white rounded-full">
          推荐 · 省 ¥{{ cmp.savedVsWorst }}
        </div>
        <div class="text-12px text-mute uppercase tracking-wide">
          {{ labelOf(p.strategy) }}
        </div>
        <h3 class="text-22px font-bold text-ink mt-6px">
          ¥<AnimatedNumber :value="p.totalTax" />
        </h3>
        <p class="text-11px text-mute mt-2px">{{ p.description }}</p>
        <div class="mt-12px space-y-4px text-12px">
          <div class="flex justify-between">
            <span class="text-mute">单独计税部分</span>
            <span class="font-mono">¥{{ p.bonusForSeparate }} → 税 {{ p.taxFromSeparate }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-mute">并入工资部分</span>
            <span class="font-mono">¥{{ p.bonusForMerge }} → 税 {{ p.taxFromMerge }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比图表 -->
    <section class="card">
      <h3 class="text-14px font-semibold text-ink mb-12px">税负对比</h3>
      <div ref="chartEl" class="h-260px" />
    </section>
  </div>
</template>
```

- [ ] **Step 2: 写入 `src/components/result/AnnualResult.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useResultStore } from '@/stores/resultStore';
import AnimatedNumber from '../shared/AnimatedNumber.vue';
import BonusComparison from './BonusComparison.vue';

const result = useResultStore();
const summary = computed(() => result.summary);
</script>

<template>
  <div v-if="summary" class="space-y-16px">
    <section class="card">
      <p class="text-11px text-mute uppercase tracking-wide">全年综合所得 (工资 + 年终奖)</p>
      <div class="flex items-baseline gap-16px mt-6px">
        <div>
          <p class="text-11px text-mute">税前总收入</p>
          <h2 class="text-28px font-bold text-ink tracking-tight">
            ¥<AnimatedNumber :value="summary.annualGross" />
          </h2>
        </div>
        <div>
          <p class="text-11px text-mute">五险一金合计</p>
          <h3 class="text-18px font-semibold text-mute">
            ¥<AnimatedNumber :value="summary.annualSocialInsurance" />
          </h3>
        </div>
        <div>
          <p class="text-11px text-mute">年度净到手（仅工资部分）</p>
          <h3 class="text-18px font-semibold text-success">
            ¥<AnimatedNumber :value="summary.annualNetIncome" />
          </h3>
        </div>
      </div>
      <div v-if="parseFloat(summary.annualReliefDeducted) > 0" class="mt-12px text-12px text-success">
        ✓ 已减征：¥{{ summary.annualReliefDeducted }}
      </div>
    </section>

    <BonusComparison />
  </div>
</template>
```

- [ ] **Step 3: 写入 `src/views/AnnualView.vue`**

```vue
<script setup lang="ts">
import SalaryPanel from '@/components/input/SalaryPanel.vue';
import DeductionsPanel from '@/components/input/DeductionsPanel.vue';
import ReliefSelector from '@/components/input/ReliefSelector.vue';
import AnnualResult from '@/components/result/AnnualResult.vue';
</script>

<template>
  <div class="grid gap-16px lg:grid-cols-[2fr_3fr]">
    <div class="space-y-16px">
      <SalaryPanel />
      <DeductionsPanel />
      <ReliefSelector />
    </div>
    <AnnualResult />
  </div>
</template>
```

- [ ] **Step 4: 类型检查**

```bash
pnpm exec vue-tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add src/components/result/ src/views/AnnualView.vue
git commit -m "feat: 年度汇算视图 + 年终奖三方案对比与陷阱提醒"
```

---
<!-- TASK17_END -->

## Task 18: 应用框架与响应式（顶部栏 + Tab 切换 + 自动计算）

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 重写 `src/App.vue`**

```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInputStore } from '@/stores/inputStore';
import { useResultStore } from '@/stores/resultStore';
import CityPicker from '@/components/input/CityPicker.vue';
import MonthlyView from '@/views/MonthlyView.vue';
import AnnualView from '@/views/AnnualView.vue';

const settings = useSettingsStore();
const input = useInputStore();
const result = useResultStore();
const { activeTab } = storeToRefs(settings);

let timer: number | undefined;
const recompute = () => {
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(() => result.compute(), 200);
};

onMounted(() => result.compute());

watch(
  () => [
    input.monthlySalary,
    input.annualBonus,
    input.customSocialBase,
    input.customHousingFundBase,
    JSON.stringify(input.deductions),
    JSON.stringify(input.reliefs),
    settings.cityId,
    settings.housingFundRatio,
  ],
  recompute,
  { deep: true }
);
</script>

<template>
  <div class="min-h-screen bg-bg text-ink font-sans">
    <header class="bg-white border-b border-stone-100 sticky top-0 z-10">
      <div class="max-w-1280px mx-auto px-24px py-14px flex items-center justify-between gap-16px">
        <div class="flex items-center gap-16px">
          <h1 class="text-18px font-bold tracking-tight">
            <span class="text-primary">Tax</span>Calc
          </h1>
          <nav class="flex bg-stone-100 rounded-8px p-2px">
            <button
              v-for="t in (['monthly', 'annual'] as const)"
              :key="t"
              class="px-14px py-6px text-13px rounded-6px transition"
              :class="activeTab === t ? 'bg-white text-ink shadow-sm font-medium' : 'text-mute'"
              @click="activeTab = t"
            >
              {{ t === 'monthly' ? '月度预扣' : '年度汇算' }}
            </button>
          </nav>
        </div>
        <CityPicker />
      </div>
    </header>

    <main class="max-w-1280px mx-auto px-24px py-24px">
      <MonthlyView v-if="activeTab === 'monthly'" />
      <AnnualView v-else />
    </main>

    <footer class="text-center text-11px text-mute py-24px">
      数据仅供参考。实际申报以当地税务机关核定为准。
    </footer>
  </div>
</template>
```

- [ ] **Step 2: 启动开发服务器手动验证**

```bash
pnpm dev
```

预期输出：Vite 启动后给出 `http://localhost:5173`。在浏览器打开后：
- 默认显示北京、月度预扣视图
- 输入月薪 30,000，右侧实时显示当月到手金额
- 切换到年度汇算 Tab，看到三方案对比卡片和柱状图
- 输入年终奖 36,500，顶部出现红色陷阱警告
- 切换城市后，左侧减征政策列表更新
- 勾选"北京残疾人减征 50%"，右下角出现"已减征"提示

按 `Ctrl+C` 停止开发服务器。

- [ ] **Step 3: 运行类型检查与构建**

```bash
pnpm exec vue-tsc --noEmit
pnpm build
```

预期：均无错误，`dist/` 目录生成。

- [ ] **Step 4: 提交**

```bash
git add src/App.vue
git commit -m "feat: 应用框架（顶部栏 + Tab 切换 + 自动计算 debounce）"
```

---
<!-- TASK18_END -->

## Task 19: 端到端集成验证（核心场景）

**Files:**
- Create: `tests/e2e-scenarios.spec.ts`

通过纯函数链路覆盖典型场景，确保从输入到输出的端到端正确性。不引入浏览器测试，仅验证 `core/` 整合 `data/` 配置后的真实结果。

- [ ] **Step 1: 写入 `tests/e2e-scenarios.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeAnnualSummary } from '@/core/annual';
import { CITIES } from '@/data/cities';
import type { DeductionsInput } from '@/types';

const empty: DeductionsInput = {
  childEducation: { enabled: false, count: 0 },
  infantCare: { enabled: false, count: 0 },
  continuingEducation: { enabled: false, type: 'degree' },
  seriousIllness: { enabled: false, amount: '0' },
  housingLoan: { enabled: false },
  housingRent: { enabled: false, cityTier: 'tier1' },
  elderlyCare: { enabled: false, isOnlyChild: true, sharedAmount: '0' },
};

describe('端到端场景验证', () => {
  it('北京月薪 30000 + 1 孩 + 房贷 + 残疾人减征 50%：12 月累计预扣 ≈ 年度汇算 × 0.5', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '30000',
      annualBonus: '0',
      city: CITIES.beijing,
      housingFundRatio: 0.12,
      deductions: {
        ...empty,
        childEducation: { enabled: true, count: 1 },
        housingLoan: { enabled: true },
      },
      reliefs: ['beijing-disability'],
    });
    const sum = r.monthly.reduce((a, m) => a + parseFloat(m.monthlyTax), 0);
    expect(sum).toBeCloseTo(parseFloat(r.annualSalaryTax), 1);
  });

  it('上海月薪 50000 年终奖 200000：上海年限额 10500 应在年度内用完', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '50000',
      annualBonus: '200000',
      city: CITIES.shanghai,
      housingFundRatio: 0.07,
      deductions: empty,
      reliefs: ['shanghai-disability'],
    });
    expect(parseFloat(r.annualReliefDeducted)).toBeCloseTo(10500, 0);
  });

  it('广州月薪 40000 + 残疾人减征 90%：累计税额按 90% 减征', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '40000',
      annualBonus: '0',
      city: CITIES.guangzhou,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: ['guangdong-disability'],
    });
    const noRelief = computeAnnualSummary({
      monthlyIncome: '40000',
      annualBonus: '0',
      city: { ...CITIES.guangzhou, reliefPolicies: [] },
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: [],
    });
    const noTax = parseFloat(noRelief.annualSalaryTax);
    const withTax = parseFloat(r.annualSalaryTax);
    if (noTax * 0.9 < 90000) {
      expect(withTax).toBeCloseTo(noTax * 0.1, 1);
    } else {
      // 减征达上限 90000
      expect(noTax - withTax).toBeCloseTo(90000, 1);
    }
  });

  it('杭州月薪 20000 + 残疾人 monthly_cap 500：每月最多减 500', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '20000',
      annualBonus: '0',
      city: CITIES.hangzhou,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: ['zhejiang-disability'],
    });
    for (const m of r.monthly) {
      const taxBeforeRelief = parseFloat(m.cumulativeTaxBeforeRelief);
      const reliefTotal = parseFloat(m.cumulativeReliefDeducted);
      // 最多累计 500 × month
      expect(reliefTotal).toBeLessThanOrEqual(500 * m.month + 0.01);
      // 每月减征不超过该月应缴税
      expect(reliefTotal).toBeLessThanOrEqual(taxBeforeRelief + 0.01);
    }
  });

  it('深圳月薪 80000 + 年终奖 50000：year 终奖 36500 落入陷阱时 best 不会是 separate', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '80000',
      annualBonus: '36500',
      city: CITIES.shenzhen,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: [],
    });
    expect(r.bonusComparison.trapWarning).toBeDefined();
    expect(r.bonusComparison.best.strategy).not.toBe('separate');
  });

  it('成都年限额 12000 + 高薪 100000/月：减征达上限', () => {
    const r = computeAnnualSummary({
      monthlyIncome: '100000',
      annualBonus: '0',
      city: CITIES.chengdu,
      housingFundRatio: 0.12,
      deductions: empty,
      reliefs: ['sichuan-disability'],
    });
    expect(parseFloat(r.annualReliefDeducted)).toBeCloseTo(12000, 0);
  });
});
```

- [ ] **Step 2: 运行端到端测试**

```bash
pnpm test
```

预期：所有用例 PASS。

- [ ] **Step 3: 全量验证**

```bash
pnpm exec vue-tsc --noEmit
pnpm build
pnpm test
```

预期：类型检查、构建、测试全部通过。

- [ ] **Step 4: 提交**

```bash
git add tests/e2e-scenarios.spec.ts
git commit -m "test: 六城典型场景端到端验证"
```

---
<!-- TASK19_END -->

## Task 20: 浏览器实测与最终打磨

**Files:** （无新增文件，浏览器实测）

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

打开浏览器访问 `http://localhost:5173`。

- [ ] **Step 2: 月度预扣验收清单**

逐项检查并截图记录：

- [ ] 默认显示北京 / 月薪 20000 / 月度预扣视图
- [ ] 月薪输入框输入 30000 后，右侧"本月到手"金额随动滚动
- [ ] 12 月预扣进度表展示完整 12 行，累计应纳税所得额单调不减
- [ ] 切换到上海，社保金额变化（基数上下限不同）
- [ ] 勾选"子女教育"，输入 2，到手金额对应增加
- [ ] 同时勾选"住房贷款"和"住房租金"时，扣除区下方出现红色冲突提示

- [ ] **Step 3: 年度汇算验收清单**

- [ ] 切换到年度汇算 Tab
- [ ] 年终奖输入 60000，三方案卡片金额刷新
- [ ] 推荐方案带绿色徽章 "省 ¥XXX"
- [ ] ECharts 柱状图三柱高度对应税额，最优柱呈绿色
- [ ] 年终奖输入 36500，顶部出现红色陷阱警告，提示下调到 36000

- [ ] **Step 4: 减征政策验收清单**

- [ ] 切换城市后，减征政策列表更新
- [ ] 北京显示残疾人/孤老/烈属 3 项（50% 无限额）
- [ ] 杭州显示 3 项（每月 500）
- [ ] 勾选其中一项，下方展开"查看政策原文 ↗"链接
- [ ] 点击链接在新窗口打开政策原文
- [ ] 选中政策后，年度汇算右上角显示"已减征"金额

- [ ] **Step 5: 持久化验收**

- [ ] 改动月薪、扣除项、减征选择
- [ ] 刷新页面（Ctrl+R）
- [ ] 所有输入保留
- [ ] 切换城市后再刷新，城市选择保留

- [ ] **Step 6: 响应式验收**

- [ ] DevTools 切到 768px 宽度
- [ ] 输入区与结果区改为上下堆叠
- [ ] 三方案卡片改为单列
- [ ] 12 月进度表横向滚动可用

- [ ] **Step 7: 修复发现的问题**

如果上述任一项失败，定位问题文件、补丁并重测。每个修复一次提交。

- [ ] **Step 8: 最终全量验证**

```bash
pnpm exec vue-tsc --noEmit
pnpm test
pnpm build
```

预期：全部通过，`dist/` 生成最终产物。

- [ ] **Step 9: 提交（如有补丁）**

```bash
git add -A
git commit -m "polish: UI 验收发现的问题修复"
```

---

## 完成标准

- [ ] `pnpm test` 全部通过（核心计算层 + 端到端典型场景）
- [ ] `pnpm exec vue-tsc --noEmit` 无类型错误
- [ ] `pnpm build` 成功输出 dist
- [ ] 浏览器手动验收清单全部通过（月度/年度/减征/持久化/响应式）
- [ ] 每条减征政策能正确展示原文链接
