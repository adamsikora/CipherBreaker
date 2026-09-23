// Searching of word dictionaries and maps of places. Port of Dictionary.kt and MapDictionary.kt:
// entries are searched by keys made of their names, entries themselves are shown. Unlike the app,
// which makes the keys during every search, they are made once per dictionary and kept.

import { keyFromName, keyWithDiacritics } from './dictionary-key';
import { decodeFile } from './front-coding';
import { hammingDistance, levenshteinDistance } from './string-utils';

export const MAX_RESULTS = 1000;
const DISTANCE_LIMIT = 6;
const CHUNK = 20000;

export const MODES = ['Regex', 'Hamming', 'Levenshtein', 'Subanagram', 'Anagram', 'Superanagram',
  '# Morse', '# Braille', '# Segments', '# Moves', '# Holes', '# Ends'];

const COUNTS_LISTS = [
  ['', 'et', 'aimn', 'dgkorsuw', 'bcfhjlpqvxyz'], // Morse
  ['', 'a', 'bceik', 'dfhjlmosu', 'gnprtvxz', 'qwy'], // Braille
  ['', '', 'ir', 'clnu', 'fhjoty', 'bdegkmpqsvxz', 'aw'], // Segments
  ['', 'i', 'cjltvx', 'acdfhjknpsuyz', 'egmorw', 'bqs'], // Moves
  ['cefghijklmnstuvwxyz', 'adopqr', 'b'], // Holes
  ['bdo', 'p', 'acgijlmnqrsuvwz', 'efty', 'hkx'], // Ends
];

const LETTER = /\p{L}/u;

export interface Dictionary {
  /** Entries as shown, names of places for a map */
  names: string[];
  /** Coordinates of the places, only for a map */
  lat?: Float64Array;
  lon?: Float64Array;
  /** Keys of the entries, made by prepareKeys once and kept; see it for when */
  keys?: Promise<string[]>;
  keysWithDiacritics?: Promise<string[]>;
}

export interface QueryParams {
  modeId: number;
  minLength: number;
  maxLength: number;
  diacritics: boolean;
}

export interface Location {
  lat: number;
  lon: number;
}

export interface SearchCallbacks {
  toast(text: string): void;
  /** Called at most every 100 ms while searching and once more when done */
  progress(progress: number, count: number, time: number, result: string, done: boolean): void;
}

/** Makes a dictionary of the content of a front coded file, a map when the name ends with .cbfcmap */
export function loadDictionary(text: string, isMap: boolean): Dictionary {
  const entries = decodeFile(text);
  if (!isMap) return { names: entries };
  // Lines are name;lat;lon, names are without semicolons
  const count = entries.length;
  const names = new Array<string>(count);
  const lat = new Float64Array(count);
  const lon = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const parts = entries[i].split(';');
    names[i] = parts[0];
    lat[i] = parseFloat(parts[parts.length - 2]);
    lon[i] = parseFloat(parts[parts.length - 1]);
  }
  return { names, lat, lon };
}

export function isMap(dictionary: Dictionary): boolean {
  return dictionary.lat !== undefined;
}

const noYield = () => Promise.resolve();

/**
 * Keys of all the entries, computed the first time they are asked for and kept. Making them takes
 * about as long as a search, so the worker asks for the plain ones right after loading, while the
 * user is still typing; a search that comes meanwhile waits for the same computation.
 */
export function prepareKeys(dictionary: Dictionary, diacritics: boolean,
                            yieldNow: () => Promise<void> = noYield): Promise<string[]> {
  const existing = diacritics ? dictionary.keysWithDiacritics : dictionary.keys;
  if (existing) return existing;
  const names = dictionary.names;
  const make = diacritics ? keyWithDiacritics : keyFromName;
  const promise = (async () => {
    const keys = new Array<string>(names.length);
    for (let i = 0; i < names.length; i++) {
      keys[i] = make(names[i]);
      if (i % CHUNK === CHUNK - 1) await yieldNow();
    }
    return keys;
  })();
  if (diacritics) dictionary.keysWithDiacritics = promise;
  else dictionary.keys = promise;
  return promise;
}

export function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Place {
  distance: number;
  name: string;
}

const closerFirst = (a: Place, b: Place) => a.distance - b.distance || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const farther = (a: Place, b: Place) => closerFirst(a, b) > 0;

/**
 * The closest places matched so far, at most MAX_RESULTS of them. A binary heap with the farthest
 * place at the root, so that a closer match replaces it in logarithmic time: a query matching
 * every place, the way to list what is around, would otherwise sort the matches over and over.
 */
class ClosestPlaces {
  private readonly heap: Place[] = [];

  get size(): number {
    return this.heap.length;
  }

  add(place: Place): void {
    const heap = this.heap;
    if (heap.length < MAX_RESULTS) {
      heap.push(place);
      // Sift up
      let i = heap.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (!farther(heap[i], heap[parent])) break;
        [heap[i], heap[parent]] = [heap[parent], heap[i]];
        i = parent;
      }
    } else if (farther(heap[0], place)) {
      heap[0] = place;
      // Sift down
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let largest = i;
        if (left < heap.length && farther(heap[left], heap[largest])) largest = left;
        if (right < heap.length && farther(heap[right], heap[largest])) largest = right;
        if (largest === i) break;
        [heap[i], heap[largest]] = [heap[largest], heap[i]];
        i = largest;
      }
    }
  }

  /** The places from the closest, the heap itself is left as it is */
  sorted(): Place[] {
    return [...this.heap].sort(closerFirst);
  }
}

