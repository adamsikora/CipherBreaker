import { describe, expect, it } from 'vitest';
import { encodeLetter, makeQuestion, OPTION_COUNT, pickWord, TRAINER_CODES, TRAINER_LETTERS, trainerWords, wordLetters } from '../src/logic/trainer';

/** A generator of numbers below one that gives the same ones every time */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

describe('Trainer', () => {
  it('encodes letters as their position in the alphabet', () => {
    expect(encodeLetter('number', 'A')).toBe('1');
    expect(encodeLetter('number', 'T')).toBe('20');
    expect(encodeLetter('number', 'Z')).toBe('26');
  });

  it('encodes letters in binary and ternary digits', () => {
    expect(encodeLetter('binary', 'A')).toBe('00001');
    expect(encodeLetter('binary', 'F')).toBe('00110');
    expect(encodeLetter('binary', 'Z')).toBe('11010');
    expect(encodeLetter('ternary', 'A')).toBe('001');
    expect(encodeLetter('ternary', 'R')).toBe('200');
    expect(encodeLetter('ternary', 'W')).toBe('212');
    expect(encodeLetter('ternary', 'Z')).toBe('222');
  });

  it('encodes letters in Morse code', () => {
    expect(encodeLetter('morse', 'E')).toBe('.');
    expect(encodeLetter('morse', 'V')).toBe('...-');
    expect(encodeLetter('morse', 'Q')).toBe('--.-');
  });

  it('encodes letters in Braille', () => {
    expect(encodeLetter('braille', 'A')).toBe('1');
    expect(encodeLetter('braille', 'H')).toBe('125');
    expect(encodeLetter('braille', 'W')).toBe('2456');
    expect(encodeLetter('braille', 'Z')).toBe('1356');
    // The letters from K to T are the ones from A to J with the dot 3, U to Z but W with the dot 6 too
    for (let i = 0; i < 10; i++) {
      expect(encodeLetter('braille', TRAINER_LETTERS[i + 10])).toBe([...encodeLetter('braille', TRAINER_LETTERS[i]) + '3'].sort().join(''));
    }
    expect(encodeLetter('braille', 'U')).toBe(encodeLetter('braille', 'K') + '6');
    expect(encodeLetter('braille', 'X')).toBe(encodeLetter('braille', 'M') + '6');
  });

  it('encodes letters in semaphore', () => {
    expect(encodeLetter('semaphore', 'A')).toBe('01');
    expect(encodeLetter('semaphore', 'D')).toBe('04');
    expect(encodeLetter('semaphore', 'J')).toBe('46');
    expect(encodeLetter('semaphore', 'K')).toBe('14');
    expect(encodeLetter('semaphore', 'Q')).toBe('25');
    expect(encodeLetter('semaphore', 'R')).toBe('26');
    expect(encodeLetter('semaphore', 'Z')).toBe('67');
  });

  it('gives every letter a code of its own', () => {
    for (const code of TRAINER_CODES) {
      const symbols = [...TRAINER_LETTERS].map(letter => encodeLetter(code, letter));
      expect(symbols.every(symbol => symbol !== '')).toBe(true);
      expect(new Set(symbols).size).toBe(26);
    }
  });

  it('encodes nothing but the letters', () => {
    expect(encodeLetter('number', 'a')).toBe('');
    expect(encodeLetter('morse', '1')).toBe('');
    expect(encodeLetter('binary', '')).toBe('');
  });

  it('makes questions with the answer among different letters', () => {
    const random = seededRandom(1);
    const answers = new Set<string>();
    let previous = '';
    for (let i = 0; i < 500; i++) {
      const question = makeQuestion(random, previous);
      expect(question.options.length).toBe(OPTION_COUNT);
      expect(new Set(question.options).size).toBe(OPTION_COUNT);
      expect(question.options).toContain(question.answer);
      expect(question.options.every(letter => TRAINER_LETTERS.includes(letter))).toBe(true);
      expect(question.answer).not.toBe(previous);
      answers.add(question.answer);
      previous = question.answer;
    }
    expect(answers.size).toBe(26);
  });

  it('puts the answer at every place among the options', () => {
    const random = seededRandom(2);
    const places = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const question = makeQuestion(random);
      places.add(question.options.indexOf(question.answer));
    }
    expect(places.size).toBe(OPTION_COUNT);
  });

  it('reads a word by its letters without diacritics', () => {
    expect(wordLetters('neláska')).toBe('NELASKA');
    expect(wordLetters('kůň')).toBe('KUN');
    expect(wordLetters('chřest')).toBe('CHREST');
    expect(wordLetters('žížala')).toBe('ZIZALA');
  });

  it('takes the words to read from the entries of a dictionary', () => {
    const entries = ['pes', 'krut', 'neláska', 'žížala', 'Praha', 'Novák', 'principál', 'osmiúhelník', 'cha-cha', 'a priori', 'kočka', 'ČSAD', 'osmička'];
    expect(trainerWords(entries)).toEqual(['krut', 'neláska', 'žížala', 'kočka', 'osmička']);
    expect(trainerWords([])).toEqual([]);
  });

  it('picks a word other than the previous one', () => {
    const random = seededRandom(3);
    const words = ['krut', 'neláska', 'kočka'];
    const picked = new Set<string>();
    let previous = '';
    for (let i = 0; i < 300; i++) {
      const word = pickWord(words, random, previous);
      expect(words).toContain(word);
      expect(word).not.toBe(previous);
      picked.add(word);
      previous = word;
    }
    expect(picked.size).toBe(3);
  });

  it('picks the only word again, and nothing of no words', () => {
    expect(pickWord(['krut'], seededRandom(4), 'krut')).toBe('krut');
    expect(pickWord([], seededRandom(4))).toBe('');
  });
});
