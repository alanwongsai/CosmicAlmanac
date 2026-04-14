# Cosmic Almanac

## 中文说明

Cosmic Almanac 是一个结合星座、生肖、月相与每日宜忌的双语每日神谕小应用。用户只需要输入一次生日，之后每天打开都会得到一份稳定的每日解读。结果会结合出生日期、当天日期、月相、月入星座、星期行星、个人西方星座和中国生肖生成。

项目是一个轻量级静态网页应用，适合部署在 GitHub Pages，也可以添加到 iPhone 主屏幕，当作轻量级 PWA 使用。页面结构在 `index.html`，样式与交互逻辑分别在 `app.css` 和 `app.js`，文案与规则内容拆分在 `content.en.js` 与 `content.zh.js`。

### 当前界面

阅读页从上到下包括：

- 日期和今日标题
- 两个身份标签：西方星座、中国生肖
- `今日天象 / 今日宜忌` 玻璃卡片，展示月相、月入星座、今日之日
- 四个分类评分：事业职场、感情人际、身体健康、财运偏财
- 今日神谕
- 宇宙建议

多数卡片都可以点击。点击后会打开居中的液态玻璃弹窗，显示更大的文字和更多上下文。

### 今日宜忌逻辑

`今日宜 / 今日不宜` 不是随机生成的。它由五个稳定因素共同生成：

```text
月相 × 月入星座 × 今日之日 × 西方星座 × 中国生肖
```

当前组合空间是：

```text
8 个月相 × 12 个月入星座 × 7 个今日之日 × 12 个西方星座 × 12 个生肖
= 96,768 种可能组合
```

应用没有手写 96,768 条完整文案，而是为每个因素维护一组规则，再根据当天和用户的五因素组合生成稳定的 `宜 / 不宜`。这样既能覆盖很大的组合空间，也能保持代码可维护。

这个系统参考了传统历法中按周期分类活动倾向的思路，但在产品里呈现为象征性的每日建议，不是医学、法律、金融或科学结论。

### 分类评分逻辑

四个分类评分都是 `1` 到 `5` 分。

评分会参考：

- 用户出生星座
- 当天月入星座
- 当天月相
- 星期对应的行星日
- 出生星座与当天月亮星座之间的相位关系
- 一点点基于日期的稳定微调

每个分类会根据算出的分数，从对应分数的文案池里选择一条今日信息。

### 每日内容如何保持稳定

今日神谕、宇宙建议和分类文案会使用 seeded pseudo-random generator 选择。种子来自：

```text
出生日期 + 当天日期
```

因此：

- 同一个人在同一天反复打开，会看到同一份结果。
- 第二天会刷新为新的结果。
- 不需要服务器、接口或运行时随机源。

`今日宜 / 今日不宜` 不走这个随机种子，而是由当前五因素组合直接推导。

### 天文和历法输入

应用会计算：

- 月相：基于 Julian date 算法
- 月亮平均黄经：用于估算当天月入星座
- 太阳黄经：用于辅助天文逻辑
- 西方星座：由出生月日计算
- 中国生肖：由出生年份计算
- 今日之日：由星期对应的行星日计算

注意：中国生肖目前使用公历年份循环计算。出生在一月或二月的人，如果严格按农历新年边界，可能会出现生肖差异。

### 设计系统

界面使用统一的 liquid glass 设计语言：

- 毛玻璃卡片
- 柔和内高光
- 香槟金强调色
- 居中弹窗
- 白天 / 夜晚模式
- 紧凑的今日天象卡片
- 英文模式使用更像书籍印刷的衬线字体
- 中文模式使用更清晰的系统中文字体

### 语言和主题

应用支持：

- 简体中文
- English

语言和主题都可以随时切换，并保存在本地浏览器中。

### 隐私

所有逻辑都在浏览器本地运行。

保存到 `localStorage` 的内容只有：

- `cosmic_bday`：用户生日
- `cosmic_lang`：语言偏好
- `cosmic_theme`：白天 / 夜晚模式偏好

应用使用 Cloudflare Web Analytics 记录匿名访问统计，用于了解页面访问量、访客趋势、来源和设备类型等基础信息。

没有自定义后端。生日、语言偏好、主题偏好和生成的每日解读内容不会由本应用发送给 Cloudflare。

发布到不同渠道时，可以使用不同入口页区分来源：

