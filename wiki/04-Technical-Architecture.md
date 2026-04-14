# 技术架构

## 架构概览

Cosmic Almanac 是一个纯静态单页应用。主逻辑集中在 `index.html`，内容数据集中在 `content.js`。

```text
浏览器
  -> index.html
     -> 加载 CSS 和页面结构
     -> 加载 content.js 中的 LANG 与规则内容
     -> 执行本地计算
     -> 渲染 Onboarding 或 Reading 页面
```

没有后端服务器，没有数据库，也没有运行时 API 调用。

## 主要模块

### 页面结构

`index.html` 的 HTML 部分包含：

- 背景层。
- 顶部控制栏。
- Onboarding 输入页。
- Reading 阅读页。
- 详情弹窗。

大部分文字内容由 JavaScript 根据当前语言动态填充。

### 样式系统

CSS 直接写在 `index.html` 中，负责：

- 深色和浅色主题变量。
- 背景渐变和星点。
- liquid glass 卡片。
- 响应式布局。
- 动画。
- 弹窗和卡片样式。

主题通过 `html[data-theme="dark"]` 和 `html[data-theme="light"]` 切换。

### 内容数据

`content.js` 暴露 `LANG` 数据对象，包含：

- 中英文 UI 文案。
- 星座、生肖、月相、行星日详情。
- 今日神谕和建议池。
- 分类评分短句。
- 今日宜忌规则片段。

### 状态存储

浏览器本地保存三个关键值：

```text
cosmic_bday   用户生日
cosmic_lang   语言偏好
cosmic_theme  主题偏好
```

这些值都存在 `localStorage` 中。

## 关键计算流程

### 初始化

`init()` 会：

- 应用主题。
- 应用静态语言文案。
- 读取本地生日。
- 如果已有生日，进入阅读页并渲染今日结果。
- 如果没有生日，显示生日输入页。

### 生成每日结果

`renderReading(bday, targetDate)` 是阅读页核心渲染入口。它会：

- 解析生日。
- 计算西方星座和中国生肖。
- 计算月相。
- 计算月入星座。
- 计算行星日。
- 生成 seeded RNG。
- 计算四个评分。
- 从内容池中选择今日标题、神谕、建议和评分短句。
- 更新 DOM。

### 稳定随机

`dailySeed(bday, today)` 将生日和日期组合成每日种子。`mkRng(seed)` 基于种子生成 pseudo-random 函数。

结果是：

- 同一个生日和同一天，结果稳定。
- 日期变化后，结果变化。
- 不依赖服务器或浏览器运行时随机源。

### 详情弹窗

卡片点击后通过 `getDetailPayload(type, key)` 获取对应内容，再由 `openDetail()` 打开弹窗。弹窗支持普通详情和今日宜忌的自定义 tab 内容。

## 为什么没有框架

V1 保持无框架结构，主要是为了：

- 快速部署到 GitHub Pages。
- 降低学习和维护门槛。
- 让所有逻辑透明可读。
- 避免为小型静态应用引入不必要复杂度。

如果后续应用继续增长，可以把 `index.html` 中的逻辑拆成独立模块，或迁移到 React/Vite 等结构。
