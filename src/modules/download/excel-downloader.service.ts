import { Injectable, Logger } from '@nestjs/common';
import { chromium, Download, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExcelDownloaderService {
  private readonly logger = new Logger(ExcelDownloaderService.name);
  private readonly downloadDir = path.resolve(__dirname, '../../downloads');

  constructor() {
    // Tạo thư mục lưu file nếu chưa có
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
      this.logger.log(`Created download directory: ${this.downloadDir}`);
    }
  }

  /**
   * Tự động vào trang web và tải file Excel
   */
  async downloadExcelFromSite(): Promise<string> {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      acceptDownloads: true,
    });
    const page = await context.newPage();

    try {
      this.logger.log('Navigating to page...');
      await page.goto('https://iboard-query.ssi.com.vn/stock/exchange/hnx?boardId=MAIN');

      // Nếu cần login: thêm logic ở đây
      // await this.login(page);

      this.logger.log('Waiting for download button...');
      // 👉 TODO: Thay selector thực tế của nút tải Excel
      const downloadButtonSelector = '#downloadExcelButton';

      await page.waitForSelector(downloadButtonSelector, { timeout: 10000 });
      const downloadPromise = page.waitForEvent('download');

      this.logger.log('Clicking download button...');
      await page.click(downloadButtonSelector);

      const download: Download = await downloadPromise;
      const suggestedName = download.suggestedFilename();
      const savePath = path.join(this.downloadDir, suggestedName);

      await download.saveAs(savePath);
      this.logger.log(`✅ File downloaded: ${savePath}`);

      return savePath;
    } catch (error) {
      this.logger.error('❌ Download failed', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * (Tùy chọn) Ví dụ login
   */
  private async login(page: Page): Promise<void> {
    this.logger.log('Logging in...');
    await page.fill('#username', 'your_username');
    await page.fill('#password', 'your_password');
    await page.click('#login-button');
    await page.waitForNavigation({ timeout: 10000 });
  }
}