# Logo 和图片使用清单

> 生成时间：2026-02-12
> 目的：统一视觉标识，替换所有 Logo 和图标

---

## 一、当前 Logo 使用情况

### 1.1 Web 端

| 位置 | 文件路径 | 当前实现 | 行号 | 说明 |
|------|---------|---------|------|------|
| 登录页 Logo | `packages/web/src/pages/LoginPage.tsx` | 渐变圆角方块 + Material Icon `restaurant_menu` | 53-55 | 橙色到青色渐变背景 |
| 首页 Header Logo | `packages/web/src/pages/HomePage.tsx` | 渐变圆形 + Material Icon `restaurant_menu` | 22-24 | 橙色到青色渐变背景 |
| Dashboard Header | `packages/web/src/pages/Dashboard.tsx` | 需要检查 | - | 待确认 |

**Web 端 Logo 代码示例**：
```tsx
// LoginPage.tsx (line 53-55)
<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
  <span className="material-icons-round text-white text-3xl">restaurant_menu</span>
</div>

// HomePage.tsx (line 22-24)
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
  <span className="material-icons-round text-white">restaurant_menu</span>
</div>
```

---

### 1.2 小程序端

| 位置 | 文件路径 | 当前实现 | 行号 | 说明 |
|------|---------|---------|------|------|
| 登录页 Logo | `packages/miniprogram/miniprogram/pages/login/index.wxml` | Emoji 🍽️ | 3 | 纯文本 Emoji |
| 首页 Header | `packages/miniprogram/miniprogram/pages/index/index.wxml` | 无 Logo | - | 只有文字问候 |
| 个人中心头像 | `packages/miniprogram/miniprogram/pages/profile/index.wxml` | 昵称首字母 | 4 | 动态生成 |

**小程序 Logo 代码示例**：
```xml
<!-- login/index.wxml (line 3) -->
<view class="logo">🍽️</view>
```

---

## 二、图片资源清单

### 2.1 项目根目录

| 文件路径 | 用途 | 尺寸 | 说明 |
|---------|------|------|------|
| `assets/logo.png` | 项目主 Logo | 未知 | 从 `screenshot-20260210-231213.png` 重命名而来 |

---

### 2.2 小程序图标资源

| 文件路径 | 用途 | 说明 |
|---------|------|------|
| `packages/miniprogram/miniprogram/assets/icons/home.png` | TabBar 首页图标（未选中） | 灰色 |
| `packages/miniprogram/miniprogram/assets/icons/home-active.png` | TabBar 首页图标（选中） | 橙色 |
| `packages/miniprogram/miniprogram/assets/icons/list.png` | TabBar 聚会列表图标（未选中） | 灰色 |
| `packages/miniprogram/miniprogram/assets/icons/list-active.png` | TabBar 聚会列表图标（选中） | 橙色 |
| `packages/miniprogram/miniprogram/assets/icons/user.png` | TabBar 个人中心图标（未选中） | 灰色 |
| `packages/miniprogram/miniprogram/assets/icons/user-active.png` | TabBar 个人中心图标（选中） | 橙色 |
| `packages/miniprogram/miniprogram/assets/icons/user-marker.png` | 地图用户标记 | 用于地图显示参与者位置 |
| `packages/miniprogram/miniprogram/assets/icons/restaurant-marker.png` | 地图餐厅标记 | 用于地图显示餐厅位置 |

---

### 2.3 Web 端图片资源

**当前 Web 端没有使用图片文件**，全部使用：
- Material Icons Round 图标库
- CSS 渐变背景
- Emoji 表情

---

## 三、需要替换的位置

### 3.1 高优先级（影响品牌识别）

| 位置 | 当前 | 建议替换为 | 文件 |
|------|------|-----------|------|
| Web 登录页 Logo | 渐变方块 + Icon | 统一 Logo 图片 | `packages/web/src/pages/LoginPage.tsx:53-55` |
| Web 首页 Header | 渐变圆形 + Icon | 统一 Logo 图片（小尺寸） | `packages/web/src/pages/HomePage.tsx:22-24` |
| 小程序登录页 Logo | Emoji 🍽️ | 统一 Logo 图片 | `packages/miniprogram/miniprogram/pages/login/index.wxml:3` |

---

### 3.2 中优先级（可选优化）

| 位置 | 当前 | 建议 | 文件 |
|------|------|------|------|
| 小程序 TabBar 图标 | 通用图标 | 可保持或替换为品牌风格图标 | `packages/miniprogram/miniprogram/assets/icons/*` |
| 地图标记图标 | 通用标记 | 可保持或替换为品牌风格 | `packages/miniprogram/miniprogram/assets/icons/*-marker.png` |

---

## 四、Logo 规格建议

### 4.1 Web 端需求

| 用途 | 尺寸 | 格式 | 说明 |
|------|------|------|------|
| 登录页主 Logo | 64x64px (2x: 128x128px) | PNG/SVG | 圆角方形或圆形 |
| Header 小 Logo | 40x40px (2x: 80x80px) | PNG/SVG | 圆形 |
| Favicon | 32x32px, 16x16px | ICO/PNG | 浏览器标签页图标 |

---

### 4.2 小程序需求

| 用途 | 尺寸 | 格式 | 说明 |
|------|------|------|------|
| 登录页 Logo | 120x120px (2x: 240x240px) | PNG | 圆角方形 |
| 小程序图标 | 144x144px | PNG | 微信平台要求 |
| TabBar 图标 | 81x81px | PNG | 选中/未选中各一套 |

---

## 五、替换步骤建议

### Step 1: 准备 Logo 资源
1. 确认 `assets/logo.png` 是否为最终版本
2. 生成不同尺寸的 Logo 变体：
   - `logo-64.png` (Web 登录页)
   - `logo-40.png` (Web Header)
   - `logo-120.png` (小程序登录页)
   - `logo-144.png` (小程序图标)

### Step 2: 替换 Web 端
```tsx
// LoginPage.tsx
<img src="/assets/logo-64.png" alt="碰个头" className="w-16 h-16 rounded-2xl shadow-lg mb-4" />

// HomePage.tsx
<img src="/assets/logo-40.png" alt="碰个头" className="w-10 h-10 rounded-full shadow-lg" />
```

### Step 3: 替换小程序端
```xml
<!-- login/index.wxml -->
<image class="logo" src="/assets/logo-120.png" mode="aspectFit"></image>
```

### Step 4: 更新配置文件
- 小程序 `app.json` 中的 TabBar 图标路径
- Web 端 `index.html` 中的 favicon

---

## 六、当前问题总结

1. **Web 端**：使用代码生成的渐变背景 + Material Icon，不是真实 Logo
2. **小程序端**：使用 Emoji 表情，不是真实 Logo
3. **不统一**：两端视觉标识完全不同
4. **缺少 Favicon**：Web 端浏览器标签页没有图标

---

## 七、待确认

- [ ] `assets/logo.png` 是否为最终版本？
- [ ] 是否需要生成不同尺寸的变体？
- [ ] 是否需要 SVG 格式（Web 端可缩放）？
- [ ] TabBar 图标是否需要重新设计？
- [ ] 地图标记图标是否需要品牌化？
