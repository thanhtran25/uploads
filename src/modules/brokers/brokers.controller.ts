import {
  Controller,
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
   * So sánh dữ liệu SSI (từ list file CSV upload) với dữ liệu KIS.
   * POST /brokers/compare  (multipart/form-data, field name: "files")
   */
  @Post('compare')
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
