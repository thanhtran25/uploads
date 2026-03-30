import { Injectable } from '@nestjs/common';
import { compareObjectsWithWeight } from '@shared/utils/compare.util';
import {
  KEY_MAP,
  MARKET_ENTRIES,
  SSI_FILE_SOURCE_MAP,
  MarketCompareEntry,
} from '@shared/utils/constants/market.constant';
import { ExcelDownloaderService } from './excel-downloader.service';
import { KISService } from './kis.service';
import { SSIService, CsvFileLike } from './ssi.service';
import { MiraeAssetService } from './mirae-asset.service';

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
    const date = dir ? dir.split('/').pop() : null;
    const files = dir ? this.downloadService.loadFilesFromDir(dir) : [];
    const ssiPending = !files.length;

    const results = await this.compare(files, ssiPending);
    return ssiPending ? { date, results, ssiPending } : { date, results };
  }

  async compare(files: CsvFileLike[], skipSSI = false) {
    const { wts: kisData, iKis } = await this.kisService.fetchData();
    const masData = await this.masService.fetchData();

    let ssiResult: Record<string, any> | null = null;
    if (!skipSSI) {
      const ssiRaw = this.ssiService.handleSSIData(files);
      const ssiData = this.normalizeFileData(ssiRaw, SSI_FILE_SOURCE_MAP);
      ssiResult = {
        WTS: this.compareData(ssiData, kisData, KEY_MAP.SSI, 1, 's'),
        iKIS: this.compareData(ssiData, iKis, KEY_MAP.iKIS_SSI, 1, 'symbol'),
      };
    }

    return {
      SSI: ssiResult,
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
      const source = sourceData[sourceKey];
      const kis = kisData[kisDataKey];
      const sourceEmpty = !source || Object.keys(source).length === 0;
      const kisEmpty = !kis || Object.keys(kis).length === 0;
      if (sourceEmpty && kisEmpty) {
        result[resultKey] = { status: true };
        continue;
      }
      if (sourceEmpty) {
        result[resultKey] = { status: 'pending' };
        continue;
      }
      result[resultKey] = compareObjectsWithWeight(
        sourceKey,
        source,
        kisData[kisDataKey] ?? {},
        weight,
        keyMap,
        kisSymbol,
      );
    }
    return result;
  }
}
