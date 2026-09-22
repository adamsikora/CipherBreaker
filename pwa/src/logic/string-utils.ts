// Port of StringUtils.kt

/**
 * Levenshtein distance. Without a limit the words are compared regardless of case. With a limit
 * the words are taken as they are and distances of limit and more are all given as limit, which
 * saves most of the computation for words that are far from each other. Costs is an array of
 * b.length + 1 or more numbers that may be reused for further calls.
 */
export function levenshteinDistance(aInput: string, bInput: string, limit?: number, costs?: Int32Array): number {
  const unlimited = limit === undefined;
  const a = unlimited ? aInput.toLowerCase() : aInput;
  const b = unlimited ? bInput.toLowerCase() : bInput;
  const max = unlimited ? Number.MAX_SAFE_INTEGER : limit;
  if (Math.abs(a.length - b.length) >= max) return max;
  const row = costs ?? new Int32Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    row[0] = i;
    let nw = i - 1;
    let rowMin = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cj = Math.min(1 + Math.min(row[j], row[j - 1]), ca === b.charCodeAt(j - 1) ? nw : nw + 1);
      nw = row[j];
      row[j] = cj;
      if (cj < rowMin) rowMin = cj;
    }
    // Numbers of the following rows are never lower than the lowest one of this row
    if (rowMin >= max) return max;
  }
  return Math.min(row[b.length], max);
}

/** Number of positions the words differ at, regardless of case. Expects words of the same length. */
export function hammingDistance(aInput: string, bInput: string): number {
  const a = aInput.toLowerCase();
  const b = bInput.toLowerCase();
  let counter = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) counter++;
  }
  return counter;
}
