# 设计系统 — 碰个头 (OnTheWay)

> 版本：v0.1.0 | 最后更新：2025-02
> 设计 Token 源文件：[design/design-tokens.json](../design/design-tokens.json)

---

## 1. 色彩系统

### 主色（Primary）— 活力橙

品牌核心色，传达温暖、活力、食欲感。

| 色阶 | 色值 | 用途 |
|------|------|------|
| 50 | `#fff7ed` | 浅色背景 |
| 100 | `#ffedd5` | 悬浮态背景 |
| 200 | `#fed7aa` | 边框高亮 |
| 300 | `#fdba74` | 图标辅助色 |
| 400 | `#fb923c` | 次要按钮 |
| **500** | **`#f2930d`** | **主色 — 按钮、链接、强调** |
| 600 | `#ea580c` | 悬浮态 |
| 700 | `#c2410c` | 按下态 |
| 800 | `#9a3412` | 深色文字 |
| 900 | `#7c2d12` | 极深色 |
| 950 | `#431407` | 暗色模式强调 |

### 辅色（Secondary）— 信息蓝

用于辅助信息、链接、次要操作。

| 色阶 | 色值 | 用途 |
|------|------|------|
| 50 | `#eff6ff` | 浅色背景 |
| **500** | **`#0d94f2`** | **辅色 — 信息提示、次要操作** |
| 600 | `#2563eb` | 悬浮态 |
| 700 | `#1d4ed8` | 按下态 |

### 语义色

| 语义 | 色值 | 用途 |
|------|------|------|
| 成功（Success） | `#14b8a6` (teal-500) | 成功提示、已到达状态 |
| 警告（Warning） | `#f2930d` (primary-500) | 警告提示、催促消息 |
| 危险（Danger） | `#ef4444` (red-500) | 错误提示、删除操作 |

### 中性色

| 用途 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 页面背景 | `#f8f7f5` | `#221b10` |
| 卡片背景 | `#ffffff` | `#2d2418` |
| 表面色 | `#f0ede8` | `#3a3028` |
| 主文字 | `#1a1a1a` | `#f5f5f4` |
| 次要文字 | `#6b7280` | `#a8a29e` |

---

## 2. 暗色模式

采用**暖色调暗色主题**，与品牌橙色协调，避免冷色调的生硬感。

### 设计原则

- 背景使用暖棕色调（stone 系列），而非纯黑或冷灰
- 阴影使用主色（橙色）微光，营造温暖氛围
- 文字对比度符合 WCAG AA 标准（≥ 4.5:1）

### 色彩映射

| 元素 | 亮色 | 暗色 |
|------|------|------|
| 页面背景 | `#f8f7f5` 暖白 | `#221b10` 深棕 |
| 卡片 | `#ffffff` 纯白 | `#2d2418` 暗棕 |
| 表面/分割 | `#f0ede8` 浅灰 | `#3a3028` 中棕 |
| 主文字 | `#1a1a1a` 近黑 | `#f5f5f4` stone-100 |
| 次要文字 | `#6b7280` gray-500 | `#a8a29e` stone-400 |
| 阴影 | 黑色透明度 | 橙色透明度 |

