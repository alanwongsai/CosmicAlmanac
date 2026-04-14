# Cosmic Daily 项目代码学习笔记

这份笔记面向刚开始学习 coding 的读者。项目本身是一个很适合入门分析的单页网页应用：没有后端、没有构建工具、没有依赖安装。主界面和交互逻辑在 `index.html` 里，双语文案和规则内容在 `content.js` 里。

项目作用：用户输入生日后，网页会根据生日和当天日期生成一份每日星象解读，包括西方星座、中国生肖、月相、月入星座、今日宜忌、四类评分、今日神谕和建议。

## 1. 项目文件结构

```text
index.html
content.js
README.md
CONTENT_DATABASE_REPORT.md
manifest.json
cosmic-daily-icon.png
cosmic-daily-icon-192.png
```

### `index.html`

这是主程序文件，包含三类代码：

1. HTML：页面结构，比如按钮、输入框、阅读页、弹窗。
2. CSS：视觉样式，比如深色/浅色主题、毛玻璃卡片、布局、动画。
3. JavaScript：计算逻辑、状态保存、页面渲染、交互事件。

这个项目刻意保持无构建工具结构，所以打开 `index.html` 就能看到页面和主逻辑如何工作。

### `content.js`

这是内容文件，包含双语界面文案、星座/生肖详情、今日宜忌规则、每日神谕和建议文案池。

把内容从 `index.html` 里拆出来后，后续新增文案、扩展语言或调整规则时，不需要在主页面结构和交互逻辑中来回查找。

### `README.md`

这是给用户和开发者看的说明文档。它解释了应用是什么、如何部署到 GitHub Pages、如何添加到 iPhone 主屏幕、每日内容如何保持稳定，以及当前限制。

`README.md` 不参与程序运行。浏览器打开网页时不会自动读取它。它的作用是帮助人理解项目。

### `CONTENT_DATABASE_REPORT.md`

这是内容库规模报告。它记录当前有多少星座、生肖、月相、宜忌组合、评分短句和弹窗扩展模板，方便后续判断内容是否足够丰富。

### `manifest.json`

这是 PWA 配置文件。PWA 可以理解为“能像 App 一样安装到主屏幕的网页”。

它里面定义了：

```json
{
  "name": "Cosmic Daily",
  "short_name": "Cosmic Daily",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#09080b",
  "theme_color": "#09080b",
  "orientation": "portrait",
  "icons": [...]
}
```

重点字段：

- `name` / `short_name`：安装后显示的应用名称。
- `start_url`：打开应用时加载哪个页面，这里是 `index.html`。
- `display: "standalone"`：让网页以接近原生 App 的方式打开，减少浏览器 UI。
- `background_color` / `theme_color`：启动和系统栏颜色。
- `orientation: "portrait"`：偏向竖屏体验。
- `icons`：告诉系统使用哪些图标文件。

### 图标文件

`cosmic-daily-icon.png` 和 `cosmic-daily-icon-192.png` 是应用图标。它们被两个地方使用：

1. `index.html` 的 `<link rel="apple-touch-icon">`。
2. `manifest.json` 的 `icons` 数组。

这些图片不包含程序逻辑，只负责安装到主屏幕、浏览器识别应用时的视觉展示。

## 2. `index.html` 总体结构

`index.html` 大致分成四段：

```html
<!DOCTYPE html>
<html>
<head>
  元信息、PWA 链接、标题、CSS
</head>
<body>
  页面 HTML 结构
  <script>
    JavaScript 数据和逻辑
  </script>
</body>
</html>
```

浏览器加载它时的顺序是：

1. 读取 HTML。
2. 读取 `<head>` 里的元信息和 CSS。
3. 创建 `<body>` 里的页面元素。
4. 执行 `<script>` 里的 JavaScript。
5. JavaScript 根据本地保存的生日决定显示“输入生日页”还是“每日解读页”。

## 3. HTML 部分：页面骨架

HTML 的作用是定义页面上有哪些东西。这个项目的 HTML 主体不复杂，真正的内容多数由 JavaScript 动态填进去。

### 3.1 背景层

```html
<div class="bg" aria-hidden="true">
  <div class="bg-depth"></div>
  <div class="bg-stars"></div>
</div>
```

这部分负责背景视觉。

- `.bg` 是固定在整个屏幕上的背景容器。
- `.bg-depth` 画出深色或浅色的渐变背景。
- `.bg-stars` 画出星点。
- `aria-hidden="true"` 表示这只是装饰，不需要被屏幕阅读器朗读。

为什么这样写：背景和主要内容分开，可以让页面内容保持清晰，CSS 也更容易控制层级。

### 3.2 主题和语言按钮

