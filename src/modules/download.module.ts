import { Module } from '@nestjs/common';
import { DownloadController } from '@controllers/download.controller';
import { ExcelDownloaderService } from '@services/excel-downloader.service';
import { DownloadScheduleService } from '@services/download-schedule.service';

@Module({
  controllers: [DownloadController],
  providers: [ExcelDownloaderService, DownloadScheduleService],
  exports: [ExcelDownloaderService],
})
export class DownloadModule {}
