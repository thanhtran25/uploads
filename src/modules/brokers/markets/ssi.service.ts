import { Injectable } from '@nestjs/common';
import { csvToJsonFromContent, mapData } from '@shared/utils/data.util';
import { KEY_MAP } from '@shared/utils/constants/market.constant';
import path from 'path';

/** File như từ API upload (Multer): buffer + originalname */
export interface CsvFileLike {
  buffer: Buffer;
  originalname: string;
}

@Injectable()
export class SSIService {
  /**
   * Nhận list file CSV (từ API upload), trả về object key = tên file (không extension), value = data đã mapData.
   */
  handleSSIData(files: CsvFileLike[]): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {};

    for (const file of files) {
      const fileName = path.basename(file.originalname, path.extname(file.originalname));
      const csvData = csvToJsonFromContent(file.buffer);
      result[fileName] = mapData(csvData, KEY_MAP.ssi.s);
    }

    return result;
  }
}