```html
<button class="theme-btn" id="theme-btn" onclick="toggleTheme()">☀️</button>
<button class="lang-btn" id="lang-btn" onclick="toggleLang()">中文</button>
```

这两个按钮用于全局设置：

- `theme-btn`：切换白天/夜晚主题。
- `lang-btn`：切换英文/中文。
- `onclick="toggleTheme()"` 和 `onclick="toggleLang()"` 表示点击按钮时调用对应 JavaScript 函数。

这些按钮和 JavaScript 的关系：

- 点击主题按钮会调用 `toggleTheme()`。
- 点击语言按钮会调用 `toggleLang()`。
- 函数会更新页面文字、保存偏好，并重新渲染当前解读。

### 3.3 Onboarding：第一次输入生日页面

```html
<div id="onboarding" class="screen hidden">
  ...
  <input type="date" id="bday-input" class="date-input"/>
  <button class="btn-reveal" id="ob-btn" onclick="startReading()"></button>
</div>
```

这是用户第一次打开时看到的页面。

重要元素：

- `id="onboarding"`：JavaScript 用这个 id 找到整个输入页。
- `class="screen hidden"`：`screen` 是页面布局类，`hidden` 表示默认隐藏。
- `id="bday-input"`：生日输入框。
- `onclick="startReading()"`：点击按钮后开始生成阅读结果。

为什么很多文字元素是空的，比如：

```html
<h1 class="app-title" id="ob-title"></h1>
```

因为项目支持中英文。页面初始不直接写死文字，而是让 JavaScript 根据当前语言填充。这样切换语言时不用准备两套 HTML。

### 3.4 Reading：每日解读页面

```html
<div id="reading" class="screen hidden">
  <div class="r-header">
    <div class="r-date" id="r-date"></div>
    <div class="r-title" id="r-title"></div>
    <div class="signs-row" id="r-signs"></div>
  </div>

  <div class="glass almanac-summary interactive-card" id="almanac-summary"></div>
  <div class="cat-grid" id="cat-grid"></div>
  ...
</div>
```

这是生日输入后显示的主页面。

主要区域：

- `r-date`：当天日期。
- `r-title`：今日标题，从文案池中选出。
- `r-signs`：西方星座和中国生肖标签。
- `almanac-summary`：今日天象/宜忌卡片。
- `cat-grid`：四类评分卡片，包含事业、感情、健康、财运。
- `oracle-card`：今日神谕。
- `suggestion-card`：宇宙建议。
- `btn-reset`：修改生日。

这里很多容器一开始是空的，原因是结果必须根据生日和日期计算后才能生成。

### 3.5 Detail Modal：详情弹窗

```html
<div class="detail-modal" id="detail-modal" aria-hidden="true">
  <div class="glass detail-sheet" role="dialog" aria-modal="true">
    <button class="detail-close" id="detail-close" onclick="closeDetail()">✕</button>
    <div class="detail-kicker" id="detail-kicker"></div>
    <div class="detail-title" id="detail-title"></div>
    <div class="detail-sub" id="detail-sub"></div>
    <div class="detail-facts" id="detail-facts"></div>
    <div class="detail-custom" id="detail-custom"></div>
    <div class="detail-copy" id="detail-copy"></div>
  </div>
</div>
```

详情弹窗用于点击卡片后显示更多解释。

它没有为每种卡片单独写一个弹窗，而是使用一个通用弹窗，然后由 JavaScript 填入不同内容。

这样写的好处：

- 代码更少。
- 弹窗样式统一。
- 新增详情类型时，只需要新增构造数据的函数。

## 4. CSS 部分：样式、主题和布局

CSS 的作用是控制页面长什么样。

这个项目的 CSS 在 `<style>` 标签里，主要分为这些模块。

### 4.1 全局重置

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

这是常见的 CSS 重置写法。

- `margin: 0` 和 `padding: 0` 清掉浏览器默认间距。
- `box-sizing: border-box` 让宽高计算更直观：元素的宽度包含内容、内边距和边框。

为什么这样写：不同浏览器默认样式可能不同，先统一基础样式，后面布局更稳定。

### 4.2 CSS 变量

```css
:root {
  --bg: #09080b;
  --gold: #c4a55a;
  --t1: rgba(255,252,248,0.93);
  --glass-panel: ...;
}
```

CSS 变量以 `--` 开头。后面可以通过 `var(--bg)` 使用。

这个项目把颜色、阴影、玻璃效果等都放进变量里。

好处：

- 深色和浅色主题可以共用一套组件样式。
- 修改主题只需要改变量，不需要到处改颜色。
- 代码更有组织。

### 4.3 深色/浅色主题

```css
html[data-theme="light"] {
  --bg: #f5f0e8;
  --gold: #a8821e;
  --t1: rgba(20,12,4,0.88);
}
```

