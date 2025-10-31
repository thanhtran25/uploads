import * as fs from 'fs';
import * as path from 'path';

export function createIfNotExists(dirPath: string): string {
    const absolutePath = path.resolve(dirPath);
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
      this.logger.log(`📁 Created: ${absolutePath}`);
    }
    return absolutePath;
  }

export function   createDefaultFolders(): void {
    const defaultDirs = [
      path.resolve(__dirname, '../../downloads'),
      path.resolve(__dirname, '../../logs'),
    ];
    for (const dir of defaultDirs) {
      this.createIfNotExists(dir);
    }
  }
