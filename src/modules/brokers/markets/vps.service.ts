import { Injectable } from '@nestjs/common';
import { fetchFromAPI, mapData } from '@shared/utils/data.util';
import { KEY_MAP } from '@shared/utils/constants/market.constant';
import { CW_IDS, HNX_IDS, HOSE_IDS, UPCOM_IDS } from '@shared/utils/constants/stock.contants';

@Injectable()
export class VPSService {
  async fetchData() {
    const [vpsDefault, vpsCW] = await Promise.all([
      fetchFromAPI(
        `https://bgapidatafeed.vps.com.vn/getliststockdata/${[...HOSE_IDS, ...HNX_IDS, ...UPCOM_IDS].join(',')}`,
      ),
      fetchFromAPI(
        `https://bgapidatafeed.vps.com.vn/getliststockdata/${[...CW_IDS].join(',')}`,
      ),
    ]);
    return this.handleVPSData(vpsDefault, vpsCW);
  }

  handleVPSData(vps: any, vpsCW: any) {
    const Hose = mapData(vps.filter(obj => obj.marketId === 'STO'), KEY_MAP.vps.s);
    const Hnx = mapData(vps.filter(obj => obj.marketId === 'STX'), KEY_MAP.vps.s);
    const Upcom = mapData(vps.filter(obj => obj.marketId === 'UPX'), KEY_MAP.vps.s);
    const CW = mapData(vpsCW, KEY_MAP.vps.s);
    return { Hose, CW, Hnx, Upcom };
  }
}