JavaScript 会修改 `<html>` 上的 `data-theme`：

```html
<html data-theme="dark">
```

当它变成：

```html
<html data-theme="light">
```

CSS 里 `html[data-theme="light"]` 的规则就会生效。

这就是主题切换的核心配合方式：

1. JavaScript 改 HTML 属性。
2. CSS 根据属性切换变量。
3. 整个页面自动换颜色。

### 4.4 字体语言适配

```css
html[lang^="en"] {
  --font-ui: "Iowan Old Style", ...;
}

html[lang^="zh"] {
  --font-ui: -apple-system, "PingFang SC", ...;
}
```

英文和中文适合不同字体。JavaScript 会设置：

```js
document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
```

CSS 再根据 `lang` 属性选择字体。

为什么这样写：英文可以使用更有“书籍感”的衬线字体，中文则使用系统中文字体，阅读更清楚。

### 4.5 布局类

```css
.screen {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.screen.hidden {
  display: none;
}
```

`.screen` 是“一个完整页面”的通用布局。

项目里有两个 screen：

- `onboarding`
- `reading`

JavaScript 用 `hidden` 类控制显示哪一个。

### 4.6 玻璃卡片

```css
.glass {
  background: var(--glass-panel);
  backdrop-filter: blur(30px);
  border: 1px solid var(--glass-border);
  border-radius: 26px;
}

.card {
  background: var(--glass-panel-soft);
  backdrop-filter: blur(20px);
}
```

这就是项目的 “liquid glass” 风格基础。

- `background` 使用半透明渐变。
- `backdrop-filter: blur(...)` 让背后的内容模糊。
- `border` 和 `box-shadow` 增强玻璃边缘和层次。

`.glass` 用于更重要的大卡片，`.card` 用于较轻的普通卡片。

### 4.7 互动卡片和弹窗

```css
.interactive-card {
  cursor: pointer;
  transition: transform .22s ease;
}

.interactive-card:hover {
  transform: translateY(-2px);
}
```

这让卡片在鼠标悬停时轻微上浮，提示用户“可以点”。

弹窗相关样式：

```css
.detail-modal {
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.detail-modal.open {
  opacity: 1;
  pointer-events: auto;
}
```

默认弹窗透明且不能点击。JavaScript 给它加上 `.open` 后，它才显示并响应点击。

### 4.8 响应式设计

```css
@media (max-width: 560px) {
  .detail-title { font-size: 25px; }
}
```

`@media` 是媒体查询，用于适配不同屏幕宽度。

这个项目主要面向手机，所以对弹窗、网格、文字大小做了窄屏处理。

## 5. JavaScript 数据部分

JavaScript 是这个项目的核心。它负责：

- 存储中英文文案。
- 计算星座、生肖、月相、评分。
- 根据状态渲染 HTML。
- 处理点击、键盘、弹窗、语言、主题。

### 5.1 `LANG`：主要文案数据库

```js
const LANG = {
  en: { ... },
  zh: { ... }
};
```

`LANG` 包含英文和中文两套主文案。

每种语言里有：

- 应用标题、按钮文字、提示文字。
- 日期、星期、月份、星座、生肖、月相名称。
- 四类评分名称：work、love、health、finance。
- 每个评分 1 到 5 对应的一组文案。
- `oracles`：今日神谕文案池。
- `suggestions`：今日建议文案池。

它的结构可以理解为：

```js
LANG[当前语言][文案类型]
```

例如：

```js
LANG.en.appTitle
LANG.zh.work.name
LANG[lang].oracles
```

为什么这样写：界面不直接写死文字，而是从数据对象里读取。这样支持双语会容易很多。

### 5.2 `DETAILS`：弹窗详情数据库

```js
const DETAILS = {
  en: { ... },
  zh: { ... }
};
```

`DETAILS` 专门给弹窗使用。

里面包含：

- `labels`：弹窗上方的小标题。
- `western`：12 个西方星座详情。
- `chinese`：12 个中国生肖详情。
- `phases`：8 个月相详情。
- `planetDays`：7 个星期行星详情。
- `aspects`：相位关系详情。

它和 `LANG` 的区别：

- `LANG` 更偏页面主内容和每日文案。
- `DETAILS` 更偏点击后展开的解释内容。

### 5.3 `ALMANAC_ZH` 和 `ALMANAC_EN`：今日宜忌规则

```js
const ALMANAC_ZH = { phase: [...], sign: [...], day: [...], west: [...], chinese: [...] };
const ALMANAC_EN = { phase: [...], sign: [...], day: [...], west: [...], chinese: [...] };
```

这两个对象用于生成“今日宜 / 今日不宜”。

它没有直接写出所有组合，而是把规则拆成五类：

