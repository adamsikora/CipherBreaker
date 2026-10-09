// Keyboard layouts of the Keyboard tool: what the keys type alone and with Shift, where they are
// on the keyboard and which one is at a point. Made for the PWA, the Android app has no such tool

export interface KeyboardLayout {
  id: string;
  name: string;
  /**
   * An ISO keyboard has a key more next to the left Shift and a tall Enter with a key to the left
   * of its lower part; an ANSI one has a wide Enter with that key above it
   */
  iso: boolean;
  /** The four rows of character keys from the top, a character per key: what it types alone */
  base: string[];
  /** The same with Shift; a space is a key that types nothing with it */
  shift: string[];
}

export const KEYBOARD_LAYOUTS: KeyboardLayout[] = [
  {
    id: 'cz-qwertz', name: 'Czech QWERTZ', iso: true,
    base: [';+ěščřžýáíé=´', 'qwertzuiopú)', 'asdfghjklů§¨', '\\yxcvbnm,.-'],
    shift: ['°1234567890%ˇ', 'QWERTZUIOP/(', 'ASDFGHJKL"!\'', '|YXCVBNM?:_'],
  },
  {
    id: 'cz-qwerty', name: 'Czech QWERTY', iso: true,
    base: [';+ěščřžýáíé=´', 'qwertyuiopú)', 'asdfghjklů§¨', '\\zxcvbnm,.-'],
    shift: ['°1234567890%ˇ', 'QWERTYUIOP/(', 'ASDFGHJKL"!\'', '|ZXCVBNM?:_'],
  },
  {
    id: 'en-us', name: 'English (US)', iso: false,
    base: ['`1234567890-=', 'qwertyuiop[]\\', 'asdfghjkl;\'', 'zxcvbnm,./'],
    shift: ['~!@#$%^&*()_+', 'QWERTYUIOP{}|', 'ASDFGHJKL:"', 'ZXCVBNM<>?'],
  },
  {
    id: 'dvorak', name: 'Dvorak', iso: false,
    base: ['`1234567890[]', '\',.pyfgcrl/=\\', 'aoeuidhtns-', ';qjkxbmwvz'],
    shift: ['~!@#$%^&*(){}', '"<>PYFGCRL?+|', 'AOEUIDHTNS_', ':QJKXBMWVZ'],
  },
];

/** A rectangle in units of one key: the keyboard is KEYBOARD_WIDTH wide and KEYBOARD_HEIGHT high */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Key {
  /** Of the physical key, the same in every layout, so that what is marked stays where it is */
  id: string;
  /** One rectangle; two, upper first, for the Enter of an ISO keyboard */
  rects: Rect[];
  /** What the key shows: one legend, or what it types with Shift above what it types alone */
  legends: string[];
  /** Tab, Shift and the like, which type nothing */
  control: boolean;
}

export const KEYBOARD_WIDTH = 15;
export const KEYBOARD_HEIGHT = 5;

// Where the character keys of the rows start, after Tab, Caps Lock and the left Shift
const ROW_STARTS = [0, 1.5, 1.75, 2.25];
const ISO_SHIFT_WIDTH = 1.25;
const MODIFIER_WIDTH = 1.25;
const SPACE_WIDTH = 6.25;

/** A letter shows just its capital, like on a real keyboard; any other key both of its characters */
export function keyLegends(base: string, shift: string): string[] {
  if (shift === ' ') return [base];
  if (shift !== base && shift === base.toUpperCase()) return [shift];
  return [shift, base];
}

export function keyboardKeys(layout: KeyboardLayout): Key[] {
  const keys: Key[] = [];
  const control = (id: string, label: string, ...rects: Rect[]) => keys.push({ id, rects, legends: [label], control: true });
  layout.base.forEach((row, y) => {
    const base = [...row];
    const shift = [...layout.shift[y]];
    const start = layout.iso && y === 3 ? ISO_SHIFT_WIDTH : ROW_STARTS[y];
    base.forEach((character, i) => {
      // The extra key of the bottom row of an ISO keyboard is its column -1, the letters after it
      // keep the columns they have on an ANSI one
      let id = `${y}:${layout.iso && y === 3 ? i - 1 : i}`;
      let w = 1;
      // The key left of the ISO Enter is the one above the ANSI Enter, which is wider there
      if (layout.iso && y === 2 && i === 11) id = '1:12';
      if (!layout.iso && y === 1 && i === 12) w = 1.5;
      keys.push({ id, rects: [{ x: start + i, y, w, h: 1 }], legends: keyLegends(character, shift[i]), control: false });
    });
  });
  control('backspace', '←', { x: 13, y: 0, w: 2, h: 1 });
  control('tab', 'Tab', { x: 0, y: 1, w: 1.5, h: 1 });
  control('caps', 'Caps', { x: 0, y: 2, w: 1.75, h: 1 });
  if (layout.iso) control('enter', 'Enter', { x: 13.5, y: 1, w: 1.5, h: 1 }, { x: 13.75, y: 2, w: 1.25, h: 1 });
  else control('enter', 'Enter', { x: 12.75, y: 2, w: 2.25, h: 1 });
  control('shift-left', 'Shift', { x: 0, y: 3, w: layout.iso ? ISO_SHIFT_WIDTH : ROW_STARTS[3], h: 1 });
  control('shift-right', 'Shift', { x: 12.25, y: 3, w: 2.75, h: 1 });
  // The bottom row: three keys, the space bar and four keys; the right Alt is AltGr where the
  // layout types a third character with it
  const bottom: [string, string][] = [
    ['ctrl-left', 'Ctrl'], ['win-left', 'Win'], ['alt-left', 'Alt'], ['space', ''],
    ['alt-right', layout.iso ? 'AltGr' : 'Alt'], ['win-right', 'Win'], ['menu', 'Menu'], ['ctrl-right', 'Ctrl'],
  ];
  let x = 0;
  for (const [id, label] of bottom) {
    const w = id === 'space' ? SPACE_WIDTH : MODIFIER_WIDTH;
    control(id, label, { x, y: 4, w, h: 1 });
    x += w;
  }
  return keys;
}

/** The key at a point given in units of one key, if there is one */
export function keyAt(keys: Key[], x: number, y: number): Key | null {
  return keys.find(key => key.rects.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)) ?? null;
}

/** Black or white, whichever reads better on a background given as #rrggbb */
export function textColorOn(background: string): string {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(background.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#000' : '#fff';
}
