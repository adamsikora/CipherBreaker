// Port of the pure parts of Utils.kt

/** Integer of the string, or the default when it is not a plain (optionally negative) 32-bit integer. */
export function parseIntWithDefault(s: string, fallback = 0): number {
  // Number() alone would also accept "+5", " 1" and "4.2"
  if (!/^-?\d+$/.test(s)) return fallback;
  const value = Number(s);
  return value >= -2147483648 && value <= 2147483647 ? value : fallback;
}

/** 5 digits produces coordinates with precision of ~1m */
export function formatCoord(coord: number): string {
  return coord.toFixed(5);
}

export function formatLatLng(lat: number, lon: number): string {
  return `${formatCoord(lat)}, ${formatCoord(lon)}`;
}
