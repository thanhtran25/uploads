import { Controller, Get } from '@nestjs/common';
import { ExcelDownloaderService } from '@services/excel-downloader.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly excelDownloader: ExcelDownloaderService) {}

  @Get('trigger')
  async triggerDownload() {
    const dir = await this.excelDownloader.downloadExcelFromSite();
    return { message: 'Download successful', dir };
  }

  @Get('cleanup')
  cleanup() {
    this.excelDownloader.cleanupOldDirs();
    return { message: 'Cleanup complete' };
  }
}
