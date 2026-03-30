import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page, ElementHandle, CDPSession } from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

const T = {
  navigation: 15_000,
  networkIdle: 10_000,
  appear: 3_000,
  action: 2_000,
  download: 10_000,
} as const;

const CHROMIUM_PATH =
  process.env.CHROMIUM_PATH ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/chromium-browser');

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

  private _currentDownloadDir?: string;
  private _cdp?: CDPSession;

  constructor() {
    this.ensureDirExists(this.baseDir);
  }

  private todayDir(): string {
    const date = new Date().toISOString().slice(0, 10);
    return path.join(this.baseDir, date);
  }

  getLatestDir(): string | null {
    if (!fs.existsSync(this.baseDir)) return null;
    const dirs = fs
      .readdirSync(this.baseDir)
      .filter(
        (d) =>
          /^\d{4}-\d{2}-\d{2}$/.test(d) &&
          fs.statSync(path.join(this.baseDir, d)).isDirectory(),
      )
      .sort()
      .reverse();
    return dirs.length ? path.join(this.baseDir, dirs[0]) : null;
  }

  loadFilesFromDir(dir: string): { buffer: Buffer; originalname: string }[] {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => ({
        buffer: fs.readFileSync(path.join(dir, f)),
        originalname: f,
      }));
  }

  cleanupOldDirs(): void {
    if (!fs.existsSync(this.baseDir)) return;
    const today = new Date().toISOString().slice(0, 10);
    const dirs = fs
      .readdirSync(this.baseDir)
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

    const headless = process.env.HEADLESS !== 'false';
    const browser = await puppeteer.launch({
      headless,
      executablePath: CHROMIUM_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--single-process',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--no-first-run',
        '--js-flags=--max-old-space-size=128',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );

    this._cdp = await page.createCDPSession();
    await this._cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      downloadPath: path.resolve(dir),
      eventsEnabled: true,
    });

    try {
      this.logger.log(`Starting SSI download → ${dir}`);
      await page.goto('https://iboard.ssi.com.vn', {
        waitUntil: 'domcontentloaded',
        timeout: T.navigation,
      });
      await page
        .waitForNetworkIdle({ idleTime: 500, timeout: T.networkIdle })
        .catch(() => {});

      await this.acceptTermsIfPresent(page);
      await this.switchToEnglish(page);

      const steps: DownloadStep[] = [
        { order: 2 },
        { order: 3 },
        { order: 5 },
        {
          order: 9,
          menuId: 'priceboardMenu-derivatives',
          subItems: ['Derivatives'],
        },
        {
          order: 9,
          menuId: 'priceboardMenu-rc-menu-more',
          subItems: ['Covered Warrants'],
        },
        {
          order: 1,
          menuId: 'priceboardMenu-vn30',
          subItems: ['VN30', 'VN100'],
        },
        {
          order: 4,
          menuId: 'priceboardMenu-hnx',
          subItems: ['HNX', 'HNX Bond'],
        },
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
      this._cdp = undefined;
      await browser.close();
    }
  }

  // ── Helpers ──────────────────────────────────────────────────

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
  ): Promise<ElementHandle | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const frames = [page.mainFrame(), ...page.frames()];
      for (const frame of frames) {
        const el = await frame.$(selector);
        if (el) return el;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  }

  /**
   * Wait for a CDP download to complete, then rename GUID → suggestedFilename.
   * `allowAndName` saves with GUID; we rename once `downloadProgress` reports 'completed'.
   */
  private waitForCdpDownload(dir: string, timeoutMs: number): Promise<string> {
    const cdp = this._cdp!;
    return new Promise<string>((resolve, reject) => {
      let suggestedFilename = '';

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Download timeout'));
      }, timeoutMs);

      const onBegin = (e: any) => {
        suggestedFilename = e.suggestedFilename;
      };

      const onProgress = (e: any) => {
        if (e.state === 'completed') {
          cleanup();
          const guidPath = path.join(dir, e.guid);
          const finalPath = path.join(dir, suggestedFilename);
          if (fs.existsSync(guidPath)) {
            fs.renameSync(guidPath, finalPath);
          }
          this.logger.log(`✅ ${suggestedFilename}`);
          resolve(finalPath);
        } else if (e.state === 'canceled') {
          cleanup();
          reject(new Error('Download canceled'));
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        cdp.off('Browser.downloadWillBegin', onBegin);
        cdp.off('Browser.downloadProgress', onProgress);
      };

      cdp.on('Browser.downloadWillBegin', onBegin);
      cdp.on('Browser.downloadProgress', onProgress);
    });
  }

  // ── Page interactions ────────────────────────────────────────

  private async switchToEnglish(page: Page): Promise<void> {
    try {
      await page.waitForSelector('#languageSwitcher .dropdown-button', {
        visible: true,
        timeout: T.appear,
      });
      await page.click('#languageSwitcher .dropdown-button');

      await page.waitForSelector(
        '#languageSwitcher .dropdown-menu li span',
        { visible: true, timeout: T.action },
      );

      const spans = await page.$$('#languageSwitcher .dropdown-menu li span');
      for (const span of spans) {
        const text = await span.evaluate((el) => el.textContent?.trim());
        if (text === 'English') {
          await span.click();
          break;
        }
      }

      await page
        .waitForSelector('#languageSwitcher .dropdown-menu', {
          hidden: true,
          timeout: T.action,
        })
        .catch(() => {});
    } catch {
      // Language switcher not found, continue with current language
    }
  }

  private async acceptTermsIfPresent(page: Page): Promise<void> {
    try {
      await page.waitForSelector('.confirm-modal-tnc[role="dialog"]', {
        visible: true,
        timeout: T.action,
      });

      const buttons = await page.$$(
        '.confirm-modal-tnc[role="dialog"] button',
      );
      for (const btn of buttons) {
        const text = await btn.evaluate((el) =>
          el.textContent?.trim().toLowerCase(),
        );
        if (text?.includes('xác nhận')) {
          await btn.click();
          break;
        }
      }

      await page
        .waitForSelector('.confirm-modal-tnc[role="dialog"]', {
          hidden: true,
          timeout: T.action,
        })
        .catch(() => {});
    } catch {
      // No terms modal present, continue
    }
  }

  // ── Download flow ────────────────────────────────────────────

  private async downloadStep(
    page: Page,
    step: DownloadStep,
  ): Promise<string> {
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
    const selector = `li.price-board-menu-overflow-item[style*="order: ${order}"]`;
    await page.waitForSelector(selector, {
      visible: true,
      timeout: T.appear,
    });
    await page.click(selector);

    await page
      .waitForSelector(
        `li.price-board-menu-submenu-selected[style*="order: ${order}"], li.price-board-menu-item-selected[style*="order: ${order}"]`,
        { timeout: T.action },
      )
      .catch(() => {});
  }

  private async switchBoardSubItem(
    page: Page,
    menuId: string,
    subItemText: string,
  ): Promise<void> {
    await page.waitForSelector(`div[data-menu-id="${menuId}"]`, {
      timeout: T.appear,
    });

    await page.evaluate((id) => {
      const div = document.querySelector(`div[data-menu-id="${id}"]`);
      const li = div?.closest('li.price-board-menu-submenu');
      for (const el of [li, div]) {
        if (!el) continue;
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      }
    }, menuId);

    const popupSelector = `#${menuId}-popup`;
    await page.waitForSelector(popupSelector, {
      visible: true,
      timeout: T.appear,
    });

    const items = await page.$$(`${popupSelector} li`);
    for (const item of items) {
      const text = await item.evaluate((el) => el.textContent?.trim());
      if (text?.includes(subItemText)) {
        await item.click();
        break;
      }
    }

    await page
      .waitForSelector(popupSelector, { hidden: true, timeout: T.action })
      .catch(() => {});
  }

  private async triggerDownload(
    page: Page,
    order: number | null,
  ): Promise<string> {
    await new Promise((r) => setTimeout(r, 1_000));

    const btn = await this.findExportButton(
      page,
      '#btnExportPriceboard',
      5_000,
    );
    if (!btn) {
      throw new Error('Không tìm thấy nút tải Excel #btnExportPriceboard');
    }

    const dir = this._currentDownloadDir || this.todayDir();
    const downloadPromise = this.waitForCdpDownload(dir, T.download);

    await btn.evaluate((el) =>
      el.scrollIntoView({ block: 'center' }),
    );
    await btn.click();

    const savePath = await downloadPromise;
    return savePath;
  }
}
