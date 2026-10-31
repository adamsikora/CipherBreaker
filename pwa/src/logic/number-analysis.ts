// Parsing, formatting and factoring of unsigned 64-bit numbers, which are bigint here as they do
// not fit into a JS number. Port of NumberAnalysis.kt, except for the factoring: dividing up to the
// square root, as the app does, would block the page for half a minute on the largest primes

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

const TRIAL_DIVISION_LIMIT = 1000n;
// With these the Miller-Rabin test is certain for every 64-bit number, not just probable
const PRIMALITY_WITNESSES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
const RHO_BATCH = 128;

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

function powMod(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let power = base % modulus;
  for (let e = exponent; e > 0n; e >>= 1n) {
    if (e & 1n) result = result * power % modulus;
    power = power * power % modulus;
  }
  return result;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y > 0n) {
    const rest = x % y;
    x = y;
    y = rest;
  }
  return x;
}

/** Miller-Rabin test of an odd number without factors below TRIAL_DIVISION_LIMIT */
function isPrime(n: bigint): boolean {
  if (n < TRIAL_DIVISION_LIMIT * TRIAL_DIVISION_LIMIT) return true;
  let odd = n - 1n;
  let twos = 0;
  while (!(odd & 1n)) {
    odd >>= 1n;
    twos++;
  }
  witnesses: for (const witness of PRIMALITY_WITNESSES) {
    let x = powMod(witness, odd, n);
    if (x === 1n || x === n - 1n) continue;
    for (let i = 1; i < twos; i++) {
      x = x * x % n;
      if (x === n - 1n) continue witnesses;
    }
    return false;
  }
  return true;
}

/** A factor of a composite odd number other than 1 and the number itself, by Pollard's rho */
function findFactor(n: bigint): bigint {
  for (let c = 1n; ; c++) {
    const next = (x: bigint) => (x * x + c) % n;
    let slow = 2n;
    let fast = 2n;
    let factor = 1n;
    while (factor === 1n) {
      // A gcd costs more than the steps do, so it is made of the product of a batch of them
      const slowStart = slow;
      const fastStart = fast;
      let product = 1n;
      for (let i = 0; i < RHO_BATCH; i++) {
        slow = next(slow);
        fast = next(next(fast));
        product = product * (slow - fast) % n;
      }
      factor = gcd(n, product);
      if (factor === n) {
        // More than one factor came in the batch, or the walk closed: it is gone through by steps
        slow = slowStart;
        fast = fastStart;
        do {
          slow = next(slow);
          fast = next(next(fast));
          factor = gcd(n, slow - fast);
        } while (factor === 1n);
      }
    }
    // When the walk closed without a factor, another one is tried
    if (factor !== n) return factor;
  }
}

function addPrimeFactors(n: bigint, factors: bigint[]): void {
  if (isPrime(n)) {
    factors.push(n);
  } else {
    const factor = findFactor(n);
    addPrimeFactors(factor, factors);
    addPrimeFactors(n / factor, factors);
  }
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
  // The small odd divisors, dividing by them is the fastest way to get rid of them
  for (let i = 3n; i < TRIAL_DIVISION_LIMIT && i * i <= n; i += 2n) {
    while (n % i === 0n) {
      factors.push(i);
      n /= i;
    }
  }
  if (n > 1n) addPrimeFactors(n, factors);
  return factors.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
