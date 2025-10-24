import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import fs from 'fs';
import axios from 'axios';
import {
  CW_IDS,
  HNX_IDS,
  HOSE_IDS,
  UPCOM_IDS,
} from '@shared/utils/constants/stock.contants';
import { KEY_MAP, MARKET_IDS } from '@shared/utils/constants/market.constant';

@Injectable()
export class ProductsService {
  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAll() {
    const [
      kis,
      vpsDefault,
      vpsCW
    ] = await Promise.all([
      this.fetchFromAPI(
        `https://trading.kisvn.vn/files/resources/symbol_static_data.json`,
      ),
      this.fetchFromAPI(
        `https://bgapidatafeed.vps.com.vn/getliststockdata/${[...HOSE_IDS,...HNX_IDS,...UPCOM_IDS].join(',')}`,
      ),
      this.fetchFromAPI(
        `https://bgapidatafeed.vps.com.vn/getliststockdata/${[...CW_IDS].join(',')}`,
      ),
    ]);

    console.log(1);
    const kisData = this.handleKISData(kis);
    const VPS = this.compareWithVPS(kisData, vpsDefault, vpsCW);
    const SSI = this.compareWithSSI(kisData);

    return {
      SSI,
      VPS,
    };
  }

  async fetchFromAPI(url: string) {
    try {
      // console.log('url', url);

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.log(error);

      console.error('❌ API Error:', error.message);
      throw error;
    }
  }

  compareObjectsWithWeight(
    obj1: Record<string, any>,
    obj2: Record<string, any>,
    weight: number,
    keyMap: Record<string, string>,
  ) {
    const failedSymbols = [];

    for (const symbol in obj1) {
      const item1 = obj1[symbol];
      const item2 = obj2[symbol]; // matching key

      if (!item2) {
        failedSymbols.push({
          symbol,
          reason: 'Matching symbol not found in KIS data',
        });
        continue;
      }

      const failFields = [];

      // Iterate through keyMap fields (skip "s" since it’s only for identification)
      for (const [key1, key2] of Object.entries(keyMap)) {
        if (key1 === 's') continue;

        const v1 = Number(item1[key1]);
        const v2 = Number(item2[key2]) * weight;

        if (isNaN(v1) || isNaN(v2)) {
          failFields.push({
            field1: key1,
            field2: key2,
            expected: v2,
            actual: v1,
            note: 'Invalid numeric value',
          });
          continue;
        }

        const EPSILON = 1e-6;
        if (Math.abs(v1 - v2) > EPSILON) {
          failFields.push({
            field1: key1,
            field2: key2,
            expected: v2,
            actual: v1,
          });
        }
      }

      if (failFields.length > 0) {
        failedSymbols.push({ symbol, failFields });
      }
    }

    return failedSymbols.length === 0
      ? { status: 'pass' }
      : { status: 'fail', failedSymbols };
  }

  mapData(arrObj: Record<string, any>[], key: string) {
    const resultMap = {};
    arrObj.forEach((obj) => {
      resultMap[obj[key].split(' ')[0]] = obj;
    });

    return resultMap;
  }

  csvToJson(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Split lines and remove empty ones
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

    if (lines.length <= 3) {
      console.error('❌ File does not contain enough data to process!');
      return [];
    }

    // 👉 Skip the first 2 lines and the last line
    const usefulLines = lines.slice(2, -1);

    // Header is on the 2nd line (index 1)
    const headerLine = lines[1];
    const headers = headerLine
      .split(',')
      .map((h) => h.replace(/^"|"$/g, '').trim())
      .filter((h) => h !== '');

    // Parse remaining lines into JSON
    const jsonData = usefulLines.map((line) => {
      const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());

      const obj = {};
      headers.forEach((header, i) => {
        !obj[header] ? (obj[header] = values[i] || '') : 0;
      });
      
      return obj;
    });

