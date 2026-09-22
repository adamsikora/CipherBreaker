// Binary Decoder and Ternary Decoder, ports of DebaseatorActivity.kt with DebinarizatorActivity.kt
// and DeternarizatorActivity.kt: endless rows of digit cells that cycle through their values on
// tap, each row read as letters in all the ways the digits can be taken

import { endlessRows } from '../components/endless-rows';
import { binaryLetters, TERNARY_MAPPING, ternaryLetters } from '../logic/base-reader';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { fixedTopLayout } from '../shell/layout';
import { Tool } from '../shell/router';

interface Row {
  element: HTMLElement;
  /** Values of the digits, the first one is the rightmost cell like in the app */
  values: number[];
  digits: HTMLButtonElement[];
  results: HTMLElement[];
}

function digitClass(value: number, base: number): string {
  return value === 0 ? 'digit d-low' : value === base - 1 ? 'digit d-high' : 'digit d-mid';
}

/** Rows of the reader, compute gives the letters of a row from its digit values */
function readerRows(base: number, digitCount: number, resultCount: number, compute: (values: number[]) => string[]) {
  const list = endlessRows<Row>(() => {
    const values = new Array<number>(digitCount).fill(0);
    const results = Array.from({ length: resultCount }, () => h('span', { class: 'result' }));
    const digits: HTMLButtonElement[] = [];
    const row: Row = { element: h('div'), values, digits, results };
    const update = () => {
      const letters = compute(values);
      results.forEach((result, i) => { result.textContent = letters[i]; });
    };
    for (let k = 0; k < digitCount; k++) {
      const digit = h('button', {
        type: 'button', class: digitClass(0, base), 'aria-label': `Digit ${k + 1}`,
        onclick: () => {
          values[k] = (values[k] + 1) % base;
          digit.className = digitClass(values[k], base);
          update();
        },
      });
      digits.push(digit);
    }
    // The first digit is the rightmost one
    row.element = h('div', { class: 'reader-row' },
      h('div', { class: 'results' }, ...results),
      h('div', { class: 'digits' }, ...[...digits].reverse()));
    update();
    return row;
  });
  const updateAll = () => list.rows.forEach(row => {
    const letters = compute(row.values);
    row.results.forEach((result, i) => { result.textContent = letters[i]; });
  });
  return { list, updateAll };
}

function radioGroup(name: string, label: string, options: [string, string][], checked: string, onchange: () => void) {
  const inputs = options.map(([value, text]) => {
    const input = h('input', { type: 'radio', name, value, checked: value === checked, onchange });
    return h('label', { class: 'check' }, input, text);
  });
  const group = h('div', { class: 'row radio-group' }, h('span', { class: 'muted' }, label), ...inputs);
  return {
    element: group,
    get value() { return (group.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement).value; },
    setEnabled(enabled: boolean) { group.querySelectorAll('input').forEach(input => { input.disabled = !enabled; }); },
  };
}

// Legends are drawn as SVG on the panel itself: a digit that stands for a cell value is filled
// with the colour of that cell and outlined like the cell, so that it shows in both themes;
// other digits and the arrows are in the text colour
const CELL_COLORS = ['#fff', '#9e9e9e', '#212121'];
const CELL_BORDER = '#9e9e9e';
const TILE_WIDTH = 37;

function legendTile(height: number, content: string): SVGElement {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE_WIDTH} ${height}" class="legend-tile">${content}</svg>`);
}

