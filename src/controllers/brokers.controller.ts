import {
  Controller,
  Get,
  Logger,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express/multer';
import { BrokersService } from '@services/brokers.service';

type UploadedFile = { buffer: Buffer; originalname: string };

@Controller('brokers')
export class BrokersController {
  private readonly logger = new Logger(BrokersController.name);

  constructor(private readonly brokersService: BrokersService) {}

  @Get('compare')
  compareLatest() {
    this.logger.log('GET /brokers/compare');
    return this.brokersService.compareLatest();
  }

  @Get('compare/download')
  compareWithDownload() {
    this.logger.log('GET /brokers/compare/download');
    return this.brokersService.compareWithDownload();
  }

  @Post('compare/upload')
  @UseInterceptors(FilesInterceptor('files', 20))
  compare(@UploadedFiles() files: UploadedFile[]) {
    this.logger.log(`POST /brokers/compare/upload (${files?.length ?? 0} files)`);
    if (!files?.length) {
      return { message: 'No files uploaded', data: {} };
    }
    return this.brokersService.compare(files);
  }

  @Post('ssi/csv')
  @UseInterceptors(FilesInterceptor('files', 20))
  uploadSsiCsv(@UploadedFiles() files: UploadedFile[]) {
    this.logger.log(`POST /brokers/ssi/csv (${files?.length ?? 0} files)`);
    if (!files?.length) {
      return { message: 'No files uploaded', data: {} };
    }
    return this.brokersService.handleSSIDataFromFiles(files);
  }
}