1. `phase`：月相。
2. `sign`：月入星座。
3. `day`：今日之日，比如太阳日、月亮日。
4. `west`：用户的西方星座。
5. `chinese`：用户的中国生肖。

最后通过 `buildAlmanacAdvice()` 把这五类信息拼成一句完整建议。

为什么这样写：如果手写所有组合会非常多。拆成规则后，数据更少，也更容易维护。

### 5.4 Emoji 和分类数组

```js
const WEST_EMOJI = ["♑", "♒", ...];
const CHI_EMOJI = ["🐀", "🐂", ...];
const MOON_EMOJI = ["🌑", "🌒", ...];
const CAT_KEYS = ["work", "love", "health", "finance"];
const CAT_ICONS = ["💼", "💕", "🌿", "💰"];
```

这些数组负责把计算出的索引变成图标。

例如：

- `westIdx()` 算出用户是第几个西方星座。
- `WEST_EMOJI[wi]` 就能拿到对应符号。
- `LANG[lang].westNames[wi]` 就能拿到对应名称。

这种“索引配套数组”的写法在前端项目里很常见。

## 6. JavaScript 计算函数

### 6.1 `julianDay(date)`

```js
function julianDay(date) { ... }
```

作用：把普通日期转换成 Julian Day，也就是天文学里常用的一种连续日期数字。

为什么需要它：后面计算月亮和太阳位置时，用连续天数比用年月日更方便。

### 6.2 `moonMeanLongitude(date)`

```js
function moonMeanLongitude(date) { ... }
```

作用：估算月亮当天的平均黄经，结果是 0 到 360 度。

项目用它判断“月亮今天大概在哪个星座区间”：

```js
const moonSignIdx = Math.floor(moonLon / 30) % 12;
```

因为 360 度分成 12 个星座，每个星座 30 度。

### 6.3 `sunLongitude(date)`

```js
function sunLongitude(date) { ... }
```

作用：计算太阳视黄经。当前代码里这个函数被保留为天文工具，但主流程中没有明显使用它来渲染页面。

这在项目中也很常见：有些工具函数可能是为后续功能准备的，或者以前逻辑用过后来留下了。

### 6.4 `getAspect(s1, s2)`

```js
function getAspect(s1, s2) {
  const diff = Math.abs(s1 - s2);
  const angle = Math.min(diff, 12 - diff) * 30;
  ...
}
```

作用：计算两个星座位置之间的相位关系。

返回值可能是：

- `conjunction`：合相。
- `trine`：三分相。
- `sextile`：六分相。
- `square`：四分相。
- `opposition`：对冲。
- `neutral`：无强相位。

它会影响四类评分。比如三分相和六分相会加分，四分相和对冲会减分。

### 6.5 `westIdx(m, d)`

```js
function westIdx(m, d) { ... }
```

作用：根据出生月日计算西方星座。

输入：

- `m`：月份。
- `d`：日期。

输出：0 到 11 的索引。

注意：这里的顺序是：

```text
摩羯、水瓶、双鱼、白羊、金牛、双子、巨蟹、狮子、处女、天秤、天蝎、射手
```

这个顺序和 `WEST_EMOJI`、`LANG.en.westNames`、`LANG.zh.westNames` 对应。

### 6.6 `chiIdx(y)`

```js
function chiIdx(y) {
  return ((y - 1900) % 12 + 12) % 12;
}
```

作用：根据出生年份计算中国生肖索引。

它用 1900 年作为参考点，每 12 年循环一次。

注意：它按公历年份计算，没有处理农历新年的边界。所以一月或二月出生的人，严格按农历可能会有差异。

### 6.7 `moonIdx(date)`

```js
function moonIdx(date) { ... }
```

作用：根据日期估算当天月相。

它把月相分成 8 类：

```text
新月、眉月、上弦月、盈凸月、满月、亏凸月、下弦月、残月
```

返回值是 0 到 7，然后用于：

- 显示月相名称。
- 显示月相 emoji。
- 影响健康评分。
- 生成今日宜忌。

## 7. 随机但稳定：每日内容如何固定

这个项目的一个重要设计是：它看起来有随机性，但同一个人在同一天看到的内容是稳定的。

### 7.1 `dailySeed(bday, today)`

```js
function dailySeed(bday, today) { ... }
```

作用：把生日和当天日期混合成一个数字种子。

也就是说：

```text
同一个生日 + 同一天 = 同一个种子
同一个生日 + 第二天 = 新种子
不同生日 + 同一天 = 不同种子
```

### 7.2 `mkRng(seed)`

```js
function mkRng(seed) {
  let s = seed | 0;
  return () => { ... };
}
```

作用：根据种子创建一个伪随机函数。

