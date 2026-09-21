"""Creates word lists of base forms of Czech words from the MorfFlex CZ dictionary.

MorfFlex is a `lemma<TAB>tag<TAB>form` file with a line for every form of every word. Only lemmas,
the base forms, are taken from it. Two lists are made, one of all the words and one of common
nouns: abbreviations, proper names and words marked with a style (colloquial, archaic, vulgar...)
are left out of it. Each list is saved twice, sorted regardless of case in both cases, with
the number of words on the first line:
  - `.cbdict` - one word per line
  - `.cbfcdict` - one front coded word per line, see common/front_coding.py for the format
"""
import argparse
import re
import time
from pathlib import Path

from common.front_coding import front_code, save_lines, sort_key

# Relative to utils/, where the script is run from
OUTPUT_DIR = Path('data/cz_dict/output')

# Lemma is followed by technical suffixes: number telling lemmas of the same spelling apart and
# comments starting with _ or `, e.g. stát-1_^(státní_útvar), Praha_;G
LEMMA = re.compile(r'^(.+?)(?:-\d+)?(?:[_`].*)?$')

# Part of speech is the first character of the tag
NOUN = 'N'
# Not words: abbreviations, foreign words, single letters, segments of compound words, punctuation
SKIPPED_POS = frozenset('BFQSZ')

# Comments of lemmas that are left out of nouns:
#   _:B - abbreviation
#   _;? - proper name: Y given name or surname, S surname, E inhabitant, G geographical, K company,
#         R product, m other, U mostly latin names of genera and drugs. Other letters are fields
#         of terminology, of those only o (colour) is actually used
#   _,? - style: a archaic, e expressive, h colloquial, i distorted, l slang, n dialect, s bookish,
#         v vulgar
SKIPPED_NOUN = re.compile(r'_(?::B|;[YSEGKRmU]|,.)')


def parse_morfflex(path: Path) -> tuple[list[str], list[str]]:
    nouns: set[str] = set()
    words: set[str] = set()
    previous = None
    # Read as bytes, only the few lines that are actually used are worth decoding
    with open(path, 'rb') as f:
        for line in f:
            # Forms of a lemma follow each other, all but the first one of each part of speech are skipped
            lemma_and_pos = line[:line.index(b'\t') + 2]
            if lemma_and_pos == previous:
                continue
            previous = lemma_and_pos

            pos = chr(lemma_and_pos[-1])
            if pos in SKIPPED_POS:
                continue
            lemma = lemma_and_pos[:-2].decode('utf-8')
            word = LEMMA.match(lemma).group(1)
            words.add(word)
            # Not every proper name is marked, but common nouns are never written with an upper case letter.
            # A word of several meanings is left out only when all of them are
            if pos == NOUN and not SKIPPED_NOUN.search(lemma) and word == word.lower():
                nouns.add(word)

    print(f'Got {len(nouns)} nouns, {len(words)} words in total')
    return sorted(nouns, key=sort_key), sorted(words, key=sort_key)


def save_words(words: list[str], path: Path):
    save_lines(words, path.with_name(path.name + '.cbdict'))
    save_lines(front_code(words), path.with_name(path.name + '.cbfcdict'))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('input', type=Path,
                        help='MorfFlex CZ .tsv file to parse. Results are saved to the output directory, '
                             'nouns with _nouns suffix and all the words with _all suffix')
    parser.add_argument('-o', '--output-dir', type=Path, default=OUTPUT_DIR,
                        help='directory to save the results to (default: %(default)s)')
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / args.input.name.removesuffix('.tsv')

    start = time.perf_counter()
    nouns, words = parse_morfflex(args.input)
    save_words(nouns, output.with_name(output.name + '_nouns'))
    save_words(words, output.with_name(output.name + '_all'))
    print(f'Computation took: {time.perf_counter() - start:.1f} seconds')


if __name__ == '__main__':
    main()
