// Trainer, made for the PWA in place of the link to the Princip Trainer: practice of the codes a
// puzzle hunt uses most. The quiz shows a letter in the picked code with five letters to pick from,
// or a letter with five codes; the reading shows a whole word in the code

import { decodeFile } from '../logic/front-coding';
import { encodeLetter, makeQuestion, pickWord, TRAINER_CODES, TrainerCode, TrainerQuestion, trainerWords, wordLetters } from '../logic/trainer';
import { h, svg } from '../shell/dom';
import { settingsPanel } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';

interface State {
  trainerMode: string;
  trainerCode: string;
  trainerInvert: boolean;
}

const STATE_KEY = 'trainer';
const DEFAULT_STATE: State = { trainerMode: 'quiz', trainerCode: 'number', trainerInvert: false };

const CODE_NAMES: Record<TrainerCode, string> = {
  number: 'Position in the alphabet', morse: 'Morse code', braille: 'Braille', semaphore: 'Semaphore', binary: 'Binary', ternary: 'Ternary',
};
// The letter each code is shown by on its button
const CODE_SAMPLES: Record<TrainerCode, string> = { number: 'T', morse: 'R', braille: 'H', semaphore: 'Q', binary: 'U', ternary: 'J' };

// Symbols are drawn in a square of 100 units, in the text colour, and sized by what they sit in
const FONT_SIZES = [0, 72, 62, 46, 36, 30];

function textShape(text: string): string {
  return `<text x="50" y="50" font-size="${FONT_SIZES[text.length]}" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="central" fill="currentColor">${text}</text>`;
}

/** Dots and dashes in a row, in the middle of the square */
function morseShape(code: string): string {
  const DOT = 9, DASH = 18, GAP = 5;
  const width = [...code].reduce((sum, symbol) => sum + (symbol === '.' ? DOT : DASH), 0) + GAP * (code.length - 1);
  let x = 50 - width / 2;
  return [...code].map(symbol => {
    const start = x;
    x += (symbol === '.' ? DOT : DASH) + GAP;
    return symbol === '.'
      ? `<circle cx="${start + DOT / 2}" cy="50" r="${DOT / 2}" fill="currentColor"/>`
      : `<rect x="${start}" y="46.5" width="${DASH}" height="7" rx="2" fill="currentColor"/>`;
  }).join('');
}

/** The six dots of a cell, the raised ones filled */
function brailleShape(dots: string): string {
  return [1, 2, 3, 4, 5, 6].map(dot => {
    const centre = `cx="${dot <= 3 ? 34 : 66}" cy="${20 + ((dot - 1) % 3) * 30}"`;
    return dots.includes(String(dot))
      ? `<circle ${centre} r="12" fill="currentColor"/>`
      : `<circle ${centre} r="10.5" fill="none" stroke="currentColor" stroke-width="3"/>`;
  }).join('');
}

/** The two flags as arms from the signaller in the middle */
function semaphoreShape(flags: string): string {
  const end = (flag: string) => {
    const angle = Number(flag) * Math.PI / 4;
    return `${(50 - 38 * Math.sin(angle)).toFixed(1)},${(50 + 38 * Math.cos(angle)).toFixed(1)}`;
  };
  return `<path d="M${end(flags[0])}L50,50L${end(flags[1])}" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
    + '<circle cx="50" cy="50" r="6" fill="currentColor"/>';
}

function picture(shape: string): SVGElement {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shape}</svg>`);
}

/** A letter drawn in a code */
function symbolPicture(code: TrainerCode, letter: string): SVGElement {
  const symbol = encodeLetter(code, letter);
  switch (code) {
    case 'morse': return picture(morseShape(symbol));
    case 'braille': return picture(brailleShape(symbol));
    case 'semaphore': return picture(semaphoreShape(symbol));
    default: return picture(textShape(symbol));
  }
}

// The words to read come from the dictionary of Czech nouns, the file the Dictionary searches:
// loaded when a word is first asked for and kept for the life of the page
const WORDS_FILE = 'cs_nouns.cbfcdict';
let wordList: string[] | null = null;
let wordLoad: Promise<unknown> | null = null;

function loadWords(): Promise<unknown> {
  if (!wordLoad) {
    wordLoad = fetch(new URL(`assets/${WORDS_FILE}`, document.baseURI))
      .then(response => {
        if (!response.ok) throw new Error('Cannot load the dictionary');
        return response.text();
      })
      .then(text => { wordList = trainerWords(decodeFile(text)); });
    // A load that failed is tried again by the next word
    wordLoad.catch(() => { wordLoad = null; });
  }
  return wordLoad;
}

function isCode(value: string): value is TrainerCode {
  return (TRAINER_CODES as readonly string[]).includes(value);
}

