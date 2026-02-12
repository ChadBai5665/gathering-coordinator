# 快速开始：UI 设计软件提示词

> 直接复制以下内容到 AI 设计工具（如 Midjourney、DALL-E、Stable Diffusion 等）

---

## 🎯 一键复制提示词

### 主 Logo 设计

```
Design a modern app icon for "Ontheway" (碰个头), a social dining app.
Requirements:
- Size: 1024x1024px, rounded square (22% corner radius)
- Background: warm gradient from orange (#FF6B35) to teal (#14B8A6), top-left to bottom-right
- Icon element: combine dining (utensils/chopsticks) + social (people/chat bubble) + location (pin marker)
- Style: minimalist, friendly, modern, white or light-colored line art
- Must be recognizable when scaled down to 40x40px
- Avoid complex details
- iOS app icon style
```

---

### TabBar 图标组（3个图标，各2个状态）

#### 首页图标
```
Design a home/discover icon for mobile app tab bar.
Requirements:
- Size: 162x162px (2x for 81x81px display)
- Style: rounded, modern, line icon
- Line weight: medium (3-4px)
- Two versions needed:
  1. Inactive: gray (#9CA3AF)
  2. Active: orange (#FF6B35)
- Transparent background
- Suggest elements: home, discover, feed, dynamic
- iOS style, simple and clear
```

#### 聚会列表图标
```
Design a party/event list icon for mobile app tab bar.
Requirements:
- Size: 162x162px (2x for 81x81px display)
- Style: rounded, modern, line icon, consistent with home icon
- Line weight: medium (3-4px)
- Two versions needed:
  1. Inactive: gray (#9CA3AF)
  2. Active: orange (#FF6B35)
- Transparent background
- Suggest elements: list, calendar, multiple people gathering, event card
- iOS style, simple and clear
```

#### 个人中心图标
```
Design a user/profile icon for mobile app tab bar.
Requirements:
- Size: 162x162px (2x for 81x81px display)
- Style: rounded, modern, line icon, consistent with other tab icons
- Line weight: medium (3-4px)
- Two versions needed:
  1. Inactive: gray (#9CA3AF)
  2. Active: orange (#FF6B35)
- Transparent background
- Suggest elements: user avatar, profile, personal
- iOS style, simple and clear
```

---

### 地图标记图标

#### 用户位置标记
```
Design a user location marker icon for map display.
Requirements:
- Size: 96x96px (2x for 48x48px display)
- Combine person icon + location pin
- Color: orange (#FF6B35) or gradient
- Background: white circular base with shadow
- Style: clear, easily recognizable on map
- Transparent background with white circle base
```

#### 餐厅位置标记
```
Design a restaurant location marker icon for map display.
Requirements:
- Size: 96x96px (2x for 48x48px display)
- Combine dining utensils + location pin
- Color: teal (#14B8A6) to distinguish from user marker
- Background: white circular base with shadow
- Style: consistent with user marker but different color
- Transparent background with white circle base
```

---

### Favicon 设计
```
Design a simplified favicon version of the Ontheway app logo.
Requirements:
- Size: 512x512px (will be scaled to 32x32 and 16x16)
- Shape: square or circular
- Design: simplified version of main logo, keep only core graphic
- Must be recognizable at 16x16px
- Background: solid color or gradient
- Style: minimal, clear
```

---

## 📋 设计检查清单

完成设计后，请确保：

- [ ] 所有文件都是 PNG 格式
- [ ] 背景透明（除非特别说明需要背景）
- [ ] 尺寸完全符合要求
- [ ] 文件命名严格按照规范
- [ ] 颜色使用正确的色值
- [ ] 在小尺寸下仍清晰可辨

---

## 🎨 色彩参考

```
主色调：#FF6B35 (橙色)
辅助色：#14B8A6 (青色)
灰色：  #9CA3AF (未选中状态)
白色：  #FFFFFF (图标元素)
```

---

## 📦 文件命名规范

```
1. logo-main.png
2. favicon.png
3. tabbar-home.png
4. tabbar-home-active.png
5. tabbar-list.png
6. tabbar-list-active.png
7. tabbar-user.png
8. tabbar-user-active.png
9. marker-user.png
10. marker-restaurant.png
```

---

## 🚀 下一步

1. 将生成的 10 个文件保存到：`D:\AICoding\Ontheway\design-output\`
2. 运行处理脚本：`node scripts/process-design-assets.js`
3. 查看处理报告：`design-output/processing-report.md`

---

## 📖 完整文档

详细设计需求请查看：
`D:\AICoding\Ontheway\docs\design-requirements.md`
