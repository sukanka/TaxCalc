# 个人所得税计算器 · 设计文档

- **日期**：2026-05-23
- **作者**：与 Claude 协作
- **状态**：设计已通过用户审阅，等待最终确认后进入实现

## 1. 项目目标

构建一款覆盖月度预扣预缴和年度汇算的个人所得税计算器，支持北京、上海、广州、深圳、杭州、成都六个城市，纳入残疾、孤老、烈属减征等地方税收优惠政策，并提供年终奖三方案对比与拆分优化能力。仅计算工资薪金 + 全年一次性奖金，不涉及劳务报酬、稿酬、特许权使用费等其他综合所得，亦不涉及经营所得。

## 2. 范围与非目标

### 2.1 范围

- 月度工资薪金累计预扣预缴税额计算
- 年度综合所得汇算清缴（含全年一次性奖金）
- 年终奖三方案：并入综合所得 / 单独计税 / 拆分优化
- 年终奖单独计税"多发不如少发"陷阱区间检测与提示
- 七项专项附加扣除（含互斥规则校验）
- 五险一金按城市配置自动计算
- 残疾、孤老、烈属等地方减征政策
- 输入数据本地持久化（localStorage）

### 2.2 非目标

- 劳务报酬、稿酬、特许权使用费（用户明确不需要）
- 经营所得、利息股息红利、财产转让等其他所得类型
- 多用户、账号体系、云同步
- 多份方案命名保存与导出（用户选择 B 方案，无此需求）
- 涉外人士境外所得抵免
- 实时税务局申报对接

## 3. 技术栈

- **框架**：Vue 3 + Vite + TypeScript
- **状态管理**：Pinia + `pinia-plugin-persistedstate`
- **样式**：UnoCSS（按需生成，体积极小）
- **图表**：ECharts（方案对比柱状图）
- **数字精度**：decimal.js（金额全程高精度，避免浮点累积误差）
- **测试**：Vitest（核心计算层全覆盖单测）
- **包管理**：pnpm

## 4. 项目结构

```
tax-calculator/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── components/        # UI 组件（表单、结果卡片、对比图表等）
│   │   ├── input/            # SalaryInput、DeductionGroup、ReliefSelector 等
│   │   ├── result/           # MonthlyResult、AnnualComparison、BonusStrategyCards
│   │   └── shared/           # NumberInput、SwitchCard、PolicyLink 等
│   ├── views/
│   │   ├── MonthlyView.vue   # 月度预扣 Tab
│   │   └── AnnualView.vue    # 年度汇算 Tab
│   ├── stores/
│   │   ├── inputStore.ts
│   │   ├── settingsStore.ts
│   │   └── resultStore.ts
│   ├── core/                 # 纯计算层（无 Vue 依赖、可单测）
│   │   ├── tax.ts               # 综合所得算法、月度预扣、年终奖单独计税
│   │   ├── annual.ts            # 年度汇算 + 多方案优化器
│   │   ├── socialInsurance.ts   # 五险一金计算
│   │   ├── deductions.ts        # 专项附加扣除 + 互斥校验
│   │   ├── reliefs.ts           # 残疾/孤老/烈属减征
│   │   └── bonusOptimizer.ts    # 年终奖拆分最优解搜索
│   ├── data/                 # 城市/政策配置（纯数据 TS 常量）
│   │   ├── cities/
│   │   │   ├── beijing.ts
│   │   │   ├── shanghai.ts
│   │   │   ├── guangzhou.ts
│   │   │   ├── shenzhen.ts
│   │   │   ├── hangzhou.ts
│   │   │   └── chengdu.ts
│   │   ├── taxBrackets.ts       # 综合所得 + 月度预扣 + 年终奖税率表
│   │   └── reliefPolicies.ts    # 各省减征政策原始数据
│   └── types/                # 类型定义
│       ├── city.ts
│       ├── relief.ts
│       └── tax.ts
└── tests/
    └── core/                 # 计算层单元测试
        ├── tax.spec.ts
        ├── annual.spec.ts
        ├── bonusOptimizer.spec.ts
        ├── reliefs.spec.ts
        └── deductions.spec.ts
```

