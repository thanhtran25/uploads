import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExcelDownloaderService } from './excel-downloader.service';

@Injectable()
export class DownloadScheduleService {
  private readonly logger = new Logger(DownloadScheduleService.name);

  constructor(private readonly downloadService: ExcelDownloaderService) {}

  @Cron('0 1 8 * * 1-5', { name: 'ssi-download', timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDownload() {
    this.logger.log('Cron: Starting SSI daily download...');
    try {
      const dir = await this.downloadService.downloadExcelFromSite();
      this.logger.log(`Cron: SSI download complete → ${dir}`);
    } catch (error) {
      this.logger.error('Cron: SSI download failed', error);
    }
  }

  @Cron('0 0 7 * * 1-5', { name: 'ssi-cleanup', timeZone: 'Asia/Ho_Chi_Minh' })
  handleCleanup() {
    this.logger.log('Cron: Cleaning up old SSI downloads...');
    this.downloadService.cleanupOldDirs();
  }
}
