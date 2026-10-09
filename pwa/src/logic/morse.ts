// Morse code of the Morse tool: a message of dots, dashes and separators, read as it is and
// with the three symbols taken for one another. Made for the PWA, the Android app has no such tool

/** The symbols a message is written in: a slash ends a letter, two of them a word */
export const MORSE_SYMBOLS = './-';

const MORSE_LETTERS: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H',
  '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P',
  '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
  '-.--': 'Y', '--..': 'Z', '----': 'CH',
  '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5',
  '-....': '6', '--...': '7', '---..': '8', '----.': '9', '-----': '0',
};

const MORSE_CODES = new Map(Object.entries(MORSE_LETTERS).map(([code, letter]) => [letter, code]));

/** What the dot, the dash and the slash are read as, in that order: as they are first, then the other five ways */
export const MORSE_INTERPRETATIONS = ['.-/', '-./', './-', '/-.', '-/.', '/.-'];

/** Brings the look-alikes of the three symbols in a typed or pasted text to them, drops the rest */
export function normalizeMorse(text: string): string {
  let result = '';
  for (const character of text) {
    if ('.·•*'.includes(character)) result += '.';
    else if ('-–—−━_'.includes(character)) result += '-';
    else if ('/|\\ \n'.includes(character)) result += '/';
  }
  return result;
}

/**
 * The message as it is shown: with a bullet and a heavy line, which sit at the middle of the line
 * and are as thick as each other, where the full stop and the hyphen are not. normalizeMorse
 * brings it back
 */
export function displayMorse(code: string): string {
  return code.replace(/\./g, '•').replace(/-/g, '━');
}

/** The message in letters: an unknown group of dots and dashes is a question mark, a word ends with a space */
export function decodeMorse(code: string): string {
  let result = '';
  let wordEnded = false;
  for (const group of code.split('/')) {
    if (group === '') {
      wordEnded = result !== '';
      continue;
    }
    if (wordEnded) result += ' ';
    wordEnded = false;
    result += MORSE_LETTERS[group] ?? '?';
  }
  return result;
}

/** The message with its dots, dashes and slashes taken for what the interpretation gives for them */
export function reinterpretMorse(code: string, interpretation: string): string {
  return [...code].map(symbol => interpretation['.-/'.indexOf(symbol)] ?? '').join('');
}

/** A text in Morse code, the opposite of decodeMorse; characters without a code are left out */
export function encodeMorse(text: string): string {
  return text.toUpperCase().split(/\s+/).filter(word => word !== '')
    .map(word => [...word].map(letter => MORSE_CODES.get(letter)).filter(code => code !== undefined).join('/'))
    .join('//');
}
