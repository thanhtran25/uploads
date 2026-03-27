import { Injectable } from '@nestjs/common';
import { fetchAPI, fetchFromAPI, mapData } from '@shared/utils/data.util';

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

    const { securities: iKisStatic } = await fetchFromAPI(
      'https://static.ikis.kisvn.vn/configuration/symbol/symbolInfo',
    );

    const iKisSymbol = iKisStatic
      .filter(({ securityType }) => securityType !== 'UNKNOWN')
      .map(({ symbol }) => symbol);

    // Split the iKis symbol list to avoid a 414 (URI too long) response.
    const symbolChunks = this.chunkArray(iKisSymbol, 100);

    const iKisResponses = await Promise.all(
      symbolChunks.map((chunk) =>
        fetchAPI(
          `https://api.ikis.kisvn.vn/api/v3/market/securities/${chunk.join(',')}`,
          {
            headers: {
              'client-code':
                'LpPuP67Z%dJWwZ2j*HgGWfF!5$2fJorqa4d5d9D&legacy-messages',
            },
          },
        ),
      ),
    );

    const iKisIndexSymbols = await Promise.all(
      GROUP_INDEXES.map((group) =>
        fetchFromAPI(
          `https://api.ikis.kisvn.vn/api/v3/market/indices/${group}/stocks`,
        ),
      ),
    );

    const iKis = iKisResponses.flatMap(({ securities }) => securities ?? []);


    const kisData = this.handleKISData(kis);
    const iKisData = this.handleIKISData(iKis);

    // console.log(iKisData);

    // Build map cho từng group index dựa trên 1 list constant
    const indexMaps: Record<string, Record<string, any>> = {};
    GROUP_INDEXES.forEach((group, idx) => {
      indexMaps[group] = indexSymbolLists[idx].reduce((acc, symbol) => {
        acc[symbol] = { s: symbol };
        return acc;
      }, {});
    });

    const iKisIndexMaps: Record<string, Record<string, any>> = {};
    GROUP_INDEXES.forEach((group, idx) => {
      iKisIndexMaps[group] = iKisIndexSymbols[idx].symbols.reduce(
        (acc, symbol) => {
          acc[symbol] = { symbol };
          return acc;
        },
        {},
      );
    });
    return {
      wts: {
        ...kisData,
        ...indexMaps,
      },
      iKis: {
        ...iKisData,
        ...iKisIndexMaps,
      },
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
    const result: Record<string, Record<string, any>> = {};
    for (const [key, arr] of Object.entries(groups)) {
      result[key] = mapData(arr as any[], 's');
    }
    return result;
  }

  handleIKISData(ikis): Record<string, Record<string, any>> {
    const groups: Record<string, any[]> = {};
    for (const obj of ikis) {
      let key =
        obj.securityType === 'STOCK'
          ? obj.market
          : obj.securityType.split('_')[0];
      if (key === 'HSX') {
        key = 'HOSE';
      }
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        securityType: obj.securityType,
        market: obj.market,
        symbol: obj.symbol,
        ...obj.quote,
      });
    }
    const result: Record<string, Record<string, any>> = {};
    for (const [key, arr] of Object.entries(groups)) {
      result[key] = mapData(arr as any[], 'symbol');
    }
    return result;
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return [arr];
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
