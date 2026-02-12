#!/usr/bin/env node

/**
 * 设计资源自动处理脚本
 *
 * 功能：
 * 1. 验证设计文件的尺寸、格式
 * 2. 生成所需的其他尺寸变体
 * 3. 自动归档到正确的项目位置
 * 4. 更新配置文件
 * 5. 生成验收报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  // 设计输出目录（UI 软件生成的文件放这里）
  designOutputDir: path.join(__dirname, '../design-output'),

  // 项目资源目录
  webAssetsDir: path.join(__dirname, '../packages/web/public/assets'),
  miniprogramAssetsDir: path.join(__dirname, '../packages/miniprogram/miniprogram/assets'),
  miniprogramIconsDir: path.join(__dirname, '../packages/miniprogram/miniprogram/assets/icons'),

  // 文件规格定义
  specs: {
    'logo-main.png': {
      expectedSize: { width: 1024, height: 1024 },
      variants: [
        { name: 'logo-144.png', size: 144, dest: 'miniprogram-root' },
        { name: 'logo-120.png', size: 120, dest: 'miniprogram-assets' },
        { name: 'logo-64.png', size: 64, dest: 'web-assets' },
        { name: 'logo-40.png', size: 40, dest: 'web-assets' }
      ]
    },
    'favicon.png': {
      expectedSize: { width: 512, height: 512 },
      variants: [
        { name: 'favicon-32.png', size: 32, dest: 'web-assets' },
        { name: 'favicon-16.png', size: 16, dest: 'web-assets' }
      ]
    },
    'tabbar-home.png': {
      expectedSize: { width: 162, height: 162 },
      variants: [{ name: 'home.png', size: 162, dest: 'miniprogram-icons' }]
    },
    'tabbar-home-active.png': {
      expectedSize: { width: 162, height: 162 },
      variants: [{ name: 'home-active.png', size: 162, dest: 'miniprogram-icons' }]
    },
    'tabbar-list.png': {
      expectedSize: { width: 162, height: 162 },
      variants: [{ name: 'list.png', size: 162, dest: 'miniprogram-icons' }]
    },
    'tabbar-list-active.png': {
      expectedSize: { width: 162, height: 162 },
      variants: [{ name: 'list-active.png', size: 162, dest: 'miniprogram-icons' }]
    },
    'tabbar-user.png': {
      expectedSize: { width: 162, height: 162 },
      variants: [{ name: 'user.png', size: 162, dest: 'miniprogram-icons' }]
    },
    'tabbar-user-active.png': {
      expectedSize: { width: 162, height: 162 },
      variants: [{ name: 'user-active.png', size: 162, dest: 'miniprogram-icons' }]
    },
    'marker-user.png': {
      expectedSize: { width: 96, height: 96 },
      variants: [{ name: 'user-marker.png', size: 96, dest: 'miniprogram-icons' }]
    },
    'marker-restaurant.png': {
      expectedSize: { width: 96, height: 96 },
      variants: [{ name: 'restaurant-marker.png', size: 96, dest: 'miniprogram-icons' }]
    }
  }
};

// 验证报告
const report = {
  timestamp: new Date().toISOString(),
  validated: [],
  errors: [],
  warnings: [],
  processed: [],
  skipped: []
};

/**
 * 检查必要的工具是否安装
 */
function checkDependencies() {
  console.log('🔍 检查依赖工具...\n');

  try {
    // 检查 ImageMagick (用于图片处理)
    execSync('magick -version', { stdio: 'ignore' });
    console.log('✅ ImageMagick 已安装');
  } catch (error) {
    console.log('⚠️  ImageMagick 未安装，将使用备用方案');
    report.warnings.push('ImageMagick 未安装，某些图片处理功能可能受限');
  }

  console.log('');
}

/**
 * 获取图片尺寸（使用 ImageMagick 或备用方案）
 */
