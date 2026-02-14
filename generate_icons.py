#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图标生成脚本
根据设计要求生成所有需要的图标文件
"""

from PIL import Image, ImageDraw, ImageFilter
import os

# 文件路径
SOURCE_LOGO = "Gemini_Generated_Image_lcc2w4lcc2w4lcc2.png"
SOURCE_ICONS = "Gemini_Generated_Image_fgzwicfgzwicfgzw.png"
OUTPUT_DIR = "design-output"

# 确保输出目录存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_rounded_rectangle_mask(size, radius):
    """创建圆角矩形遮罩"""
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask

def create_gradient_background(size, color1, color2):
    """创建渐变背景（从左上到右下）"""
    width, height = size
    base = Image.new('RGB', size, color1)

    for y in range(height):
        for x in range(width):
            # 计算从左上到右下的渐变比例
            ratio = (x + y) / (width + height)
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            base.putpixel((x, y), (r, g, b))

    return base

def extract_icon_from_grid(source_img, row, col, icon_size=680):
    """从 3x3 网格中提取单个图标"""
    # 2048x2048 的图片，3x3 网格，每个图标约 680x680
    x = col * icon_size
    y = row * icon_size
    return source_img.crop((x, y, x + icon_size, y + icon_size))

def create_logo_main():
    """创建主 Logo (1024x1024px)"""
    print("生成 logo-main.png...")

    # 加载原始 Logo
    logo = Image.open(SOURCE_LOGO).convert('RGBA')

    # 创建渐变背景 (橙色 #FF6B35 到青色 #14B8A6)
    gradient = create_gradient_background((1024, 1024), (255, 107, 53), (20, 184, 166))

    # 提取中心的两个碰头圆形（去掉文字）
    # 原图是 2048x2048，我们需要裁剪中心部分
    center_size = 1200
    left = (logo.width - center_size) // 2
    top = (logo.height - center_size) // 2 - 100  # 稍微向上偏移，避开下方文字
    logo_center = logo.crop((left, top, left + center_size, top + center_size))

    # 缩放到合适大小
    logo_center = logo_center.resize((800, 800), Image.Resampling.LANCZOS)

    # 创建圆角矩形遮罩
    mask = create_rounded_rectangle_mask((1024, 1024), radius=225)  # 22% 圆角

    # 将渐变背景应用圆角
    gradient_rgba = gradient.convert('RGBA')
    gradient_with_mask = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    gradient_with_mask.paste(gradient_rgba, (0, 0), mask)

    # 将 Logo 居中粘贴到渐变背景上
    logo_x = (1024 - 800) // 2
    logo_y = (1024 - 800) // 2
    gradient_with_mask.paste(logo_center, (logo_x, logo_y), logo_center)

    # 保存
    output_path = os.path.join(OUTPUT_DIR, "logo-main.png")
    gradient_with_mask.save(output_path, 'PNG')
    print(f"[OK] 已生成: {output_path}")

def create_favicon():
    """创建 Favicon (512x512px)"""
    print("生成 favicon.png...")

    # 加载原始图标网格
    icons = Image.open(SOURCE_ICONS).convert('RGBA')

    # 提取 favicon（第一行第一列）
    favicon = extract_icon_from_grid(icons, 0, 0)

    # 缩放到 512x512
    favicon = favicon.resize((512, 512), Image.Resampling.LANCZOS)

    # 保存
    output_path = os.path.join(OUTPUT_DIR, "favicon.png")
    favicon.save(output_path, 'PNG')
    print(f"[OK] 已生成: {output_path}")

def create_tabbar_icons():
    """创建 TabBar 图标 (162x162px)"""
    print("生成 TabBar 图标...")

    # 加载原始图标网格
    icons = Image.open(SOURCE_ICONS).convert('RGBA')

    # 图标映射 (row, col, filename)
    icon_map = [
        (0, 1, "tabbar-home.png"),
        (0, 2, "tabbar-home-active.png"),
        (1, 0, "tabbar-list.png"),
        (1, 1, "tabbar-list-active.png"),
        (1, 2, "tabbar-user.png"),
        (2, 0, "tabbar-user-active.png"),
    ]

    for row, col, filename in icon_map:
        icon = extract_icon_from_grid(icons, row, col)
        icon = icon.resize((162, 162), Image.Resampling.LANCZOS)

        output_path = os.path.join(OUTPUT_DIR, filename)
        icon.save(output_path, 'PNG')
        print(f"[OK] 已生成: {output_path}")

def create_marker_icons():
    """创建地图标记图标 (96x96px，带白色底和阴影)"""
    print("生成地图标记图标...")

    # 加载原始图标网格
    icons = Image.open(SOURCE_ICONS).convert('RGBA')

    # 图标映射 (row, col, filename)
    marker_map = [
        (2, 1, "marker-user.png"),
        (2, 2, "marker-restaurant.png"),
    ]

    for row, col, filename in marker_map:
        # 提取图标
        icon = extract_icon_from_grid(icons, row, col)
        icon = icon.resize((64, 64), Image.Resampling.LANCZOS)

        # 创建 96x96 的画布
        canvas = Image.new('RGBA', (96, 96), (0, 0, 0, 0))

        # 创建白色圆形底（带阴影）
        shadow = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)

        # 绘制阴影（稍微偏移）
        shadow_draw.ellipse([4, 4, 92, 92], fill=(0, 0, 0, 60))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=3))

        # 绘制白色圆形底
        white_circle = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
        white_draw = ImageDraw.Draw(white_circle)
        white_draw.ellipse([2, 2, 94, 94], fill=(255, 255, 255, 255))

        # 合成：阴影 + 白色底 + 图标
        canvas.paste(shadow, (0, 0), shadow)
        canvas.paste(white_circle, (0, 0), white_circle)

        # 将图标居中粘贴
        icon_x = (96 - 64) // 2
        icon_y = (96 - 64) // 2
        canvas.paste(icon, (icon_x, icon_y), icon)

        output_path = os.path.join(OUTPUT_DIR, filename)
        canvas.save(output_path, 'PNG')
        print(f"[OK] 已生成: {output_path}")

def main():
    """主函数"""
    print("=" * 50)
    print("开始生成图标...")
    print("=" * 50)

    try:
        create_logo_main()
        create_favicon()
        create_tabbar_icons()
        create_marker_icons()

        print("=" * 50)
        print("[OK] 所有图标生成完成！")
        print(f"输出目录: {OUTPUT_DIR}")
        print("=" * 50)

        # 列出生成的文件
        print("\n生成的文件列表:")
        for filename in sorted(os.listdir(OUTPUT_DIR)):
            if filename.endswith('.png'):
                filepath = os.path.join(OUTPUT_DIR, filename)
                size = os.path.getsize(filepath)
                print(f"  - {filename} ({size // 1024} KB)")

    except Exception as e:
        print(f"[ERROR] 错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
