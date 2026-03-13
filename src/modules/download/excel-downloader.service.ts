import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { chromium, Download, Locator, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '@shared/config/env.config';

type EkycListFilterParams = {
  card_id?: string;
  full_name?: string;
  page?: number;
  max_size?: number;
  start_date?: string;
  end_date?: string;
};

@Injectable()
export class ExcelDownloaderService {
  private readonly logger = new Logger(ExcelDownloaderService.name);
  private readonly downloadDir =
    process.env.PRICEBOARD_DOWNLOAD_DIR?.trim() ||
    path.join(process.cwd(), 'test');
  private readonly ekycCacheDir = path.join(this.downloadDir, 'ekyc-cache');

  constructor() {
    // Tạo thư mục lưu file nếu chưa có
    this.ensureDirExists(this.downloadDir);
    this.ensureDirExists(this.ekycCacheDir);
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
      const response = await page.goto('https://iboard.ssi.com.vn');
      this.logger.log(`Status: ${response?.status()}`);
      this.logger.log(`URL: ${response?.url()}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      await this.acceptTermsIfPresent(page);

      // Nếu cần login: thêm logic ở đây
      // await this.login(page);

      this.logger.log('Waiting for download button #btnExportPriceboard ...');
      const downloadLocator = await this.findExportButton(
        page,
        '#btnExportPriceboard',
      );

      if (!downloadLocator) {
        throw new Error('Không tìm thấy nút tải Excel #btnExportPriceboard');
      }

      const downloadPromise = page.waitForEvent('download', {
        timeout: 30000,
      });

      this.logger.log('Clicking download button...');
      await downloadLocator.scrollIntoViewIfNeeded();
      await downloadLocator.click({ timeout: 5000 });

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
    timeoutMs = 15000,
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

      await page.waitForTimeout(500);
    }

    return null;
  }

  private async acceptTermsIfPresent(page: Page): Promise<void> {
    this.logger.log('Xác nhận điều khoản ngay khi vào trang (nếu có)...');
    try {
      const modal = page.locator('.confirm-modal-tnc[role=\"dialog\"]');
      await modal.first().waitFor({ state: 'visible', timeout: 3000 });

      const confirmButton = modal.getByRole('button', { name: /xác nhận/i });
      await confirmButton.first().click({ timeout: 5000 });
      this.logger.log('Đã bấm nút Xác nhận trên popup.');
      await page.waitForTimeout(5000);
    } catch (error) {
      this.logger.warn('Không thể bấm popup điều khoản, tiếp tục tải.', error);
    }
  }

  async fetchEkycListFilter(
    params: EkycListFilterParams = {},
  ): Promise<unknown> {
    const authorization = Config.IDG_EKYC_AUTHORIZATION;
    const tokenId = Config.IDG_EKYC_TOKEN_ID;
    const tokenKey = Config.IDG_EKYC_TOKEN_KEY;

    const requestParams = {
      card_id: params.card_id ?? '',
      full_name: params.full_name ?? '',
      page: params.page ?? 1,
      max_size: params.max_size ?? 1000,
      start_date: params.start_date ?? this.getTodayAsMMDDYYYY(),
      end_date: params.end_date ?? this.getTodayAsMMDDYYYY(),
    };

    const authHeader = authorization.toLowerCase().startsWith('bearer ')
      ? authorization
      : `bearer ${authorization}`;

    const cacheFilePath = this.getEkycCacheFilePath(
      requestParams.start_date,
      requestParams.end_date,
    );

    if (fs.existsSync(cacheFilePath)) {
      this.logger.log(`Using cached eKYC file: ${cacheFilePath}`);
      const cachedData = this.readCachedEkycData(cacheFilePath);
      if (cachedData) {
        return this.handleData(cachedData);
      }
    }

    try {
      const response = await axios.get(
        'https://api.idg.vnpt.vn/log-service/ekyc/list-filter',
        {
          params: requestParams,
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
            Authorization: authHeader,
            Connection: 'keep-alive',
            'Content-Type': 'application/json',
            Origin: 'https://ekyc.vnpt.vn',
            Referer: 'https://ekyc.vnpt.vn/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Token-id': tokenId,
            'Token-key': tokenKey,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'sec-ch-ua':
              '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
          },
        },
      );

      const data = response.data.object.data;

      fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
      this.logger.log(`Saved eKYC cache file: ${cacheFilePath}`);

      return this.handleData(data);
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status ?? 'N/A'
        : 'N/A';
      this.logger.error(
        `Failed to fetch eKYC list filter. Status: ${status}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
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

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getTodayAsMMDDYYYY(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate() - 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private getEkycCacheFilePath(startDate: string, endDate: string): string {
    const safeStartDate = this.toSafeFilePart(startDate);
    const safeEndDate = this.toSafeFilePart(endDate);
    const fileName = `ekyc-${safeStartDate}-${safeEndDate}.json`;
    return path.join(this.ekycCacheDir, fileName);
  }

  private toSafeFilePart(value: string): string {
    return value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
  }

  private readCachedEkycData(filePath: string): any[] | null {
    try {
      const rawFile = fs.readFileSync(filePath, 'utf-8');
      const parsedFile = JSON.parse(rawFile);
      if (Array.isArray(parsedFile)) {
        return parsedFile;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Invalid cache file, fallback to API: ${filePath}`);
      return null;
    }
  }

  private handleData(data: any[]): any {
    const result = data.filter(
      ({ client_session }) => client_session !== 'KIS_EKYC',
    );

    const iosData = result.filter(({ client_session }) =>
      client_session?.startsWith('IOS'),
    );

    const androidData = result.filter(({ client_session }) =>
      client_session?.startsWith('ANDROID'),
    );

    return {
      iosData: this.mapData(iosData),
      androidData: this.mapData(androidData),
    };
  }

  private mapData(data: any[]) {
    const mappedData = data.map(
      ({
        client_session,
        match_prob,
        ocr_warning,
        valid_liveness_card_back,
        valid_liveness_card_front,
        valid_liveness_face,
        card_id,
      }) => ({
        client_session,
        match_prob,
        ocr_warning,
        valid_liveness_card_back,
        valid_liveness_card_front,
        valid_liveness_face,
        card_id,
      }),
    );

    return mappedData.filter(
      ({ ocr_warning, valid_liveness_face, match_prob }) =>
        Number(ocr_warning) === 1 &&
        Number(valid_liveness_face) === 1 &&
        Number(match_prob) >= 95,
    );
  }
}
