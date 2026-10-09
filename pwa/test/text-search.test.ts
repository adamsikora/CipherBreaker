import { describe, expect, it } from 'vitest';
import { countMatches, findMatches, highlightRuns, parseTerms, searchText } from '../src/logic/text-search';

/** The parts of the text that the terms of the query are found in */
function found(text: string, query: string): string[] {
  return findMatches(searchText(text), parseTerms(query)).map(match => text.slice(match.start, match.end));
}

describe('Text search', () => {
  it('makes the key of a text with the places of its characters', () => {
    expect(searchText('Ah, oj!')).toEqual({ key: 'ahoj', starts: [0, 1, 4, 5], ends: [1, 2, 5, 6] });
    expect(searchText('')).toEqual({ key: '', starts: [], ends: [] });
    expect(searchText(' .,\n')).toEqual({ key: '', starts: [], ends: [] });
    expect(searchText('Žluťoučký kůň 42').key).toBe('zlutouckykun42');
  });

  it('keeps the characters that make more letters or take more places together', () => {
    // A sharp s is two letters of the key, a letter out of the basic plane two places of the text
    expect(searchText('aßb')).toEqual({ key: 'assb', starts: [0, 1, 1, 2], ends: [1, 2, 2, 3] });
    expect(searchText('a\u{1D41B}c')).toEqual({ key: 'abc', starts: [0, 1, 3], ends: [1, 3, 4] });
    // An accent of its own belongs to its letter
    expect(searchText('éx')).toEqual({ key: 'ex', starts: [0, 2], ends: [2, 3] });
    expect(searchText('́e')).toEqual({ key: 'e', starts: [1], ends: [2] });
  });

  it('parses the terms of a query', () => {
    expect(parseTerms('pes, Kočka,kůň')).toEqual(['pes', 'kocka', 'kun']);
    expect(parseTerms('')).toEqual([]);
    expect(parseTerms(' , ,, .')).toEqual([]);
    expect(parseTerms('dva psi, DVAPSI, tři')).toEqual(['dvapsi', 'tri']);
  });

  it('finds words regardless of case and diacritics', () => {
    expect(found('Kůň běží, KUN stojí.', 'kun')).toEqual(['Kůň', 'KUN']);
    expect(found('Kun bezi', 'běží')).toEqual(['bezi']);
  });

  it('finds words across whitespace and punctuation', () => {
    expect(found('Na stole pes, kanec\na los.', 'lepes')).toEqual(['le pes']);
    expect(found('Na stole pes, kanec\na los.', 'kaneca')).toEqual(['kanec\na']);
    expect(found('a-b c', 'abc')).toEqual(['a-b c']);
  });

  it('does not take the characters around a match', () => {
    const text = '  (pes)  ';
    expect(findMatches(searchText(text), ['pes'])).toEqual([{ term: 0, start: 3, end: 6 }]);
  });

  it('finds every term, in the order of the text', () => {
    const text = 'pes a kocka a pes';
    expect(findMatches(searchText(text), parseTerms('kocka, pes'))).toEqual([
      { term: 1, start: 0, end: 3 },
      { term: 0, start: 6, end: 11 },
      { term: 1, start: 14, end: 17 },
    ]);
    expect(countMatches(findMatches(searchText(text), parseTerms('kocka, pes, los')), 3)).toEqual([1, 2, 0]);
  });

  it('finds overlapping matches, the longer of those that start together first', () => {
    expect(findMatches(searchText('aaa'), ['aa'])).toEqual([{ term: 0, start: 0, end: 2 }, { term: 0, start: 1, end: 3 }]);
    expect(findMatches(searchText('abcd'), ['ab', 'abc', 'bcd'])).toEqual([
      { term: 1, start: 0, end: 3 },
      { term: 0, start: 0, end: 2 },
      { term: 2, start: 1, end: 4 },
    ]);
  });

  it('finds nothing without terms or text', () => {
    expect(findMatches(searchText('pes'), [])).toEqual([]);
    expect(findMatches(searchText('pes'), [''])).toEqual([]);
    expect(findMatches(searchText(''), ['pes'])).toEqual([]);
  });

  it('stops at the limit', () => {
    expect(findMatches(searchText('a'.repeat(100)), ['a'], 10).length).toBe(10);
    expect(findMatches(searchText('a'.repeat(100)), ['a']).length).toBe(100);
  });

  it('highlights matches that stand apart as they are', () => {
    const matches = findMatches(searchText('pes a kocka a pes'), parseTerms('kocka, pes'));
    expect(highlightRuns(matches)).toEqual(matches);
    expect(highlightRuns([])).toEqual([]);
  });

  it('highlights overlapping matches with the later one on top', () => {
    // abcd: ab and abc start together, bcd starts in them
    const matches = findMatches(searchText('abcd'), ['ab', 'abc', 'bcd']);
    expect(highlightRuns(matches)).toEqual([
      { term: 0, start: 0, end: 1 },
      { term: 2, start: 1, end: 2 },
      { term: 2, start: 2, end: 3 },
      { term: 2, start: 3, end: 4 },
    ]);
    expect(highlightRuns(findMatches(searchText('aaa'), ['aa']))).toEqual([
      { term: 0, start: 0, end: 1 },
      { term: 0, start: 1, end: 2 },
      { term: 0, start: 2, end: 3 },
    ]);
  });

  it('highlights the rest of a match that another one ends in', () => {
    // xabcx: b is found in abc, which shows on both of its sides
    expect(highlightRuns(findMatches(searchText('xabcx'), ['abc', 'b']))).toEqual([
      { term: 0, start: 1, end: 2 },
      { term: 1, start: 2, end: 3 },
      { term: 0, start: 3, end: 4 },
    ]);
  });

  it('has a run starting where every match starts', () => {
    const matches = findMatches(searchText('abc abc bca cab'), ['abc', 'bc', 'ca', 'cabc', 'a']);
    const runStarts = new Set(highlightRuns(matches).map(run => run.start));
    expect(matches.every(match => runStarts.has(match.start))).toBe(true);
  });
});
