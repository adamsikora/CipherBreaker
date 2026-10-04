// Keyboard Helper, made for the PWA: a keyboard drawn in the picked layout, whose keys are painted
// with the picked colour by tapping them. The colours belong to the physical keys, so they stay
// where they are when the layout changes

import { Key, KEYBOARD_HEIGHT, KEYBOARD_LAYOUTS, KEYBOARD_WIDTH, keyAt, keyboardKeys, textColorOn } from '../logic/keyboard';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { settingsPanel } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';

interface State {
  keyboardLayout: string;
  /** The colour the keys are painted with, empty for the eraser */
  keyboardColor: string;
  keyboardCustomColor: string;
  /** Colours of the painted keys by the id of the key */
  keyboardKeys: Record<string, string>;
}

const STATE_KEY = 'keyboard';
const [RED, YELLOW, GREEN, BLUE] = ['#e53935', '#fdd835', '#43a047', '#1e88e5'];
const COLORS = [RED, YELLOW, GREEN, BLUE];
const DEFAULT_STATE: State = { keyboardLayout: KEYBOARD_LAYOUTS[0].id, keyboardColor: COLORS[0], keyboardCustomColor: '#795548', keyboardKeys: {} };

/** An example: a layout with keys painted, given as the ids of the keys of each colour */
function keyboardExample(layout: string, painted: [string, string[]][]): State {
  const keys: Record<string, string> = {};
  for (const [color, ids] of painted) {
    for (const id of ids) keys[id] = color;
  }
  return { ...DEFAULT_STATE, keyboardLayout: layout, keyboardKeys: keys };
}

/** The keys of the three rows of letters in the given columns */
const columns = (...cols: number[]) => cols.flatMap(col => [1, 2, 3].map(row => `${row}:${col}`));
// Space between the keys, as a part of a key
const GAP = 0.04;

