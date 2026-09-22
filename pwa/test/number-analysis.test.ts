import { describe, expect, it } from 'vitest';
import {
  factorNumber, formatInBase, formatRomanNumeral, parseNumber, parseRomanNumeral, ULONG_MAX,
} from '../src/logic/number-analysis';

describe('factorNumber', () => {
  it('finds no factors below two', () => {
    expect(factorNumber(0n)).toEqual([]);
    expect(factorNumber(1n)).toEqual([]);
  });

  it('gives primes as their only factor', () => {
    expect(factorNumber(2n)).toEqual([2n]);
    expect(factorNumber(3n)).toEqual([3n]);
    expect(factorNumber(97n)).toEqual([97n]);
    expect(factorNumber(1000000007n)).toEqual([1000000007n]);
  });

  it('sorts and repeats factors', () => {
    expect(factorNumber(360n)).toEqual([2n, 2n, 2n, 3n, 3n, 5n]);
    expect(factorNumber(49n)).toEqual([7n, 7n]);
    expect(factorNumber(30030n)).toEqual([2n, 3n, 5n, 7n, 11n, 13n]);
    expect(factorNumber(1099511627776n)).toEqual(Array(40).fill(2n));
  });

  it('factors large numbers', () => {
    expect(factorNumber(600851475143n)).toEqual([71n, 839n, 1471n, 6857n]);
    // Square of a prime, which is found only when the search goes all the way to the square root
    expect(factorNumber(999966000289n)).toEqual([999983n, 999983n]);
    expect(factorNumber(ULONG_MAX)).toEqual([3n, 5n, 17n, 257n, 641n, 65537n, 6700417n]);
  });
});

describe('roman numerals', () => {
  it('are formatted', () => {
    expect(formatRomanNumeral(1n)).toBe('I');
    expect(formatRomanNumeral(4n)).toBe('IV');
    expect(formatRomanNumeral(9n)).toBe('IX');
    expect(formatRomanNumeral(14n)).toBe('XIV');
    expect(formatRomanNumeral(40n)).toBe('XL');
    expect(formatRomanNumeral(90n)).toBe('XC');
    expect(formatRomanNumeral(400n)).toBe('CD');
    expect(formatRomanNumeral(1994n)).toBe('MCMXCIV');
    expect(formatRomanNumeral(3999n)).toBe('MMMCMXCIX');
    expect(formatRomanNumeral(4000n)).toBe('MMMM');
  });

  it('have limits', () => {
    expect(formatRomanNumeral(0n)).toBeNull();
    expect(formatRomanNumeral(100000n)).toBe('M'.repeat(100));
    expect(formatRomanNumeral(100001n)).toBeNull();
  });

  it('are parsed', () => {
    expect(parseRomanNumeral('MCMXCIV')).toBe(1994n);
    expect(parseRomanNumeral('mcmxciv')).toBe(1994n);
    expect(parseRomanNumeral('MMMM')).toBe(4000n);
  });

  it('are rejected when not canonical', () => {
    expect(parseRomanNumeral('')).toBeNull();
    expect(parseRomanNumeral('IIII')).toBeNull();
    expect(parseRomanNumeral('IC')).toBeNull();
    expect(parseRomanNumeral('VX')).toBeNull();
    expect(parseRomanNumeral('XIVI')).toBeNull();
    expect(parseRomanNumeral('ABC')).toBeNull();
    expect(parseRomanNumeral('12')).toBeNull();
  });

  it('round trip', () => {
    for (let i = 1n; i <= 5000n; i++) {
      const numeral = formatRomanNumeral(i)!;
      expect(parseRomanNumeral(numeral), numeral).toBe(i);
    }
  });
});

describe('parseNumber', () => {
  it('parses numbers in given base', () => {
    expect(parseNumber('255', 'base-10')).toBe(255n);
    expect(parseNumber('ff', 'base-16')).toBe(255n);
    expect(parseNumber('FF', 'base-16')).toBe(255n);
    expect(parseNumber('101', 'base-2')).toBe(5n);
    expect(parseNumber('XIV', 'roman numerals')).toBe(14n);
    expect(parseNumber('18446744073709551615', 'base-10')).toBe(ULONG_MAX);
  });

  it('rejects invalid numbers', () => {
    expect(parseNumber('12', 'base-2')).toBeNull();
    expect(parseNumber('-1', 'base-10')).toBeNull();
    expect(parseNumber('1.5', 'base-10')).toBeNull();
    expect(parseNumber('18446744073709551616', 'base-10')).toBeNull();
    expect(parseNumber('XIV', 'base-10')).toBeNull();
    expect(parseNumber('14', 'roman numerals')).toBeNull();
    expect(parseNumber('5', 'prime factors')).toBeNull();
  });
});

describe('formatInBase', () => {
  it('formats numbers in given base', () => {
    expect(formatInBase(255n, 10)).toBe('255');
    expect(formatInBase(255n, 2)).toBe('11111111');
    expect(formatInBase(255n, 16)).toBe('FF');
    expect(formatInBase(ULONG_MAX, 16)).toBe('FFFFFFFFFFFFFFFF');
  });
});
