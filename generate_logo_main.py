#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成主 Logo（去除文字版本）
"""

from PIL import Image
import os

# 文件路径
SOURCE_LOGO = "Gemini_Generated_Image_wo91jpwo91jpwo91.png"
OUTPUT_DIR = "design-output"

# 确保输出目录存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_logo_main():
    """创建主 Logo (1024x1024px) - 去除文字版本"""
    print("生成 logo-main.png (应用图标版本)...")

    # 加载原始 Logo
    logo = Image.open(SOURCE_LOGO).convert('RGBA')

    # 原图是 2048x2048，裁剪掉下方的文字部分
    # 保留上方的核心图形（两个碰头圆形 + 小烟花）
    # 裁剪区域：保留上方 1600px，去掉下方 448px 的文字区域
    crop_height = 1600
    top_offset = 100  # 稍微向下偏移，保留一些上方空间

    logo_cropped = logo.crop((0, top_offset, 2048, top_offset + crop_height))

    # 缩放到 1024x1024
    # 由于裁剪后不是正方形，需要先创建一个正方形画布
    canvas = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))

    # 将裁剪后的图像居中粘贴（垂直居中）
    paste_y = (2048 - crop_height) // 2
    canvas.paste(logo_cropped, (0, paste_y), logo_cropped)

    # 缩放到 1024x1024
    canvas = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)

    # 保存
    output_path = os.path.join(OUTPUT_DIR, "logo-main.png")
    canvas.save(output_path, 'PNG')
    print(f"[OK] 已生成: {output_path}")

    # 同时保存带文字的版本作为品牌宣传图
    logo_with_text = logo.resize((1024, 1024), Image.Resampling.LANCZOS)
    branding_path = os.path.join(OUTPUT_DIR, "logo-branding.png")
    logo_with_text.save(branding_path, 'PNG')
    print(f"[OK] 已生成: {branding_path} (品牌宣传图)")

def main():
    """主函数"""
    print("=" * 50)
    print("生成主 Logo...")
    print("=" * 50)

    try:
        create_logo_main()

        print("=" * 50)
        print("[OK] Logo 生成完成！")
        print("=" * 50)

        print("\n生成的文件:")
        print("  - logo-main.png (1024x1024px) - 应用图标，无文字")
        print("  - logo-branding.png (1024x1024px) - 品牌宣传图，带文字")

    except Exception as e:
        print(f"[ERROR] 错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
