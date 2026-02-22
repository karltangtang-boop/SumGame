# 数字消除 (SumEliminate)

一个基于 React + Vite + Tailwind CSS 开发的数字求和消除益智游戏。

## 核心玩法
- **目标求和**：点击方块使数字总和等于屏幕上方显示的目标值。
- **消除策略**：成功凑出目标值后，选中的方块会被消除。
- **防止触顶**：如果方块堆积到屏幕顶部，游戏结束。

## 游戏模式
- **经典模式**：每次成功消除后，底部新增一行方块。
- **极速挑战**：倒计时结束前必须完成求和，否则强制新增一行。

## 技术栈
- **React 19**
- **Vite**
- **Tailwind CSS 4**
- **Framer Motion** (动画效果)
- **Canvas Confetti** (胜利特效)

## 部署到 Vercel
本项目已配置 `vercel.json`，可以直接导入 GitHub 仓库到 Vercel 进行部署。

### 本地开发
1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 构建项目：`npm run build`
