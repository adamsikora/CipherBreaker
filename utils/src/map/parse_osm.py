"""Creates map files of named features with their locations from an .osm.pbf file.

Close features of the same name are filtered out of the parsed ones, the rest is saved as
`name;lat;lon` lines sorted by name regardless of case. They are saved twice, with the number
of features on the first line in both cases:
  - `.cbmap` - one feature per line
  - `.cbfcmap` - one front coded feature per line, see common/front_coding.py for the format

Node coordinates are never all held in memory. The file is instead read several times, each pass
filtered inside osmium down to the few objects that are actually needed:
  1. relations - pick the member that will stand for the location of each relation
  2. ways - pick the node that will stand for the location of each named / referenced way
  3. nodes - named nodes are features themselves, referenced nodes provide the coordinates
"""
import argparse
import re
import time
from itertools import groupby
from math import cos, floor, radians
from pathlib import Path
from typing import NamedTuple

import osmium
import unidecode
from haversine import Unit, haversine
from osmium.filter import IdFilter, KeyFilter
from osmium.osm import NODE, RELATION, WAY

from common.front_coding import front_code, save_lines, sort_key

# Objects without any of these tags can never produce a name
NAME_KEYS = ('name', 'ele')

# Features of the same name closer than this are considered to be duplicates
MIN_DISTANCE_METERS = 500
# Size of a cell of the grid used to look the duplicates up, a degree of latitude is over 100 km everywhere
CELL_DEGREES = MIN_DISTANCE_METERS / 100_000

NON_ALPHANUMERIC = re.compile(r'[\W_]+')

# Relative to utils/, where the script is run from
OUTPUT_DIR = Path('data/map/output')


class Feature(NamedTuple):
    name: str
    lat: float
    lon: float

    def __str__(self):
        # 5 decimal places are about a meter
        return f'{self.name};{self.lat:.5f};{self.lon:.5f}'

    def distance(self, other) -> float:
        return haversine((self.lat, self.lon), (other.lat, other.lon), unit=Unit.METERS)


class Ref(NamedTuple):
    type: str  # 'n', 'w' or 'r'
    id: int


def feature_name(tags) -> str | None:
    name = tags.get('name')
    ele = tags.get('ele')
    # Peaks are searchable by their elevation
    if tags.get('natural') == 'peak' and ele:
        name = f'{ele}mnm {name}' if name else f'{ele}mnm'
    # Semicolons separate the fields of a line. Collapse whitespace so that a name can never
    # break the line based output
    return ' '.join(name.replace(';', '').split()) if name else None


def member_priority(member) -> int:
    if member.type == 'n':
        return 31 if member.role in ('admin_centre', 'label') else 30
    if member.type == 'w':
        return 21 if member.role == 'inner' else 20
    return 11 if member.role == 'subarea' else 10