普通的 `Math.random()` 每次刷新都可能不同，而这个函数只要种子相同，输出顺序就相同。

这就是“每日稳定”的关键。

### 7.3 `pick(arr, rng)`

```js
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}
```

作用：从数组中选一项。

它不使用 `Math.random()`，而是使用传进来的 `rng`，所以选择结果也是稳定的。

## 8. 四类评分：`calcRatings`

```js
function calcRatings(bdayStr, todayDate, rng) { ... }
```

这是项目最重要的计算函数之一。

它计算四个评分：

- `work`：事业职场。
- `love`：感情人际。
- `health`：身体健康。
- `finance`：财运偏财。

### 8.1 输入

```js
calcRatings(bday, today, rng)
```

输入包含：

- 用户生日。
- 今天日期。
- 稳定随机函数。

### 8.2 内部先计算基础因素

函数会先算：

```js
const bWI = westIdx(...);
const birthLon = (bWI - 3 + 12) % 12;
const moonLon = moonMeanLongitude(todayDate);
const moonSignIdx = Math.floor(moonLon / 30) % 12;
const mi = moonIdx(todayDate);
const dow = todayDate.getDay();
const asp = getAspect(birthLon, moonSignIdx);
```

这些变量的意思：

- `bWI`：出生西方星座索引。
- `birthLon`：把出生星座转换成黄道顺序，方便算角度。
- `moonSignIdx`：今天月亮所在星座。
- `mi`：今天月相。
- `dow`：星期几，0 是星期日，6 是星期六。
- `asp`：出生星座和今天月亮星座的相位关系。

### 8.3 每个评分从 3 分开始

例如事业：

```js
let work = 3.0;
```

然后根据不同因素加减：

- 星期三水星日加事业分。
- 星期日太阳日加一点事业分。
- 星期一月亮日降低事业分。
- 月亮火象加一点事业分。
- 好相位加分，紧张相位减分。
- 最后加一点稳定的微小随机变化。

其他分类也类似：

- 感情更受金星日、满月、水象影响。
- 健康更受月相和太阳日/土星日影响。
- 财运更受木星日、水星日、月亮盈亏、土象影响。

### 8.4 最后限制在 1 到 5

```js
const clamp = v => Math.max(1, Math.min(5, Math.round(v)));
```

这行保证分数不会小于 1，也不会大于 5。

返回结果：

```js
return {
  work,
  love,
  health,
  finance,
  moonSignIdx,
  asp
};
```

除了评分，还返回月入星座和相位，因为后面渲染详情需要它们。

## 9. 工具函数

### 9.1 `dots(n)`

```js
function dots(n) {
  let h = '<div class="dots">';
  for (let i = 1; i <= 5; i++) {
    h += `<div class="dot${i <= n ? ' on' : ''}"></div>`;
  }
  return h + '</div>';
}
```

作用：根据评分生成 5 个小圆点。

如果评分是 3，就有前三个圆点带 `on` 类。

这是一种常见做法：JavaScript 生成 HTML 字符串，然后放进页面。

### 9.2 `$` 和 `tx`

```js
function $(id) {
  return document.getElementById(id);
}

function tx(id, v) {
  $(id).textContent = v;
}
```

这两个是简化写法。

原本写：

```js
document.getElementById('r-title').textContent = title;
```

现在可以写：

```js
tx('r-title', title);
```

这让代码短一些。

### 9.3 `escapeHtml(v)`

```js
function escapeHtml(v) { ... }
```

作用：把特殊字符转义，避免把文本误当成 HTML 执行。

例如 `<` 会变成 `&lt;`。

为什么重要：如果把不可信文本直接放进 `innerHTML`，可能造成安全问题。这个项目在拼接宜忌文本时使用它，是一个好习惯。

## 10. 主题和语言状态

### 10.1 主题状态

```js
let theme = localStorage.getItem('cosmic_theme')
  || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
```

这行的逻辑是：

1. 先看浏览器本地有没有保存过主题。
2. 如果没有，就读取系统偏好。
3. 系统偏好浅色则用 `light`，否则用 `dark`。

### 10.2 `applyTheme(t)`

```js
function applyTheme(t) {
  theme = t;
  document.documentElement.dataset.theme = t;
  $('theme-btn').textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('cosmic_theme', t);
}
```

作用：

- 更新当前主题变量。
- 修改 `<html data-theme="...">`，触发 CSS 主题。
- 修改按钮图标。
- 保存到 `localStorage`。

### 10.3 语言状态

```js
let lang = localStorage.getItem('cosmic_lang') || 'en';
```

逻辑类似主题：

- 如果以前选过语言，就使用保存的语言。
- 否则默认英文。

### 10.4 `applyStaticLang()`

