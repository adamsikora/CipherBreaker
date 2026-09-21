"""Front coding of sorted lines, each line is stored as what it adds to the previous one.

A coded line starts with a letter, the number of leading characters the line shares with
the previous one (a = 0, b = 1, ...), the rest of the line follows: `abeceda`, `abecedně`,
`abecední` -> `aabeceda`, `gně`, `hí`.

Lines are front coded in lower case. Most of the lines with an upper case letter have just
the first one, it costs them nothing: the leading letter is in upper case then and the first
character of the decoded line is to be made upper case, `Praha`, `prahnout`, `Prahy` ->
`Apraha`, `enout`, `Ey`. Other lines start with = and the rest of the line is in its original
case. Only characters in front of the first one that is not in lower case are shared by them:
`ion`, `iPhone` -> `aion`, `=bPhone`.
"""

# Number of shared characters has to fit into a letter
MAX_SHARED = ord('z') - ord('a')
ORIGINAL_CASE = '='


def sort_key(line: str) -> tuple[str, str]:
    """Sorts regardless of case, which is the order front coding works the best in."""
    # The line itself keeps the order of the lines that differ just in case stable
    return line.lower(), line


def shared_length(a: str, b: str) -> int:
    """Length of the prefix the strings have in common."""
    return next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))


def front_code(lines: list[str]) -> list[str]:
    coded = []
    previous = ''
    for line in lines:
        lower = line.lower()
        shared = min(shared_length(lower, previous), MAX_SHARED)
        if line == lower:
            coded_line = chr(ord('a') + shared) + lower[shared:]
        elif line == lower[0].upper() + lower[1:]:
            coded_line = chr(ord('A') + shared) + lower[shared:]
        else:
            shared = min(shared, shared_length(line, lower))
            coded_line = ORIGINAL_CASE + chr(ord('a') + shared) + line[shared:]
        coded.append(coded_line)
        previous = lower
    if front_decode(coded) != lines:
        raise ValueError('Front coded lines can not be decoded back')
    return coded


def front_decode(coded: list[str]) -> list[str]:
    lines = []
    previous = ''
    for coded_line in coded:
        if coded_line[0] == ORIGINAL_CASE:
            line = previous[:ord(coded_line[1]) - ord('a')] + coded_line[2:]
        elif coded_line[0].isupper():
            line = previous[:ord(coded_line[0]) - ord('A')] + coded_line[1:]
            line = line[0].upper() + line[1:]
        else:
            line = previous[:ord(coded_line[0]) - ord('a')] + coded_line[1:]
        lines.append(line)
        previous = line.lower()
    return lines


def save_lines(lines: list[str], path):
    """Saves the lines with their number on the first line."""
    print(f'Saving {len(lines)} lines to {path}')
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join([str(len(lines))] + lines))
