export function compareObjectsWithWeight(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
  weight: number,
  keyMap: Record<string, string>,
) {
  const failedSymbols = [];

  for (const symbol in obj1) {
    const item1 = obj1[symbol];
    const item2 = obj2[symbol];
    if (!item2) {
      failedSymbols.push({ symbol, reason: 'Missing symbol'});
      continue;
    }

    const failFields = [];
    for (const [key2, key1] of Object.entries(keyMap)) {
      if (key2 === 's') continue;
      const v1 = Number(item1[key1]) * weight;
      const v2 = Number(item2[key2]);
      if (isNaN(v1) || isNaN(v2) || Math.abs(v1 - v2) > 1e-6) {
        failFields.push({ field1: key1, field2: key2, expected: v1, actual: v2 });
      }
    }

    if (failFields.length > 0) failedSymbols.push({ symbol, failFields });
  }

  return failedSymbols.length === 0
    ? { status: 'pass' }
    : { status: 'fail', failedSymbols };
}
