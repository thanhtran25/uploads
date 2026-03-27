export const KEY_MAP = {
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
  MAS: {
    s: 's',
    re: 're',
    ce: 'ce',
    fl: 'fl',
  },
  iKIS_MAS: {
    symbol: 's',
    reference: 're',
    limitUp: 'ce',
    limitDown: 'fl',
  },
};

export interface MarketCompareEntry {
  sourceKey: string;
  resultKey: string;
  kisKey?: string;
}

/**
 * Shared market entries — defines which markets to compare.
 * All data sources must normalize their data to use sourceKey as the key.
 */
export const MARKET_ENTRIES: MarketCompareEntry[] = [
  { sourceKey: 'HOSE', resultKey: 'HOSE' },
  { sourceKey: 'HNX', resultKey: 'HNX' },
  { sourceKey: 'UPCOM', resultKey: 'UPCOM' },
  { sourceKey: 'CW', resultKey: 'CW' },
  { sourceKey: 'FUTURES', resultKey: 'DERIATIVES' },
  { sourceKey: 'VN30', resultKey: 'VN30' },
  { sourceKey: 'VN100', resultKey: 'VN100' },
  { sourceKey: 'HNX30', resultKey: 'HNX30' },
  { sourceKey: 'BOND', resultKey: 'BOND' },
];

/** SSI-specific: maps CSV file name → canonical sourceKey for normalization. */
export const SSI_FILE_SOURCE_MAP: Record<string, string> = {
  EXCHANGE_HOSE: 'HOSE',
  EXCHANGE_HNX: 'HNX',
  EXCHANGE_UPCOM: 'UPCOM',
  STOCKTYPE_COVERED_WARRANTS: 'CW',
  DERIVATIVES_DERIVATIVES: 'FUTURES',
  GROUP_VN30: 'VN30',
  GROUP_VN100: 'VN100',
  GROUP_HNX30: 'HNX30',
  STOCKTYPE_HNX_BOND: 'BOND',
};