### Tailwind 配置示例

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#f8f7f5',
          dark: '#221b10',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#2d2418',
        },
        surface: {
          DEFAULT: '#f0ede8',
          dark: '#3a3028',
        },
      },
    },
  },
}
```

---

## 3. 字体

### 字体族

```css
font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
```

- **Plus Jakarta Sans**：主字体，几何感现代字体，可读性好
- **system-ui**：回退字体，确保各平台显示一致

### 字号阶梯

| 名称 | 大小 | 行高 | 用途 |
|------|------|------|------|
| `xs` | 12px | 1.5 | 辅助说明、标签 |
| `sm` | 14px | 1.5 | 次要文字、表单提示 |
| `base` | 16px | 1.5 | 正文 |
| `lg` | 18px | 1.5 | 小标题 |
| `xl` | 20px | 1.25 | 卡片标题 |
| `2xl` | 24px | 1.25 | 页面标题 |
| `3xl` | 30px | 1.25 | 大标题 |
| `4xl` | 36px | 1.25 | 特大标题 |

### 字重

| 名称 | 值 | 用途 |
|------|-----|------|
| `normal` | 400 | 正文 |
| `medium` | 500 | 强调文字 |
| `semibold` | 600 | 小标题、按钮 |
| `bold` | 700 | 大标题 |

---

## 4. 间距

基准单位：**4px**

| Token | 值 | 用途 |
|-------|-----|------|
| `1` | 4px | 最小间距、图标与文字间距 |
| `2` | 8px | 紧凑元素间距 |
| `3` | 12px | 表单元素内间距 |
| `4` | 16px | 标准内间距、卡片内边距 |
| `5` | 20px | 中等间距 |
| `6` | 24px | 区块间距 |
| `8` | 32px | 大区块间距 |
| `10` | 40px | 页面区域间距 |
| `12` | 48px | 大区域间距 |
| `16` | 64px | 页面顶部/底部间距 |
| `20` | 80px | 特大间距 |
| `24` | 96px | 最大间距 |

---

## 5. 圆角

| 名称 | 值 | 用途 |
|------|-----|------|
| `sm` | 8px | 小元素：标签、徽章 |
| `md` | 16px | 中等元素：按钮、输入框、卡片 |
| `lg` | 24px | 大元素：模态框、底部弹窗 |
| `xl` | 32px | 特大元素：全屏卡片 |
| `full` | 9999px | 圆形：头像、圆形按钮 |

---

## 6. 阴影

### 亮色模式

| 层级 | 值 | 用途 |
|------|-----|------|
| `sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | 微弱阴影：标签、徽章 |
| `md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | 标准阴影：卡片 |
| `lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | 悬浮阴影：hover 态卡片 |
| `xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | 强阴影：模态框 |

### 暗色模式

暗色模式使用**橙色微光**替代黑色阴影，营造温暖氛围：

| 层级 | 值 |
|------|-----|
| `sm` | `0 1px 2px 0 rgba(242,147,13,0.1)` |
| `md` | `0 4px 6px -1px rgba(242,147,13,0.15), 0 2px 4px -1px rgba(242,147,13,0.1)` |
| `lg` | `0 10px 15px -3px rgba(242,147,13,0.2), 0 4px 6px -2px rgba(242,147,13,0.15)` |
| `xl` | `0 20px 25px -5px rgba(242,147,13,0.25), 0 10px 10px -5px rgba(242,147,13,0.2)` |

---

## 7. 组件规范

### 7.1 Button 按钮

#### 变体

| 变体 | 样式 | 用途 |
|------|------|------|
| `primary` | 橙色填充，白色文字 | 主要操作：创建聚会、确认 |
| `secondary` | 白色填充，橙色边框和文字 | 次要操作：取消、返回 |
| `ghost` | 透明背景，橙色文字 | 轻量操作：链接式按钮 |
| `danger` | 红色填充，白色文字 | 危险操作：删除 |

#### 尺寸

| 尺寸 | 高度 | 内边距 | 字号 | 圆角 |
|------|------|--------|------|------|
| `sm` | 32px | 12px 16px | 14px | 8px |
| `md` | 40px | 12px 24px | 16px | 16px |
| `lg` | 48px | 16px 32px | 18px | 16px |

#### 状态

| 状态 | 变化 |
|------|------|
| 默认 | 基础样式 |
| Hover | 背景加深一级（如 primary-500 → primary-600），上浮 1px |
| Active | 背景加深两级（如 primary-500 → primary-700），下沉 |
| Disabled | 透明度 50%，禁止点击 |
| Loading | 显示旋转图标，禁止点击 |

#### 代码示例

```tsx
// Primary Button
<button className="
  bg-primary-500 text-white font-semibold
  px-6 py-3 rounded-md
  hover:bg-primary-600 hover:-translate-y-0.5
  active:bg-primary-700
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-150
">
  创建聚会
</button>
```

---

### 7.2 Card 卡片

| 属性 | 值 |
|------|-----|
| 背景 | 亮：`#ffffff` / 暗：`#2d2418` |
| 圆角 | 16px (`rounded-md`) |
| 内边距 | 16px-24px |
| 阴影 | `md` 级别 |
| Hover | 阴影升级为 `lg`，上浮 2px |

```tsx
<div className="
  bg-white dark:bg-card-dark
  rounded-md p-4 md:p-6
  shadow-md hover:shadow-lg
  hover:-translate-y-0.5
  transition-all duration-300
">
  {/* 卡片内容 */}
</div>
```

---

### 7.3 Input 输入框

| 属性 | 值 |
|------|-----|
| 高度 | 40px (md) / 48px (lg) |
| 边框 | 1px solid `#e5e7eb` / 暗色 `#3a3028` |
| 圆角 | 16px |
| 内边距 | 12px 16px |
| 聚焦 | 边框变为 primary-500，外发光 |

```tsx
<input className="
  w-full h-10 px-4 py-3
  border border-gray-200 dark:border-surface-dark
  rounded-md bg-white dark:bg-card-dark
  text-base text-gray-900 dark:text-stone-100
  placeholder:text-gray-400 dark:placeholder:text-stone-500
  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
  transition-colors duration-150
" />
```

---

### 7.4 Toast 提示

| 类型 | 图标 | 背景色 | 边框色 |
|------|------|--------|--------|
| success | ✅ | teal-50 | teal-500 |
| warning | ⚠️ | primary-50 | primary-500 |
| error | ❌ | red-50 | red-500 |
| info | ℹ️ | secondary-50 | secondary-500 |

