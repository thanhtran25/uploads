import { Injectable } from '@nestjs/common';
import { compareObjectsWithWeight } from '@shared/utils/compare.util';
import {
  KEY_MAP,
  MARKET_ENTRIES,
  SSI_FILE_SOURCE_MAP,
  MarketCompareEntry,
} from '@shared/utils/constants/market.constant';
import { ExcelDownloaderService } from '@modules/download/excel-downloader.service';
import { KISService } from './markets/kis.service';
import { SSIService, CsvFileLike } from './markets/ssi.service';
import { MiraeAssetService } from './markets/mirae-asset.service';

@Injectable()
export class BrokersService {
  constructor(
    private readonly kisService: KISService,
    private readonly ssiService: SSIService,
    private readonly masService: MiraeAssetService,
    private readonly downloadService: ExcelDownloaderService,
  ) {}

  handleSSIDataFromFiles(files: CsvFileLike[]) {
    return this.ssiService.handleSSIData(files);
  }

  async compareWithDownload() {
    await this.downloadService.downloadExcelFromSite();
    return this.compareLatest();
  }

  async compareLatest() {
    const dir = this.downloadService.getLatestDir();
    if (!dir) {
      return { date: null, results: null, message: 'No SSI data available. Waiting for scheduled download at 08:01.' };
    }

    const date = dir.split('/').pop();
    const files = this.downloadService.loadFilesFromDir(dir);
    if (!files.length) {
      return { date, results: null, message: 'Download folder is empty.' };
    }

    const results = await this.compare(files);
    return { date, results };
  }

  async compare(files: CsvFileLike[]) {
    const { wts: kisData, iKis } = await this.kisService.fetchData();
    const ssiRaw = this.ssiService.handleSSIData(files);
    const ssiData = this.normalizeFileData(ssiRaw, SSI_FILE_SOURCE_MAP);
    const masData = await this.masService.fetchData();
    return {
      SSI: {
        WTS: this.compareData(ssiData, kisData, KEY_MAP.SSI, 1, 's'),
        iKIS: this.compareData(ssiData, iKis, KEY_MAP.iKIS_SSI, 1, 'symbol'),
      },
      MAS: {
        WTS: this.compareData(masData, kisData, KEY_MAP.MAS, 1, 's'),
        iKIS: this.compareData(masData, iKis, KEY_MAP.iKIS_MAS, 1, 'symbol'),
      },
    };
  }

  /**
   * Normalize file-keyed data (e.g. SSI CSV) to canonical sourceKey.
   * API sources like MAS already use canonical keys — skip this step.
   */
  normalizeFileData(
    fileData: Record<string, Record<string, any>>,
    fileKeyMap: Record<string, string>,
  ): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {};
    for (const [fileName, sourceKey] of Object.entries(fileKeyMap)) {
      if (fileData[fileName]) {
        result[sourceKey] = fileData[fileName];
      }
    }
    return result;
  }

  compareData(
    sourceData: Record<string, Record<string, any>>,
    kisData: Record<string, any>,
    keyMap: Record<string, string>,
    weight: number,
    kisSymbol: string,
    markets: MarketCompareEntry[] = MARKET_ENTRIES,
  ) {
    const result: Record<string, any> = {};
    for (const { sourceKey, resultKey, kisKey } of markets) {
      const kisDataKey = kisKey ?? sourceKey;
      result[resultKey] = compareObjectsWithWeight(
        sourceKey,
        sourceData[sourceKey] ?? {},
        kisData[kisDataKey] ?? {},
        weight,
        keyMap,
        kisSymbol,
      );
    }
    return result;
  }
}
