// Parsing, formatting and factoring of unsigned 64-bit numbers, which are bigint here as they do
// not fit into a JS number. Port of NumberAnalysis.kt

export const ROMAN_NUMERALS = 'roman numerals';
export const PRIME_FACTORS = 'prime factors';

export const ULONG_MAX = (1n << 64n) - 1n;

// Above this the numeral is a wall of M characters, so it is not worth showing
const MAX_ROMAN_NUMERAL = 100000n;

const ROMAN_SYMBOLS: [bigint, string][] = [
  [1000n, 'M'], [900n, 'CM'], [500n, 'D'], [400n, 'CD'], [100n, 'C'], [90n, 'XC'],
  [50n, 'L'], [40n, 'XL'], [10n, 'X'], [9n, 'IX'], [5n, 'V'], [4n, 'IV'], [1n, 'I'],
];
// Only canonical numerals: IV/IX/XL/XC/CD/CM are the only subtractive pairs,
// I/X/C repeat at most three times and V/L/D at most once. Thousands are left
// unbounded, because values above MMM have no other plain text notation.
const ROMAN_PATTERN = /^M*(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

const ROMAN_VALUES: Record<string, bigint> = {
  I: 1n, V: 5n, X: 10n, L: 50n, C: 100n, D: 500n, M: 1000n,
};

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Parses digits of given radix as an unsigned 64-bit number, null when they are not one. */
export function parseULong(input: string, radix: number): bigint | null {
  if (input === '' || radix < 2 || radix > 36) return null;
  let value = 0n;
  const big = BigInt(radix);
  for (const c of input.toLowerCase()) {
    const digit = DIGITS.indexOf(c);
    if (digit < 0 || digit >= radix) return null;
    value = value * big + BigInt(digit);
    if (value > ULONG_MAX) return null;
  }
  return value;
}

// Input type is either "roman numerals" or "base-N".
export function parseNumber(input: string, inputType: string): bigint | null {
  if (inputType === ROMAN_NUMERALS) return parseRomanNumeral(input);
  if (!inputType.startsWith('base-')) return null;
  const radix = parseInt(inputType.slice('base-'.length), 10);
  if (!Number.isFinite(radix)) return null;
  return parseULong(input, radix);
}

export function formatInBase(number: bigint, radix: number): string {
  const digits = number.toString(radix);
  // Hexadecimal reads better in capitals, and matches what the hex keyboard types
  return radix > 10 ? digits.toUpperCase() : digits;
}

export function formatRomanNumeral(number: bigint): string | null {
  if (number < 1n || number > MAX_ROMAN_NUMERAL) return null;
  let remainder = number;
  let numeral = '';
  // Greedily take the largest symbol that still fits, subtractive pairs included
  for (const [value, symbol] of ROMAN_SYMBOLS) {
    while (remainder >= value) {
      numeral += symbol;
      remainder -= value;
    }
  }
  return numeral;
}

export function parseRomanNumeral(input: string): bigint | null {
  const numeral = input.toUpperCase();
  if (numeral === '' || !ROMAN_PATTERN.test(numeral)) return null;
  let total = 0n;
  let previous = 0n;
  // Walk right to left: a numeral smaller than the one to its right is subtracted
  for (let i = numeral.length - 1; i >= 0; i--) {
    const value = ROMAN_VALUES[numeral[i]];
    if (value < previous) {
      total -= value;
    } else {
      total += value;
      previous = value;
    }
  }
  return total;
}

/** Prime factors in ascending order, with repetitions. Numbers below 2 have none. */
export function factorNumber(number: bigint): bigint[] {
  const factors: bigint[] = [];
  if (number < 2n) return factors;
  let n = number;
  while (n % 2n === 0n) {
    factors.push(2n);
    n /= 2n;
  }
  // Odd divisors up to the square root of what is left
  for (let i = 3n; i * i <= n; i += 2n) {
    while (n % i === 0n) {
      factors.push(i);
      n /= i;
    }
  }
  // What is left is a prime greater than 2
  if (n > 2n) factors.push(n);
  return factors;
}
