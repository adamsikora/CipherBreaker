// Morse, made for the PWA: a message typed with a button for the dot, the dash and the
// slash each, shown decoded as it is and in the five other ways of taking the three symbols for
// one another, as a message may have them swapped

import { decodeMorse, displayMorse, encodeMorse, MORSE_INTERPRETATIONS, normalizeMorse, reinterpretMorse } from '../logic/morse';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';

interface State {
  morseInput: string;
}

const STATE_KEY = 'morse';
const DEFAULT_STATE: State = { morseInput: '' };

// The symbols of the buttons, drawn so that they sit in the middle whatever the font
const symbolIcon = (shape: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${shape}</svg>`;
const DOT_ICON = symbolIcon('<circle cx="12" cy="12" r="3.5" fill="currentColor"/>');
const DASH_ICON = symbolIcon('<path d="M4,12H20" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>');
const SLASH_ICON = symbolIcon('<path d="M15.5,4L8.5,20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>');

/** What an interpretation does: each of the three symbols with an arrow to what it is read as */
function interpretationLabel(interpretation: string): HTMLElement {
  return h('div', { class: 'muted morse-label' }, ...[...'.-/'].map((symbol, i) =>
    h('span', null, displayMorse(symbol), h('span', { class: 'morse-arrow' }, '→'), displayMorse(interpretation[i]))));
}

export const morseTool: Tool = {
  path: 'morse',
  title: 'Morse',
  icon: 'morse',
  mount(container) {
    // Typed with the buttons below, so the keyboard of a phone stays hidden; a text can still be
    // pasted in or typed on a real keyboard
    const inputBox = h('textarea', {
      class: 'morse-input', placeholder: 'Morse code', rows: 1, inputmode: 'none', autocomplete: 'off', spellcheck: false, 'aria-label': 'Morse code',
    });
    const decodedView = h('div', { class: 'morse-result' });
    const otherViews = MORSE_INTERPRETATIONS.slice(1).map(() => h('div', { class: 'morse-other' }));
    let code = '';

    function save() {
      saveState(STATE_KEY, { morseInput: code } satisfies State);
    }

    /** Makes the box as high as its message, up to the height the style sheet lets it have */
    function fitBox() {
      inputBox.style.height = 'auto';
      inputBox.style.overflowY = 'hidden';
      // The height of a box includes its borders, the height of what is in it does not
      inputBox.style.height = `${inputBox.scrollHeight + inputBox.offsetHeight - inputBox.clientHeight}px`;
      // A scrollbar only once the message is higher than the box may be
      if (inputBox.scrollHeight > inputBox.clientHeight + 1) inputBox.style.overflowY = 'auto';
    }

    /** Puts in a typed, saved or example message, or the empty one */
    function setCode(text: string) {
      code = normalizeMorse(text);
      inputBox.value = displayMorse(code);
      fitBox();
      decodedView.textContent = decodeMorse(code);
      MORSE_INTERPRETATIONS.slice(1).forEach((interpretation, i) => {
        otherViews[i].textContent = decodeMorse(reinterpretMorse(code, interpretation));
      });
      save();
    }

    /** A whole new message, a saved or example one or the empty one: the cursor goes to its end */
    function typeCode(text: string) {
      setCode(text);
      inputBox.setSelectionRange(code.length, code.length);
      inputBox.scrollTop = inputBox.scrollHeight;
    }

    /**
     * A button: its symbol goes where the cursor of the box is, in place of what is selected there;
     * the backspace, with no symbol, takes the selection or the symbol before the cursor
     */
    function typeSymbol(symbol: string) {
      let start = inputBox.selectionStart;
      const end = inputBox.selectionEnd;
      if (symbol === '' && start === end) start = Math.max(start - 1, 0);
      setCode(code.slice(0, start) + symbol + code.slice(end));
      const cursor = start + symbol.length;
      inputBox.setSelectionRange(cursor, cursor);
      if (cursor === code.length) inputBox.scrollTop = inputBox.scrollHeight;
    }

    // The buttons do not take the focus, so the cursor of the box stays to be seen where it is
    const key = (name: string, icon: string, symbol: string) => h('button', {
      class: 'morse-key', 'aria-label': name, onmousedown: (event: Event) => event.preventDefault(), onclick: () => typeSymbol(symbol),
    }, svg(icon));
    const buttons = h('div', { class: 'morse-keys' },
      key('Dot', DOT_ICON, '.'),
      key('Dash', DASH_ICON, '-'),
      key('Separator', SLASH_ICON, '/'),
      key('Backspace', icons.backspace, ''),
    );

    // What is typed or pasted into the box is brought to the three symbols, the cursor stays put
    inputBox.addEventListener('input', () => {
      const cursor = normalizeMorse(inputBox.value.slice(0, inputBox.selectionStart)).length;
      setCode(inputBox.value);
      inputBox.setSelectionRange(cursor, cursor);
    });
    // The box stays at the top and the buttons at the bottom, the readings scroll between them;
    // the box is on the plain page, not on the tinted panel of the settings of other tools
    container.classList.add('fill');
    container.append(
      inputBox,
      h('hr', { class: 'morse-divider' }),
      h('div', { class: 'scroll' },
        decodedView,
        ...MORSE_INTERPRETATIONS.slice(1).flatMap((interpretation, i) => [h('hr'), interpretationLabel(interpretation), otherViews[i]]),
      ),
      buttons,
    );
    typeCode(loadState(STATE_KEY, DEFAULT_STATE).morseInput);
    // The lines of the message break elsewhere when the screen is turned
    window.addEventListener('resize', fitBox);

    return {
      unmount() {
        save();
        window.removeEventListener('resize', fitBox);
        container.classList.remove('fill');
      },
      reset: () => typeCode(''),
      examples: [
        { name: 'SOS', apply: () => typeCode(encodeMorse('SOS')) },
        { name: 'A message of several words', apply: () => typeCode(encodeMorse('MEET AT THE OLD BRIDGE')) },
        { name: 'Dots and dashes swapped', apply: () => typeCode(reinterpretMorse(encodeMorse('SWAPPED SYMBOLS'), '-./')) },
        { name: 'Slashes for dots, dots for dashes, dashes for slashes', apply: () => typeCode(reinterpretMorse(encodeMorse('CIPHER BREAKER'), '/.-')) },
      ],
    };
  },
};