function getImageSize(filePath) {
  try {
    // 尝试使用 ImageMagick
    const output = execSync(`magick identify -format "%wx%h" "${filePath}"`, { encoding: 'utf8' });
    const [width, height] = output.trim().split('x').map(Number);
    return { width, height };
  } catch (error) {
    // 备用方案：读取 PNG 文件头
    const buffer = fs.readFileSync(filePath);
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    throw new Error('无法读取图片尺寸');
  }
}

/**
 * 验证单个文件
 */
function validateFile(fileName) {
  const filePath = path.join(CONFIG.designOutputDir, fileName);
  const spec = CONFIG.specs[fileName];

  if (!spec) {
    report.warnings.push(`未知文件: ${fileName}`);
    return false;
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    report.errors.push(`文件不存在: ${fileName}`);
    return false;
  }

  // 检查文件格式
  if (!fileName.endsWith('.png')) {
    report.errors.push(`文件格式错误: ${fileName} (需要 PNG 格式)`);
    return false;
  }

  // 检查文件尺寸
  try {
    const size = getImageSize(filePath);
    const expected = spec.expectedSize;

    if (size.width !== expected.width || size.height !== expected.height) {
      report.errors.push(
        `尺寸不符: ${fileName} (期望 ${expected.width}x${expected.height}, 实际 ${size.width}x${size.height})`
      );
      return false;
    }

    report.validated.push({
      file: fileName,
      size: `${size.width}x${size.height}`,
      status: 'valid'
    });

    return true;
  } catch (error) {
    report.errors.push(`无法验证: ${fileName} - ${error.message}`);
    return false;
  }
}

/**
 * 生成图片变体
 */
function generateVariants(sourceFile) {
  const sourcePath = path.join(CONFIG.designOutputDir, sourceFile);
  const spec = CONFIG.specs[sourceFile];

  if (!spec.variants || spec.variants.length === 0) {
    return;
  }

  console.log(`📐 生成 ${sourceFile} 的变体...`);

  spec.variants.forEach(variant => {
    try {
      const destDir = getDestinationDir(variant.dest);
      const destPath = path.join(destDir, variant.name);

      // 确保目标目录存在
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // 使用 ImageMagick 调整尺寸
      try {
        execSync(
          `magick "${sourcePath}" -resize ${variant.size}x${variant.size} "${destPath}"`,
          { stdio: 'ignore' }
        );
        console.log(`  ✅ ${variant.name} (${variant.size}x${variant.size})`);
        report.processed.push({
          source: sourceFile,
          output: variant.name,
          size: `${variant.size}x${variant.size}`,
          destination: variant.dest
        });
      } catch (error) {
        // 备用方案：直接复制原文件
        fs.copyFileSync(sourcePath, destPath);
        report.warnings.push(`${variant.name} 使用原始尺寸（无法调整大小）`);
      }
    } catch (error) {
      report.errors.push(`生成变体失败: ${variant.name} - ${error.message}`);
    }
  });

  console.log('');
}

/**
 * 获取目标目录
 */
function getDestinationDir(dest) {
  switch (dest) {
    case 'web-assets':
      return CONFIG.webAssetsDir;
    case 'miniprogram-assets':
      return CONFIG.miniprogramAssetsDir;
    case 'miniprogram-icons':
      return CONFIG.miniprogramIconsDir;
    case 'miniprogram-root':
      return path.join(__dirname, '../packages/miniprogram/miniprogram');
    default:
      throw new Error(`未知的目标位置: ${dest}`);
  }
}

/**
 * 生成验收报告
 */