- Instagram：`https://alanwongsai.github.io/CosmicAlmanac/instagram.html`
- 微信：`https://alanwongsai.github.io/CosmicAlmanac/wechat.html`
- 特殊分享：`https://alanwongsai.github.io/CosmicAlmanac/meltcado.html`
- 自己测试：`https://alanwongsai.github.io/CosmicAlmanac/owner.html`

对应的二维码海报文件：

- Instagram：`share-card-instagram.html`
- 微信：`share-card-wechat.html`
- 特殊分享：`share-card-meltcado.html`

`owner.html` 会在当前浏览器写入 `cosmic_analytics_opt_out=1`，之后这个浏览器打开主应用时不会加载 Cloudflare Web Analytics。

### 部署到 GitHub Pages

需要提交这些文件：

```text
index.html
app.css
app.js
content.en.js
content.zh.js
sw.js
cosmic-daily-icon.png
cosmic-daily-icon-192.png
manifest.json
README.md
CONTENT_DATABASE_REPORT.md
```

然后在 GitHub 仓库中：

1. 打开 **Settings**。
2. 进入 **Pages**。
3. 选择主分支和根目录。
4. 保存。

应用地址会类似：

```text
https://yourusername.github.io/yourrepo/
```

### 添加到 iPhone 主屏幕

1. 用 Safari 打开应用地址。
2. 点击分享按钮。
3. 选择 **Add to Home Screen**。
4. 点击 **Add**。

之后应用会像原生应用一样全屏打开。

### 文件结构

```text
index.html                  主页面结构与资源入口
app.css                     视觉样式与主题系统
app.js                      交互逻辑与计算逻辑
content.en.js               英文文案、详情说明和宜忌规则
content.zh.js               中文文案、详情说明和宜忌规则
sw.js                       Service Worker 离线缓存脚本
cosmic-daily-icon.png       512 x 512 应用图标
cosmic-daily-icon-192.png   192 x 192 PWA 图标
manifest.json               PWA 配置文件
README.md                   项目文档
CONTENT_DATABASE_REPORT.md  内容库规模和组合逻辑报告
```

### 当前限制

- 月入星座使用月亮平均黄经估算，适合轻量每日应用，不等同于专业星历表。
- 中国生肖按公历年份计算，没有严格处理农历新年边界。
- 今日宜忌是象征性和文化性的每日建议，不构成医学、法律、金融或科学建议。
- 项目刻意保持无构建工具结构，所以可以直接部署为静态文件。

---

## English

Cosmic Almanac is a bilingual daily oracle web app blending zodiac signs, moon phase, weekday ruler, and personal daily guidance. Enter your birthday once, then open the app each day for a stable daily reading. The result combines your birth date, the current date, moon phase, moon-in-sign, weekday ruler, Western zodiac sign, and Chinese zodiac animal.

The project is a lightweight static web app designed for GitHub Pages. The page structure lives in `index.html`, styles and interactions are in `app.css` and `app.js`, and bilingual copy/rules are split into `content.en.js` and `content.zh.js`. It can also be added to an iPhone home screen as a lightweight PWA.

### Current Experience

The reading screen is organized as:

- Date and daily title
- Two identity badges: Western zodiac sign and Chinese zodiac year
- `Daily Almanac / 今日天象` glass card showing moon phase, moon-in-sign, and weekday ruler
- Four category ratings: Work & Career, Love & Social, Health & Body, and Finance & Luck
- Today's Oracle
- Cosmic Suggestion

Most cards are interactive. Tapping a card opens a centered liquid-glass popup with larger text and more context.

### Daily Almanac Logic

The `Today's Do / Avoid` result is not random. It is generated from five deterministic factors:

```text
moon phase × moon sign × weekday ruler × Western zodiac × Chinese zodiac
```

The current combination space is:

```text
8 moon phases × 12 moon signs × 7 weekday rulers × 12 Western signs × 12 Chinese zodiac animals
= 96,768 possible combinations
```

The app does not store 96,768 hand-written entries. Instead, each factor has its own rule set, and the current day's five-factor profile is combined into a stable recommendation. This keeps the app maintainable while still making the result depend on the real date and the user's birth profile.

The system is inspired by calendar and almanac-style activity guidance, but it is presented as symbolic daily guidance, not as medical, legal, financial, or scientific advice.

### Category Rating Logic

The four category ratings are scored from `1` to `5`.

Ratings are influenced by:

