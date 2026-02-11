import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  try {
    // 检查文件是否存在
    const serverPath = join(__dirname, '../packages/server/dist/app.js');
    const exists = existsSync(serverPath);
    
    if (!exists) {
      // 列出目录内容
      const packagesDir = join(__dirname, '../packages');
      const serverDir = join(__dirname, '../packages/server');
      
      return res.json({
        error: 'app.js not found',
        serverPath,
        packagesExists: existsSync(packagesDir),
        serverExists: existsSync(serverDir),
        packagesDirContent: existsSync(packagesDir) ? readdirSync(packagesDir) : [],
        serverDirContent: existsSync(serverDir) ? readdirSync(serverDir) : []
      });
    }
    
    // 动态导入
    const { default: app } = await import(serverPath);
    return app(req, res);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
