// Dictionaries are searched by keys made of the names in them: diacritics are removed, letters
// are made lower case and everything but a-z and digits is left out. Keys of searches that are
// sensitive to diacritics keep the letters as they are, only in lower case.
// Port of DictionaryKey.kt

// Letters that are not made of a base letter and a diacritical mark
const SPECIAL: Record<string, string> = {
  'ł': 'l', 'ø': 'o', 'đ': 'd', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe',
  'þ': 'th', 'ð': 'd', 'ı': 'i', 'ħ': 'h',
};

// Keys of the characters that follow ASCII, all the Czech letters are among them.
// Normalizing is too slow to be done for every name of a large dictionary
const TABLE_START = 0x80;
const TABLE_END = 0x180;
const LETTER = /\p{L}/u;

function isKeyChar(code: number): boolean {
  return (code >= 97 && code <= 122) || (code >= 48 && code <= 57);
}

function normalizedKey(name: string): string {
  let key = '';
  for (const c of name.normalize('NFKD')) {
    const lower = c.toLowerCase();
    for (const d of SPECIAL[lower] ?? lower) {
      if (isKeyChar(d.charCodeAt(0))) key += d;
    }
  }
  return key;
}

const TABLE: string[] = [];
for (let code = TABLE_START; code < TABLE_END; code++) {
  TABLE.push(normalizedKey(String.fromCharCode(code)));
}

export function keyFromName(name: string): string {
  let key = '';
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    if (isKeyChar(code)) key += name[i];
    else if (code >= 65 && code <= 90) key += String.fromCharCode(code + 32);
    else if (code < TABLE_START) continue;
    else if (code < TABLE_END) key += TABLE[code - TABLE_START];
    else return normalizedKey(name);
  }
  return key;
}

export function keyWithDiacritics(name: string): string {
  let key = '';
  for (const c of name) {
    const code = c.codePointAt(0)!;
    if (isKeyChar(code)) key += c;
    else if (code >= 65 && code <= 90) key += String.fromCharCode(code + 32);
    else if (code < TABLE_START) continue;
    else if (LETTER.test(c)) key += c.toLowerCase();
  }
  return key;
}
