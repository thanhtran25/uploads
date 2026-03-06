import { Controller, Get, Query } from '@nestjs/common';
import { ExcelDownloaderService } from './excel-downloader.service';

type EkycListFilterQuery = {
  card_id?: string;
  full_name?: string;
  page?: string;
  max_size?: string;
  start_date?: string;
  end_date?: string;
};

@Controller('download')
export class DownloadController {
  constructor(private readonly excelDownloader: ExcelDownloaderService) {}

  @Get('excel')
  async triggerDownload() {
    const filePath = await this.excelDownloader.downloadExcelFromSite();
    return { message: 'Download successful', filePath };
  }

  @Get('ekyc/list-filter')
  async getEkycListFilter(@Query() query: EkycListFilterQuery) {
    const data = await this.excelDownloader.fetchEkycListFilter({
      card_id: query.card_id ?? '',
      full_name: query.full_name ?? '',
      page: this.parseNumber(query.page, 1),
      max_size: this.parseNumber(query.max_size, 1000),
      start_date: query.start_date,
      end_date: query.end_date,
    });

    return { message: 'Fetch eKYC list filter successful', data };
  }

  private parseNumber(value: string | undefined, fallback: number): number {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return fallback;
    }
    return parsedValue;
  }
}
