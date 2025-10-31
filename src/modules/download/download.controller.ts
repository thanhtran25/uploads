import { Controller, Get } from '@nestjs/common';
import { ExcelDownloaderService } from './excel-downloader.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly excelDownloader: ExcelDownloaderService) {}

  @Get('excel')
  async triggerDownload() {
    const filePath = await this.excelDownloader.downloadExcelFromSite();
    return { message: 'Download successful', filePath };
  }
}