/**
 * Searches the dictionary. Input is expected in lower case. The search yields between chunks of
 * entries through yieldNow, and stops without a final progress call when shouldStop says so.
 */
export async function search(dictionary: Dictionary, input: string, params: QueryParams,
                             location: Location | null, callbacks: SearchCallbacks,
                             yieldNow: () => Promise<void> = noYield,
                             shouldStop: () => boolean = () => false): Promise<void> {
  const { modeId, minLength, maxLength } = params;
  const started = performance.now();
  const time = () => (performance.now() - started) / 1000;

  const regex = modeId === 0;
  const hamming = modeId === 1;
  const levenshtein = modeId === 2;
  const subset = modeId === 3;
  const exact = modeId === 4;
  const superset = modeId === 5;
  const countMode = modeId >= 6;
  const counts = countMode ? COUNTS_LISTS[modeId - 6] : null;
  const countValues: number[] = [];
  // Letters of anagram and count modes are without diacritics
  const diacritics = params.diacritics && (regex || hamming || levenshtein);
  const map = isMap(dictionary);
  const shouldSort = hamming || levenshtein;

  const fail = (text: string) => {
    callbacks.toast(text);
    callbacks.progress(100, 0, time(), '', true);
  };

  if (!counts && !(regex || subset || exact || superset || hamming || levenshtein)) {
    return fail('No mode selected');
  }

  let pattern: RegExp | null = null;
  if (regex) {
    try {
      pattern = new RegExp('^(?:' + input + ')$', 'u');
    } catch (e) {
      return fail('Invalid regex syntax');
    }
  }

  const charCount = new Int32Array(26);
  if (counts) {
    for (const c of input) {
      const position = c.charCodeAt(0) - 48;
      if (position < 0 || position > 9) return fail(`Invalid input letter "${c}". Aborting calculation`);
      if (position >= counts.length) return fail(`Only numbers up to ${counts.length} are usable in this mode. Aborting calculation`);
      if (counts[position] === '') return fail(`${position} has no assigned letters in this mode. Aborting calculation`);
      countValues.push(position);
    }
  } else if (!regex && !hamming) {
    for (const c of input) {
      const position = c.charCodeAt(0) - 97;
      if (position >= 0 && position <= 25) charCount[position]++;
      else if (!(diacritics && LETTER.test(c))) callbacks.toast(`Invalid input letter "${c}"`);
    }
  }

  const keys = await prepareKeys(dictionary, diacritics, yieldNow);
  if (shouldStop()) return;
  const names = dictionary.names;
  const total = names.length;
  const costs = new Int32Array(input.length + 1);
  // Letter counts of the entry in the anagram modes, one array reused for all the entries
  const chars = new Int32Array(26);

  // Matches are strings for a word dictionary, trimmed to MAX_RESULTS whenever twice as many
  // gather, and the closest places for a map
  let words: string[] = [];
  const places = new ClosestPlaces();
  const trim = () => {
    if (shouldSort) words.sort();
    words = words.slice(0, MAX_RESULTS);
  };
  const matched = (i: number, prefix: string) => {
    if (map) {
      const distance = location ? distanceMetres(location.lat, location.lon, dictionary.lat![i], dictionary.lon![i]) : 0;
      places.add({ distance, name: prefix + names[i] });
    } else {
      words.push(prefix + names[i]);
      if (words.length >= 2 * MAX_RESULTS) trim();
    }
  };
  const conclude = () => {
    if (map) return places.sorted().map(p => `${p.name} (${Math.round(p.distance)}m)`).join('\n');
    trim();
    return words.join('\n');
  };
  const resultsSize = () => map ? places.size : Math.min(words.length, MAX_RESULTS);

  let lastUpdate = performance.now();
  for (let i = 0; i < total; i++) {
    if (i % CHUNK === CHUNK - 1) {
      await yieldNow();
      if (shouldStop()) return;
      const now = performance.now();
      if (now - lastUpdate > 100) {
        lastUpdate = now;
        callbacks.progress(Math.floor(100 * i / total), resultsSize(), time(), conclude(), false);
      }
    }
    const first = keys[i];
    const len = first.length;
    if (subset && len > input.length
        || superset && len < input.length
        || exact && len !== input.length
        || hamming && len !== input.length
        || counts && len !== input.length
        || len < minLength || len > maxLength) {
      continue;
    }
    if (pattern) {
      if (pattern.test(first)) matched(i, '');
    } else if (hamming) {
      const d = hammingDistance(first, input);
      if (d < DISTANCE_LIMIT) matched(i, `(${d}) `);
    } else if (levenshtein) {
      const d = levenshteinDistance(first, input, DISTANCE_LIMIT, costs);
      if (d < DISTANCE_LIMIT) matched(i, `(${d}) `);
    } else if (counts) {
      let allSatisfy = true;
      for (let j = 0; j < len; j++) {
        if (!counts[countValues[j]].includes(first[j])) { allSatisfy = false; break; }
      }
      if (allSatisfy) matched(i, '');
    } else {
      chars.fill(0);
      for (let j = 0; j < len; j++) {
        // Digits of a key are not counted
        const position = first.charCodeAt(j) - 97;
        if (position >= 0 && position <= 25) chars[position]++;
      }
      let ok = true;
      for (let k = 0; k < 26; k++) {
        if (subset && charCount[k] < chars[k] || exact && charCount[k] !== chars[k] || superset && charCount[k] > chars[k]) {
          ok = false;
          break;
        }
      }
      if (ok) matched(i, '');
    }
  }
  callbacks.progress(100, resultsSize(), time(), conclude(), true);
}