## 5. 核心算法

### 5.1 月度预扣预缴（综合所得累计预扣法）

```
当月累计预扣预缴税额 =
  (累计应纳税所得额 × 适用税率 − 速算扣除数) − 已预扣预缴税额

累计应纳税所得额 =
  累计收入 − 累计五险一金 − 累计专项附加扣除
  − 累计基本减除（5,000 × 月数）− 累计减征
```

适用税率从月度预扣预缴税率表（与综合所得年度税率表结构一致，按"累计应纳税所得额"分档）查得。

### 5.2 全年综合所得年度汇算

```
全年应纳税额 =
  (全年综合所得 − 60,000 − 全年五险一金 − 全年专项附加扣除 − 其他减除)
  × 适用税率 − 速算扣除数
```

汇算补退税额 = 全年应纳税额 − 已预缴税额。本计算器仅计算应纳税额本身。

### 5.3 全年一次性奖金计税方案

**方案 A：并入综合所得**
- 年终奖 + 全年工资合并按 5.2 公式计算

**方案 B：单独计税**
- 年终奖税额 = 年终奖 × `T(年终奖 ÷ 12)` 适用税率 − 该税率档速算扣除数
- 工资部分独立按综合所得算

**方案 C：拆分优化**
- 把年终奖拆为 `X` 元单独计税 + `(总额 − X)` 元并入工资
- 候选切分点（数十个）：月度税率表 6 个断点 + 年度税率表 7 个断点的全组合 + "让月薪部分恰好填满当前年度税档"的金额
- 在候选点中找总税负最低值。理论上最优解一定落在断点附近（分段线性函数），无需暴力搜索

**临界点提醒**

年终奖单独计税在以下区间出现"多发 1 元多缴几千元"的反向跳跃：

| 区间起点 (元) | 区间终点 (元) | 多发开始的临界点 |
|---|---|---|
| 36,000.01 | 38,566.67 | 36,000 |
| 144,000.01 | 160,500 | 144,000 |
| 300,000.01 | 318,333.33 | 300,000 |
| 420,000.01 | 447,500 | 420,000 |
| 660,000.01 | 706,538.46 | 660,000 |
| 960,000.01 | 1,120,000 | 960,000 |

如用户输入金额落入区间，UI 顶部显示警示：建议下调至临界点金额（如 36,000），并标注可省金额。

### 5.4 减征计算统一接口

```typescript
applyRelief(
  taxAmount: Decimal,
  policy: ReliefPolicy,
  accumulatedReduced: Decimal
): { reduced: Decimal; remainingCap: Decimal }
```

三种 mode 的实现：
- `ratio`：`reduced = min(taxAmount × ratio, annualCap − accumulated)`
- `cap`：`reduced = min(taxAmount, annualCap − accumulated)`
- `monthly_cap`：`reduced = min(taxAmount, monthlyCap)`，每月独立结算

### 5.5 精度

- 所有金额计算使用 decimal.js
- 税档边界比较使用整数分（× 100）
- 最终展示保留 2 位小数（按"四舍五入"）

## 6. 政策数据架构

### 6.1 类型定义

```typescript
interface ReliefPolicy {
  id: string;                    // 'beijing-disability'
  region: 'beijing' | 'shanghai' | 'guangdong' | 'zhejiang' | 'sichuan';
  category: 'disability' | 'elderly_alone' | 'martyr_family';
  mode: 'ratio' | 'cap' | 'monthly_cap';
  ratio?: number;                // 0.5 / 0.9
  annualCap?: number;            // 10,500 / 90,000 / 12,000
  monthlyCap?: number;           // 500
  scope: 'comprehensive' | 'salary_only';
  description: string;           // UI 简短说明
  source: { title: string; url: string; docNo?: string };
  effectiveFrom?: string;
  effectiveTo?: string;
}

interface CityConfig {
  id: 'beijing' | 'shanghai' | 'guangzhou' | 'shenzhen' | 'hangzhou' | 'chengdu';
  name: string;
  region: ReliefPolicy['region'];
  socialInsurance: SocialInsuranceConfig;
  housingFund: HousingFundConfig;
  reliefPolicies: ReliefPolicy[];
}
```

