// Binary Reader and Ternary Reader, ports of DebaseatorActivity.kt with DebinarizatorActivity.kt
// and DeternarizatorActivity.kt: endless rows of digit cells that cycle through their values on
// tap, each row read as letters in all the ways the digits can be taken

import { endlessRows } from '../components/endless-rows';
import { binaryLetters, ternaryLetters } from '../logic/base-reader';
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

const legendImage = (name: string) => h('img', { src: `legend/${name}.png`, alt: '' });

// Legend images of the six value assignments in the order of the results: the images show which
// colour stands for which digit, ternary2 belongs to the third assignment and ternary3 to the second
const VALUES_LEGEND = [1, 3, 2, 4, 5, 6];

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
          h('div', null, legendImage('right'), legendImage('right'), legendImage('left'), legendImage('left')),
          h('div', null, legendImage('black_horizontal'), legendImage('white_horizontal'), legendImage('black_horizontal'), legendImage('white_horizontal'))),
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
      legendImages.forEach((image, i) => {
        image.src = readOrder ? `legend/ternaryorder${6 - i}.png` : `legend/ternary${VALUES_LEGEND[i]}.png`;
      });
      rows.updateAll();
    });
    const legendImages = VALUES_LEGEND.map(n => legendImage(`ternary${n}`));
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
        h('div', { class: 'legend ternary-legend' }, ...legendImages),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Settings', onclick: () => settings.classList.toggle('hidden') }, svg(icons.settings))),
      rows.list.element,
    );
    return () => rows.list.dispose();
  },
};
