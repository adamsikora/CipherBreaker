import { describe, expect, it } from 'vitest';
import { keyFromName, keyWithDiacritics } from '../src/logic/dictionary-key';

describe('keyFromName', () => {
  it('makes letters lower case', () => {
    expect(keyFromName('abakus')).toBe('abakus');
    expect(keyFromName('Aachen')).toBe('aachen');
    expect(keyFromName('AACR')).toBe('aacr');
  });

  it('removes diacritics', () => {
    expect(keyFromName('Příliš žluťoučký kůň')).toBe('priliszlutouckykun');
    expect(keyFromName('ÚPĚL ĎÁBELSKÉ ÓDY')).toBe('upeldabelskeody');
    expect(keyFromName('Gmünd')).toBe('gmund');
  });

  it('keeps only letters and digits', () => {
    expect(keyFromName('Bus 741: Gmünd')).toBe('bus741gmund');
    expect(keyFromName('1234mnm Sněžka')).toBe('1234mnmsnezka');
    expect(keyFromName('?! - _')).toBe('');
    expect(keyFromName('')).toBe('');
  });

  it('replaces letters without decomposition', () => {
    expect(keyFromName('Łódź')).toBe('lodz');
    expect(keyFromName('Straße')).toBe('strasse');
    expect(keyFromName('København')).toBe('kobenhavn');
  });

  it('normalizes characters outside of the table', () => {
    // Roman numeral two is a single character
    expect(keyFromName('Karel Ⅱ')).toBe('karelii');
    expect(keyFromName('ṡofia')).toBe('sofia');
    // Other scripts are left out
    expect(keyFromName('30 ОСТРАВА')).toBe('30');
  });
});

describe('keyWithDiacritics', () => {
  it('keeps diacritics', () => {
    expect(keyWithDiacritics('Příliš žluťoučký kůň')).toBe('přílišžluťoučkýkůň');
    expect(keyWithDiacritics('ÚPĚL ĎÁBELSKÉ ÓDY')).toBe('úpělďábelskéódy');
    expect(keyWithDiacritics('Bus 741: Gmünd')).toBe('bus741gmünd');
    expect(keyWithDiacritics('Łódź')).toBe('łódź');
    expect(keyWithDiacritics('?! - _')).toBe('');
  });

  it('handles characters out of the table of the common ones', () => {
    // Other scripts, with the part in the table before and after them
    expect(keyWithDiacritics('Žít Москва ž')).toBe('žítмоскваž');
    expect(keyWithDiacritics('Ελλάδα, 東京')).toBe('ελλάδα東京');
    // A letter out of the basic plane, and symbols that are not letters
    expect(keyWithDiacritics('a𝒜b')).toBe('a𝒜b');
    expect(keyWithDiacritics('č→€😀ď')).toBe('čď');
    // In the table, but not letters
    expect(keyWithDiacritics('š©×÷ř')).toBe('šř');
  });
});
