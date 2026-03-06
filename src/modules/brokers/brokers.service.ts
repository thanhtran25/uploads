import { Injectable } from '@nestjs/common';
import { compareObjectsWithWeight } from '@shared/utils/compare.util';
import {
  KEY_MAP,
  SSI_FILE_TO_MARKET,
  FileToMarketMapping,
} from '@shared/utils/constants/market.constant';
import { KISService } from './markets/kis.service';
import { SSIService, CsvFileLike } from './markets/ssi.service';

@Injectable()
export class BrokersService {
  constructor(
    private readonly kisService: KISService,
    private readonly ssiService: SSIService,
  ) {}

  /**
   * Xử lý list file CSV upload từ API, trả về object key = tên file, value = data đã mapData.
   */
  handleSSIDataFromFiles(
    files: CsvFileLike[],
  ) {
    return this.ssiService.handleSSIData(files);
  }

  /**
   * So sánh dữ liệu file (theo bảng MARKET truyền vào) với KIS.
   * Key và logic hoàn toàn dựa vào fileToMarket; thêm bên khác chỉ cần truyền MARKET mới.
   */
  async compare(
    files: CsvFileLike[],
  ) {
    const kisData = await this.kisService.fetchData();
    const ssiData = this.ssiService.handleSSIData(files);
    
    return { 
      SSI: this.handleCompareData(kisData, ssiData, KEY_MAP.ssi, 1, SSI_FILE_TO_MARKET) ,
    };
    // return {
    //   kisData
    // }
  }

  handleCompareData(
    kisData: Record<string, any>,
    sourceData: Record<string, Record<string, any>>,
    keyMap: Record<string, string>,
    weight: number,
    fileToMarket: FileToMarketMapping,
  ) {
    const source: Record<string, Record<string, any>> = {};
    for (const [fileName, { sourceKey }] of Object.entries(fileToMarket)) {
      source[sourceKey] = sourceData[fileName] ?? {};
    }

    return this.compareData(source, kisData, keyMap, weight, fileToMarket);
  }

  compareData(
    source: Record<string, Record<string, any>>,
    kis: Record<string, any>,
    keyMap: Record<string, string>,
    weight: number,
    fileToMarket: FileToMarketMapping,
  ) {
    const result: Record<string, any> = {};
    for (const { sourceKey, resultKey, kisKey } of Object.values(fileToMarket)) {
      const kisDataKey = kisKey ?? sourceKey;
      result[resultKey] = compareObjectsWithWeight(
        source[sourceKey] ?? {},
        kis[kisDataKey] ?? {},
        weight,
        keyMap,
      );
    }
    return result;
  }
}
