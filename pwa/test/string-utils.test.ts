import { describe, expect, it } from 'vitest';
import { hammingDistance, levenshteinDistance } from '../src/logic/string-utils';

describe('levenshteinDistance', () => {
  it('is zero for the same words', () => {
    expect(levenshteinDistance('sifra', 'sifra')).toBe(0);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('counts edits', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('flaw', 'lawn')).toBe(2);
    expect(levenshteinDistance('sifra', 'sifry')).toBe(1);
  });

  it('is the length to an empty word', () => {
    expect(levenshteinDistance('sifra', '')).toBe(5);
    expect(levenshteinDistance('', 'sifra')).toBe(5);
  });

  it('ignores case', () => {
    expect(levenshteinDistance('Sifra', 'sIFRA')).toBe(0);
  });

  it('is the same below the limit', () => {
    expect(levenshteinDistance('sifra', 'sifra', 6)).toBe(0);
    expect(levenshteinDistance('kitten', 'sitting', 6)).toBe(3);
    expect(levenshteinDistance('sifra', '', 6)).toBe(5);
    expect(levenshteinDistance('', 'sifra', 6)).toBe(5);
  });

  it('is the limit from the limit up', () => {
    expect(levenshteinDistance('kitten', 'sitting', 3)).toBe(3);
    expect(levenshteinDistance('kitten', 'sitting', 2)).toBe(2);
    // Lengths differ by the limit
    expect(levenshteinDistance('sifra', 'sifrovackou', 6)).toBe(6);
    expect(levenshteinDistance('abcdefgh', 'stuvwxyz', 6)).toBe(6);
  });

  it('matches the unlimited one when limited', () => {
    const words = ['', 'a', 'kos', 'kost', 'kosti', 'sako', 'pesek', 'sifra', 'sifrovacka',
      'prekvapeni', 'prekazka', 'nejneobhospodarovavatelnejsi'];
    for (const a of words) {
      for (const b of words) {
        for (let limit = 1; limit <= 8; limit++) {
          expect(levenshteinDistance(a, b, limit), `${a} ${b} ${limit}`).toBe(Math.min(levenshteinDistance(a, b), limit));
        }
      }
    }
  });

  it('does not ignore case when limited', () => {
    expect(levenshteinDistance('Sifra', 'sIFRA', 6)).toBe(5);
  });

  it('can reuse the costs', () => {
    const costs = new Int32Array(20);
    expect(levenshteinDistance('kitten', 'sitting', 6, costs)).toBe(3);
    expect(levenshteinDistance('sifra', 'sifry', 6, costs)).toBe(1);
    expect(levenshteinDistance('abcdefgh', 'stuvwxyz', 6, costs)).toBe(6);
    expect(levenshteinDistance('flaw', 'lawn', 6, costs)).toBe(2);
  });
});

describe('hammingDistance', () => {
  it('counts different positions', () => {
    expect(hammingDistance('sifra', 'sifra')).toBe(0);
    expect(hammingDistance('karolin', 'kathrin')).toBe(3);
    expect(hammingDistance('abcde', 'vwxyz')).toBe(5);
  });

  it('ignores case', () => {
    expect(hammingDistance('Sifra', 'sIFRA')).toBe(0);
  });
});
