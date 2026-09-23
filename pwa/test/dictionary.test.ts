import { describe, expect, it } from 'vitest';
import { Dictionary, loadDictionary, search } from '../src/logic/dictionary';

const words = ['en', 'kos', 'osa', 'pes', 'šep', 'ta', 'at', 'kosa', 'sako', 'pešek', 'kost', 'kosti'];

const regex = 0;
const hamming = 1;
const levenshtein = 2;
const subset = 3;
const exact = 4;
const superset = 5;
const morse = 6;
const holes = 10;

interface Result {
  matches: string[];
  count: number;
  toasts: string[];
}

async function run(dictionary: Dictionary, input: string, modeId: number,
                   { minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, diacritics = false } = {}): Promise<Result> {
  const toasts: string[] = [];
  let lastResult = '';
  let lastCount = -1;
  let lastProgress = -1;
  await search(dictionary, input, { modeId, minLength, maxLength, diacritics }, null, {
    toast: text => toasts.push(text),
    progress: (progress, count, _time, result) => {
      lastProgress = progress;
      lastCount = count;
      lastResult = result;
    },
  });
  expect(lastProgress).toBe(100);
  return { matches: lastResult.split('\n').filter(m => m !== ''), count: lastCount, toasts };
}

const find = (input: string, modeId: number, options = {}, names = words) => run({ names }, input, modeId, options);

describe('word dictionary', () => {
  it('matches regex against the whole key', async () => {
    expect((await find('kos.*', regex)).matches).toEqual(['kos', 'kosa', 'kost', 'kosti']);
    expect((await find('kos', regex)).matches).toEqual(['kos']);
    expect((await find('[ps]e[ps]', regex)).matches).toEqual(['pes', 'šep']);
  });

  it('counts matches', async () => {
    const result = await find('kos.*', regex);
    expect(result.count).toBe(4);
    expect(result.toasts).toEqual([]);
  });

  it('searches the key and shows the name', async () => {
    expect((await find('pesek', regex)).matches).toEqual(['pešek']);
    expect((await find('pešek', regex)).matches).toEqual([]);
  });

  it('makes keys of letters and digits in lower case', async () => {
    const names = ['Karel IV.', 'iPhone 4S'];
    expect((await find('kareliv', regex, {}, names)).matches).toEqual(['Karel IV.']);
    expect((await find('iphone4s', regex, {}, names)).matches).toEqual(['iPhone 4S']);
  });

  it('reports invalid regex', async () => {
    const result = await find('kos(', regex);
    expect(result.matches).toEqual([]);
    expect(result.toasts).toEqual(['Invalid regex syntax']);
  });

  it('finds words made of some of the letters as subset', async () => {
    expect((await find('kosa', subset)).matches).toEqual(['kos', 'osa', 'kosa', 'sako']);
    expect((await find('kk', subset)).matches).toEqual([]);
  });

  it('finds anagrams as exact', async () => {
    expect((await find('oska', exact)).matches).toEqual(['kosa', 'sako']);
    expect((await find('eps', exact)).matches).toEqual(['pes', 'šep']);
    expect((await find('kosaa', exact)).matches).toEqual([]);
  });

  it('finds words containing all the letters as superset', async () => {
    expect((await find('ok', superset)).matches).toEqual(['kos', 'kosa', 'sako', 'kost', 'kosti']);
    expect((await find('it', superset)).matches).toEqual(['kosti']);
  });

  it('applies length limits', async () => {
    expect((await find('kos.*', regex, { minLength: 4, maxLength: 4 })).matches).toEqual(['kosa', 'kost']);
    expect((await find('kos.*', regex, { minLength: 5 })).matches).toEqual(['kosti']);
    expect((await find('kos.*', regex, { maxLength: 3 })).matches).toEqual(['kos']);
  });

  it('finds close words of the same length with hamming sorted by distance', async () => {
    expect((await find('kosa', hamming)).matches).toEqual(['(0) kosa', '(1) kost', '(4) sako']);
  });

  it('finds close words with levenshtein sorted by distance', async () => {
    const matches = (await find('kost', levenshtein)).matches;
    expect(matches.slice(0, 4)).toEqual(['(0) kost', '(1) kos', '(1) kosa', '(1) kosti']);
    // Everything in this small dictionary is closer than the limit of 6 edits
    expect(matches.length).toBe(words.length);
  });

  it('matches letters by number of symbols in morse mode', async () => {
    // One symbol is E or T, two symbols are A, I, M or N
    expect((await find('12', morse)).matches).toEqual(['en', 'ta']);
    expect((await find('21', morse)).matches).toEqual(['at']);
  });

  it('rejects unusable digits in count modes', async () => {
    const tooLarge = await find('19', morse);
    expect(tooLarge.matches).toEqual([]);
    expect(tooLarge.toasts).toEqual(['Only numbers up to 5 are usable in this mode. Aborting calculation']);

    const noLetters = await find('10', morse);
    expect(noLetters.matches).toEqual([]);
    expect(noLetters.toasts).toEqual(['0 has no assigned letters in this mode. Aborting calculation']);

    const notDigit = await find('1a', morse);
    expect(notDigit.matches).toEqual([]);
    expect(notDigit.toasts).toEqual(['Invalid input letter "a". Aborting calculation']);
  });

  it('allows zero in holes mode', async () => {
    // O and A have one hole, the rest of the letters in the dictionary none
    expect((await find('010', holes)).matches).toEqual(['kos']);
    expect((await find('101', holes)).matches).toEqual(['osa']);
  });

  it('matches diacritics when asked for', async () => {
    expect((await find('pešek', regex, { diacritics: true })).matches).toEqual(['pešek']);
    expect((await find('pesek', regex, { diacritics: true })).matches).toEqual([]);
    expect((await find('[ps]e[ps]', regex, { diacritics: true })).matches).toEqual(['pes']);
    expect((await find('[pš]e[ps]', regex, { diacritics: true })).matches).toEqual(['pes', 'šep']);
  });

  it('matches diacritics regardless of case', async () => {
    const names = ['Šárka', 'ŠÍP'];
    expect((await find('šárka', regex, { diacritics: true }, names)).matches).toEqual(['Šárka']);
    expect((await find('šíp', hamming, { diacritics: true }, names)).matches).toEqual(['(0) ŠÍP']);
  });

  it('makes distances sensitive to diacritics when asked for', async () => {
    const names = ['šep'];
    expect((await find('sep', hamming, {}, names)).matches).toEqual(['(0) šep']);
    expect((await find('šep', hamming, { diacritics: true }, names)).matches).toEqual(['(0) šep']);
    expect((await find('sep', hamming, { diacritics: true }, names)).matches).toEqual(['(1) šep']);

    const result = await find('šepy', levenshtein, { diacritics: true }, names);
    expect(result.matches).toEqual(['(1) šep']);
    expect(result.toasts).toEqual([]);
    expect((await find('sepy', levenshtein, { diacritics: true }, names)).matches).toEqual(['(2) šep']);
  });

  it('ignores diacritics in anagram modes', async () => {
    expect((await find('eps', exact, { diacritics: true })).matches).toEqual(['pes', 'šep']);
    expect((await find('kosa', subset, { diacritics: true })).matches).toEqual(['kos', 'osa', 'kosa', 'sako']);
    expect((await find('it', superset, { diacritics: true })).matches).toEqual(['kosti']);
    expect((await find('pše', exact, { diacritics: true })).toasts).toEqual(['Invalid input letter "š"']);
  });

  it('ignores diacritics in count modes', async () => {
    // S has three symbols, E one and P four
    expect((await find('314', morse, { diacritics: true }, ['šep'])).matches).toEqual(['šep']);
  });

  it('keeps the first thousand matches of many', async () => {
    const names = Array.from({ length: 2500 }, (_, i) => `slovo${i}`);
    const result = await find('slovo.*', regex, {}, names);
    expect(result.count).toBe(1000);
    expect(result.matches.length).toBe(1000);
    expect(result.matches[0]).toBe('slovo0');
  });
});

