// Playfair Helper, port of PlayfairActivity.kt: a key grid and a text, shown decrypted and
// encrypted as they are typed

import { cellGrid, CellGrid } from '../components/cell-grid';
import { crypt, findProblem } from '../logic/playfair';
import { h } from '../shell/dom';
import { settingsPanel } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
import { toast } from '../shell/toast';

const SIZES = [4, 5, 6, 7, 8, 9, 10];

interface State {
  playfairWidthSpinner: number;
  playfairHeightSpinner: number;
  playfairGrid: string;
  playfairText: string;
}

const STATE_KEY = 'playfair';
const DEFAULT_STATE: State = {
  playfairWidthSpinner: 1, playfairHeightSpinner: 1, playfairGrid: 'PLAYFIRBCDEGHJKMNOSTUVWXZ', playfairText: 'LYBLRTKUYODPBNWLSLMKZSDE',
};

export const playfairTool: Tool = {
  path: 'playfair',
  title: 'Playfair Helper',
  icon: 'playfair',
  mount(container) {
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const sizeOptions = () => SIZES.map(size => h('option', null, String(size)));
    const widthSelect = h('select', null, ...sizeOptions());
    const heightSelect = h('select', null, ...sizeOptions());
    const gridHolder = h('div', { class: 'grid-holder' });
    const inputBox = h('textarea', { placeholder: 'Text to decipher', rows: 2, autocomplete: 'off', spellcheck: false, style: 'width: 100%' });
    const decryptedView = h('div', { class: 'playfair-result' });
    const encryptedView = h('div', { class: 'playfair-result' });

    let width = 0;
    let height = 0;
    let grid: CellGrid | null = null;

    function computeGrid() {
      const cells = grid!.letters();
      const text = inputBox.value;
      const problem = findProblem(cells, text);
      if (problem !== null) {
        decryptedView.textContent = problem;
        encryptedView.textContent = problem;
        return;
      }
      decryptedView.textContent = crypt(cells, text, true);
      encryptedView.textContent = crypt(cells, text, false);
    }

    function reloadGrid() {
      width = SIZES[widthSelect.selectedIndex];
      height = SIZES[heightSelect.selectedIndex];
      grid = cellGrid({
        rows: height, cols: width,
        next: (i, j) => [j + 1 === width ? i + 1 : i, (j + 1) % width],
        prev: (i, j) => [j === 0 ? i - 1 : i, (j - 1 + width) % width],
        onChange: () => { computeGrid(); save(); },
      });
      gridHolder.replaceChildren(grid.element);
      computeGrid();
    }

    function save() {
      let letters = '';
      let isEmpty = true;
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const letter = grid!.cells[i][j].value.slice(0, 1);
          if (letter !== '') isEmpty = false;
          letters += letter === '' ? '_' : letter;
        }
      }
      saveState(STATE_KEY, isEmpty ? DEFAULT_STATE : {
        playfairWidthSpinner: widthSelect.selectedIndex,
        playfairHeightSpinner: heightSelect.selectedIndex,
        playfairGrid: letters,
        playfairText: inputBox.value,
      } satisfies State);
    }

    function loadSavedState() {
      widthSelect.selectedIndex = Math.min(Math.max(state.playfairWidthSpinner, 0), SIZES.length - 1);
      heightSelect.selectedIndex = Math.min(Math.max(state.playfairHeightSpinner, 0), SIZES.length - 1);
      reloadGrid();
      if (state.playfairGrid.length !== width * height) {
        toast('Invalid saved state, not loading');
        return;
      }
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const letter = state.playfairGrid[i * width + j];
          if (letter !== '_') grid!.setLetter(i, j, letter);
        }
      }
      inputBox.value = state.playfairText;
      computeGrid();
    }

    widthSelect.addEventListener('change', () => { reloadGrid(); save(); });
    heightSelect.addEventListener('change', () => { reloadGrid(); save(); });
    inputBox.addEventListener('input', () => { computeGrid(); save(); });
    container.append(
      ...settingsPanel(h('div', { class: 'row' }, h('label', { class: 'fixed' }, 'Width:', widthSelect), h('label', { class: 'fixed' }, 'Height:', heightSelect))),
      gridHolder,
      inputBox,
      h('div', { class: 'muted', style: 'margin-top: 8px' }, 'Decrypted text:'),
      decryptedView,
      h('div', { class: 'muted', style: 'margin-top: 8px' }, 'Encrypted text:'),
      encryptedView,
    );
    loadSavedState();

    return () => save();
  },
};