- User birth sign
- Current moon sign
- Current moon phase
- Weekday ruler
- Aspect between the user's birth sign and the current moon sign
- A small deterministic date-based variation

Each category score selects one message from the corresponding score pool.

### Deterministic Daily Content

The oracle, suggestion, and category messages use a seeded pseudo-random generator. The seed is based on:

```text
birth date + current calendar date
```

This means:

- The same person gets the same result throughout the same day.
- The result changes the next day.
- No server, API, or runtime random source is required.

The almanac `Do / Avoid` logic is separate from the seeded message selection. It is derived directly from the current five-factor almanac profile.

### Astronomy And Calendar Inputs

The app calculates:

- Moon phase using Julian date arithmetic
- Moon mean longitude to estimate the current moon sign
- Sun longitude for helper astronomy logic
- Western zodiac sign from birth month and day
- Chinese zodiac animal from birth year
- Weekday ruler from the current weekday

Note: the Chinese zodiac currently uses a simple Gregorian birth-year cycle. Birth dates in January or February may differ from a strict Chinese New Year based calculation.

### Design System

The interface uses a unified liquid-glass design language:

- Frosted glass cards
- Soft inner highlights
- Champagne-gold accents
- Centered popups
- Day and night modes
- Compact daily almanac card
- Serif typography in English mode
- Clean system Chinese typography in Chinese mode

### Language And Theme

The app supports:

- English
- Simplified Chinese

Language and theme can be switched at any time and are saved locally in the browser.

### Privacy

Everything runs locally in the browser.

Only these values are stored in `localStorage`:

- `cosmic_bday`: user's birthday
- `cosmic_lang`: language preference
- `cosmic_theme`: day/night theme preference

The app uses Cloudflare Web Analytics for anonymous visit statistics, including page views, visitor trends, referrers, and device types.

There is no custom backend. The birthday, language preference, theme preference, and generated daily reading content are not sent to Cloudflare by this app.

Use separate entry pages when publishing to different channels:

- Instagram: `https://alanwongsai.github.io/CosmicAlmanac/instagram.html`
- WeChat: `https://alanwongsai.github.io/CosmicAlmanac/wechat.html`
- Special sharing: `https://alanwongsai.github.io/CosmicAlmanac/meltcado.html`
- Owner testing: `https://alanwongsai.github.io/CosmicAlmanac/owner.html`

Matching QR poster files:

- Instagram: `share-card-instagram.html`
- WeChat: `share-card-wechat.html`
- Special sharing: `share-card-meltcado.html`

`owner.html` stores `cosmic_analytics_opt_out=1` in the current browser, so future main-app visits from that browser will not load Cloudflare Web Analytics.

### Hosting On GitHub Pages

Push these files to your GitHub repository:

```text
index.html
app.css
app.js
content.en.js
content.zh.js
sw.js
cosmic-daily-icon.png
cosmic-daily-icon-192.png
manifest.json
README.md
CONTENT_DATABASE_REPORT.md
```

Then enable GitHub Pages:

1. Open repository **Settings**.
2. Open **Pages**.
3. Select the main branch and root folder.
4. Save.

The app will be available at:

```text
https://yourusername.github.io/yourrepo/
```

### Add To iPhone Home Screen

1. Open the app URL in Safari.
2. Tap the Share button.
3. Tap **Add to Home Screen**.
4. Tap **Add**.

The app will open full-screen like a native app.

### File Structure

```text
index.html                  Page structure and resource entrypoint
app.css                     Visual styles and theme system
app.js                      Interaction and computation logic
content.en.js               English copy, details, and almanac rules
content.zh.js               Chinese copy, details, and almanac rules
sw.js                       Service Worker script for offline caching
cosmic-daily-icon.png       512 x 512 app icon
cosmic-daily-icon-192.png   192 x 192 PWA icon
manifest.json               PWA manifest
README.md                   Project documentation
CONTENT_DATABASE_REPORT.md  Content scale and combination logic report
```

### Current Limitations

- Moon sign calculation uses approximate mean longitude, suitable for a lightweight daily app but not a professional ephemeris.
- Chinese zodiac is based on Gregorian birth year and does not strictly handle Chinese New Year boundaries.
- Almanac guidance is symbolic and cultural daily guidance, not medical, legal, financial, or scientific advice.
- The project intentionally stays build-free, so it can be deployed directly as static files.
