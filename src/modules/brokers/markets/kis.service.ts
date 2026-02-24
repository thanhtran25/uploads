import { Injectable } from '@nestjs/common';
import { fetchFromAPI, mapData } from '@shared/utils/data.util';

@Injectable()
export class KISService {
  async fetchData() {
    const [kis, vn100ListSymbol] = await Promise.all([ 
      fetchFromAPI('https://trading.kisvn.vn/files/resources/symbol_static_data.json'),
      fetchFromAPI('https://trading.kisvn.vn/rest/api/v2/market/indexStockList/VN30')
    ]);
    const kisData = this.handleKISData(kis);

    return {
      ...kisData,
      VN100: this.handleVN100KisData(kis, vn100ListSymbol)
    }
  }

  handleKISData(kis: any) {
    
    const Hose = mapData(
      kis.filter((obj) => obj.t === 'STOCK' && obj.m === 'HOSE'),
      's',
    );
    const Hnx = mapData(
      kis.filter((obj) => obj.t === 'STOCK' && obj.m === 'HNX'),
      's',
    );
    const Upcom = mapData(
      kis.filter((obj) => obj.t === 'STOCK' && obj.m === 'UPCOM'),
      's',
    );
    const CW = mapData(kis.filter((obj) => obj.t === 'FUTURES'), 's');

    return { Hose, CW, Hnx, Upcom , kis};
  }

  handleVN100KisData(kis: any, vn100: string[]) {
    const kisMap = mapData(kis, 's');
    const resultMap= {};

    for (let index = 0; index < vn100.length; index++) {
        const key = vn100[index];
        resultMap[key] = kisMap[key];
    }

    return resultMap;
  }
}