### 6.2 已收集的减征政策

| 城市 | 模式 | 比例 | 限额 | 原文链接 |
|---|---|---|---|---|
| 北京 | ratio | 50% | 待补 | [北京税务局通知](http://beijing.chinatax.gov.cn/bjswj/c105384/202207/7eb27639aea5468194ab7fd90d799043.shtml) |
| 上海 | cap | — | 10,500 元/年 | [上海税务局通知](https://shanghai.chinatax.gov.cn/zcfw/zcfgk/grsds/202601/t478928.html) |
| 广州 | ratio | 90% | 90,000 元/年 | [广东省税务局公告](https://guangdong.chinatax.gov.cn/gdsw/ssfggds/2022-03/03/content_2cae6ba9eac44d5cbf93d09a73aa890a.shtml) |
| 深圳 | ratio | 90% | 90,000 元/年 | 同广州（沿用广东省统一政策） |
| 杭州 | monthly_cap | — | 500 元/月 | [浙江税务局通知](https://zhejiang.chinatax.gov.cn/art/2023/2/8/art_25980_1144.html) |
| 成都 | cap | — | 12,000 元/年 | [四川政策链接](https://dzsgxjscyy.sczwfw.gov.cn/art/2025/2/21/art_44457_280795.html?areaCode=511771000000) |

注：北京减征上限和成都减征比例需在实现阶段访问原文核实并补全。

### 6.3 UI 联动

- 用户选择城市 → 加载该城市 `reliefPolicies` → 减征政策选择器列出可勾选项
- 勾选后下方折叠区展开 `description` + "查看政策原文 ↗"链接（新窗口打开）
- 计算引擎根据选中政策应用减征接口

## 7. 用户界面

### 7.1 整体布局

```
┌─────────────────────────────────────────────────┐
│  TaxCalc        [月度预扣] [年度汇算]    城市▾   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────┐  ┌────────────────────┐ │
│  │  输入区（左 40%） │  │  结果区（右 60%）  │ │
│  │  · 工资薪金       │  │  ¥27,860 大数字   │ │
│  │  · 五险一金       │  │  本月到手          │ │
│  │  · 专项附加扣除   │  │  扣税明细卡片      │ │
│  │  · 减征政策       │  │  方案对比图表      │ │
│  └───────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 7.2 月度预扣 Tab

- 左侧实时输入
- 右侧顶部：当月到手金额（大字）+ 当月预扣税额 + 累计已预扣
- 下方：12 个月预扣进度卡片（横向滚动），展示每月累计应纳税所得额变化和当月扣税

### 7.3 年度汇算 Tab

- 顶部：年度总收入、年度应纳税额（最优方案）大字展示
- 中部：三张方案卡片（A 并入 / B 单独 / C 拆分）并列
  - 最优方案高亮 + 徽章 "省 ¥XXXX"
  - 方案 C 显示拆分参数（"年终奖单独计税部分 ¥XXX，并入工资部分 ¥YYY"）
- 下方：ECharts 柱状图直观对比三方案税负差异
- 临界点检测：若年终奖落入陷阱区，顶部红色横幅"⚠ 您的年终奖落入陷阱区，建议下调至 ¥XXX，可省 ¥YYY"

### 7.4 减征政策模块

- 城市选择决定可见政策
- 单选/多选根据政策互斥规则（同一类别多个政策互斥，不同类别可叠加）
- 选中后展开说明 + 政策原文链接

### 7.5 专项附加扣除

- 七项分组卡片，每项一个开关
- 开启后展开金额/数量输入
- 互斥校验实时提示（住房贷款 vs 住房租金）

### 7.6 响应式

- ≥ 1024px 双栏
- < 1024px 上下堆叠
- 移动端表单和结果分两屏

### 7.7 配色（现代简约风）

- 主色：靛蓝 `#4f46e5`
- 警示：琥珀 `#f59e0b`
- 危险：红 `#dc2626`
- 成功：翠绿 `#10b981`
- 中性：石灰 `#fafaf9`（背景）/ `#1c1917`（主文本）/ `#78716c`（次文本）

### 7.8 动效

- 金额变化：0.3s 数字滚动
- 方案卡片：0.4s 高度过渡
- 整体克制，不抢戏

## 8. 状态管理

### 8.1 Pinia Stores

```
stores/
├── inputStore.ts
├── settingsStore.ts
└── resultStore.ts
```

### 8.2 inputStore 结构

金额字段在 store 中以 `string` 形式存储（便于 localStorage 序列化和精度保留），在 `core/` 计算层入口转为 `Decimal` 实例参与运算，结果再转回 `string` 写入 `resultStore`。

```typescript
{
  monthlySalary: string,            // Decimal 金额字符串
  monthlyBonus: string,
  customSocialBase: string | null,
  customHousingFundBase: string | null,
  housingFundRatio: number,
  deductions: {
    childEducation: { enabled, count },
    infantCare: { enabled, count },
    continuingEducation: { enabled, type },
    seriousIllness: { enabled, amount },
    housingLoan: { enabled },
    housingRent: { enabled },
    elderlyCare: { enabled, isOnlyChild, sharedAmount },
  },
  reliefs: string[],
  annualBonus: string,
  bonusStrategy: 'auto' | 'merge' | 'separate' | 'split',
}
```

### 8.3 数据流

```
用户输入 → inputStore (响应式)
            ↓ watch
       核心计算函数（pure，core/）
            ↓
       resultStore.computed
            ↓
       UI 组件（v-bind）
```

### 8.4 持久化

- `inputStore` + `settingsStore` 写入 localStorage
- `resultStore` 不持久化
- 计算 debounce 200ms

### 8.5 互斥校验

`deductions` 上挂 `validate()` 返回 `{valid, conflicts: string[]}`，UI 据此显示提示。

## 9. 测试策略

### 9.1 税档边界值

- 综合所得 7 档税率每档边界 ±1 元
- 月度预扣 7 档税率每档边界 ±1 元
- 年终奖单独计税 6 档税率每档边界 ±1 元

### 9.2 年终奖临界点（核心）

必测六个临界点及陷阱区间内典型值：36,000 / 144,000 / 300,000 / 420,000 / 660,000 / 960,000。

### 9.3 方案 C 拆分优化

- 年终奖恰等于月度税档断点 × 12
- 月薪已用满当前年度税档时的最优拆分
- 年终奖 < 36,000（理论上单独计税最优）
- 月薪极低或极高的极端情形

### 9.4 减征政策

- ratio：北京 50%、广东 90%
- cap：上海 10,500 年限额，分多月累计扣到上限
- monthly_cap：杭州 500/月独立结算
- 边界：减征额超过应纳税额时只能扣到 0

### 9.5 专项附加扣除互斥

- 住房贷款 + 住房租金同时开启 → 报错
- 子女教育多孩、赡养老人独生/非独生分摊正确性

### 9.6 累计预扣 12 月一致性

全年 12 个月累计预扣总和 = 同输入下年度汇算应缴税额。

### 9.7 端到端典型场景

月薪 1 万 / 3 万 / 10 万 + 年终奖 5 万 / 30 万 等组合验证整体链路。

### 9.8 精度验证

容差 ≤ 0.01 元，不允许浮点累积误差。

## 10. 实现里程碑（实现阶段拆分）

1. 项目脚手架 + UnoCSS + Pinia 配置
2. 核心计算层（`core/`）+ Vitest 单测
3. 城市/政策数据填充（含原文核实）
4. 状态管理 + 持久化
5. UI 组件（输入区 + 结果区）
6. 月度预扣视图
7. 年度汇算视图（含三方案对比 + 拆分优化器结果展示 + 临界点提醒）
8. 响应式适配 + 动效打磨
9. 端到端验证

## 11. 数据来源（核实清单）

实现阶段需从以下权威来源核实并补齐数据：

- 国家层面：国家税务总局官网、《个人所得税法》及实施条例
- 全年一次性奖金延续政策：财政部 税务总局公告 2023 年第 30 号（延续至 2027-12-31）
- 各城市社保公积金基数：当地人社局/公积金中心 2026 年度公告
- 各省减征政策原文（已收集链接见 6.2）
