export function compareObjectsWithWeight(
  sourceData: Record<string, any>,
  kisData: Record<string, any>,
  weight: number,
  columnMap: Record<string, string>,
) {
  type FailureType = 'missing_in_source' | 'missing_in_kis' | 'value_mismatch';

  const failures: {
    symbol: string;
    type: FailureType;
    differences?: {
      sourceField: string;
      kisField: string;
      expected: number;
      actual: number;
    }[];
  }[] = [];

  // Tập hợp tất cả symbol cần so sánh (hợp của 2 bên: source + KIS)
  const allSymbols = new Set<string>([
    ...Object.keys(sourceData ?? {}),
    ...Object.keys(kisData ?? {}),
  ]);

  for (const symbol of allSymbols) {
    const sourceItem = sourceData?.[symbol];
    const kisItem = kisData?.[symbol];

    // Symbol chỉ có ở KIS
    if (!sourceItem && kisItem) {
      failures.push({
        symbol,
        type: 'missing_in_source',
      });
      continue;
    }

    // Symbol chỉ có ở source
    if (sourceItem && !kisItem) {
      failures.push({
        symbol,
        type: 'missing_in_kis',
      });
      continue;
    }

    const fieldDifferences: {
      sourceField: string;
      kisField: string;
      expected: number;
      actual: number;
    }[] = [];

    for (const [kisField, sourceField] of Object.entries(columnMap)) {
      if (kisField === 's') continue;

      const expected = Number(sourceItem[sourceField]) * weight;
      const actual = Number(kisItem[kisField]);

      if (isNaN(expected) || isNaN(actual) || Math.abs(expected - actual) > 1e-6) {
        fieldDifferences.push({
          sourceField,
          kisField,
          expected,
          actual,
        });
      }
    }

    if (fieldDifferences.length > 0) {
      failures.push({
        symbol,
        type: 'value_mismatch',
        differences: fieldDifferences,
      });
    }
  }

  if (failures.length === 0) {
    return { status: 'pass' as const };
  }

  return {
    status: 'fail' as const,
    failures,
  };
}
