import { describe, expect, it } from 'vitest';
import { decodeFile, frontDecode } from '../src/logic/front-coding';

describe('frontDecode', () => {
  it('adds the shared prefix of the previous line', () => {
    expect(frontDecode(['aabeceda', 'gně', 'hí'])).toEqual(['abeceda', 'abecedně', 'abecední']);
  });

  it('makes the first letter upper case for upper case codes', () => {
    expect(frontDecode(['Apraha', 'enout', 'Ey'])).toEqual(['Praha', 'prahnout', 'Prahy']);
  });

  it('keeps original case after =', () => {
    expect(frontDecode(['aion', '=bPhone'])).toEqual(['ion', 'iPhone']);
  });

  it('shares prefixes regardless of case', () => {
    expect(frontDecode(['Apetřín', 'Gy', 'ghoubí'])).toEqual(['Petřín', 'Petříny', 'petřínhoubí']);
  });
});

describe('decodeFile', () => {
  it('skips the count line and a trailing newline', () => {
    expect(decodeFile('2\naabc\nbd\n')).toEqual(['abc', 'ad']);
    expect(decodeFile('2\naabc\nbd')).toEqual(['abc', 'ad']);
  });

  it('rejects a file without the count', () => {
    expect(() => decodeFile('aabc\nbd')).toThrow('Invalid dictionary file');
  });
});
