# 部署、PWA 与链接分享

## GitHub Pages 部署

Cosmic Almanac 是纯静态项目，可以直接通过 GitHub Pages 部署。

推荐部署方式：

1. 打开 GitHub 仓库。
2. 进入 **Settings**。
3. 打开 **Pages**。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`。
6. Folder 选择 `/root`。
7. 保存。

应用地址通常类似：

```text
https://alanwongsai.github.io/CosmicAlmanac/
```

如果仓库名或 Pages 设置不同，以 GitHub Pages 页面实际显示的地址为准。

## PWA 配置

`manifest.json` 当前配置了：

- `name`: Cosmic Almanac。
- `short_name`: Cosmic Almanac。
- `start_url`: `./index.html`。
- `display`: `standalone`。
- `background_color`: `#09080b`。
- `theme_color`: `#09080b`。
- `orientation`: `portrait`。
- 192 x 192 和 512 x 512 图标。

这让应用可以被添加到手机主屏幕，并以接近原生 App 的形式打开。

## iPhone 主屏幕添加

1. 用 Safari 打开应用地址。
2. 点击分享按钮。
3. 选择 **Add to Home Screen**。
4. 确认名称为 Cosmic Almanac。
5. 点击 **Add**。

## 应用链接分享

`index.html` 已包含基础分享元数据：

- `meta name="description"`。
- `og:title`。
- `og:description`。
- `og:type`。
- `og:url`。
- `og:site_name`。
- `twitter:card`。
- `twitter:title`。
- `twitter:description`。
- `canonical`。

这些标签用于让聊天软件、社交平台或预览工具在粘贴应用链接时显示标题和简介。

当前没有添加 `og:image` 或 `twitter:image`。因此链接预览会以文字信息为主，不会显示正式横向分享图。

## 仓库链接分享

分享 GitHub 仓库链接和分享 GitHub Pages 应用链接是两回事。

- 应用链接预览主要读取 `index.html` 的 Open Graph / Twitter Card 元数据。
- 仓库链接预览主要读取 GitHub 仓库本身的 About、Description、Website 和 Social preview 设置。

建议仓库 About 设置：

```text
A bilingual daily oracle blending zodiac signs, moon phase, weekday ruler, and personal daily guidance.
```

Website 建议填写 GitHub Pages 应用地址。

## 后续分享图建议

如果要让分享看起来更像正式 App，下一步可以制作一张 1200 x 630 的 social preview 图。内容建议包括：

- Cosmic Almanac 标题。
- 一句短描述。
- 星象 / 月相 / 玻璃卡片风格背景。
- 与应用图标一致的视觉元素。

制作后可以同时用于：

- `og:image`。
- `twitter:image`。
- GitHub 仓库 Social preview。
