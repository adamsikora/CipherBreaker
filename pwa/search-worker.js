// Loads front coded dictionaries and searches them, a port of Dictionary.kt, MapDictionary.kt
// and DictionaryKey.kt of the Android app. Runs in a web worker so that the page stays responsive

const MAX_RESULTS = 1000;
const DISTANCE_LIMIT = 6;
const CHUNK = 20000;

const COUNTS_LISTS = [
  ['', 'et', 'aimn', 'dgkorsuw', 'bcfhjlpqvxyz'], // Morse
  ['', 'a', 'bceik', 'dfhjlmosu', 'gnprtvxz', 'qwy'], // Braille
  ['', '', 'ir', 'clnu', 'fhjoty', 'bdegkmpqsvxz', 'aw'], // Segments
  ['', 'i', 'cjltvx', 'acdfhjknpsuyz', 'egmorw', 'bqs'], // Moves
  ['cefghijklmnstuvwxyz', 'adopqr', 'b'], // Holes
  ['bdo', 'p', 'acgijlmnqrsuvwz', 'efty', 'hkx'], // Ends
];

// ---- Keys, see DictionaryKey.kt ----

// Letters that are not made of a base letter and a diacritical mark
const SPECIAL = {
  'ł': 'l', 'ø': 'o', 'đ': 'd', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe',
  'þ': 'th', 'ð': 'd', 'ı': 'i', 'ħ': 'h',
};
const TABLE_START = 0x80;
const TABLE_END = 0x180;
const LETTER = /\p{L}/u;

function normalizedKey(name) {
  let key = '';
  for (const c of name.normalize('NFKD')) {
    const lower = c.toLowerCase();
    for (const d of SPECIAL[lower] || lower) {
      if ((d >= 'a' && d <= 'z') || (d >= '0' && d <= '9')) key += d;
    }
  }
  return key;
}

const TABLE = [];
for (let code = TABLE_START; code < TABLE_END; code++) {
  TABLE.push(normalizedKey(String.fromCharCode(code)));
}

function keyFromName(name) {
  let key = '';
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57)) key += name[i];
    else if (code >= 65 && code <= 90) key += String.fromCharCode(code + 32);
    else if (code < TABLE_START) continue;
    else if (code < TABLE_END) key += TABLE[code - TABLE_START];
    else return normalizedKey(name);
  }
  return key;
}

function keyWithDiacritics(name) {
  let key = '';
  for (const c of name) {
    const code = c.codePointAt(0);
    if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57)) key += c;
    else if (code >= 65 && code <= 90) key += String.fromCharCode(code + 32);
    else if (code < TABLE_START) continue;
    else if (LETTER.test(c)) key += c.toLowerCase();
  }
  return key;
}

// ---- Distances, see StringUtils.kt ----

function hammingDistance(a, b) {
  let counter = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) counter++;
  }
  return counter;
}

// Distances of limit and more are all given as limit
function levenshteinDistance(a, b, limit, costs) {
  if (Math.abs(a.length - b.length) >= limit) return limit;
  for (let j = 0; j <= b.length; j++) costs[j] = j;
  for (let i = 1; i <= a.length; i++) {
    costs[0] = i;
    let nw = i - 1;
    let rowMin = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cj = Math.min(1 + Math.min(costs[j], costs[j - 1]), ca === b.charCodeAt(j - 1) ? nw : nw + 1);
      nw = costs[j];
      costs[j] = cj;
      if (cj < rowMin) rowMin = cj;
    }
    if (rowMin >= limit) return limit;
  }
  return Math.min(costs[b.length], limit);
}

// ---- Front coded files, see utils/src/common/front_coding.py ----

function frontDecode(coded) {
  const lines = new Array(coded.length);
  let previous = '';
  for (let i = 0; i < coded.length; i++) {
    const codedLine = coded[i];
    let line;
    const first = codedLine.charCodeAt(0);
    if (codedLine[0] === '=') {
      line = previous.slice(0, codedLine.charCodeAt(1) - 97) + codedLine.slice(2);
    } else if (first >= 65 && first <= 90) {
      line = previous.slice(0, first - 65) + codedLine.slice(1);
      line = line[0].toUpperCase() + line.slice(1);
    } else {
      line = previous.slice(0, first - 97) + codedLine.slice(1);
    }
    lines[i] = line;
    previous = line.toLowerCase();
  }
  return lines;
}

