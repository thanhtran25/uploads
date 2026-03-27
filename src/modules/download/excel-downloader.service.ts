import { Injectable, Logger } from '@nestjs/common';
import { chromium, Download, Locator, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

type DownloadStep = {
  order: number | null;
  menuId?: string;
  subItems?: string[];
};

@Injectable()
export class ExcelDownloaderService {
  private readonly logger = new Logger(ExcelDownloaderService.name);
  private readonly baseDir =
    process.env.PRICEBOARD_DOWNLOAD_DIR?.trim() ||
    path.join(process.cwd(), 'downloads', 'ssi');

  constructor() {
    this.ensureDirExists(this.baseDir);
  }

  private todayDir(): string {
    const date = new Date().toISOString().slice(0, 10);
    return path.join(this.baseDir, date);
  }

  getLatestDir(): string | null {
    if (!fs.existsSync(this.baseDir)) return null;
    const dirs = fs.readdirSync(this.baseDir)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && fs.statSync(path.join(this.baseDir, d)).isDirectory())
      .sort()
      .reverse();
    return dirs.length ? path.join(this.baseDir, dirs[0]) : null;
  }

  loadFilesFromDir(dir: string): { buffer: Buffer; originalname: string }[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => ({
        buffer: fs.readFileSync(path.join(dir, f)),
        originalname: f,
      }));
  }

  cleanupOldDirs(): void {
    if (!fs.existsSync(this.baseDir)) return;
    const today = new Date().toISOString().slice(0, 10);
    const dirs = fs.readdirSync(this.baseDir)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < today);

    for (const dir of dirs) {
      const fullPath = path.join(this.baseDir, dir);
      fs.rmSync(fullPath, { recursive: true, force: true });
      this.logger.log(`Cleaned up old download dir: ${fullPath}`);
    }
  }

  /**
   * Tự động vào trang web và tải file Excel
   */
  async downloadExcelFromSite(): Promise<string> {
    const dir = this.todayDir();
    this.ensureDirExists(dir);
    this._currentDownloadDir = dir;

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
      this.logger.log(`Downloading SSI data → ${dir}`);
      const response = await page.goto('https://iboard.ssi.com.vn');
      this.logger.log(`Status: ${response?.status()}`);
      await page.waitForLoadState('domcontentloaded');

      await this.acceptTermsIfPresent(page);
      await this.switchToEnglish(page);

      const steps: DownloadStep[] = [
        { order: null },
        { order: 1, menuId: 'priceboardMenu-vn30', subItems: ['VN100'] },
        { order: 2 },
        { order: 3 },
        { order: 4, menuId: 'priceboardMenu-hnx', subItems: ['HNX', 'HNX Bond'] },
        { order: 5 },
        { order: 9, menuId: 'priceboardMenu-derivatives', subItems: ['Derivatives'] },
        { order: 9, menuId: 'priceboardMenu-rc-menu-more', subItems: ['Covered Warrants'] },
      ];

      for (const step of steps) {
        await this.downloadStep(page, step);
      }

      this.logger.log(`All SSI downloads complete → ${dir}`);
      return dir;
    } catch (error) {
      this.logger.error('Download failed', error);
      throw error;
    } finally {
      this._currentDownloadDir = undefined;
      await browser.close();
    }
  }

  private _currentDownloadDir?: string;

  private ensureDirExists(dir: string): void {
    if (fs.existsSync(dir)) return;
    try {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created directory: ${dir}`);
    } catch (error) {
      this.logger.error(`Cannot create directory: ${dir}`, error);
      throw error;
    }
  }

  private async findExportButton(
    page: Page,
    selector: string,
    timeoutMs = 5000,
  ): Promise<Locator | null> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const frames = [page.mainFrame(), ...page.frames()];
      for (const frame of frames) {
        const locator = frame.locator(selector);
        if ((await locator.count()) > 0) {
          return locator.first();
        }
      }

      await page.waitForTimeout(200);
    }

    return null;
  }

  private async switchToEnglish(page: Page): Promise<void> {
    this.logger.log('Chuyển ngôn ngữ sang English nếu có...');
    try {
      const dropdownButton = page.locator(
        '#languageSwitcher .dropdown-button',
      );
      await dropdownButton.first().waitFor({ state: 'visible', timeout: 5000 });
      await dropdownButton.first().click({ timeout: 3000 });

      const englishItem = page.locator(
        '#languageSwitcher .dropdown-menu li span:text("English")',
      );
      await englishItem.first().waitFor({ state: 'visible', timeout: 3000 });
      await englishItem.first().click({ timeout: 3000 });
      await page.locator('#languageSwitcher .dropdown-menu').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      this.logger.log('Đã chuyển ngôn ngữ sang English.');
    } catch (error) {
      this.logger.log(
        'Không tìm thấy nút chuyển English, giữ nguyên ngôn ngữ.',
      );
    }
  }

  private async acceptTermsIfPresent(page: Page): Promise<void> {
    this.logger.log('Xác nhận điều khoản ngay khi vào trang (nếu có)...');
    try {
      const modal = page.locator('.confirm-modal-tnc[role="dialog"]');
      await modal.first().waitFor({ state: 'visible', timeout: 1000 });

      const confirmButton = modal.getByRole('button', { name: /xác nhận/i });
      await confirmButton.first().click({ timeout: 1000 });
      this.logger.log('Đã bấm nút Xác nhận trên popup.');
      await modal.first().waitFor({ state: 'hidden', timeout: 3000 });
    } catch (error) {
      this.logger.warn('Không thể bấm popup điều khoản, tiếp tục tải.', error);
    }
  }

  private async downloadStep(page: Page, step: DownloadStep): Promise<string> {
    if (step.menuId && step.subItems?.length) {
      let lastPath = '';
      for (const subItem of step.subItems) {
        await this.switchBoardSubItem(page, step.menuId, subItem);
        lastPath = await this.triggerDownload(page, step.order);
      }
      return lastPath;
    }

    if (step.order !== null) {
      await this.switchBoard(page, step.order);
    }
    return this.triggerDownload(page, step.order);
  }

  private async switchBoard(page: Page, order: number): Promise<void> {
    this.logger.log(`Chuyển tab priceboard order ${order}...`);

    const item = page.locator(
      `li.price-board-menu-overflow-item[style*="order: ${order}"]`,
    );

    await item.first().waitFor({ state: 'visible', timeout: 5000 });
    await item.first().click({ timeout: 3000 });
    await page.locator(
      `li.price-board-menu-submenu-selected[style*="order: ${order}"], li.price-board-menu-item-selected[style*="order: ${order}"]`,
    ).first().waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
  }

  private async switchBoardSubItem(
    page: Page,
    menuId: string,
    subItemText: string,
  ): Promise<void> {
    this.logger.log(`Chuyển submenu "${menuId}" → "${subItemText}"...`);

    const tabTitle = page.locator(`div[data-menu-id="${menuId}"]`);
    await tabTitle.first().waitFor({ state: 'attached', timeout: 5000 });

    // The tab may be visually obscured by other menu items (e.g. Watchlist).
    // Dispatch mouseover/mouseenter on both the <li> parent and <div> child
    // to trigger rc-menu's hover handler via React's event delegation.
    await page.evaluate((id) => {
      const div = document.querySelector(`div[data-menu-id="${id}"]`);
      const li = div?.closest('li.price-board-menu-submenu');
      for (const el of [li, div]) {
        if (!el) continue;
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      }
    }, menuId);

    const popup = page.locator(`#${menuId}-popup`);
    await popup.waitFor({ state: 'visible', timeout: 5000 });

    const subItem = popup.locator(`li:has-text("${subItemText}")`);
    await subItem.first().waitFor({ state: 'visible', timeout: 3000 });

    await subItem.first().click({ timeout: 3000 });
    await popup.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }

  private async triggerDownload(
    page: Page,
    order: number | null,
  ): Promise<string> {
    this.logger.log(
      `Waiting for download button #btnExportPriceboard (order ${
        order ?? 'default'
      })...`,
    );

    await page.waitForTimeout(1000);

    const downloadLocator = await this.findExportButton(
      page,
      '#btnExportPriceboard',
    );

    if (!downloadLocator) {
      throw new Error('Không tìm thấy nút tải Excel #btnExportPriceboard');
    }

    const downloadPromise = page.waitForEvent('download', {
      timeout: 30_000,
    });

    this.logger.log('Clicking download button...');
    await downloadLocator.scrollIntoViewIfNeeded();
    await downloadLocator.click({ timeout: 5000 });

    const download: Download = await downloadPromise;
    const suggestedName = download.suggestedFilename();
    const saveDir = this._currentDownloadDir || this.todayDir();
    const savePath = path.join(saveDir, suggestedName);

    await download.saveAs(savePath);
    this.logger.log(
      `✅ File downloaded${order ? ` (order ${order})` : ''}: ${savePath}`,
    );

    return savePath;
  }
}
