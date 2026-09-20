"""Creates word lists of base forms of Czech words from the MorfFlex CZ dictionary.

MorfFlex is a `lemma<TAB>tag<TAB>form` file with a line for every form of every word. Only lemmas,
the base forms, are taken from it. Two lists are made, one of all the words and one of common
nouns: abbreviations, proper names and words marked with a style (colloquial, archaic, vulgar...)
are left out of it. Each list is saved twice, sorted regardless of case in both cases, with
the number of words on the first line:
  - `.cbdict` - one word per line
  - `.cbfcdict` - one front coded word per line. Such a line starts with a letter, the number of
    leading characters the word shares with the previous one (a = 0, b = 1, ...), the rest of
    the word follows: `abeceda`, `abecedně`, `abecední` -> `aabeceda`, `gně`, `hí`.

    Words are front coded in lower case. Most of the words with an upper case letter have just
    the first one, it costs them nothing: the leading letter is in upper case then and the first
    character of the decoded word is to be made upper case, `Praha`, `prahnout`, `Prahy` ->
    `Apraha`, `enout`, `Ey`. Other words start with = and the rest of the line is in its original
    case. Only characters in front of the first one that is not in lower case are shared by them:
    `ion`, `iPhone` -> `aion`, `=bPhone`.
"""
import argparse
import re
import time
from pathlib import Path

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

# Number of shared characters has to fit into a letter
MAX_SHARED = ord('z') - ord('a')
ORIGINAL_CASE = '='


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


def sort_key(word: str) -> tuple[str, str]:
    # The word itself keeps the order of the words that differ just in case stable
    return word.lower(), word


def shared_length(a: str, b: str) -> int:
    """Length of the prefix the strings have in common."""
    return next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))


def front_code(words: list[str]) -> list[str]:
    coded = []
    previous = ''
    for word in words:
        lower = word.lower()
        shared = min(shared_length(lower, previous), MAX_SHARED)
        if word == lower:
            line = chr(ord('a') + shared) + lower[shared:]
        elif word == lower[0].upper() + lower[1:]:
            line = chr(ord('A') + shared) + lower[shared:]
        else:
            shared = min(shared, shared_length(word, lower))
            line = ORIGINAL_CASE + chr(ord('a') + shared) + word[shared:]
        coded.append(line)
        previous = lower
    return coded


def front_decode(lines: list[str]) -> list[str]:
    words = []
    previous = ''
    for line in lines:
        if line[0] == ORIGINAL_CASE:
            word = previous[:ord(line[1]) - ord('a')] + line[2:]
        elif line[0].isupper():
            word = previous[:ord(line[0]) - ord('A')] + line[1:]
            word = word[0].upper() + word[1:]
        else:
            word = previous[:ord(line[0]) - ord('a')] + line[1:]
        words.append(word)
        previous = word.lower()
    return words


def save_lines(lines: list[str], path: Path):
    print(f'Saving {len(lines)} words to {path}')
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join([str(len(lines))] + lines))


def save_words(words: list[str], path: Path):
    save_lines(words, path.with_name(path.name + '.cbdict'))
    coded = front_code(words)
    if front_decode(coded) != words:
        raise ValueError('Front coded words can not be decoded back')
    save_lines(coded, path.with_name(path.name + '.cbfcdict'))


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