```js
function applyStaticLang() {
  const L = LANG[lang];
  $('lang-btn').textContent = L.langToggle;
  tx('ob-title', L.appTitle);
  ...
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
}
```

作用：把不会随每日计算变化的文字填进页面。

比如：

- 首页标题。
- 输入框说明。
- 按钮文字。
- 关闭按钮的无障碍标签。
- HTML 的语言属性。

为什么叫 static：这些文字只和语言有关，不和生日或日期有关。

## 11. 页面状态和本地保存

这个项目没有服务器。它用浏览器的 `localStorage` 保存少量状态。

保存的 key：

```text
cosmic_theme
cosmic_lang
cosmic_bday
```

含义：

- `cosmic_theme`：用户选择的主题。
- `cosmic_lang`：用户选择的语言。
- `cosmic_bday`：用户输入的生日。

### 11.1 `startReading()`

```js
function startReading() {
  const v = $('bday-input').value;
  if (!v) { ... return; }
  localStorage.setItem('cosmic_bday', v);
  show('reading');
  renderReading(v);
}
```

作用：

1. 读取生日输入框。
2. 如果没填，就提示输入框。
3. 保存生日。
4. 切换到解读页。
5. 调用 `renderReading()` 生成页面内容。

### 11.2 `resetBday()`

```js
function resetBday() {
  if (!confirm(L.resetMsg)) return;
  localStorage.removeItem('cosmic_bday');
  show('onboarding');
}
```

作用：让用户重新输入生日。

它会删除本地保存的生日，然后回到输入页。

### 11.3 `show(id)`

```js
function show(id) {
  ['onboarding', 'reading'].forEach(s => $(s).classList.add('hidden'));
  $(id).classList.remove('hidden');
}
```

作用：控制显示哪个页面。

它先把所有页面隐藏，再显示指定页面。

这是一种简单的单页应用切屏方式。

## 12. 详情弹窗逻辑

### 12.1 弹窗内容格式

弹窗使用一种统一的数据格式：

```js
{
  kicker: "...",
  title: "...",
  subtitle: "...",
  facts: [...],
  paragraphs: [...],
  custom: ...
}
```

不同卡片点击后，只要返回这种格式，弹窗就能显示。

### 12.2 `applyDetail(payload)`

```js
function applyDetail(payload) {
  setBlockText('detail-kicker', payload.kicker);
  setBlockText('detail-title', payload.title);
  ...
}
```

作用：把详情数据填入弹窗 DOM。

它会处理：

- 小标题。
- 主标题。
- 副标题。
- facts 小标签。
- 正文段落。
- 特殊的 almanac 自定义内容。

### 12.3 `openDetail()` 和 `closeDetail()`

```js
function openDetail(payload) {
  applyDetail(payload);
  $('detail-modal').classList.add('open');
  document.body.classList.add('modal-open');
}
```

打开弹窗时：

- 填内容。
- 给弹窗加 `.open` 类。
- 禁止背景滚动。
- 把焦点移动到关闭按钮。

关闭弹窗时：

- 移除 `.open`。
- 恢复背景滚动。
- 把焦点还给刚才点击的卡片。

这说明作者考虑了键盘操作和无障碍体验。

### 12.4 多种详情构造函数

项目为不同类型写了不同的构造函数：

```js
buildWesternDetail(idx)
buildChineseDetail(idx)
buildMoonPhaseDetail(idx)
buildMoonSignDetail(idx)
buildPlanetDetail(idx)
buildCategoryDetail(key)
buildOracleDetail()
buildSuggestionDetail()
```

这些函数不直接操作页面，只负责“准备数据”。

真正显示页面的是 `applyDetail()`。

这种分工很好：

- 构造函数负责数据。
- 渲染函数负责 DOM。
- 点击事件负责触发。

## 13. 今日宜忌逻辑

### 13.1 `getAlmanacPack()`

```js
function getAlmanacPack() {
  return lang === 'zh' ? ALMANAC_ZH : ALMANAC_EN;
}
```

作用：根据当前语言选择中文或英文的宜忌规则。

### 13.2 `buildAlmanacAdvice()`

```js
function buildAlmanacAdvice() {
  const pack = getAlmanacPack();
  const phase = pack.phase[readingState.phaseIdx];
  const sign = pack.sign[readingState.moonSignIdx];
  const day = pack.day[readingState.dayIdx];
  const west = pack.west[readingState.westIdx];
  const zodiac = pack.chinese[readingState.chineseIdx];
  ...
}
```

它从 `readingState` 里拿到当前五个因素：

1. 月相。
2. 月入星座。
3. 今日之日。
4. 用户西方星座。
5. 用户中国生肖。

然后组合成：

```js
{
  yi: "...",
  ji: "..."
}
```

也就是今日宜和今日不宜。

