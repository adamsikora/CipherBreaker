import { describe, expect, it } from 'vitest';
import { Grille } from '../src/logic/grille';

const rows = (...lines: string[]) => lines.map(row => [...row]);

describe('Grille', () => {
  it('turns a corner through all corners', () => {
    expect(new Grille(4).getRotations(0, 0)).toEqual([[0, 0], [0, 3], [3, 3], [3, 0]]);
  });

  it('turns a cell clockwise', () => {
    const grille = new Grille(4);
    expect(grille.getRotation(0, 1, 0)).toEqual([0, 1]);
    expect(grille.getRotation(0, 1, 1)).toEqual([1, 3]);
    expect(grille.getRotation(0, 1, 2)).toEqual([3, 2]);
    expect(grille.getRotation(0, 1, 3)).toEqual([2, 0]);
    expect(grille.getRotation(0, 1, 4)).toEqual([0, 1]);
  });

  it('keeps the center of an odd grille in place', () => {
    expect(new Grille(5).getRotations(2, 2)).toEqual([[2, 2], [2, 2], [2, 2], [2, 2]]);
  });

  it('has a center cell only when odd', () => {
    expect(new Grille(5).isCenterCell(2, 2)).toBe(true);
    expect(new Grille(5).isCenterCell(2, 3)).toBe(false);
    expect(new Grille(5).isCenterCell(1, 1)).toBe(false);
    expect(new Grille(4).isCenterCell(2, 2)).toBe(false);
    expect(new Grille(4).isCenterCell(1, 1)).toBe(false);
  });

  it('has a quarter of usable cells as holes', () => {
    expect(new Grille(2).desiredPresets()).toBe(1);
    expect(new Grille(3).desiredPresets()).toBe(2);
    expect(new Grille(4).desiredPresets()).toBe(4);
    expect(new Grille(5).desiredPresets()).toBe(6);
    expect(new Grille(6).desiredPresets()).toBe(9);
  });

  it('goes to the next cell row by row and skips the center', () => {
    const grille = new Grille(5);
    expect(grille.nextCell(0, 0)).toEqual([0, 1]);
    expect(grille.nextCell(0, 4)).toEqual([1, 0]);
    expect(grille.nextCell(2, 1)).toEqual([2, 3]);
    // Row equal to size means there is no next cell
    expect(grille.nextCell(4, 4)).toEqual([5, 0]);
    expect(new Grille(4).nextCell(1, 1)).toEqual([1, 2]);
  });

  it('goes back to the previous cell and skips the center', () => {
    const grille = new Grille(5);
    expect(grille.prevCell(0, 1)).toEqual([0, 0]);
    expect(grille.prevCell(1, 0)).toEqual([0, 4]);
    expect(grille.prevCell(2, 3)).toEqual([2, 1]);
    // Negative row means there is no previous cell
    expect(grille.prevCell(0, 0)).toEqual([-1, 4]);
  });

  it('reads text through the turning grille', () => {
    const letters = rows('SPEE', 'LMEJ', 'UDEE', '_KSA');
    const holes: [number, number][] = [[0, 0], [0, 2], [1, 3], [2, 1]];
    const grille = new Grille(4);
    expect(grille.read(letters, holes, 0)).toBe('SEJD');
    expect(grille.read(letters, holes, 1)).toBe('EMES');
    expect(grille.read(letters, holes, 2)).toBe('EUKA');
    expect(grille.read(letters, holes, 3)).toBe('PLE_');
  });

  it('reads empty cells as underscore', () => {
    const letters = [['A', ''], ['', 'D']];
    expect(new Grille(2).read(letters, [[0, 0]], 0)).toBe('A');
    expect(new Grille(2).read(letters, [[0, 0]], 1)).toBe('_');
    expect(new Grille(2).read(letters, [[0, 0]], 2)).toBe('D');
  });

  it('reads holes row by row regardless of their order', () => {
    expect(new Grille(2).read(rows('AB', 'CD'), [[1, 1], [0, 0]], 0)).toBe('AD');
  });
});
