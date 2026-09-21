"""Converts .canon dictionaries of the app to word lists.

A .canon file has a `cleanedkey:word` line for every word. Keys are left out, as they can be made
from the words, and words are sorted regardless of case. The same word is kept just once. Each
list is saved twice, with the number of words on the first line in both cases:
  - `.cbdict` - one word per line
  - `.cbfcdict` - one front coded word per line, see common/front_coding.py for the format
"""
import argparse
import time
from pathlib import Path

from common.front_coding import front_code, save_lines, sort_key

# Relative to utils/, where the script is run from
OUTPUT_DIR = Path('data/cz_dict/output')


def parse_canon(path: Path) -> list[str]:
    words: set[str] = set()
    n_lines = 0
    # Line ends of .canon files differ, all of them are taken as \n when read as a text
    with open(path, encoding='utf-8') as f:
        for line in f:
            # The key ends with the first colon, same as in the app
            _, separator, word = line.rstrip('\n').partition(':')
            if not separator or not word:
                continue
            n_lines += 1
            words.add(word)

    print(f'Got {len(words)} words from {n_lines} lines of {path}')
    return sorted(words, key=sort_key)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('input', type=Path, nargs='+',
                        help='.canon files to convert. Results are saved to the output directory '
                             'with .cbdict and .cbfcdict (front coded) extensions')
    parser.add_argument('-o', '--output-dir', type=Path, default=OUTPUT_DIR,
                        help='directory to save the results to (default: %(default)s)')
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    start = time.perf_counter()
    for path in args.input:
        output = args.output_dir / path.name.removesuffix('.canon')
        words = parse_canon(path)
        save_lines(words, output.with_name(output.name + '.cbdict'))
        save_lines(front_code(words), output.with_name(output.name + '.cbfcdict'))
    print(f'Computation took: {time.perf_counter() - start:.1f} seconds')


if __name__ == '__main__':
    main()
