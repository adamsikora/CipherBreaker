import { describe, expect, it } from 'vitest';
import { formatCoord, formatLatLng, parseIntWithDefault } from '../src/logic/format';

describe('parseIntWithDefault', () => {
  it('parses integers', () => {
    expect(parseIntWithDefault('42')).toBe(42);
    expect(parseIntWithDefault('-7')).toBe(-7);
    expect(parseIntWithDefault('0', 5)).toBe(0);
  });

  it('falls back on invalid input', () => {
    expect(parseIntWithDefault('')).toBe(0);
    expect(parseIntWithDefault('', 5)).toBe(5);
    expect(parseIntWithDefault('abc', 5)).toBe(5);
    expect(parseIntWithDefault('4.2', 5)).toBe(5);
    expect(parseIntWithDefault(' 1', 5)).toBe(5);
  });

  it('falls back on overflow', () => {
    expect(parseIntWithDefault('2147483647', 5)).toBe(2147483647);
    expect(parseIntWithDefault('2147483648', 5)).toBe(5);
    expect(parseIntWithDefault('99999999999', 5)).toBe(5);
    expect(parseIntWithDefault('-99999999999', 5)).toBe(5);
  });
});

describe('formatCoord', () => {
  it('uses five decimals', () => {
    expect(formatCoord(50.123456)).toBe('50.12346');
    expect(formatCoord(14.0)).toBe('14.00000');
    expect(formatCoord(-0.5)).toBe('-0.50000');
  });

  it('joins latitude and longitude', () => {
    expect(formatLatLng(50.0833514, 14.3950931)).toBe('50.08335, 14.39509');
  });
});
