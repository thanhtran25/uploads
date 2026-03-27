import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express/multer';
import { BrokersService } from './brokers.service';

type UploadedFile = { buffer: Buffer; originalname: string };

@Controller('brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  /**
   * Compare using latest downloaded SSI data (from cron job).
   * GET /brokers/compare
   */
  @Get('compare')
  compareLatest() {
    return this.brokersService.compareLatest();
  }

  /**
   * Download SSI CSV files, then compare.
   * GET /brokers/compare/download
   */
  @Get('compare/download')
  compareWithDownload() {
    return this.brokersService.compareWithDownload();
  }

  /**
   * Compare using uploaded CSV files.
   * POST /brokers/compare/upload
   */
  @Post('compare/upload')
  @UseInterceptors(FilesInterceptor('files', 20))
  compare(@UploadedFiles() files: UploadedFile[]) {
    if (!files?.length) {
      return { message: 'No files uploaded', data: {} };
    }
    return this.brokersService.compare(files);
  }

  /**
   * Nhận list file CSV (multipart/form-data, field name: "files").
   * Trả về object: key = tên file (không extension), value = data đã mapData.
   */
  @Post('ssi/csv')
  @UseInterceptors(FilesInterceptor('files', 20))
  uploadSsiCsv(@UploadedFiles() files: UploadedFile[]) {
    if (!files?.length) {
      return { message: 'No files uploaded', data: {} };
    }
    return this.brokersService.handleSSIDataFromFiles(files);
  }
}
