// Codes of the Trainer: the letters of the alphabet in the codes a puzzle hunt uses most, the
// questions of its quiz and the words of its reading practice. Made for the PWA, the Android app
// has no such tool

import { keyFromName } from './dictionary-key';
import { encodeMorse } from './morse';

export const TRAINER_CODES = ['number', 'morse', 'braille', 'semaphore', 'binary', 'ternary'] as const;
export type TrainerCode = typeof TRAINER_CODES[number];

export const TRAINER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** How many letters or symbols a question of the quiz offers */
export const OPTION_COUNT = 5;

// The raised dots of a letter: 1 to 3 down the left column of the cell, 4 to 6 down the right one
const BRAILLE_DOTS = [
  '1', '12', '14', '145', '15', '124', '1245', '125', '24', '245', '13', '123', '134',
  '1345', '135', '1234', '12345', '1235', '234', '2345', '136', '1236', '2456', '1346', '13456', '1356',
];

// The two flags of a letter as the reader sees them: 0 points down, the next ones follow clockwise
// in eighths of a turn, so 2 is to the left, 4 up and 6 to the right
const SEMAPHORE_FLAGS = [
  '01', '02', '03', '04', '05', '06', '07', '12', '13', '46', '14', '15', '16',
  '17', '23', '24', '25', '26', '27', '34', '35', '47', '56', '57', '36', '67',
];

/**
 * A letter in a code, as text: its position in the alphabet from 1, also in five binary and three
 * ternary digits, dots and dashes of Morse, the raised dots of Braille and the two flags of the
 * semaphore
 */
export function encodeLetter(code: TrainerCode, letter: string): string {
  const index = letter.length === 1 ? TRAINER_LETTERS.indexOf(letter) : -1;
  if (index === -1) return '';
  switch (code) {
    case 'number': return String(index + 1);
    case 'morse': return encodeMorse(letter);
    case 'braille': return BRAILLE_DOTS[index];
    case 'semaphore': return SEMAPHORE_FLAGS[index];
    case 'binary': return (index + 1).toString(2).padStart(5, '0');
    case 'ternary': return (index + 1).toString(3).padStart(3, '0');
  }
}

export interface TrainerQuestion {
  answer: string;
  /** The letters to pick from, the answer among them */
  options: string[];
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** A question of the quiz: a letter other than the previous one, among letters to pick it from */
export function makeQuestion(random: () => number = Math.random, previous = ''): TrainerQuestion {
  const answer = pick([...TRAINER_LETTERS].filter(letter => letter !== previous), random);
  const others = shuffled([...TRAINER_LETTERS].filter(letter => letter !== answer), random).slice(0, OPTION_COUNT - 1);
  return { answer, options: shuffled([answer, ...others], random) };
}

const MIN_WORD_LENGTH = 4;
const MAX_WORD_LENGTH = 8;

/** The letters a word is read by: the key the dictionary is searched by, without diacritics, in upper case */
export function wordLetters(word: string): string {
  return keyFromName(word).toUpperCase();
}

/**
 * The entries of a dictionary that make words to read: of four to eight letters and nothing else,
 * and without the names, which start with a capital
 */
export function trainerWords(entries: readonly string[]): string[] {
  return entries.filter(entry => {
    if (entry.length < MIN_WORD_LENGTH || entry.length > MAX_WORD_LENGTH || entry !== entry.toLowerCase()) return false;
    const letters = wordLetters(entry);
    return letters.length === entry.length && [...letters].every(letter => TRAINER_LETTERS.includes(letter));
  });
}

/** A word to read, other than the previous one when there is another */
export function pickWord(words: readonly string[], random: () => number = Math.random, previous = ''): string {
  if (words.length === 0) return '';
  for (;;) {
    const word = pick(words, random);
    if (word !== previous || words.length === 1) return word;
  }
}
