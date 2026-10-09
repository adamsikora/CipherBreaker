// Searching of a pasted text for the Search tool: the text is searched by the key the dictionaries
// are searched by, without diacritics, case, whitespace and punctuation, so a word is found across
// the words of the text too. Made for the PWA, the Android app has no such tool

import { keyFromName } from './dictionary-key';

export interface SearchText {
  /** The letters and digits of the text, as the keys of the dictionaries have them */
  key: string;
  /** Where in the text the character of every character of the key starts, and where it ends */
  starts: number[];
  ends: number[];
}

export interface TextMatch {
  /** Which of the terms is found */
  term: number;
  /** The part of the text from the first to the last character of the match, the end is exclusive */
  start: number;
  end: number;
}

/** A part of the text to highlight in the colour of a term */
export type HighlightRun = TextMatch;

const COMBINING_MARK = /\p{M}/u;

/** The key of a text with the places of its characters in the text */
export function searchText(text: string): SearchText {
  let key = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;
  for (const character of text) {
    const end = index + character.length;
    const characterKey = keyFromName(character);
    for (let i = 0; i < characterKey.length; i++) {
      starts.push(index);
      ends.push(end);
    }
    // An accent written as a character of its own belongs to the letter before it
    if (characterKey === '' && ends.length > 0 && ends[ends.length - 1] === index && COMBINING_MARK.test(character)) {
      ends[ends.length - 1] = end;
    }
    key += characterKey;
    index = end;
  }
  return { key, starts, ends };
}

/** The keys of the comma separated terms of a query; the empty ones and the repeated ones are left out */
export function parseTerms(query: string): string[] {
  const terms: string[] = [];
  for (const part of query.split(',')) {
    const term = keyFromName(part);
    if (term !== '' && !terms.includes(term)) terms.push(term);
  }
  return terms;
}

/**
 * Every place of every term in the text, the overlapping ones too, in the order of the text; of
 * the matches that start together the longer is first. No more than the limit of them is looked for
 */
export function findMatches(text: SearchText, terms: readonly string[], limit = Infinity): TextMatch[] {
  const matches: TextMatch[] = [];
  terms.forEach((term, termIndex) => {
    if (term === '') return;
    for (let at = text.key.indexOf(term); at !== -1 && matches.length < limit; at = text.key.indexOf(term, at + 1)) {
      matches.push({ term: termIndex, start: text.starts[at], end: text.ends[at + term.length - 1] });
    }
  });
  return matches.sort((a, b) => a.start - b.start || b.end - a.end || a.term - b.term);
}

/**
 * The parts of the text to highlight, in its order and not overlapping: where matches overlap, the
 * one that starts last is on top, the shorter of those that start together. The matches are as
 * findMatches gives them
 */
export function highlightRuns(matches: readonly TextMatch[]): HighlightRun[] {
  const bounds = [...new Set(matches.flatMap(match => [match.start, match.end]))].sort((a, b) => a - b);
  const runs: HighlightRun[] = [];
  let active: TextMatch[] = [];
  let next = 0;
  for (let i = 0; i + 1 < bounds.length; i++) {
    const start = bounds[i];
    active = active.filter(match => match.end > start);
    while (next < matches.length && matches[next].start === start) active.push(matches[next++]);
    if (active.length > 0) runs.push({ term: active[active.length - 1].term, start, end: bounds[i + 1] });
  }
  return runs;
}

/** How many times each of the terms is among the matches */
export function countMatches(matches: readonly TextMatch[], termCount: number): number[] {
  const counts = new Array<number>(termCount).fill(0);
  for (const match of matches) counts[match.term]++;
  return counts;
}
