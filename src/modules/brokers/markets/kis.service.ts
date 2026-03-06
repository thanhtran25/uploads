import { Injectable } from '@nestjs/common';
import { fetchFromAPI, mapData } from '@shared/utils/data.util';

@Injectable()
export class KISService {
  async fetchData() {
    // API chính lấy toàn bộ symbol
    const GROUP_INDEXES = ['VN30', 'VN100', 'HNX30'];

    const [kis, ...indexSymbolLists] = await Promise.all([
      fetchFromAPI(
        'https://trading.kisvn.vn/files/resources/symbol_static_data.json',
      ),
      ...GROUP_INDEXES.map((group) =>
        fetchFromAPI(
          `https://trading.kisvn.vn/rest/api/v2/market/indexStockList/${group}`,
        ),
      ),
    ]);
    const kisData = this.handleKISData(kis);

    // Build map cho từng group index dựa trên 1 list constant
    const indexMaps: Record<string, Record<string, any>> = {};
    GROUP_INDEXES.forEach((group, idx) => {
      indexMaps[group] = this.handleIndexKisData(
        kis,
        indexSymbolLists[idx] as string[],
      );
    });

    return {
      ...kisData,
      ...indexMaps,
    };
  }

  /**
   * Key theo obj: t === 'STOCK' → key = obj.m (HOSE, HNX, UPCOM), khác STOCK → key = obj.t (vd. FUTURES).
   */
  handleKISData(kis: any): Record<string, Record<string, any>> {
    const groups: Record<string, any[]> = {};
    for (const obj of kis) {
      const key = obj.t === 'STOCK' ? obj.m : obj.t;
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(obj);
    }
    const result: Record<string, Record<string, any>> = { };
    for (const [key, arr] of Object.entries(groups)) {
      result[key] = mapData(arr as any[], 's');
    }
    return result;
  }

  /**
   * Build map cho 1 group index bất kỳ (VN30, VN100, HNX30, ...).
   */
  handleIndexKisData(kis: any, symbols: string[]) {
    const kisMap = mapData(kis, 's');
    const resultMap = {};

    for (let index = 0; index < symbols.length; index++) {
      const key = symbols[index];
      resultMap[key] = kisMap[key];
    }

    return resultMap;
  }
}
