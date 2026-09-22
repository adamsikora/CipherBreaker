import { describe, expect, it } from 'vitest';
import { binaryLetters, getChLetter, getLetter, ternaryLetters } from '../src/logic/base-reader';

describe('letters', () => {
  it('are numbered from one', () => {
    expect(getLetter(1)).toBe('A');
    expect(getLetter(9)).toBe('I');
    expect(getLetter(26)).toBe('Z');
  });

  it('are blank outside of the alphabet', () => {
    expect(getLetter(0)).toBe(' ');
    expect(getLetter(27)).toBe(' ');
    expect(getLetter(-1)).toBe(' ');
    expect(getChLetter(0)).toBe(' ');
    expect(getChLetter(28)).toBe(' ');
  });

  it('have CH after H', () => {
    expect(getChLetter(8)).toBe('H');
    expect(getChLetter(9)).toBe('CH');
    expect(getChLetter(10)).toBe('I');
    expect(getChLetter(27)).toBe('Z');
  });
});

describe('binaryLetters', () => {
  it('reads in both directions and inverted', () => {
    // 00001 is 16 from the right and 1 from the left
    expect(binaryLetters([0, 0, 0, 0, 1], 0)).toEqual(['P', 'O', 'A', ' ']);
    expect(binaryLetters([1, 0, 1, 1, 0], 0)).toEqual(['M', 'R', 'V', 'I']);
    expect(binaryLetters([1, 1, 1, 1, 1], 0)).toEqual([' ', ' ', ' ', ' ']);
  });

  it('can start the alphabet at zero', () => {
    expect(binaryLetters([0, 0, 0, 0, 0], 1)).toEqual(['A', ' ', 'A', ' ']);
    expect(binaryLetters([0, 1, 0, 1, 1], 1)).toEqual([' ', 'F', 'L', 'U']);
  });
});

describe('ternaryLetters', () => {
  it('assigns values in all ways', () => {
    expect(ternaryLetters([0, 1, 2], false, false, 0, false)).toEqual(['E', 'G', 'K', 'O', 'S', 'U']);
    expect(ternaryLetters([0, 1, 2], false, true, 0, false)).toEqual(['U', 'O', 'S', 'G', 'K', 'E']);
    expect(ternaryLetters([2, 2, 2], false, false, 0, false)).toEqual(['Z', 'M', 'Z', ' ', 'M', ' ']);
  });

  it('takes digits in all orders', () => {
    expect(ternaryLetters([0, 1, 2], true, false, 0, false)).toEqual(['U', 'S', 'O', 'K', 'G', 'E']);
    // Direction does not matter when reading order
    expect(ternaryLetters([0, 1, 2], true, true, 0, false)).toEqual(['U', 'S', 'O', 'K', 'G', 'E']);
  });

  it('can start the alphabet at zero and contain CH', () => {
    expect(ternaryLetters([1, 0, 0], false, false, 1, false)).toEqual(['J', 'S', 'E', 'W', 'I', 'R']);
    expect(ternaryLetters([1, 0, 0], false, false, 0, true)).toEqual(['CH', 'Q', 'D', 'U', 'H', 'P']);
    expect(ternaryLetters([2, 2, 2], false, false, 0, true)).toEqual(['Y', 'L', 'Y', ' ', 'L', ' ']);
  });
});