// ---- Dictionaries ----

const dictionaries = new Map(); // name -> { entries, names, keys, keysDia, lat, lon }
let loading = null;

function post(msg) {
  self.postMessage(msg);
}

async function loadDictionary(name) {
  if (dictionaries.has(name)) return dictionaries.get(name);
  if (loading && loading.name === name) return loading.promise;
  const promise = (async () => {
    post({ type: 'loading', text: `Loading ${name}…` });
    const started = performance.now();
    const response = await fetch('assets/' + name);
    if (!response.ok) throw new Error(`Cannot load ${name}`);
    const text = await response.text();
    const lines = text.split('\n');
    const total = parseInt(lines[0], 10);
    if (!Number.isFinite(total)) throw new Error('Invalid dictionary file');
    if (lines[lines.length - 1] === '') lines.pop();
    const entries = frontDecode(lines.slice(1));
    const dictionary = { entries, names: null, keys: null, keysDia: null, lat: null, lon: null };
    if (name.endsWith('.cbfcmap')) {
      // Lines are name;lat;lon, names are without semicolons
      const count = entries.length;
      dictionary.names = new Array(count);
      dictionary.lat = new Float64Array(count);
      dictionary.lon = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        const parts = entries[i].split(';');
        dictionary.names[i] = parts[0];
        dictionary.lat[i] = parseFloat(parts[parts.length - 2]);
        dictionary.lon[i] = parseFloat(parts[parts.length - 1]);
      }
    } else {
      dictionary.names = entries;
    }
    dictionaries.set(name, dictionary);
    const seconds = ((performance.now() - started) / 1000).toFixed(2);
    post({ type: 'loading', text: `${name}: ${entries.length} entries loaded in ${seconds} s` });
    return dictionary;
  })();
  loading = { name, promise };
  try {
    return await promise;
  } finally {
    if (loading && loading.promise === promise) loading = null;
  }
}

// Keys are made once per dictionary and kept, unlike in the app which makes them in every search
async function getKeys(dictionary, diacritics, shouldStop) {
  const field = diacritics ? 'keysDia' : 'keys';
  if (dictionary[field]) return dictionary[field];
  const names = dictionary.names;
  const keys = new Array(names.length);
  const make = diacritics ? keyWithDiacritics : keyFromName;
  for (let i = 0; i < names.length; i++) {
    keys[i] = make(names[i]);
    if (i % CHUNK === CHUNK - 1) {
      await yieldToMessages();
      if (shouldStop()) return null;
    }
  }
  dictionary[field] = keys;
  return keys;
}