- 位置：顶部居中
- 动画：从上方滑入，3 秒后自动消失
- 圆角：16px
- 阴影：`lg` 级别

---

### 7.5 Tag 标签

用于口味偏好选择。

| 状态 | 样式 |
|------|------|
| 未选中 | 白色背景，灰色边框，灰色文字 |
| 已选中 | primary-50 背景，primary-500 边框，primary-700 文字 |
| Hover | 背景微亮 |

```tsx
<span className={`
  inline-flex items-center px-3 py-1
  rounded-full text-sm font-medium
  border cursor-pointer transition-colors
  ${selected
    ? 'bg-primary-50 border-primary-500 text-primary-700'
    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
  }
`}>
  🌶️ 川菜
</span>
```

---

### 7.6 Avatar 头像

| 尺寸 | 大小 | 用途 |
|------|------|------|
| `sm` | 32px | 列表项 |
| `md` | 40px | 参与者卡片 |
| `lg` | 56px | 个人中心 |

- 形状：圆形 (`rounded-full`)
- 无头像时：显示昵称首字，背景为 primary-100，文字为 primary-700
- 边框：2px solid white（头像组叠加时）

---

### 7.7 Badge 徽章

| 类型 | 样式 | 用途 |
|------|------|------|
| 状态 | 圆点 + 文字 | 参与者状态（已加入/已出发/已到达） |
| 计数 | 圆形数字 | 未读消息数 |

状态颜色映射：

| 状态 | 颜色 |
|------|------|
| 已加入 | gray-400 |
| 已出发 | primary-500 |
| 已到达 | teal-500 |

---

### 7.8 Modal 模态框

| 属性 | 值 |
|------|-----|
| 遮罩 | 黑色 50% 透明度 |
| 容器 | 白色/暗色卡片背景 |
| 圆角 | 24px |
| 最大宽度 | 480px |
| 内边距 | 24px |
| 阴影 | `xl` 级别 |
| 动画 | 从底部滑入 + 淡入 |

---

## 8. 动效

### 基础参数

| 名称 | 时长 | 缓动函数 | 用途 |
|------|------|----------|------|
| `fast` | 150ms | `ease-out` | 按钮状态变化、颜色切换 |
| `normal` | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 卡片悬浮、页面过渡 |
| `slow` | 500ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 模态框进出、复杂动画 |
| `bounce` | 500ms | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 弹跳效果 |

### 常用动效

#### Hover 上浮

```css
.hover-float {
  transition: transform 300ms ease, box-shadow 300ms ease;
}
.hover-float:hover {
  transform: translateY(-2px);
  box-shadow: /* lg 级别阴影 */;
}
```

#### Pulse 呼吸

用于等待状态、加载提示。

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### Bounce 弹跳

用于新消息提示、催促动画。

```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-bounce {
  animation: bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}
```

#### Slide In 滑入

用于 Toast、Modal 进入。

```css
@keyframes slideInUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## 9. 响应式设计

### 设计原则

**Mobile First** — 先设计移动端，再向上适配。

聚餐协调场景中，用户大概率在手机上操作。

### 断点

| 名称 | 宽度 | 设备 |
|------|------|------|
| 默认 | < 640px | 手机竖屏 |
| `sm` | ≥ 640px | 手机横屏 / 小平板 |
| `md` | ≥ 768px | 平板 |
| `lg` | ≥ 1024px | 笔记本 |
| `xl` | ≥ 1280px | 桌面显示器 |

### 布局策略

| 断点 | 布局 | 说明 |
|------|------|------|
| 默认 | 单列 | 全宽卡片，垂直堆叠 |
| `sm` | 单列 | 增加侧边距 |
| `md` | 居中容器 | 最大宽度 640px，居中显示 |
| `lg` | 双列 | 左侧聚会信息，右侧参与者/状态 |
| `xl` | 双列 | 更宽松的间距 |

### 容器宽度

```tsx
<div className="
  w-full px-4
  sm:px-6
  md:max-w-2xl md:mx-auto
  lg:max-w-5xl
  xl:max-w-6xl
">
```

### 关键页面响应式

#### 聚会详情页

```
手机（默认）：
┌──────────────┐
│   聚会标题    │
│   状态信息    │
├──────────────┤
│   参与者列表  │
├──────────────┤
│   餐厅推荐    │
├──────────────┤
│   操作按钮    │
└──────────────┘

平板/桌面（lg+）：
┌────────────────────┬──────────────┐
│   聚会标题          │  参与者列表   │
│   状态信息          │  状态追踪    │
│   餐厅推荐          │              │
│   操作按钮          │              │
└────────────────────┴──────────────┘
```