这里的关键思想是“组合规则”，不是“随机抽一句”。

## 14. 主渲染函数：`renderReading(bday, targetDate)`

```js
function renderReading(bday, targetDate = new Date()) { ... }
```

这是整个应用最核心的函数。

它负责把生日和当前查看日期变成完整页面。默认查看今天，也可以由上一天、今天、下一天按钮切换到其他日期。

### 14.1 准备语言和日期

```js
const L = LANG[lang];
applyStaticLang();

const birth = parseDateInput(bday);
const today = localDate(targetDate);
```

这里先拿当前语言的文案，再创建生日和当前查看日期的日期对象。

### 14.2 计算星座、生肖、月相

```js
const wi = westIdx(bM, bD);
const ci = chiIdx(bY);
const mi = moonIdx(today);
```

得到：

- `wi`：西方星座索引。
- `ci`：中国生肖索引。
- `mi`：今日月相索引。

### 14.3 创建稳定随机数

```js
const todayStr = today.toISOString().split('T')[0];
const rng = mkRng(dailySeed(bday, todayStr));
```

这里用生日和当天日期生成稳定随机数。

这一步决定了：

- 今天刷新页面结果不变。
- 明天结果会变。

### 14.4 计算评分

```js
const calc = calcRatings(bday, today, rng);
const ratings = {
  work: calc.work,
  love: calc.love,
  health: calc.health,
  finance: calc.finance
};
```

拿到四类评分。

### 14.5 根据评分挑选文案

```js
const msgs = {};
for (const k of CAT_KEYS) {
  msgs[k] = pick(L[k].m[ratings[k]], rng);
}
const oracle = pick(L.oracles, rng);
const suggest = pick(L.suggestions, rng);
const rtitle = pick(L.readingTitles, rng);
```

解释：

- `CAT_KEYS` 是 `["work", "love", "health", "finance"]`。
- 每个分类根据自己的分数去对应文案池里选一句。
- 今日神谕、建议、标题也从各自数组中选一句。

### 14.6 保存 `readingState`

```js
readingState = {
  birthYear: bY,
  ratings,
  msgs,
  oracle,
  suggest,
  phaseIdx: mi,
  dayIdx: today.getDay(),
  aspect: calc.asp,
  westIdx: wi,
  chineseIdx: ci,
  moonSignIdx: calc.moonSignIdx,
  moonInLabel,
  planetDayLabel
};
```

`readingState` 是当前阅读结果的全局状态。

为什么需要它：

- 页面已经渲染完后，用户可能点击卡片。
- 弹窗详情需要知道当前星座、生肖、月相、评分和文案。
- 与其重新算一遍，不如把当前结果存在 `readingState`。

### 14.7 渲染页面头部

```js
tx('r-date', L.dateStr(...));
tx('r-title', rtitle);
```

这里填入日期和标题。

然后生成星座和生肖按钮：

```js
$('r-signs').innerHTML = `
  <button data-detail="western" data-key="${wi}">...</button>
  <button data-detail="chinese" data-key="${ci}">...</button>
`;
```

`data-detail` 和 `data-key` 很重要。它们告诉点击事件：

- 这个按钮是哪种详情。
- 它对应第几个星座或生肖。

### 14.8 渲染今日天象卡片

```js
$('almanac-summary').innerHTML = `...`;
```

这里显示：

- 月相。
- 月入星座。
- 今日之日。

点击这张卡片会打开今日宜忌详情。

### 14.9 渲染四类评分卡片

```js
$('cat-grid').innerHTML = CAT_KEYS.map((k, i) => `...`).join('');
```

这里用 `map()` 批量生成四张卡片。

为什么用数组循环生成：四类卡片结构几乎一样，只是图标、名称、分数和文案不同。用循环可以避免重复写四遍 HTML。

### 14.10 渲染神谕、建议和底部

```js
tx('oracle-txt', oracle);
tx('sug-txt', suggest);
tx('r-foot', ...);
```

最后填入每日神谕、建议和底部身份信息。

## 15. 事件处理

### 15.1 点击卡片打开详情

```js
function onReadingClick(e) {
  const trigger = e.target.closest('[data-detail]');
  if (trigger) activateDetailTrigger(trigger);
}
```

这是一种事件委托写法。

不是给每张卡片单独绑定点击事件，而是给整个 `reading` 容器绑定一个事件，然后检查被点击的元素附近有没有 `data-detail`。

好处：

- 动态生成的卡片也能被点击。
- 代码更少。
- 新增卡片时只要加 `data-detail` 属性即可。

### 15.2 键盘打开详情

```js
function onReadingKeydown(e) {
  const trigger = e.target.closest('[data-detail]');
  if (trigger && isActionKey(e)) {
    e.preventDefault();
    activateDetailTrigger(trigger);
  }
}
```