/** A digit at given position, filled like a cell when a cell colour is given */
function digit(text: string | number, x: number, y: number, size: number, cellColor?: string): string {
  const paint = cellColor
    ? `fill="${cellColor}" stroke="${CELL_BORDER}" stroke-width="1" paint-order="stroke"`
    : 'fill="currentColor"';
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="bold" text-anchor="middle" ${paint}>${text}</text>`;
}

const ARROW_RIGHT = 'M6,9h18l-5,-5l2,-2l8,7l-8,7l-2,-2l5,-5h-18z';

/** Arrow of the reading direction, over the binary results */
function arrowTile(right: boolean): SVGElement {
  const transform = right ? '' : ` transform="translate(${TILE_WIDTH},0) scale(-1,1)"`;
  return legendTile(18, `<path d="${ARROW_RIGHT}" fill="currentColor"${transform}/>`);
}

/** "1 0" with the digits in the colours of the cells they are read from */
function binaryTile(oneIsDark: boolean): SVGElement {
  const [one, zero] = oneIsDark ? [CELL_COLORS[2], CELL_COLORS[0]] : [CELL_COLORS[0], CELL_COLORS[2]];
  return legendTile(18, digit(1, 10, 14, 14, one) + digit(0, 27, 14, 14, zero));
}

/** Three digits stacked top to bottom, in the colours of cells when given */
function ternaryTile(digits: number[], colors?: string[]): SVGElement {
  return legendTile(70, digits.map((d, k) => digit(d, TILE_WIDTH / 2, 20 + k * 22, 18, colors?.[k])).join(''));
}

/** Values mode: digits 0, 1, 2 each in the colour of the cell value the assignment turns into it */
function valuesTile(mapping: number[]): SVGElement {
  return ternaryTile([0, 1, 2], [0, 1, 2].map(d => CELL_COLORS[mapping.indexOf(d)]));
}

/** Order mode: the positions of the cells in the order they are read */
function orderTile(order: number[]): SVGElement {
  return ternaryTile(order);
}

export const binaryReaderTool: Tool = {
  path: 'binary',
  title: 'Binary Decoder',
  icon: 'binary',
  mount(container) {
    const start = radioGroup('binaryStart', 'Alphabet Start', [['1', '1'], ['0', '0']], '1', () => rows.updateAll());
    const rows = readerRows(2, 5, 4, values => binaryLetters(values, start.value === '0' ? 1 : 0));
    container.classList.add('reader', 'binary');
    const unmountLayout = fixedTopLayout(container, [
      h('div', { class: 'legend-bar' },
        h('div', { class: 'legend binary-legend' },
          h('div', null, arrowTile(true), arrowTile(true), arrowTile(false), arrowTile(false)),
          h('div', null, binaryTile(true), binaryTile(false), binaryTile(true), binaryTile(false))),
        start.element),
    ], [rows.list.element]);
    return () => {
      rows.list.dispose();
      unmountLayout();
      container.classList.remove('reader', 'binary');
    };
  },
};

export const ternaryReaderTool: Tool = {
  path: 'ternary',
  title: 'Ternary Decoder',
  icon: 'ternary',
  mount(container) {
    const start = radioGroup('ternaryStart', 'Alphabet Start', [['1', '1'], ['0', '0']], '1', () => rows.updateAll());
    // 27 letters is the Czech alphabet with CH after H
    const alphabet = radioGroup('ternaryAlphabet', 'Alphabet Length', [['26', '26'], ['27', '27']], '26', () => rows.updateAll());
    const direction = radioGroup('ternaryDirection', 'Reading Direction', [['right', '->'], ['left', '<-']], 'right', () => rows.updateAll());
    // The direction only matters when values are permutated, the legend shows what is permutated
    const applyMode = () => {
      const readOrder = mode.value === 'order';
      direction.setEnabled(!readOrder);
      // Result i uses the assignment i of the values, or the order 5 - i of the positions
      legend.replaceChildren(...TERNARY_MAPPING.map((mapping, i) => readOrder ? orderTile(TERNARY_MAPPING[5 - i]) : valuesTile(mapping)));
      rows.updateAll();
    };
    const mode = radioGroup('ternaryMode', 'Permutate', [['order', 'Order'], ['values', 'Values']], 'order', applyMode);
    const legend = h('div', { class: 'legend ternary-legend' });
    const rows = readerRows(3, 3, 6, values => ternaryLetters(
      values, mode.value === 'order', direction.value === 'right', start.value === '0' ? 1 : 0, alphabet.value === '27'));
    applyMode();
    container.classList.add('reader', 'ternary');

    const settings = h('div', { class: 'settings hidden' },
      h('button', { type: 'button', class: 'icon close', 'aria-label': 'Close settings', onclick: () => settings.classList.add('hidden') }, svg(icons.close)),
      start.element,
      alphabet.element,
      direction.element,
      mode.element);
    const unmountLayout = fixedTopLayout(container, [
      settings,
      h('div', { class: 'legend-bar' },
        legend,
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Settings', onclick: () => settings.classList.toggle('hidden') }, svg(icons.settings))),
    ], [rows.list.element]);
    return () => {
      rows.list.dispose();
      unmountLayout();
      container.classList.remove('reader', 'ternary');
    };
  },
};
