// Binary Reader and Ternary Reader, ports of DebaseatorActivity.kt with DebinarizatorActivity.kt
// and DeternarizatorActivity.kt: endless rows of digit cells that cycle through their values on
// tap, each row read as letters in all the ways the digits can be taken

import { endlessRows } from '../components/endless-rows';
import { binaryLetters, TERNARY_MAPPING, ternaryLetters } from '../logic/base-reader';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
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

// Legends are drawn as SVG in the colours of the digit cells, so that they read the same in both
// themes: a digit is shown in the colour of the cell that stands for it
const CELL_COLORS = ['#fff', '#9e9e9e', '#212121'];
const LEGEND_BG = '#3f51b5';
const TILE_WIDTH = 37;

function legendTile(height: number, content: string): SVGElement {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE_WIDTH} ${height}" class="legend-tile">`
    + `<rect width="${TILE_WIDTH}" height="${height}" fill="${LEGEND_BG}"/>${content}</svg>`);
}

const ARROW_RIGHT = 'M6,9h18l-5,-5l2,-2l8,7l-8,7l-2,-2l5,-5h-18z';

/** Arrow of the reading direction, over the binary results */
function arrowTile(right: boolean): SVGElement {
  const transform = right ? '' : ` transform="translate(${TILE_WIDTH},0) scale(-1,1)"`;
  return legendTile(18, `<path d="${ARROW_RIGHT}" fill="#fff"${transform}/>`);
}

/** "1 0" with the digits in the colours of the cells they are read from */
function binaryTile(oneIsDark: boolean): SVGElement {
  const [one, zero] = oneIsDark ? [CELL_COLORS[2], CELL_COLORS[0]] : [CELL_COLORS[0], CELL_COLORS[2]];
  return legendTile(18, `<text x="10" y="14" font-size="14" font-weight="bold" text-anchor="middle" fill="${one}">1</text>`
    + `<text x="27" y="14" font-size="14" font-weight="bold" text-anchor="middle" fill="${zero}">0</text>`);
}

/** Three digits stacked: given digits in given colours, top to bottom */
function ternaryTile(digits: number[], colors: string[]): SVGElement {
  const content = digits.map((digit, k) =>
    `<text x="${TILE_WIDTH / 2}" y="${20 + k * 22}" font-size="18" font-weight="bold" text-anchor="middle" fill="${colors[k]}">${digit}</text>`).join('');
  return legendTile(70, content);
}

/** Values mode: digits 0, 1, 2 each in the colour of the cell value the assignment turns into it */
function valuesTile(mapping: number[]): SVGElement {
  const colors = [0, 1, 2].map(digit => CELL_COLORS[mapping.indexOf(digit)]);
  return ternaryTile([0, 1, 2], colors);
}

/** Order mode: the positions of the cells in the order they are read */
function orderTile(order: number[]): SVGElement {
  return ternaryTile(order, [CELL_COLORS[0], CELL_COLORS[0], CELL_COLORS[0]]);
}

export const binaryReaderTool: Tool = {
  path: 'binary',
  title: 'Binary Reader',
  icon: 'two',
  mount(container) {
    const start = radioGroup('binaryStart', 'Alphabet Start', [['1', '1'], ['0', '0']], '1', () => rows.updateAll());
    const rows = readerRows(2, 5, 4, values => binaryLetters(values, start.value === '0' ? 1 : 0));
    container.append(
      h('div', { class: 'legend-bar' },
        h('div', { class: 'legend binary-legend' },
          h('div', null, arrowTile(true), arrowTile(true), arrowTile(false), arrowTile(false)),
          h('div', null, binaryTile(true), binaryTile(false), binaryTile(true), binaryTile(false))),
        start.element),
      rows.list.element,
    );
    return () => rows.list.dispose();
  },
};

export const ternaryReaderTool: Tool = {
  path: 'ternary',
  title: 'Ternary Reader',
  icon: 'three',
  mount(container) {
    const start = radioGroup('ternaryStart', 'Alphabet Start', [['1', '1'], ['0', '0']], '1', () => rows.updateAll());
    const chBox = h('input', { type: 'checkbox', onchange: () => rows.updateAll() });
    const direction = radioGroup('ternaryDirection', 'Reading Direction', [['right', '->'], ['left', '<-']], 'right', () => rows.updateAll());
    const mode = radioGroup('ternaryMode', 'Permutate', [['values', 'Values'], ['order', 'Order']], 'values', () => {
      const readOrder = mode.value === 'order';
      direction.setEnabled(!readOrder);
      // Result i uses the assignment i of the values, or the order 5 - i of the positions
      legend.replaceChildren(...TERNARY_MAPPING.map((mapping, i) => readOrder ? orderTile(TERNARY_MAPPING[5 - i]) : valuesTile(mapping)));
      rows.updateAll();
    });
    const legend = h('div', { class: 'legend ternary-legend' }, ...TERNARY_MAPPING.map(mapping => valuesTile(mapping)));
    const rows = readerRows(3, 3, 6, values => ternaryLetters(
      values, mode.value === 'order', direction.value === 'right', start.value === '0' ? 1 : 0, chBox.checked));

    const settings = h('div', { class: 'settings hidden' },
      h('button', { type: 'button', class: 'icon close', 'aria-label': 'Close settings', onclick: () => settings.classList.add('hidden') }, svg(icons.close)),
      start.element,
      h('div', { class: 'row' }, h('label', { class: 'check' }, chBox, 'Include CH')),
      direction.element,
      mode.element);
    container.append(
      settings,
      h('div', { class: 'legend-bar' },
        legend,
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Settings', onclick: () => settings.classList.toggle('hidden') }, svg(icons.settings))),
      rows.list.element,
    );
    return () => rows.list.dispose();
  },
};
