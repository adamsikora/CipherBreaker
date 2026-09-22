// Grille Helper, port of GrillerActivity.kt: letters in a square grid, holes of the turning
// grille marked by a long press, the text read through the holes in all four rotations

import { cellGrid, CellGrid } from '../components/cell-grid';
import { Grille } from '../logic/grille';
import { h } from '../shell/dom';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
import { toast } from '../shell/toast';

const SIZES = [4, 5, 6, 7, 8, 9, 10];

// Cell states: 0 is a hole, 1-3 the cells it turns onto, 4 a free cell, 5 the unusable center
const STATE_COLORS = ['#4f71e5', '#e8f3db', '#fffbd8', '#ffdad3', '#d9d9d9', '#808080'];
const RESULT_COLORS = ['#4f71e5', '#8bc34a', '#ffeb3b', '#ff4722'];
const HOLE = 0;
const FREE = 4;
const CENTER = 5;

interface State {
  sizeSpinner: number;
  inputLetters: string;
  inputHoles: string;
}

const STATE_KEY = 'grille';
const DEFAULT_STATE: State = { sizeSpinner: 0, inputLetters: 'kcuerloulmnyutsv', inputHoles: '3020123131032021' };

export const grilleTool: Tool = {
  path: 'grille',
  title: 'Grille Helper',
  icon: 'grille',
  mount(container) {
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const sizeSelect = h('select', null, ...SIZES.map(size => h('option', null, `${size}x${size}`)));
    const gridHolder = h('div', { class: 'grid-holder' });
    const resultViews = RESULT_COLORS.map(color => h('div', { class: 'grille-result', style: `color: ${color}` }));
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
      grid!.setColor(i, j, STATE_COLORS[cellState]);
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
        rows: size, cols: size, uppercase: true,
        isDisabled: (i, j) => geometry.isCenterCell(i, j),
        next: (i, j) => geometry.nextCell(i, j),
        prev: (i, j) => geometry.prevCell(i, j),
        onChange: () => { computeGrid(); save(); },
        onLongPress: toggleHole,
      });
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) grid.setColor(i, j, STATE_COLORS[states[i][j]]);
      }
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

    function loadSavedState() {
      sizeSelect.selectedIndex = Math.min(Math.max(state.sizeSpinner, 0), SIZES.length - 1);
      reloadGrille();
      if (state.inputHoles.length !== size * size || state.inputLetters.length !== size * size) {
        toast('Invalid saved state, not loading');
        return;
      }
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const letter = state.inputLetters[i * size + j].toUpperCase();
          if (letter !== '_') grid!.setLetter(i, j, letter);
          const cellState = parseInt(state.inputHoles[i * size + j], 10);
          if (!(cellState >= 0 && cellState <= 5)) {
            toast(`Invalid cell state ${cellState}`);
            return;
          }
          setCellState(i, j, cellState);
        }
      }
      computeGrid();
    }

    sizeSelect.addEventListener('change', () => { reloadGrille(); save(); });
    container.append(
      h('div', { class: 'row' }, h('label', { class: 'fixed' }, 'Size:', sizeSelect)),
      gridHolder,
      ...resultViews,
      warningView,
    );
    loadSavedState();

    return () => save();
  },
};
