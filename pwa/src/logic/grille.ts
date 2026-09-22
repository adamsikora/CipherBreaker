// Geometry of a square turning grille. Cells are addressed as [row, column]. Port of Grille.kt

export type Cell = [number, number];

export class Grille {
  constructor(readonly size: number) {}

  /** Position of the cell after the grille is turned clockwise by given number of quarter turns. */
  getRotation(i: number, j: number, rotation: number): Cell {
    switch (rotation % 4) {
      case 0: return [i, j];
      case 1: return [j, this.size - i - 1];
      case 2: return [this.size - i - 1, this.size - j - 1];
      default: return [this.size - j - 1, i];
    }
  }

  getRotations(i: number, j: number): Cell[] {
    return [0, 1, 2, 3].map(rot => this.getRotation(i, j, rot));
  }

  // Center of odd sized grille turns onto itself, so it can not be used
  isCenterCell(i: number, j: number): boolean {
    return this.size % 2 === 1 && i === j && 2 * i + 1 === this.size;
  }

  /** Row equal to size means there is no next cell. */
  nextCell(i: number, j: number): Cell {
    let nextJ = (j + 1) % this.size;
    const nextI = nextJ === 0 ? i + 1 : i;
    if (this.isCenterCell(nextI, nextJ)) nextJ += 1;
    return [nextI, nextJ];
  }

  /** Negative row means there is no previous cell. */
  prevCell(i: number, j: number): Cell {
    let prevJ = (j - 1 + this.size) % this.size;
    const prevI = j === 0 ? i - 1 : i;
    if (this.isCenterCell(prevI, prevJ)) prevJ -= 1;
    return [prevI, prevJ];
  }

  // Number of holes needed for every usable cell to be read exactly once
  desiredPresets(): number {
    let desiredPresets = this.size * this.size;
    if (this.size % 2 === 1) desiredPresets -= 1;
    return Math.floor(desiredPresets / 4);
  }

  /**
   * Reads letters through the holes of the grille turned by given number of quarter turns,
   * row by row. Empty cells are read as "_".
   */
  read(letters: string[][], holes: Cell[], rotation: number): string {
    const indices = holes.map(([i, j]) => this.getRotation(i, j, rotation));
    indices.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let text = '';
    for (const [i, j] of indices) {
      const char = letters[i][j];
      text += char === '' ? '_' : char;
    }
    return text;
  }
}
