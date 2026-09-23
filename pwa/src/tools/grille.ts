// Turning Grille, port of GrillerActivity.kt: letters in a square grid, holes of the turning
// grille marked by a long press, the text read through the holes in all four rotations

import { cellGrid, CellGrid, GRID_SIZES as SIZES } from '../components/cell-grid';
import { Grille } from '../logic/grille';
import { h } from '../shell/dom';
import { settingsPanel } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
import { toast } from '../shell/toast';

// Cell states: 0 is a hole, 1-3 the cells it turns onto, 4 a free cell, 5 the unusable center.
// States 0-3 are coloured by the cell-grid `state` classes, the other two are the plain look
const HOLE = 0;
const FREE = 4;
const CENTER = 5;

interface State {
  sizeSpinner: number;
  inputLetters: string;
  inputHoles: string;
}

const STATE_KEY = 'grille';
const DEFAULT_STATE: State = { sizeSpinner: 0, inputLetters: '', inputHoles: '' };

/**
 * An example: the message is what the holes read in the four rotations, the letters are placed
 * so that it comes out; a hole is given per orbit of four cells
 */
function grilleExample(size: number, holes: [number, number][], message: string): State {
  const geometry = new Grille(size);
  const letters: string[][] = Array.from({ length: size }, () => new Array<string>(size).fill('_'));
  const states: number[][] = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => geometry.isCenterCell(i, j) ? CENTER : FREE));
  let next = 0;
  for (let rotation = 0; rotation < 4; rotation++) {
    const cells = holes.map(([i, j]) => geometry.getRotation(i, j, rotation));
    cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const [i, j] of cells) letters[i][j] = message[next++] ?? '_';
  }
  for (const [i, j] of holes) {
    geometry.getRotations(i, j).forEach(([y, x], k) => { states[y][x] = k; });
  }
  return { sizeSpinner: SIZES.indexOf(size), inputLetters: letters.flat().join(''), inputHoles: states.flat().join('') };
}

export const grilleTool: Tool = {
  path: 'grille',
  title: 'Turning Grille',
  icon: 'grille',
  mount(container) {
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const sizeSelect = h('select', null, ...SIZES.map(size => h('option', null, `${size}x${size}`)));
    const gridHolder = h('div', { class: 'grid-holder' });
    const resultViews = [0, 1, 2, 3].map(rot => h('div', { class: `grille-result read-${rot}` }));
    const warningView = h('div', { class: 'muted' });

    let size = 0;
    let geometry = new Grille(0);
    let grid: CellGrid | null = null;
    let states: number[][] = [];

    function computeGrid() {
      const presets: [number, number][] = [];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (states[i][j] === HOLE) presets.push([i, j]);
        }
      }
      warningView.textContent = presets.length !== geometry.desiredPresets()
        ? 'Not all reading positions are set. Specify them through long tap.' : '';
      const letters = grid!.letters();
      for (let rot = 0; rot < 4; rot++) resultViews[rot].textContent = geometry.read(letters, presets, rot);
    }

    function setCellState(i: number, j: number, cellState: number) {
      states[i][j] = cellState;
      grid!.setState(i, j, cellState < FREE ? cellState : null);
    }

    // A long press on a hole frees it and the cells it turns onto, on any other cell makes a hole
    function toggleHole(i: number, j: number) {
      const rotations = geometry.getRotations(i, j);
      if (states[i][j] === HOLE) {
        for (const [y, x] of rotations) setCellState(y, x, FREE);
      } else {
        setCellState(i, j, HOLE);
        for (let k = 1; k < 4; k++) setCellState(rotations[k][0], rotations[k][1], k);
      }
      computeGrid();
      save();
    }

    function reloadGrille() {
      size = SIZES[sizeSelect.selectedIndex];
      geometry = new Grille(size);
      states = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => geometry.isCenterCell(i, j) ? CENTER : FREE));
      grid = cellGrid({
        rows: size, cols: size,
        isDisabled: (i, j) => geometry.isCenterCell(i, j),
        next: (i, j) => geometry.nextCell(i, j),
        prev: (i, j) => geometry.prevCell(i, j),
        onChange: () => { computeGrid(); save(); },
        onLongPress: toggleHole,
      });
      gridHolder.replaceChildren(grid.element);
      computeGrid();
    }

    function save() {
      let letters = '';
      let holes = '';
      let isEmpty = true;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const letter = grid!.cells[i][j].value.slice(0, 1);
          if (letter !== '') isEmpty = false;
          letters += letter === '' ? '_' : letter;
          if (states[i][j] < FREE) isEmpty = false;
          holes += String(states[i][j]);
        }
      }
      saveState(STATE_KEY, isEmpty ? DEFAULT_STATE : { sizeSpinner: sizeSelect.selectedIndex, inputLetters: letters, inputHoles: holes } satisfies State);
    }

    /** Puts in a saved state, an example or the defaults; an empty one is just the empty grid */
    function applyState(s: State) {
      sizeSelect.selectedIndex = Math.min(Math.max(s.sizeSpinner, 0), SIZES.length - 1);
      reloadGrille();
      if (s.inputLetters === '' && s.inputHoles === '') {
        save();
        return;
      }
      if (s.inputHoles.length !== size * size || s.inputLetters.length !== size * size) {
        toast('Invalid saved state, not loading');
        return;
      }
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const letter = s.inputLetters[i * size + j].toUpperCase();
          if (letter !== '_') grid!.setLetter(i, j, letter);
          const cellState = parseInt(s.inputHoles[i * size + j], 10);
          if (!(cellState >= 0 && cellState <= 5)) {
            toast(`Invalid cell state ${cellState}`);
            return;
          }
          setCellState(i, j, cellState);
        }
      }
      computeGrid();
      save();
    }

    sizeSelect.addEventListener('change', () => { reloadGrille(); save(); });
    container.append(
      ...settingsPanel(h('div', { class: 'row' }, h('label', { class: 'fixed' }, 'Size:', sizeSelect))),
      gridHolder,
      ...resultViews,
      warningView,
    );
    applyState(state);

    return {
      unmount: save,
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        { name: '4×4 grille', apply: () => applyState({ sizeSpinner: 0, inputLetters: 'kcuerloulmnyutsv', inputHoles: '3020123131032021' }) },
        { name: '5×5 grille, the centre stays unused', apply: () => applyState(grilleExample(5, [[0, 1], [0, 3], [1, 2], [2, 0], [3, 3], [4, 4]], 'THEGRILLEHIDESTHEMESSAGE')) },
        { name: '6×6 grille', apply: () => applyState(grilleExample(6, [[0, 0], [1, 5], [5, 3], [0, 4], [4, 4], [3, 1], [3, 5], [4, 2], [2, 2]], 'MEETATTHEOLDBRIDGEATMIDNIGHTBRINGMAP')) },
      ],
    };
  },
};
