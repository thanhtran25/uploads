import { Injectable } from '@nestjs/common';
import { csvToJson, mapData } from '@shared/utils/data.util';
import { KEY_MAP } from '@shared/utils/constants/market.constant';

@Injectable()
export class SSIService {
  handleSSIData() {
    const ssiHose = csvToJson('/Users/thanhtran/Downloads/EXCHANGE_HOSE.csv');
    const ssiHnx = csvToJson('/Users/thanhtran/Downloads/EXCHANGE_HNX.csv');
    const ssiUpcom = csvToJson('/Users/thanhtran/Downloads/EXCHANGE_UPCOM.csv');
    const ssiCW = csvToJson('/Users/thanhtran/Downloads/STOCKTYPE_COVERED_WARRANTS.csv');    

    return {
      Hose: mapData(ssiHose, KEY_MAP.ssi.s),
      Hnx: mapData(ssiHnx, KEY_MAP.ssi.s),
      Upcom: mapData(ssiUpcom, KEY_MAP.ssi.s),
      CW: mapData(ssiCW, KEY_MAP.ssi.s),
    };
  }
}
