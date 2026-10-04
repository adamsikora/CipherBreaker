import { describe, expect, it } from 'vitest';
import { Key, KEYBOARD_HEIGHT, KEYBOARD_LAYOUTS, KEYBOARD_WIDTH, keyAt, keyboardKeys, keyLegends, Rect, textColorOn } from '../src/logic/keyboard';

const layout = (id: string) => KEYBOARD_LAYOUTS.find(l => l.id === id)!;
const key = (keys: Key[], id: string) => keys.find(k => k.id === id)!;
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('Keyboard', () => {
  it('has the keys of an ANSI or ISO keyboard in every layout', () => {
    for (const l of KEYBOARD_LAYOUTS) {
      expect(l.base.map(row => [...row].length), l.id).toEqual(l.iso ? [13, 12, 12, 11] : [13, 13, 11, 10]);
      expect(l.shift.map(row => [...row].length), l.id).toEqual(l.base.map(row => [...row].length));
    }
  });

  it('has unique layout ids', () => {
    expect(new Set(KEYBOARD_LAYOUTS.map(l => l.id)).size).toBe(KEYBOARD_LAYOUTS.length);
  });

  it('places the keys inside the keyboard without overlaps', () => {
    for (const l of KEYBOARD_LAYOUTS) {
      const keys = keyboardKeys(l);
      expect(new Set(keys.map(k => k.id)).size, l.id).toBe(keys.length);
      const rects = keys.flatMap(k => k.rects);
      for (const r of rects) {
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= KEYBOARD_WIDTH && r.y + r.h <= KEYBOARD_HEIGHT, l.id).toBe(true);
      }
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) expect(overlap(rects[i], rects[j]), l.id).toBe(false);
      }
    }
  });

  it('has the four layouts', () => {
    expect(KEYBOARD_LAYOUTS.map(l => l.id)).toEqual(['cz-qwertz', 'cz-qwerty', 'en-us', 'dvorak']);
  });

  it('has the modifier keys around the space bar', () => {
    const bottom = (id: string) => keyboardKeys(layout(id)).filter(k => k.rects[0].y === 4);
    expect(bottom('en-us').map(k => k.legends[0])).toEqual(['Ctrl', 'Win', 'Alt', '', 'Alt', 'Win', 'Menu', 'Ctrl']);
    expect(bottom('cz-qwertz').map(k => k.legends[0])).toEqual(['Ctrl', 'Win', 'Alt', '', 'AltGr', 'Win', 'Menu', 'Ctrl']);
    expect(bottom('en-us').every(k => k.control)).toBe(true);
    expect(key(bottom('en-us'), 'space').rects).toEqual([{ x: 3.75, y: 4, w: 6.25, h: 1 }]);
  });

  it('fills the five rows of keys to the full width', () => {
    for (const l of KEYBOARD_LAYOUTS) {
      const rects = keyboardKeys(l).flatMap(k => k.rects);
      for (let y = 0; y < KEYBOARD_HEIGHT; y++) {
        expect(rects.filter(r => r.y === y).reduce((sum, r) => sum + r.w, 0), `${l.id} row ${y}`).toBe(KEYBOARD_WIDTH);
      }
    }
  });

  it('shows a letter as its capital and other keys with both characters', () => {
    expect(keyLegends('q', 'Q')).toEqual(['Q']);
    expect(keyLegends('ü', 'Ü')).toEqual(['Ü']);
    expect(keyLegends('ě', '2')).toEqual(['2', 'ě']);
    expect(keyLegends('ú', '/')).toEqual(['/', 'ú']);
    expect(keyLegends('1', '!')).toEqual(['!', '1']);
    expect(keyLegends('²', ' ')).toEqual(['²']);
  });

  it('has the Shift symbols on the top row', () => {
    const top = (id: string) => keyboardKeys(layout(id)).slice(0, 13).map(k => k.legends.join(''));
    expect(top('cz-qwertz')).toEqual(['°;', '1+', '2ě', '3š', '4č', '5ř', '6ž', '7ý', '8á', '9í', '0é', '%=', 'ˇ´']);
    expect(top('en-us')).toEqual(['~`', '!1', '@2', '#3', '$4', '%5', '^6', '&7', '*8', '(9', ')0', '_-', '+=']);
  });

  it('keeps the ids of the physical keys between layouts', () => {
    const us = keyboardKeys(layout('en-us'));
    const cz = keyboardKeys(layout('cz-qwertz'));
    const dvorak = keyboardKeys(layout('dvorak'));
    expect(key(us, '3:0').legends).toEqual(['Z']);
    expect(key(cz, '3:0').legends).toEqual(['Y']);
    expect(key(dvorak, '3:0').legends).toEqual([':', ';']);
    expect(key(cz, '3:-1').legends).toEqual(['|', '\\']);
    expect(us.some(k => k.id === '3:-1')).toBe(false);
    // The key above the ANSI Enter is left of the ISO one
    expect(key(us, '1:12').rects).toEqual([{ x: 13.5, y: 1, w: 1.5, h: 1 }]);
    expect(key(cz, '1:12').rects).toEqual([{ x: 12.75, y: 2, w: 1, h: 1 }]);
    expect(key(cz, '1:12').legends).toEqual(['\'', '¨']);
  });

  it('finds the key at a point', () => {
    const us = keyboardKeys(layout('en-us'));
    const cz = keyboardKeys(layout('cz-qwertz'));
    expect(keyAt(us, 0.5, 0.5)!.legends).toEqual(['~', '`']);
    expect(keyAt(us, 2, 1.5)!.legends).toEqual(['Q']);
    expect(keyAt(us, 1, 1.5)!.id).toBe('tab');
    expect(keyAt(us, 2.5, 3.5)!.legends).toEqual(['Z']);
    expect(keyAt(cz, 2.5, 3.5)!.legends).toEqual(['Y']);
    expect(keyAt(us, 7, 4.5)!.id).toBe('space');
    expect(keyAt(us, 1, 4.5)!.id).toBe('ctrl-left');
    expect(keyAt(us, 10.5, 4.5)!.id).toBe('alt-right');
    expect(keyAt(us, 14.5, 4.5)!.id).toBe('ctrl-right');
    expect(keyAt(us, 15, 0.5)).toBeNull();
    expect(keyAt(us, 7, 5)).toBeNull();
    // Both parts of the ISO Enter, and the key in its corner
    expect(keyAt(cz, 14, 1.5)!.id).toBe('enter');
    expect(keyAt(cz, 14, 2.5)!.id).toBe('enter');
    expect(keyAt(cz, 13.6, 2.5)!.id).toBe('1:12');
  });

  it('picks a readable text colour', () => {
    expect(textColorOn('#fdd835')).toBe('#000');
    expect(textColorOn('#ffffff')).toBe('#000');
    expect(textColorOn('#1e88e5')).toBe('#fff');
    expect(textColorOn('#000000')).toBe('#fff');
  });
});
