// Number Analyzer, port of NumberAnalyzerActivity.kt

import {
  factorNumber, formatInBase, formatRomanNumeral, parseNumber, PRIME_FACTORS, ROMAN_NUMERALS,
} from '../logic/number-analysis';
import { endlessRows } from '../components/endless-rows';
import { h } from '../shell/dom';
import { fixedTopLayout } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';

const INPUT_TYPES = ['base-2', 'base-3', 'base-5', 'base-7', 'base-10', 'base-16', ROMAN_NUMERALS];
const OUTPUT_TYPES = [...INPUT_TYPES, PRIME_FACTORS];

// Saved types and the numbers typed, up to the last row with one
interface State {
  inputType: string;
  outputType: string;
  numbers: string[];
}

const STATE_KEY = 'numbers';
const DEFAULT_STATE: State = { inputType: 'base-10', outputType: PRIME_FACTORS, numbers: [] };

interface Row {
  element: HTMLElement;
  input: HTMLInputElement;
  result: HTMLElement;
}

export const numberAnalyzerTool: Tool = {
  path: 'numbers',
  title: 'Number Analyzer',
  icon: 'number-analyzer',
  mount(container) {
    const inputTypeSelect = h('select', null, ...INPUT_TYPES.map(type => h('option', null, type)));
    const outputTypeSelect = h('select', null, ...OUTPUT_TYPES.map(type => h('option', null, type)));
    // The saved types, or the common case rather than the first entry of each list
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const save = () => {
      const numbers = list.rows.map(row => row.input.value);
      let count = numbers.length;
      while (count > 0 && numbers[count - 1].trim() === '') count--;
      saveState(STATE_KEY, { inputType: inputTypeSelect.value, outputType: outputTypeSelect.value, numbers: numbers.slice(0, count) } satisfies State);
    };

    // Hexadecimal and roman numerals need letters, the remaining bases only digits
    const needsLetters = () => inputTypeSelect.value === ROMAN_NUMERALS || inputTypeSelect.value === 'base-16';

    function setKeyboard(input: HTMLInputElement) {
      input.inputMode = needsLetters() ? 'text' : 'numeric';
      input.autocapitalize = needsLetters() ? 'characters' : 'off';
    }

    // Renders the number in the output type currently selected
    function formatNumber(number: bigint): Node[] {
      const outputType = outputTypeSelect.value;
      if (outputType === PRIME_FACTORS) return formatPrimeFactors(number);
      if (outputType === ROMAN_NUMERALS) {
        return [document.createTextNode(formatRomanNumeral(number) ?? 'Unable to write the number in roman numerals')];
      }
      const radix = parseInt(outputType.slice('base-'.length), 10);
      return [document.createTextNode(formatInBase(number, radix))];
    }

    function formatPrimeFactors(number: bigint): Node[] {
      const frequencies = new Map<bigint, number>();
      for (const factor of factorNumber(number)) frequencies.set(factor, (frequencies.get(factor) ?? 0) + 1);
      const nodes: Node[] = [];
      for (const [factor, count] of frequencies) {
        nodes.push(document.createTextNode(String(factor)));
        if (count > 1) nodes.push(h('sup', null, String(count)));
        nodes.push(document.createTextNode(' '));
      }
      return nodes;
    }

    function analyzeRow(row: Row) {
      const input = row.input.value.trim();
      if (input === '') {
        row.result.replaceChildren();
        return;
      }
      const number = parseNumber(input, inputTypeSelect.value);
      row.result.replaceChildren(...(number === null ? ['Unable to parse the number'] : formatNumber(number)));
    }

    const list = endlessRows<Row>(index => {
      const input = h('input', { type: 'search', autocomplete: 'off', spellcheck: false, 'aria-label': `Number ${index + 1}` });
      setKeyboard(input);
      const result = h('span', { class: 'row-result' });
      const row: Row = { element: h('div', { class: 'number-row' }, input, result), input, result };
      input.addEventListener('input', () => { analyzeRow(row); save(); });
      // Enter moves on to the next row, like in a list of numbers
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const next = list.rows[list.rows.indexOf(row) + 1];
        if (next) {
          next.input.focus();
          next.input.select();
        }
      });
      return row;
    });

    const analyzeAllRows = () => list.rows.forEach(analyzeRow);
    inputTypeSelect.addEventListener('change', () => {
      list.rows.forEach(row => setKeyboard(row.input));
      analyzeAllRows();
      save();
    });
    outputTypeSelect.addEventListener('change', () => { analyzeAllRows(); save(); });

    /** Puts in a saved state, an example or the defaults */
    function applyState(s: State) {
      inputTypeSelect.value = INPUT_TYPES.includes(s.inputType) ? s.inputType : DEFAULT_STATE.inputType;
      outputTypeSelect.value = OUTPUT_TYPES.includes(s.outputType) ? s.outputType : DEFAULT_STATE.outputType;
      const numbers = Array.isArray(s.numbers) ? s.numbers : [];
      list.ensure(numbers.length);
      list.rows.forEach((row, i) => {
        row.input.value = String(numbers[i] ?? '');
        setKeyboard(row.input);
      });
      analyzeAllRows();
      save();
    }
    applyState(state);

    const unmountLayout = fixedTopLayout(container, [
      // Split like the rows below, the input over the number and the output over its result: the
      // number box keeps its 20px of padding and border before the 2:3 split, so does the label
      h('div', { class: 'row' },
        h('label', { style: 'flex: 2 1 20px' }, 'input:', inputTypeSelect),
        h('label', { style: 'flex: 3 1 0' }, 'output:', outputTypeSelect)),
    ], [list.element]);
    list.rows[0].input.focus();

    return {
      unmount() {
        save();
        list.dispose();
        unmountLayout();
      },
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        { name: 'Prime factors', apply: () => applyState({ inputType: 'base-10', outputType: PRIME_FACTORS, numbers: ['2026', '1234567', '65536', '600851475143'] }) },
        { name: 'Hexadecimal to decimal', apply: () => applyState({ inputType: 'base-16', outputType: 'base-10', numbers: ['FF', 'CAFE', 'DEADBEEF'] }) },
        { name: 'Roman numerals to decimal', apply: () => applyState({ inputType: ROMAN_NUMERALS, outputType: 'base-10', numbers: ['MMXXVI', 'MCMLXXXIV', 'XLII'] }) },
      ],
    };
  },
};
