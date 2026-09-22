// Turns digits of binary and ternary numbers into letters in all the ways they can be read.
// Offset is 0 when A is 1 and 1 when A is 0. Port of BaseReader.kt

const BINARY_MAX = 31;

const ALPHABET = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const CH_ALPHABET = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'CH', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

// Every assignment of ternary digits 0, 1, 2 (when reading values)
// and every order of reading three digits (when reading order)
const TERNARY_MAPPING = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

export function getLetter(i: number): string {
  return i >= 1 && i <= 26 ? ALPHABET[i] : ' ';
}

export function getChLetter(i: number): string {
  return i >= 1 && i <= 27 ? CH_ALPHABET[i] : ' ';
}

/**
 * Binary digits read with the most significant digit on the right, the same with digits
 * inverted, with the most significant digit on the left and the same with digits inverted.
 */
export function binaryLetters(values: number[], offset: number): string[] {
  let down = 0;
  let up = 0;
  for (let k = 0; k < values.length; k++) {
    down = down * 2 + values[k];
  }
  for (let k = values.length - 1; k >= 0; k--) {
    up = up * 2 + values[k];
  }
  return [
    getLetter(up + offset),
    getLetter(BINARY_MAX - up + offset),
    getLetter(down + offset),
    getLetter(BINARY_MAX - down + offset),
  ];
}

/**
 * Three ternary digits read in six ways. When reading order, the digits are taken in all
 * six orders. Otherwise their values are assigned in all six ways and the most significant
 * digit is either on the right or on the left.
 */
export function ternaryLetters(values: number[], readOrder: boolean, significantOnRight: boolean, offset: number, ch: boolean): string[] {
  const iterate = significantOnRight ? [2, 1, 0] : [0, 1, 2];
  const letters: string[] = [];
  for (let i = 0; i < 6; i++) {
    let value = 0;
    if (readOrder) {
      for (const j of TERNARY_MAPPING[5 - i]) {
        value = value * 3 + values[j];
      }
    } else {
      for (const j of iterate) {
        value = value * 3 + TERNARY_MAPPING[i][values[j]];
      }
    }
    letters.push(ch ? getChLetter(value + offset) : getLetter(value + offset));
  }
  return letters;
}
