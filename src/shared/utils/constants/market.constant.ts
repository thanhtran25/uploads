export const KEY_MAP = {
  vps: {
    s: 'sym',
    re: 'r',
    ce: 'c',
    fl: 'f',
  },
  SSI: {
    s: 'Symbol',
    re: 'Ref',
    ce: 'Ceil',
    fl: 'Floor',
  },
  iKIS_SSI: {
    symbol: 'Symbol',
    reference: 'Ref',
    limitUp: 'Ceil',
    limitDown: 'Floor',
  },
  vn100: {
    s: 'Symbol',
  },
};

export const MARKET_IDS = {
  HOSE: 'HOSE',
  HNX: 'HNX',
  UPCOM: 'UPCOM',
};

export interface MarketMappingEntry {
  sourceKey: string;
  resultKey: string;
  kisKey?: string;
}

/** Bảng MARKET: tên file → entry. Thêm bên khác chỉ cần thêm constant mới cùng kiểu này. */
export type FileToMarketMapping = Record<string, MarketMappingEntry>;

/** MARKET SSI: mapping file CSV SSI. */
export const SSI_FILE_TO_MARKET: FileToMarketMapping = {
  EXCHANGE_HOSE: { sourceKey: 'HOSE', resultKey: 'HOSE' },
  EXCHANGE_HNX: { sourceKey: 'HNX', resultKey: 'HNX' },
  EXCHANGE_UPCOM: { sourceKey: 'UPCOM', resultKey: 'UPCOM' },
  STOCKTYPE_COVERED_WARRANTS: { sourceKey: 'CW', resultKey: 'CW'},
  DERIVATIVES_DERIVATIVES: { sourceKey: 'DV', resultKey: 'DV', kisKey: 'FUTURES' },
  GROUP_VN30: { sourceKey: 'VN30', resultKey: 'VN30' },
  GROUP_HNX30: { sourceKey: 'HNX30', resultKey: 'HNX30' },
  STOCKTYPE_HNX_BOND: { sourceKey: 'BOND', resultKey: 'BOND' },
};

