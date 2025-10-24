import { Injectable } from '@nestjs/common';
import { fetchFromAPI, mapData } from '@shared/utils/data.util';

@Injectable()
export class KISService {
  async fetchData() {
    const kis = await fetchFromAPI(
      'https://trading.kisvn.vn/files/resources/symbol_static_data.json',
    );
    return this.handleKISData(kis);
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
    const CW = mapData(kis.filter((obj) => obj.t === 'CW'), 's');
    return { Hose, CW, Hnx, Upcom };
  }
}
