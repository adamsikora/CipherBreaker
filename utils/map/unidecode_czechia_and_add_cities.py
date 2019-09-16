import re
from typing import List

import unidecode as unidecode


def save_cbmap(lines_to_write: List[str], file_name: str):
    with open(f'{file_name}.cbmap', 'w', encoding="utf-8") as f:
        print(f'Saving {len(lines_to_write)} lines for {file_name}')
        f.write(''.join(lines_to_write))


pattern = re.compile('[\W_]+')
with open('osm_parser/cz.cbmap', encoding="utf-8") as fp:
    lines = fp.readlines()

corrected_lines = []
for line in lines:
    split = line.split(';')
    name = ';'.join(split[0:len(split)-2]).lower()
    cleared = pattern.sub('', name)
    unaccented = unidecode.unidecode(cleared)
    corrected_lines.append(f'{unaccented}:{line}')

sorted_lines = sorted(corrected_lines)
save_cbmap(sorted_lines, 'Czechia')

# Bounding boxes around cities were handpicked in open street maps
cities = [
    {
        "name": "Prague",
        "min_lat": 49.9397,
        "max_lat": 50.1813,
        "min_lon": 14.2122,
        "max_lon": 14.7162,
    },
    {
        "name": "Brno",
        "min_lat": 49.1006,
        "max_lat": 49.3106,
        "min_lon": 16.4249,
        "max_lon": 16.7360,
    },
]

for city in cities:
    city_lines = []
    for line in sorted_lines:
        split = line.strip().split(';')
        lat, lon = (float(c) for c in split[-2:])
        if (city['min_lat'] <= lat <= city['max_lat']
                and city['min_lon'] <= lon <= city['max_lon']):
            city_lines.append(line)

    save_cbmap(city_lines, city['name'])