def middle_node(way) -> int | None:
    return way.nodes[len(way.nodes) // 2].ref if len(way.nodes) > 0 else None


def parse_osm(path: Path) -> list[Feature]:
    file = str(path)

    print('Reading relations...')
    relation_refs: dict[int, Ref] = {}
    named_relations: list[tuple[str, int]] = []
    for relation in osmium.FileProcessor(file, RELATION):
        # max returns the first of equally good members
        best = max(relation.members, key=member_priority, default=None)
        if best is None:
            continue
        relation_refs[relation.id] = Ref(best.type, best.ref)
        name = feature_name(relation.tags)
        if name:
            named_relations.append((name, relation.id))

    def resolve_relation(relation_id: int) -> Ref | None:
        """Follows relation -> relation references until a way or a node is reached."""
        ref = Ref('r', relation_id)
        seen = set()
        while ref.type == 'r':
            if ref.id in seen or ref.id not in relation_refs:
                return None
            seen.add(ref.id)
            ref = relation_refs[ref.id]
        return ref

    # Named features whose location is yet to be looked up
    pending: list[tuple[str, Ref]] = []
    for name, relation_id in named_relations:
        ref = resolve_relation(relation_id)
        if ref is not None:
            pending.append((name, ref))
    print(f'Got {len(named_relations)} named relations, {len(named_relations) - len(pending)} have no usable member')

    print('Reading ways...')
    way_nodes: dict[int, int] = {}
    needed_ways = {ref.id for _, ref in pending if ref.type == 'w'}
    for way in osmium.FileProcessor(file, WAY).with_filter(IdFilter(needed_ways)):
        node = middle_node(way)
        if node is not None:
            way_nodes[way.id] = node

    named_ways: list[tuple[str, Ref]] = []
    for way in osmium.FileProcessor(file, WAY).with_filter(KeyFilter(*NAME_KEYS)):
        name = feature_name(way.tags)
        node = middle_node(way)
        if name and node is not None:
            named_ways.append((name, Ref('n', node)))
    print(f'Got {len(named_ways)} named ways')

    # Ways come before relations, same as in the input
    pending = named_ways + [
        (name, Ref('n', way_nodes[ref.id]) if ref.type == 'w' else ref)
        for name, ref in pending
        if ref.type == 'n' or ref.id in way_nodes
    ]

    print('Reading nodes...')
    features: list[Feature] = []
    for node in osmium.FileProcessor(file, NODE).with_filter(KeyFilter(*NAME_KEYS)):
        name = feature_name(node.tags)
        if name and node.location.valid():
            features.append(Feature(name, node.location.lat, node.location.lon))
    print(f'Got {len(features)} named nodes')

    locations: dict[int, tuple[float, float]] = {}
    needed_nodes = {ref.id for _, ref in pending}
    for node in osmium.FileProcessor(file, NODE).with_filter(IdFilter(needed_nodes)):
        if node.location.valid():
            locations[node.id] = (node.location.lat, node.location.lon)

    n_unresolved = 0
    for name, ref in pending:
        if ref.id in locations:
            features.append(Feature(name, *locations[ref.id]))
        else:
            n_unresolved += 1
    # Extracts are cut along a border, so some of the referenced objects are missing
    print(f'{n_unresolved} ways and relations left without location')

    return features


def cleaned_name(name: str) -> str:
    """The key a feature is searched by, names that differ just in what it leaves out are the same."""
    return NON_ALPHANUMERIC.sub('', unidecode.unidecode(name).lower())


def postprocess(features: list[Feature]) -> list[Feature]:
    # Features with nothing to be searched by are left out
    keyed_features = sorted((key, feature) for feature in features if (key := cleaned_name(feature.name)))

    print(f'Got {len(keyed_features)} features. Filtering close features...')
    # Accepted features are kept in a grid, so that a feature is compared only with the ones around it
    # instead of with all of them. Cells are at least MIN_DISTANCE_METERS big in both directions,
    # duplicates are therefore always in the same or in a neighbouring cell. Meridians get closer
    # towards the poles, width of a cell is taken from the latitude where they are the closest.
    max_lat = max((abs(feature.lat) for _, feature in keyed_features), default=0)
    lon_cell_degrees = CELL_DEGREES / cos(radians(min(max_lat + CELL_DEGREES, 89)))

    filtered_features = []
    for _, group in groupby(keyed_features, key=lambda x: x[0]):
        grid: dict[tuple[int, int], list[Feature]] = {}
        for _, feature in group:
            row, col = floor(feature.lat / CELL_DEGREES), floor(feature.lon / lon_cell_degrees)
            if not any(feature.distance(accepted_feature) < MIN_DISTANCE_METERS
                       for r in (row - 1, row, row + 1)
                       for c in (col - 1, col, col + 1)
                       for accepted_feature in grid.get((r, c), ())):
                grid.setdefault((row, col), []).append(feature)
                filtered_features.append(feature)

    print(f'Got {len(filtered_features)} features after filtering')
    return sorted(filtered_features, key=lambda x: (sort_key(x.name), x.lat, x.lon))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('input', type=Path,
                        help='.osm.pbf file to parse. Results are saved to the output directory with .cbmap '
                             'and .cbfcmap (front coded) extensions')
    parser.add_argument('-o', '--output-dir', type=Path, default=OUTPUT_DIR,
                        help='directory to save the results to (default: %(default)s)')
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / args.input.name.removesuffix('.osm.pbf')

    start = time.perf_counter()
    lines = [str(feature) for feature in postprocess(parse_osm(args.input))]
    save_lines(lines, output.with_name(output.name + '.cbmap'))
    save_lines(front_code(lines), output.with_name(output.name + '.cbfcmap'))
    print(f'Computation took: {time.perf_counter() - start:.1f} seconds')


if __name__ == '__main__':
    main()
