// Number Analyzer, port of NumberAnalyzerActivity.kt

import {
  factorNumber, formatInBase, formatRomanNumeral, parseNumber, PRIME_FACTORS, ROMAN_NUMERALS,
} from '../logic/number-analysis';
import { endlessRows } from '../components/endless-rows';
import { h } from '../shell/dom';
import { fixedTopLayout } from '../shell/layout';
import { Tool } from '../shell/router';

const INPUT_TYPES = ['base-2', 'base-3', 'base-5', 'base-7', 'base-10', 'base-16', ROMAN_NUMERALS];
const OUTPUT_TYPES = [...INPUT_TYPES, PRIME_FACTORS];

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
    // Start on the common case rather than on the first entry of each list
    inputTypeSelect.value = 'base-10';
    outputTypeSelect.value = PRIME_FACTORS;

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

    const list = endlessRows<Row>(() => {
      const input = h('input', { type: 'text', autocomplete: 'off', spellcheck: false });
      setKeyboard(input);
      const result = h('span', { class: 'row-result' });
      const row: Row = { element: h('div', { class: 'number-row' }, input, result), input, result };
      input.addEventListener('input', () => analyzeRow(row));
      return row;
    });

    const analyzeAllRows = () => list.rows.forEach(analyzeRow);
    inputTypeSelect.addEventListener('change', () => {
      list.rows.forEach(row => setKeyboard(row.input));
      analyzeAllRows();
    });
    outputTypeSelect.addEventListener('change', analyzeAllRows);

    const unmountLayout = fixedTopLayout(container, [
      h('div', { class: 'row' }, h('label', null, 'input:', inputTypeSelect), h('label', null, 'output:', outputTypeSelect)),
    ], [list.element]);
    list.rows[0].input.focus();

    return () => {
      list.dispose();
      unmountLayout();
    };
  },
};