    return jsonData;
  }

  handleKISData(kis: any) {
    const kisMapHose = this.mapData(
      kis.filter((obj) => obj.t == 'STOCK' && obj.m == 'HOSE'),
      's',
    );
    const kisMapHnx = this.mapData(
      kis.filter((obj) => obj.t == 'STOCK' && obj.m == 'HNX'),
      's',
    );
    const kisMapUpcom = this.mapData(
      kis.filter((obj) => obj.t == 'STOCK' && obj.m == 'UPCOM'),
      's',
    );
    const kisMapCW = this.mapData(
      kis.filter((obj) => obj.t == 'CW'),
      's',
    );

    return { kisMapHose, kisMapCW, kisMapHnx, kisMapUpcom };
  }

  handleVPSData(vps: any, vpsCW: any) {
    const vpsMapHose = this.mapData(
      vps.filter((obj) => obj.marketId == 'STO'),
      KEY_MAP.vps.s
    );
    const vpsMapHnx = this.mapData(
      vps.filter((obj) => obj.marketId == 'STX'),
      KEY_MAP.vps.s
    );
    const vpsMapUpcom = this.mapData(
      vps.filter((obj) => obj.marketId == 'UPX'),
      KEY_MAP.vps.s
    );
    const vpsMapCW = this.mapData(
      vpsCW,
      KEY_MAP.vps.s
    );

    return { vpsMapHose, vpsMapCW, vpsMapHnx, vpsMapUpcom };
  }

  handleSSIData() {
    const ssiHoseJSON = this.csvToJson(
      '/Users/thanhtran/Downloads/EXCHANGE_HOSE.csv',
    );
    const ssiHnxJSON = this.csvToJson(
      '/Users/thanhtran/Downloads/EXCHANGE_HNX.csv',
    );
    const ssiUpcomJSON = this.csvToJson(
      '/Users/thanhtran/Downloads/EXCHANGE_UPCOM.csv',
    );
    const ssiCWJSON = this.csvToJson(
      '/Users/thanhtran/Downloads/STOCKTYPE_COVERED_WARRANTS.csv',
    );

    const ssiMapHose = this.mapData(ssiHoseJSON, KEY_MAP.ssi.s);
    const ssiMapHnx = this.mapData(ssiHnxJSON, KEY_MAP.ssi.s);
    const ssiMapUpcom = this.mapData(ssiUpcomJSON, KEY_MAP.ssi.s);
    const ssiMapCW = this.mapData(ssiCWJSON, KEY_MAP.ssi.s);
    
    return { 
      ssiMapHose, 
      ssiMapCW, 
      ssiMapHnx, 
      ssiMapUpcom,
    };
  }

  compareWithVPS(kisData: any, vpsDefault: any, vpsCW: any) {
    const { vpsMapCW, vpsMapHnx, vpsMapHose, vpsMapUpcom } = this.handleVPSData(
      vpsDefault,
      vpsCW,
    );
    const { kisMapHose, kisMapHnx, kisMapUpcom, kisMapCW } = kisData;

    const HOSE = this.compareObjectsWithWeight(
      kisMapHose,
      vpsMapHose,
      1000,
      KEY_MAP.vps,
    );
    const HNX = this.compareObjectsWithWeight(
      kisMapHnx,
      vpsMapHnx,
      1000,
      KEY_MAP.vps,
    );
    const UPCOM = this.compareObjectsWithWeight(
      kisMapUpcom,
      vpsMapUpcom,
      1000,
      KEY_MAP.vps,
    );
    const WS = this.compareObjectsWithWeight(
      kisMapCW,
      vpsMapCW,
      1000,
      KEY_MAP.vps,
    );

    return {
      HOSE,
      HNX,
      UPCOM,
      WS,
    };
  }

  compareWithSSI(kisData: any) {
    const { 
      ssiMapHose, 
      ssiMapCW, 
      ssiMapHnx, 
      ssiMapUpcom,
    } = this.handleSSIData();
    const { kisMapHose, kisMapHnx, kisMapUpcom, kisMapCW } = kisData;

    const HOSE = this.compareObjectsWithWeight(
      kisMapHose,
      ssiMapHose,
      1,
      KEY_MAP.ssi,
    );
    const HNX = this.compareObjectsWithWeight(
      kisMapHnx,
      ssiMapHnx,
      1,
      KEY_MAP.ssi,
    );
    const UPCOM = this.compareObjectsWithWeight(
      kisMapUpcom,
      ssiMapUpcom,
      1,
      KEY_MAP.ssi,
    );
    const WS = this.compareObjectsWithWeight(
      kisMapCW,
      ssiMapCW,
      1,
      KEY_MAP.ssi,
    );

    return {
      HOSE,
      HNX,
      UPCOM,
      WS,
    };
  }
}
