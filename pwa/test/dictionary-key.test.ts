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
});
