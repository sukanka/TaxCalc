# TaxCalc — 个人所得税计算器

支持北上广深杭蓉六城，覆盖月度预扣预缴、年度综合所得汇算、年终奖三方案对比与拆分优化，纳入残疾/孤老/烈属减征政策。

## 功能

- **月度预扣预缴** — 累计预扣法，展示 12 个月逐月预扣进度、到手工资
- **年度汇算** — 综合所得全年汇算，拆解工资税、年终奖税、税收优惠、总税
- **年终奖三方案对比** — 并入综合所得 / 单独计税 / 拆分优化，自动推荐最优方案，柱状图可视化差异
- **陷阱提醒** — 年终奖在 6 个"多发不如少发"区间时给出警告和建议金额
- **减征政策** — 残疾、孤老、烈属减征，6 城 3 种模式（比例 / 年限额 / 月度限额），带政策原文链接
- **专项附加扣除** — 7 项全覆盖，含互斥校验（房贷 vs 房租）
- **五险一金明细** — 逐项列出基数 × 比例 = 金额，养老和公积金比例可调，基数封顶提示
- **数据持久化** — 输入自动保存至浏览器 localStorage，刷新不丢失
- **6 城市配置** — 北京、上海、广州、深圳、杭州、成都，社保/公积金基数为 2025 年度官方数据，附来源链接

## 技术栈

Vue 3 + TypeScript + Vite + Pinia + UnoCSS + ECharts + decimal.js

## 本地开发

```bash
# 安装依赖（需要 pnpm）
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm exec vue-tsc --noEmit

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

## 部署

构建产物在 `dist/` 目录，纯静态文件，可部署到任意静态托管服务。

```bash
pnpm build
# dist/ 目录即完整站点
```

示例 — 用 nginx 托管：

```nginx
server {
    listen 80;
    server_name tax.example.com;
    root /var/www/tax-calculator/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

也可一键部署到 Vercel / Netlify / GitHub Pages，无需额外配置。

## 项目结构

```
src/
├── core/          # 纯计算层（无 Vue 依赖，Vitest 全覆盖）
├── data/cities/   # 6 城市社保/公积金/减征政策配置
├── types/         # TypeScript 类型定义
├── stores/        # Pinia 状态管理 + localStorage 持久化
├── components/    # UI 组件（输入区 / 结果展示）
└── views/         # 月度预扣 / 年度汇算双视图
tests/             # Vitest 单元测试（79 用例）
```

## 免责声明

本工具仅用于个人参考和规划，计算结果不代表实际应纳税额。实际申报以当地税务机关核定为准。