function generateReport() {
  const reportPath = path.join(CONFIG.designOutputDir, 'processing-report.md');

  let content = '# 设计资源处理报告\n\n';
  content += `> 生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  content += '---\n\n';

  // 验证结果
  content += '## 一、文件验证\n\n';
  if (report.validated.length > 0) {
    content += '### ✅ 验证通过\n\n';
    content += '| 文件名 | 尺寸 | 状态 |\n';
    content += '|--------|------|------|\n';
    report.validated.forEach(item => {
      content += `| ${item.file} | ${item.size} | ${item.status} |\n`;
    });
    content += '\n';
  }

  // 错误
  if (report.errors.length > 0) {
    content += '### ❌ 错误\n\n';
    report.errors.forEach(error => {
      content += `- ${error}\n`;
    });
    content += '\n';
  }

  // 警告
  if (report.warnings.length > 0) {
    content += '### ⚠️ 警告\n\n';
    report.warnings.forEach(warning => {
      content += `- ${warning}\n`;
    });
    content += '\n';
  }

  // 处理结果
  if (report.processed.length > 0) {
    content += '---\n\n';
    content += '## 二、文件处理\n\n';
    content += '| 源文件 | 输出文件 | 尺寸 | 目标位置 |\n';
    content += '|--------|----------|------|----------|\n';
    report.processed.forEach(item => {
      content += `| ${item.source} | ${item.output} | ${item.size} | ${item.destination} |\n`;
    });
    content += '\n';
  }

  // 总结
  content += '---\n\n';
  content += '## 三、处理总结\n\n';
  content += `- ✅ 验证通过：${report.validated.length} 个文件\n`;
  content += `- 📐 生成变体：${report.processed.length} 个文件\n`;
  content += `- ❌ 错误：${report.errors.length} 个\n`;
  content += `- ⚠️ 警告：${report.warnings.length} 个\n`;

  fs.writeFileSync(reportPath, content, 'utf8');
  console.log(`📄 报告已生成: ${reportPath}\n`);
}

/**
 * 主流程
 */
function main() {
  console.log('🎨 Ontheway 设计资源自动处理\n');
  console.log('='.repeat(50) + '\n');

  // 检查依赖
  checkDependencies();

  // 检查设计输出目录
  if (!fs.existsSync(CONFIG.designOutputDir)) {
    console.log(`❌ 设计输出目录不存在: ${CONFIG.designOutputDir}`);
    console.log('请先创建目录并放入设计文件\n');
    process.exit(1);
  }

  // 获取所有文件
  const files = fs.readdirSync(CONFIG.designOutputDir).filter(f => f.endsWith('.png'));

  if (files.length === 0) {
    console.log('❌ 设计输出目录中没有 PNG 文件\n');
    process.exit(1);
  }

  console.log(`📦 找到 ${files.length} 个文件\n`);

  // 验证所有文件
  console.log('🔍 验证文件...\n');
  const expectedFiles = Object.keys(CONFIG.specs);
  let allValid = true;

  expectedFiles.forEach(fileName => {
    const isValid = validateFile(fileName);
    if (!isValid) {
      allValid = false;
    }
  });

  console.log('');

  // 如果有错误，停止处理
  if (report.errors.length > 0) {
    console.log('❌ 验证失败，请修复以下问题：\n');
    report.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
    console.log('');
    generateReport();
    process.exit(1);
  }

  console.log('✅ 所有文件验证通过\n');
  console.log('='.repeat(50) + '\n');

  // 生成变体并归档
  console.log('📐 生成变体并归档...\n');
  expectedFiles.forEach(fileName => {
    generateVariants(fileName);
  });

  // 生成报告
  console.log('='.repeat(50) + '\n');
  generateReport();

  // 最终总结
  console.log('✅ 处理完成！\n');
  console.log(`📊 统计：`);
  console.log(`  - 验证通过：${report.validated.length} 个文件`);
  console.log(`  - 生成变体：${report.processed.length} 个文件`);
  console.log(`  - 警告：${report.warnings.length} 个`);
  console.log('');

  if (report.warnings.length > 0) {
    console.log('⚠️  请查看报告了解警告详情\n');
  }
}

// 运行
try {
  main();
} catch (error) {
  console.error('❌ 处理失败:', error.message);
  process.exit(1);
}
