// Playfair cipher. Grid is given as rows of cell contents, only the first character of each cell
// is used. Port of Playfair.kt

function cellLetter(cell: string): string {
  return cell.length > 1 ? cell[0] : cell;
}

/**
 * Returns description of what prevents the text from being processed with the grid,
 * null when there is no such problem.
 */
export function findProblem(grid: string[][], text: string): string | null {
  const letterIndexes = new Map<string, [number, number]>();
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const letter = cellLetter(grid[i][j]);
      if (letter === '') return 'Fill the grid with letters first.';
      if (letterIndexes.has(letter)) return `Symbol "${letter}" is present in grid multiple times.`;
      letterIndexes.set(letter, [i, j]);
    }
  }
  if (text === '') return 'Fill the text to decipher first.';
  if (text.length % 2 !== 0) return 'Length of text must divisible by 2.';
  const letters = [...text];
  for (const letter of letters) {
    if (!letterIndexes.has(letter)) return `Symbol "${letter}" is not present in the grid.`;
  }
  for (let i = 0; i < letters.length / 2; i++) {
    if (letters[2 * i] === letters[2 * i + 1]) return `Two same letters (${letters[2 * i]}) in a pair are not allowed.`;
  }
  return null;
}

/** Encrypts or decrypts the text. Expects that findProblem found nothing. */
export function crypt(grid: string[][], text: string, decrypt: boolean): string {
  const height = grid.length;
  const width = grid[0].length;
  const letterIndexes = new Map<string, [number, number]>();
  const indexLetters = new Map<string, string>();
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const letter = cellLetter(grid[i][j]);
      letterIndexes.set(letter, [i, j]);
      indexLetters.set(`${i},${j}`, letter);
    }
  }
  const at = (i: number, j: number) => indexLetters.get(`${i},${j}`)!;
  const letters = [...text];
  const shift = decrypt ? -1 : 1;
  let result = '';
  for (let i = 0; i < letters.length / 2; i++) {
    const [i1, j1] = letterIndexes.get(letters[2 * i])!;
    const [i2, j2] = letterIndexes.get(letters[2 * i + 1])!;
    if (i1 === i2) {
      result += at(i1, (j1 + shift + width) % width);
      result += at(i2, (j2 + shift + width) % width);
    } else if (j1 === j2) {
      result += at((i1 + shift + height) % height, j1);
      result += at((i2 + shift + height) % height, j2);
    } else {
      result += at(i1, j2);
      result += at(i2, j1);
    }
  }
  return result;
}