export const keyboardTool: Tool = {
  path: 'keyboard',
  title: 'Keyboard Helper',
  icon: 'keyboard',
  mount(container) {
    const layoutSelect = h('select', null, ...KEYBOARD_LAYOUTS.map(layout => h('option', { value: layout.id }, layout.name)));
    const colorButtons = COLORS.map(color => h('button', { class: 'swatch', style: `background: ${color}`, title: color, 'aria-label': `Colour ${color}` }));
    // The colour input of the browser would look like one more swatch, so it lies unseen over a
    // rainbow one, with the colour picked in it shown in the middle
    const customInput = h('input', { type: 'color', 'aria-label': 'Any colour' });
    const customDot = h('span');
    const customButton = h('label', { class: 'swatch custom', title: 'Any colour' }, customInput, customDot);
    const eraseButton = h('button', { class: 'swatch erase', title: 'Eraser', 'aria-label': 'Eraser' }, svg(icons.close));
    const canvas = h('canvas', { class: 'keyboard', role: 'img', 'aria-label': 'Keyboard' });

    let keys: Key[] = [];
    let color = '';
    let colors: Record<string, string> = {};

    function draw() {
      const width = canvas.clientWidth;
      if (width === 0) return;
      const unit = width / KEYBOARD_WIDTH;
      const ratio = window.devicePixelRatio || 1;
      // Sized only when the size changes: setting the size of a canvas empties it and lays the
      // page out again, which shows as a blink when just a key is painted
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(unit * KEYBOARD_HEIGHT * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.style.height = `${unit * KEYBOARD_HEIGHT}px`;
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext('2d')!;
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      // Drawn in the pixels of the canvas, a key being `scale` of them: with the context scaled to
      // a key instead the fonts would be under a pixel in size, and phones leave letters out then
      const scale = canvas.width / KEYBOARD_WIDTH;
      const font = (size: number) => `${size * scale}px system-ui, sans-serif`;
      const text = (legend: string, x: number, y: number) => context.fillText(legend, x * scale, y * scale);
      const style = getComputedStyle(canvas);
      const keyColor = style.getPropertyValue('--cell-free');
      const textColor = style.getPropertyValue('--cell-fg');
      const mutedColor = style.getPropertyValue('--muted');
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (const key of keys) {
        const painted = colors[key.id];
        context.fillStyle = painted ?? keyColor;
        // The lower part of a tall Enter reaches up to the upper one, over the gap between the rows
        key.rects.forEach((r, i) => {
          const top = i === 0 ? r.y + GAP : r.y - GAP;
          context.fillRect((r.x + GAP) * scale, top * scale, (r.w - 2 * GAP) * scale, (r.y + r.h - GAP - top) * scale);
        });
        const { x, y, w } = key.rects[0];
        if (key.control) {
          context.fillStyle = painted ? textColorOn(painted) : mutedColor;
          context.font = font(0.3);
          text(key.legends[0], x + w / 2, y + 0.5);
          continue;
        }
        context.fillStyle = painted ? textColorOn(painted) : textColor;
        if (key.legends.length === 1) {
          context.font = font(0.5);
          text(key.legends[0], x + w / 2, y + 0.52);
        } else {
          context.font = font(0.4);
          text(key.legends[0], x + w / 2, y + 0.29);
          text(key.legends[1], x + w / 2, y + 0.73);
        }
      }
    }

    function showColor() {
      colorButtons.forEach((button, i) => button.classList.toggle('selected', COLORS[i] === color));
      eraseButton.classList.toggle('selected', color === '');
      customButton.classList.toggle('selected', color !== '' && !COLORS.includes(color));
      customDot.style.background = customInput.value;
    }

    function save() {
      saveState(STATE_KEY, {
        keyboardLayout: layoutSelect.value,
        keyboardColor: color,
        keyboardCustomColor: customInput.value,
        keyboardKeys: colors,
      } satisfies State);
    }

    function reloadLayout() {
      keys = keyboardKeys(KEYBOARD_LAYOUTS[layoutSelect.selectedIndex]);
      draw();
    }

    /** Puts in a saved state, an example or the defaults */
    function applyState(s: State) {
      layoutSelect.selectedIndex = Math.max(KEYBOARD_LAYOUTS.findIndex(layout => layout.id === s.keyboardLayout), 0);
      customInput.value = s.keyboardCustomColor;
      color = s.keyboardColor;
      colors = { ...s.keyboardKeys };
      showColor();
      reloadLayout();
      save();
    }

    function pickColor(picked: string) {
      color = picked;
      showColor();
      save();
    }

    layoutSelect.addEventListener('change', () => { reloadLayout(); save(); });
    colorButtons.forEach((button, i) => button.addEventListener('click', () => pickColor(COLORS[i])));
    eraseButton.addEventListener('click', () => pickColor(''));
    // A click opens the picker of the browser and makes its colour the picked one even if left as it is
    customInput.addEventListener('click', () => pickColor(customInput.value));
    customInput.addEventListener('input', () => pickColor(customInput.value));
    // Tapping a key that has the picked colour already takes the colour off again
    canvas.addEventListener('click', event => {
      const unit = canvas.clientWidth / KEYBOARD_WIDTH;
      const key = keyAt(keys, event.offsetX / unit, event.offsetY / unit);
      if (!key) return;
      if (color === '' || colors[key.id] === color) delete colors[key.id];
      else colors[key.id] = color;
      draw();
      save();
    });

    container.append(
      ...settingsPanel(h('div', { class: 'keyboard-settings' },
        h('div', { class: 'row' }, h('label', null, 'Layout:', layoutSelect)),
        h('div', { class: 'swatches' }, ...colorButtons, customButton, eraseButton),
      )),
      h('div', { class: 'keyboard-holder' }, canvas),
    );
    applyState(loadState(STATE_KEY, DEFAULT_STATE));

    // The keyboard is as wide as the page, and its colours follow the theme
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const theme = window.matchMedia('(prefers-color-scheme: dark)');
    theme.addEventListener('change', draw);

    return {
      unmount() {
        observer.disconnect();
        theme.removeEventListener('change', draw);
        save();
      },
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        { name: 'Touch typing, a colour per finger', apply: () => applyState(keyboardExample('cz-qwertz', [[RED, columns(0, 9)], [YELLOW, columns(1, 8)], [GREEN, columns(2, 7)], [BLUE, columns(3, 4, 5, 6)]])) },
        { name: 'Keys of the word CIPHER', apply: () => applyState(keyboardExample('en-us', [[GREEN, ['3:2', '1:7', '1:9', '2:5', '1:2', '1:3']]])) },
        { name: 'Dvorak, vowels on the home row', apply: () => applyState(keyboardExample('dvorak', [[YELLOW, ['2:0', '2:1', '2:2', '2:3', '2:4']], [BLUE, ['2:5', '2:6', '2:7', '2:8', '2:9']]])) },
      ],
    };
  },
};
