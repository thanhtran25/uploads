import { Module } from '@nestjs/common';
import { ExcelDownloaderService } from './excel-downloader.service';

@Module({
  providers: [ExcelDownloaderService],
  exports: [ExcelDownloaderService],
})
export class DownloadModule {}