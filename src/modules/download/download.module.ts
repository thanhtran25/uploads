import { Module } from '@nestjs/common';
import { ExcelDownloaderService } from './excel-downloader.service';
import { DownloadScheduleService } from './download-schedule.service';

@Module({
  providers: [ExcelDownloaderService, DownloadScheduleService],
  exports: [ExcelDownloaderService],
})
export class DownloadModule {}