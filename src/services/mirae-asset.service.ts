import { Injectable } from '@nestjs/common';
import { fetchFromAPI, mapData } from '@shared/utils/data.util';

@Injectable()
export class MiraeAssetService {
  async fetchData() {
    // API chính lấy toàn bộ symbol
    const GROUP_INDEXES = ['VN30', 'VN100', 'HNX30'];

    const [mas, indexSymbolLists] = await Promise.all([
      fetchFromAPI(
        'https://mastrade.masvn.com/media/symbol_static_data.json',
      ),
      fetchFromAPI(
          `https://mastrade.masvn.com/media/indexStockList.json`,
        ),
    ]);


    const masData = this.handleMASData(mas);

    // console.log(iMasData);

    // Build map cho từng group index dựa trên 1 list constant
    const indexMaps: Record<string, Record<string, any>> = {};
    GROUP_INDEXES.forEach((group) => {
      indexMaps[group] = indexSymbolLists[group].reduce((acc, symbol) => {
        acc[symbol] = { s: symbol };
        return acc;
      }, {});
    });

    return {
        ...masData,
        ...indexMaps,
      }
    ;
  }

  /**
   * Key theo obj: t === 'STOCK' → key = obj.m (HOSE, HNX, UPCOM), khác STOCK → key = obj.t (vd. FUTURES).
   */
  handleMASData(mas: any): Record<string, Record<string, any>> {
    const groups: Record<string, any[]> = {};
    for (const obj of mas) {
      const key = obj.t === 'STOCK' ? obj.m : obj.t;
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(obj);
    }
    const result: Record<string, Record<string, any>> = {};
    for (const [key, arr] of Object.entries(groups)) {
      result[key] = mapData(arr as any[], 's');
    }
    return result;
  }

}
