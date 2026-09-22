// Grid of single-letter cells for the Grille and Playfair helpers, the counterpart of the
// EditText tables the app builds: typing a letter moves to the next cell, Enter too, Backspace in
// an empty cell moves back, a long press (or right click) reports the cell

import { h } from '../shell/dom';

export type CellIndex = [number, number];

export interface CellGridOptions {
  rows: number;
  cols: number;
  /** Cells that can not be written to, the center of an odd grille */
  isDisabled?(i: number, j: number): boolean;
  /** Next cell to move to, a row of `rows` means there is none */
  next(i: number, j: number): CellIndex;
  /** Previous cell to move to, a row of -1 means there is none */
  prev(i: number, j: number): CellIndex;
  onChange(): void;
  onLongPress?(i: number, j: number): void;
}

export interface CellGrid {
  element: HTMLElement;
  cells: HTMLInputElement[][];
  letters(): string[][];
  setLetter(i: number, j: number, letter: string): void;
  /** Marks the cell with a state, styled by the `state-<n>` classes; null clears it */
  setState(i: number, j: number, state: number | null): void;
}

const LONG_PRESS_MS = 500;

export function cellGrid(options: CellGridOptions): CellGrid {
  const { rows, cols } = options;
  const cells: HTMLInputElement[][] = [];

  const focusCell = ([i, j]: CellIndex) => {
    if (i < 0 || i >= rows) {
      (document.activeElement as HTMLElement | null)?.blur();
    } else {
      cells[i][j].focus();
      cells[i][j].select();
    }
  };

  const element = h('div', { class: 'cell-grid', style: `grid-template-columns: repeat(${cols}, auto)` });
  for (let i = 0; i < rows; i++) {
    const row: HTMLInputElement[] = [];
    for (let j = 0; j < cols; j++) {
      const disabled = options.isDisabled?.(i, j) ?? false;
      const cell = h('input', {
        type: 'text', class: 'cell', maxlength: 1, autocomplete: 'off', spellcheck: false,
        autocapitalize: 'characters', disabled,
      });
      if (!disabled) {
        cell.addEventListener('focus', () => cell.select());
        cell.addEventListener('input', () => {
          // Letters are always upper case, whatever the keyboard gives
          cell.value = cell.value.toUpperCase();
          options.onChange();
          if (cell.value.length === 1) focusCell(options.next(i, j));
        });
        cell.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            focusCell(options.next(i, j));
          } else if (event.key === 'Backspace' && cell.value === '') {
            event.preventDefault();
            focusCell(options.prev(i, j));
          }
        });
        if (options.onLongPress) {
          // The press decides first: a long one marks the cell without focusing it (so no keyboard
          // pops up), a short one focuses it on release. A right click marks it as well
          let timer: number | undefined;
          let longPressed = false;
          const cancel = () => clearTimeout(timer);
          cell.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.preventDefault();
            longPressed = false;
            cancel();
            timer = window.setTimeout(() => {
              longPressed = true;
              options.onLongPress!(i, j);
            }, LONG_PRESS_MS);
          });
          cell.addEventListener('pointerup', event => {
            if (event.button !== 0) return;
            cancel();
            if (!longPressed) focusCell([i, j]);
          });
          for (const type of ['pointercancel', 'pointerleave']) cell.addEventListener(type, cancel);
          cell.addEventListener('contextmenu', event => {
            event.preventDefault();
            cancel();
            if (!longPressed) options.onLongPress!(i, j);
          });
        }
      }
      row.push(cell);
      element.append(cell);
    }
    cells.push(row);
  }

  return {
    element,
    cells,
    letters: () => cells.map(row => row.map(cell => cell.value)),
    setLetter: (i, j, letter) => { cells[i][j].value = letter; },
    setState: (i, j, state) => {
      cells[i][j].className = state === null ? 'cell' : `cell state-${state}`;
    },
  };
}
