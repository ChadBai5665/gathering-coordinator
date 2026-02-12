# 设计输出目录

> 请将 UI 设计软件生成的图标文件放在这里

---

## 使用说明

### 1. 放置设计文件

将以下 10 个 PNG 文件放入此目录：

```
✅ logo-main.png          (1024x1024px)
✅ favicon.png            (512x512px)
✅ tabbar-home.png        (162x162px)
✅ tabbar-home-active.png (162x162px)
✅ tabbar-list.png        (162x162px)
✅ tabbar-list-active.png (162x162px)
✅ tabbar-user.png        (162x162px)
✅ tabbar-user-active.png (162x162px)
✅ marker-user.png        (96x96px)
✅ marker-restaurant.png  (96x96px)
```

### 2. 运行处理脚本

```bash
cd D:\AICoding\Ontheway
node scripts/process-design-assets.js
```

### 3. 查看报告

处理完成后，会在此目录生成 `processing-report.md` 报告文件。

---

## 注意事项

- 文件名必须严格按照上述命名
- 所有文件必须是 PNG 格式
- 尺寸必须符合要求
- 建议使用透明背景（除非特别说明）

---

## 设计需求文档

完整的设计需求请查看：
`D:\AICoding\Ontheway\docs\design-requirements.md`
