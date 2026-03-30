import { Controller, Get, Logger } from '@nestjs/common';
import { ExcelDownloaderService } from '@services/excel-downloader.service';

@Controller('download')
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name);

  constructor(private readonly excelDownloader: ExcelDownloaderService) {}

  @Get('trigger')
  async triggerDownload() {
    this.logger.log('GET /download/trigger');
    const dir = await this.excelDownloader.downloadExcelFromSite();
    return { message: 'Download successful', dir };
  }

  @Get('cleanup')
  cleanup() {
    this.logger.log('GET /download/cleanup');
    this.excelDownloader.cleanupOldDirs();
    return { message: 'Cleanup complete' };
  }
}