这让用户可以用 Enter 或空格打开卡片详情。

这是无障碍和键盘可操作性的设计。

### 15.3 弹窗关闭事件

初始化时绑定了：

```js
$('detail-modal').addEventListener('click', e => {
  if (e.target === $('detail-modal')) closeDetail();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('detail-modal').classList.contains('open')) closeDetail();
});
```

支持两种关闭方式：

- 点击弹窗外层背景关闭。
- 按 Escape 关闭。

## 16. 初始化流程：`init()`

```js
function init() {
  applyTheme(theme);
  applyStaticLang();
  $('reading').addEventListener('click', onReadingClick);
  $('reading').addEventListener('keydown', onReadingKeydown);
  ...
  const bday = localStorage.getItem('cosmic_bday');
  if (bday) {
    show('reading');
    renderReading(bday);
  } else {
    show('onboarding');
  }
}

init();
```

这是程序启动入口。

浏览器执行到最后一行 `init()` 时，应用正式开始运行。

它做了这些事：

1. 应用主题。
2. 应用静态语言文字。
3. 绑定点击和键盘事件。
4. 绑定弹窗关闭事件。
5. 从 `localStorage` 读取生日。
6. 如果有生日，直接显示今日解读。
7. 如果没有生日，显示输入生日页面。

## 17. 数据文件和配置文件与主程序的关系

### `manifest.json` 和 `index.html`

`index.html` 里有：

```html
<link rel="manifest" href="manifest.json">
```

这告诉浏览器：这个网页有一个 PWA 配置文件。

浏览器会读取 `manifest.json`，从中知道应用名称、图标、启动页面和显示方式。

### 图标和 manifest 的关系

`manifest.json` 里引用：

```json
"src": "cosmic-daily-icon.png"
```

所以图标文件必须和 manifest 中的路径对应，否则安装时可能没有正确图标。

### README 和主程序的关系

`README.md` 不被程序读取。它是项目说明书，帮助人知道怎么使用、部署和理解项目。

## 18. 整个项目运行流程总结

可以把整个项目想象成下面这条流水线：

```text
浏览器打开 index.html
        ↓
加载 CSS，准备深色/浅色主题样式
        ↓
创建 HTML 页面骨架
        ↓
执行 JavaScript
        ↓
init() 启动
        ↓
读取 localStorage 里的主题、语言、生日
        ↓
如果没有生日：显示输入生日页
        ↓
用户输入生日并点击按钮
        ↓
startReading() 保存生日
        ↓
renderReading() 开始生成当前日期的解读
        ↓
根据生日计算西方星座和生肖
        ↓
根据今天日期计算月相、月入星座、星期行星
        ↓
用生日 + 今天日期创建稳定随机数
        ↓
calcRatings() 计算四类评分
        ↓
从文案池中稳定选择标题、分类文案、神谕、建议
        ↓
把结果保存到 readingState
        ↓
用 innerHTML 和 textContent 渲染页面
        ↓
用户点击卡片
        ↓
根据 data-detail 构造详情 payload
        ↓
applyDetail() 填充通用弹窗
        ↓
openDetail() 显示弹窗
```

## 19. 这个项目适合学习的重点

如果你正在学习 coding，可以重点看这几个知识点：

1. HTML 如何只提供结构，具体内容由 JavaScript 填充。
2. CSS 变量如何实现主题切换。
3. `localStorage` 如何保存用户偏好。
4. 数据对象如何支持双语内容。
5. 数组索引如何把计算结果映射到名称和图标。
6. 伪随机种子如何做到“随机但稳定”。
7. `renderReading()` 如何把数据变成页面。
8. 事件委托如何处理动态生成的卡片点击。
9. 通用弹窗如何复用一套 HTML 显示不同详情。
10. 静态网页应用如何在没有后端的情况下完成完整体验。

## 20. 初学者阅读建议

建议按这个顺序读代码：

1. 先看 `body` 里的 HTML，搞清楚页面有哪些区域。
2. 再看 CSS 里的 `.screen`、`.glass`、`.card`、`.detail-modal`，理解主要视觉结构。
3. 看 `LANG` 的数据结构，不用逐条读文案，只要理解它如何分类。
4. 看 `westIdx()`、`chiIdx()`、`moonIdx()`，理解生日和日期如何变成索引。
5. 看 `calcRatings()`，理解评分如何从 3 分开始加减。
6. 看 `renderReading()`，这是最重要的主流程。
7. 最后看 `init()`，理解应用是如何启动的。

只要理解了 `init()` 调用 `renderReading()`，而 `renderReading()` 又使用数据和计算函数生成页面，这个项目的主线就基本通了。