export const trainerTool: Tool = {
  path: 'trainer',
  title: 'Trainer',
  icon: 'school',
  mount(container) {
    let code: TrainerCode = 'number';
    let question: TrainerQuestion = makeQuestion();
    // The word as the dictionary has it; empty until the words are loaded
    let word = '';
    let disposed = false;

    const codeButtons = TRAINER_CODES.map(c => h('button', {
      class: 'trainer-code', 'aria-label': CODE_NAMES[c], title: CODE_NAMES[c], onclick: () => { setCode(c); next(); save(); },
    }, symbolPicture(c, CODE_SAMPLES[c])));
    const modeRadio = (value: string) => h('input', { type: 'radio', name: 'trainerMode', value, onchange: () => { next(); save(); } });
    const quizRadio = modeRadio('quiz');
    const readRadio = modeRadio('read');
    const invertBox = h('input', { type: 'checkbox', onchange: () => { next(); save(); } });

    const promptView = h('div', { class: 'trainer-prompt' });
    const optionsView = h('div', { class: 'trainer-options' });
    const wordView = h('div', { class: 'trainer-word' });
    // Says that the words are being loaded, or that they cannot be
    const messageView = h('div', { class: 'muted trainer-message' });

    function save() {
      saveState(STATE_KEY, { trainerMode: readRadio.checked ? 'read' : 'quiz', trainerCode: code, trainerInvert: invertBox.checked } satisfies State);
    }

    function setCode(picked: TrainerCode) {
      code = picked;
      codeButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(TRAINER_CODES[i] === code)));
    }

    /** The quiz: what is asked about, and the options, which show whether they are right when picked */
    function showQuestion() {
      const inverted = invertBox.checked;
      const letterPicture = (letter: string) => picture(textShape(letter));
      promptView.replaceChildren(inverted ? letterPicture(question.answer) : symbolPicture(code, question.answer));
      optionsView.replaceChildren(...question.options.map((letter, i) => {
        const button = h('button', {
          // The label of a code to pick does not name its letter
          class: 'trainer-option', 'aria-label': inverted ? `Option ${i + 1}` : letter,
          onclick: () => button.classList.add(letter === question.answer ? 'right' : 'wrong'),
        }, inverted ? symbolPicture(code, letter) : letterPicture(letter));
        return button;
      }));
    }

    /** A new word in the code, letter by letter; the first one waits for the words to load */
    function nextWord() {
      if (wordList) {
        word = pickWord(wordList, Math.random, word);
        // Every letter is under its tile, where the solution shows it
        wordView.replaceChildren(...[...wordLetters(word)].map(letter => h('div', { class: 'trainer-letter' },
          h('div', { class: 'trainer-tile' }, symbolPicture(code, letter)),
          h('div', { class: 'trainer-solution' }, letter))));
        wordView.classList.remove('solved');
        messageView.textContent = '';
        return;
      }
      word = '';
      wordView.replaceChildren();
      messageView.textContent = 'Loading the words…';
      loadWords().then(() => {
        if (!disposed && readRadio.checked && word === '') nextWord();
      }, () => {
        if (!disposed && word === '') messageView.textContent = 'Cannot load the words';
      });
    }

    /** A new question or word, also after a change of the settings: the old one may be solved already */
    function next() {
      const reading = readRadio.checked;
      invertBox.disabled = reading;
      promptView.classList.toggle('hidden', reading);
      optionsView.classList.toggle('hidden', reading);
      wordView.classList.toggle('hidden', !reading);
      messageView.classList.toggle('hidden', !reading);
      if (reading) {
        nextWord();
      } else {
        question = makeQuestion(Math.random, question.answer);
        showQuestion();
      }
    }

    function showSolution() {
      if (readRadio.checked) wordView.classList.add('solved');
      else optionsView.children[question.options.indexOf(question.answer)].classList.add('right');
    }

    /** Puts in a saved state or the defaults */
    function applyState(s: State) {
      setCode(isCode(s.trainerCode) ? s.trainerCode : 'number');
      (s.trainerMode === 'read' ? readRadio : quizRadio).checked = true;
      invertBox.checked = s.trainerInvert === true;
      next();
      save();
    }

    container.append(
      ...settingsPanel(
        h('div', { class: 'trainer-codes', role: 'group', 'aria-label': 'Code' }, ...codeButtons),
        h('div', { class: 'row radio-group', role: 'radiogroup', 'aria-label': 'Mode' },
          h('label', { class: 'check' }, quizRadio, 'Quiz'),
          h('label', { class: 'check' }, readRadio, 'Read'),
          h('span', { class: 'spacer' }),
          h('label', { class: 'check' }, invertBox, 'Letter to code')),
      ),
      h('div', { class: 'trainer' },
        promptView, optionsView, wordView, messageView,
        h('div', { class: 'trainer-buttons' },
          h('button', { class: 'primary', onclick: showSolution }, 'Solution'),
          h('button', { class: 'primary', onclick: next }, 'Next'))),
    );
    applyState(loadState(STATE_KEY, DEFAULT_STATE));

    return {
      unmount() {
        disposed = true;
        save();
      },
      reset: () => applyState(DEFAULT_STATE),
    };
  },
};