function yieldToMessages() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function distanceMetres(lat1, lon1, lat2, lon2) {
  const r = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Search, see Dictionary.findResultsInternal ----

let currentSearch = 0;

async function search(msg) {
  const { id, name, modeId, input, minLength, maxLength, location } = msg;
  const shouldStop = () => currentSearch !== id;
  const started = performance.now();
  const time = () => (performance.now() - started) / 1000;

  const regex = modeId === 0;
  const subset = modeId === 1;
  const exact = modeId === 2;
  const superset = modeId === 3;
  const hamming = modeId === 4;
  const levenshtein = modeId === 5;
  const countMode = modeId >= 6;
  const counts = countMode ? COUNTS_LISTS[modeId - 6] : null;
  const countValues = [];
  // Letters of anagram and count modes are without diacritics
  const diacritics = msg.diacritics && (regex || hamming || levenshtein);
  const isMap = name.endsWith('.cbfcmap');
  const shouldSort = hamming || levenshtein;

  const fail = text => {
    post({ type: 'toast', id, text });
    post({ type: 'progress', id, progress: 100, count: 0, time: time(), result: '', done: true });
  };

  let pattern = null;
  if (regex) {
    try {
      pattern = new RegExp('^(?:' + input + ')$', 'u');
    } catch (e) {
      return fail('Invalid regex syntax');
    }
  }

  const charCount = new Int32Array(26);
  if (countMode) {
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
      else if (!(diacritics && LETTER.test(c))) post({ type: 'toast', id, text: `Invalid input letter "${c}"` });
    }
  }

  let dictionary;
  try {
    dictionary = await loadDictionary(name);
  } catch (e) {
    return fail(e.message);
  }
  if (shouldStop()) return;
  const keys = await getKeys(dictionary, diacritics, shouldStop);
  if (keys === null) return;
  const names = dictionary.names;
  const total = names.length;
  const costs = new Int32Array(input.length + 1);

  // Matches: strings for word dictionaries, {distance, name} for maps
  let matches = [];
  const trim = () => {
    if (isMap) matches.sort((a, b) => a.distance - b.distance || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    else if (shouldSort) matches.sort();
    matches = matches.slice(0, MAX_RESULTS);
  };
  const matched = (i, prefix) => {
    if (isMap) {
      const distance = location ? distanceMetres(location.lat, location.lon, dictionary.lat[i], dictionary.lon[i]) : 0;
      matches.push({ distance, name: prefix + names[i] });
    } else {
      matches.push(prefix + names[i]);
    }
    if (matches.length >= 2 * MAX_RESULTS) trim();
  };
  const conclude = () => {
    trim();
    if (isMap) return matches.map(m => `${m.name} (${Math.round(m.distance)}m)`).join('\n');
    return matches.join('\n');
  };
  const resultsSize = () => Math.min(matches.length, MAX_RESULTS);

  let lastUpdate = performance.now();
  for (let i = 0; i < total; i++) {
    if (i % CHUNK === CHUNK - 1) {
      await yieldToMessages();
      if (shouldStop()) return;
      const now = performance.now();
      if (now - lastUpdate > 100) {
        lastUpdate = now;
        post({ type: 'progress', id, progress: Math.floor(100 * i / total), count: resultsSize(), time: time(), result: conclude(), done: false });
      }
    }
    const first = keys[i];
    const len = first.length;
    if (subset && len > input.length
        || superset && len < input.length
        || exact && len !== input.length
        || hamming && len !== input.length
        || countMode && len !== input.length
        || len < minLength || len > maxLength) {
      continue;
    }
    if (regex) {
      if (pattern.test(first)) matched(i, '');
    } else if (hamming) {
      const d = hammingDistance(first, input);
      if (d < DISTANCE_LIMIT) matched(i, `(${d}) `);
    } else if (levenshtein) {
      const d = levenshteinDistance(first, input, DISTANCE_LIMIT, costs);
      if (d < DISTANCE_LIMIT) matched(i, `(${d}) `);
    } else if (countMode) {
      let allSatisfy = true;
      for (let j = 0; j < len; j++) {
        if (!counts[countValues[j]].includes(first[j])) { allSatisfy = false; break; }
      }
      if (allSatisfy) matched(i, '');
    } else {
      const chars = new Int32Array(26);
      for (let j = 0; j < len; j++) {
        // Digits of a key are not counted
        const position = first.charCodeAt(j) - 97;
        if (position >= 0 && position <= 25) chars[position]++;
      }
      let ok = true;
      for (let k = 0; k < 26; k++) {
        if (subset && charCount[k] < chars[k] || exact && charCount[k] !== chars[k] || superset && charCount[k] > chars[k]) { ok = false; break; }
      }
      if (ok) matched(i, '');
    }
  }
  post({ type: 'progress', id, progress: 100, count: resultsSize(), time: time(), result: conclude(), done: true });
}

self.onmessage = event => {
  const msg = event.data;
  if (msg.type === 'load') {
    loadDictionary(msg.name).catch(e => post({ type: 'loading', text: e.message }));
  } else if (msg.type === 'search') {
    currentSearch = msg.id;
    search(msg).catch(e => post({ type: 'toast', id: msg.id, text: 'Unknown error ' + e.message }));
  }
};
