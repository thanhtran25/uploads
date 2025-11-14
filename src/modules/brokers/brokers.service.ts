import { Injectable } from '@nestjs/common';
import { compareObjectsWithWeight } from '@shared/utils/compare.util';
import { KEY_MAP } from '@shared/utils/constants/market.constant';
import { KISService } from './markets/kis.service';
import { VPSService } from './markets/vps.service';
import { SSIService } from './markets/ssi.service';

@Injectable()
export class BrokersService {
  constructor(
    private readonly kisService: KISService,
    private readonly vpsService: VPSService,
    private readonly ssiService: SSIService,
  ) {}

  async findAll() {
    const kisData = await this.kisService.fetchData();

    // ⚡ Tùy chọn nhà cung cấp nào cần so sánh
    const vpsData = await this.vpsService.fetchData();
    
    const ssiData = this.ssiService.handleSSIData();

    const SSI = this.compareData(ssiData, kisData, KEY_MAP.ssi, 1);
    const VPS = this.compareData(vpsData, kisData, KEY_MAP.vps, 1000);


    return {
      SSI, 
      VPS,
      VN100Symbol: ssiData.ssiVN100Arr
    };
  }

  compareData(source, kis, keyMap, weight) {
    const HOSE = compareObjectsWithWeight(source.Hose , kis.Hose, weight, keyMap);
    const HNX = compareObjectsWithWeight(source.Hnx , kis.Hnx, weight, keyMap);
    const UPCOM = compareObjectsWithWeight(source.Upcom, kis.Upcom, weight, keyMap);
    const WS = compareObjectsWithWeight(source.CW, kis.CW, weight, keyMap);
    const VN100 = compareObjectsWithWeight(source.VN100, kis.VN100, weight, keyMap);

    return { 
      HOSE, HNX, UPCOM, WS,
      VN100
     };
  }
}
