import { describe, expect, it } from 'vitest';
import { decodeMorse, displayMorse, encodeMorse, MORSE_INTERPRETATIONS, normalizeMorse, reinterpretMorse } from '../src/logic/morse';

describe('Morse', () => {
  it('decodes letters, digits and words', () => {
    expect(decodeMorse('.../---/...')).toBe('SOS');
    expect(decodeMorse('.-/....//---/.---')).toBe('AH OJ');
    expect(decodeMorse('.----/..---/-----')).toBe('120');
    expect(decodeMorse('----/.-../.-/-...')).toBe('CHLAB');
  });

  it('decodes a message that is being typed', () => {
    expect(decodeMorse('')).toBe('');
    expect(decodeMorse('.')).toBe('E');
    expect(decodeMorse('./')).toBe('E');
    expect(decodeMorse('.//')).toBe('E');
    expect(decodeMorse('.//-')).toBe('E T');
    expect(decodeMorse('///./////-///')).toBe('E T');
  });

  it('marks unknown groups', () => {
    expect(decodeMorse('.-.-.-/.')).toBe('?E');
    expect(decodeMorse('......')).toBe('?');
  });

  it('encodes what it decodes', () => {
    expect(encodeMorse('SOS')).toBe('.../---/...');
    expect(encodeMorse('ah  oj')).toBe('.-/....//---/.---');
    expect(encodeMorse('A, B!')).toBe('.-//-...');
    const text = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 0123456789';
    expect(decodeMorse(encodeMorse(text))).toBe(text);
  });

  it('normalizes typed and pasted symbols', () => {
    expect(normalizeMorse('.-/')).toBe('.-/');
    expect(normalizeMorse('· – — − _ | x')).toBe('./-/-/-/-///');
    expect(normalizeMorse('... --- ...')).toBe('.../---/...');
    expect(normalizeMorse('abc')).toBe('');
  });

  it('shows the symbols centred and reads them back', () => {
    expect(displayMorse('.-/..--//')).toBe('•━/••━━//');
    expect(normalizeMorse(displayMorse('.../---/...'))).toBe('.../---/...');
  });

  it('has all six interpretations, the plain one first', () => {
    expect(MORSE_INTERPRETATIONS[0]).toBe('.-/');
    expect(new Set(MORSE_INTERPRETATIONS).size).toBe(6);
    for (const interpretation of MORSE_INTERPRETATIONS) expect([...interpretation].sort().join('')).toBe('-./');
  });

  it('reads the symbols as one another', () => {
    expect(reinterpretMorse('.../---/...', '.-/')).toBe('.../---/...');
    expect(reinterpretMorse('.../---/...', '-./')).toBe('---/.../---');
    expect(reinterpretMorse('.-/', '/.-')).toBe('/.-');
    expect(decodeMorse(reinterpretMorse('---/.../---', '-./'))).toBe('SOS');
    // Slashes for dots, dots for dashes and dashes for slashes
    expect(decodeMorse(reinterpretMorse('///-...-///', '-/.'))).toBe('SOS');
  });
});