describe('loadDictionary', () => {
  it('decodes a front coded file', () => {
    expect(loadDictionary('3\naabeceda\ngně\nhí\n', false).names).toEqual(['abeceda', 'abecedně', 'abecední']);
  });

  it('reports a file without the number of entries', () => {
    expect(() => loadDictionary('aabeceda\ngně', false)).toThrow('Invalid dictionary file');
  });

  it('splits places into names and coordinates', () => {
    const map = loadDictionary('2\nApetřín;49.46814;17.97076\nGy;50.08335;14.39509', true);
    expect(map.names).toEqual(['Petřín', 'Petříny']);
    expect(Array.from(map.lat!)).toEqual([49.46814, 50.08335]);
    expect(Array.from(map.lon!)).toEqual([17.97076, 14.39509]);
  });
});

// Without a location all distances are zero and results are sorted by name
describe('map', () => {
  const map = loadDictionary('4\n' + [
    'Bus 741: Gmünd;48.76112;14.97252',
    'Petřín;49.46814;17.97076',
    'Petřín;50.08335;14.39509',
    'Vítkov;50.08881;14.45004',
  ].map(line => 'a' + line).join('\n'), true);
  const findPlace = (input: string, options = {}) => run(map, input, regex, options);

  it('replaces coordinates with distance', async () => {
    expect((await findPlace('vitkov')).matches).toEqual(['Vítkov (0m)']);
  });

  it('lists all places of the same name', async () => {
    expect((await findPlace('petrin')).matches).toEqual(['Petřín (0m)', 'Petřín (0m)']);
  });

  it('sorts results by name', async () => {
    expect((await findPlace('[pv].*')).matches).toEqual(['Petřín (0m)', 'Petřín (0m)', 'Vítkov (0m)']);
  });

  it('keeps a colon in the name', async () => {
    expect((await findPlace('bus.*')).matches).toEqual(['Bus 741: Gmünd (0m)']);
  });

  it('leaves coordinates out of the key', async () => {
    expect((await findPlace('bus741gmund')).matches).toEqual(['Bus 741: Gmünd (0m)']);
    expect((await findPlace('.*50.*')).matches).toEqual([]);
  });

  it('can require diacritics', async () => {
    expect((await findPlace('vítkov', { diacritics: true })).matches).toEqual(['Vítkov (0m)']);
    expect((await findPlace('bus741gmünd', { diacritics: true })).matches).toEqual(['Bus 741: Gmünd (0m)']);
    expect((await findPlace('vitkov', { diacritics: true })).matches).toEqual([]);
  });

  it('sorts by distance from the location', async () => {
    let lastResult = '';
    await search(map, '.*', { modeId: regex, minLength: 0, maxLength: 100, diacritics: false },
      { lat: 50.08335, lon: 14.39509 }, { toast: () => {}, progress: (_p, _c, _t, result) => { lastResult = result; } });
    const lines = lastResult.split('\n');
    expect(lines[0]).toBe('Petřín (0m)');
    expect(lines[1]).toMatch(/^Vítkov \(\d+m\)$/);
    // Gmünd is closer to Prague than the Moravian Petřín
    expect(lines[2]).toMatch(/^Bus 741: Gmünd \(\d+m\)$/);
    expect(lines[3]).toMatch(/^Petřín \(2\d{5}m\)$/);
  });
});
