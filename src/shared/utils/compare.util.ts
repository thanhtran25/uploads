const GROUP_INDEXES = ['VN30', 'VN100', 'HNX30'];

export function compareObjectsWithWeight(
  sourceKey: string,
  sourceData: Record<string, any>,
  kisData: Record<string, any>,
  weight: number,
  columnMap: Record<string, string>,
  kisSymbol,
) {
  type FailureType = 'missing_in_source' | 'missing_in_kis' | 'value_mismatch';

  const groupedFailures: Record<FailureType, any[]> = {} as Record<
    FailureType,
    any[]
  >;

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
      (groupedFailures.missing_in_source ??= []).push(symbol);
      continue;
    }

    // Symbol chỉ có ở source
    if (sourceItem && !kisItem) {
      (groupedFailures.missing_in_kis ??= []).push(symbol);
      continue;
    }

    // Skip value comparison for index groups (VN30/VN100/HNX30) – only presence matters.
    if (GROUP_INDEXES.includes(sourceKey)) {
      continue;
    }
    const fieldDifferences: {
      sourceField: string;
      kisField: string;
      expected: number;
      actual: number;
    }[] = [];

    for (const [kisField, sourceField] of Object.entries(columnMap)) {
      if (kisField === kisSymbol) continue;

      const expectedRaw = sourceItem?.[sourceField];
      const actualRaw = kisItem?.[kisField];
      const expected = Number(expectedRaw ?? 0) * weight;
      const actual = Number(actualRaw ?? 0);

      if (
        isNaN(expected) ||
        isNaN(actual) ||
        Math.abs(expected - actual) > 1e-6
      ) {
        fieldDifferences.push({
          sourceField,
          kisField,
          expected,
          actual,
        });
      }
    }

    if (fieldDifferences.length > 0) {
      (groupedFailures.value_mismatch ??= []).push({
        symbol,
        differences: fieldDifferences[0] ?? null,
      });
    }
  }

  if (Object.keys(groupedFailures).length === 0) {
    return { status: true as const }; // ✅
  }

  return { status: false as const, failures: groupedFailures }; // ❎
}
