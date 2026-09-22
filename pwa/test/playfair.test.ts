import { describe, expect, it } from 'vitest';
import { crypt, findProblem } from '../src/logic/playfair';

const grid = (...rows: string[]) => rows.map(row => [...row]);

// The textbook example with key "playfair example"
const classicGrid = grid('PLAYF', 'IREXM', 'BCDGH', 'KNOQS', 'TUVWZ');
const smallGrid = grid('ABC', 'DEF');

describe('Playfair', () => {
  it('encrypts the classic example', () => {
    expect(findProblem(classicGrid, 'HIDETHEGOLDINTHETREXESTUMP')).toBeNull();
    expect(crypt(classicGrid, 'HIDETHEGOLDINTHETREXESTUMP', false)).toBe('BMODZBXDNABEKUDMUIXMMOUVIF');
  });

  it('decrypts the classic example', () => {
    expect(crypt(classicGrid, 'BMODZBXDNABEKUDMUIXMMOUVIF', true)).toBe('HIDETHEGOLDINTHETREXESTUMP');
  });

  it('wraps rows and columns around', () => {
    // AB shares a row, AD a column and CF the last column
    expect(crypt(smallGrid, 'ABADCF', false)).toBe('BCDAFC');
    expect(crypt(smallGrid, 'ABADCF', true)).toBe('CADAFC');
  });

  it('swaps columns of a rectangle', () => {
    expect(crypt(smallGrid, 'AE', false)).toBe('BD');
    expect(crypt(smallGrid, 'AE', true)).toBe('BD');
  });

  it('uses only the first character of a cell', () => {
    const cells = [['Ax', 'B', 'C'], ['D', 'E', 'F']];
    expect(findProblem(cells, 'AE')).toBeNull();
    expect(crypt(cells, 'AE', false)).toBe('BD');
  });

  it('reports grid problems', () => {
    expect(findProblem([['A', ''], ['C', 'D']], 'AC')).toBe('Fill the grid with letters first.');
    expect(findProblem(grid('AB', 'CA'), 'AB')).toBe('Symbol "A" is present in grid multiple times.');
  });

  it('reports text problems', () => {
    expect(findProblem(smallGrid, '')).toBe('Fill the text to decipher first.');
    expect(findProblem(smallGrid, 'ABC')).toBe('Length of text must divisible by 2.');
    expect(findProblem(smallGrid, 'AX')).toBe('Symbol "X" is not present in the grid.');
    expect(findProblem(smallGrid, 'BCAA')).toBe('Two same letters (A) in a pair are not allowed.');
  });

  it('allows the same letters in different pairs', () => {
    expect(findProblem(smallGrid, 'BAAC')).toBeNull();
  });
});
