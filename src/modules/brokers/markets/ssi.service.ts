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
    const ssiVN100 = csvToJson('/Users/thanhtran/Downloads/GROUP_VN100.csv');    
    const ssiVN100Arr = ssiVN100.map(({Symbol}) => Symbol.split(' ')[0]);    
    return {
      Hose: mapData(ssiHose, KEY_MAP.ssi.s),
      Hnx: mapData(ssiHnx, KEY_MAP.ssi.s),
      Upcom: mapData(ssiUpcom, KEY_MAP.ssi.s),
      CW: mapData(ssiCW, KEY_MAP.ssi.s),
      VN100: mapData(ssiVN100, KEY_MAP.ssi.s),
      ssiVN100Arr

    };
  }
}
