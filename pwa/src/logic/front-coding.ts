// Decoding of front coded lines, the format is described in utils/src/common/front_coding.py:
// a coded line starts with a letter giving the number of leading characters shared with the
// previous line (a = 0, b = 1, ...), in upper case when the first character of the line is;
// lines with other upper case letters start with = and are in their original case.

const ORIGINAL_CASE = '=';

export function frontDecode(coded: string[]): string[] {
  const lines = new Array<string>(coded.length);
  let previous = '';
  for (let i = 0; i < coded.length; i++) {
    const codedLine = coded[i];
    const first = codedLine.charCodeAt(0);
    let line: string;
    if (codedLine[0] === ORIGINAL_CASE) {
      line = previous.slice(0, codedLine.charCodeAt(1) - 97) + codedLine.slice(2);
    } else if (first >= 65 && first <= 90) {
      line = previous.slice(0, first - 65) + codedLine.slice(1);
      line = line[0].toUpperCase() + line.slice(1);
    } else {
      line = previous.slice(0, first - 97) + codedLine.slice(1);
    }
    lines[i] = line;
    previous = line.toLowerCase();
  }
  return lines;
}

/**
 * Decodes the content of a .cbfcdict or .cbfcmap file: the number of the lines is on the first
 * line, the front coded lines follow. Throws when the first line is not a number.
 */
export function decodeFile(text: string): string[] {
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const total = parseInt(lines[0], 10);
  if (!Number.isFinite(total)) throw new Error('Invalid dictionary file');
  return frontDecode(lines.slice(1));
}
