import re
from itertools import groupby
from typing import List, NamedTuple

import unidecode
from haversine import Unit, haversine


class Feature(NamedTuple):
    cleaned_name: str
    name: str
    lat: float
    lon: float

    def __str__(self):
        return f'{self.cleaned_name}:{self.name};{self.lat};{self.lon}'

    def distance(self, other) -> float:
        return haversine((self.lat, self.lon), (other.lat, other.lon), unit=Unit.METERS)


def save_cbmap(features_to_write: List[Feature], file_name: str):
    with open(f'{file_name}.cbmap', 'w', encoding="utf-8") as f:
        print(f'Saving {len(features_to_write)} features for {file_name}')
        f.write('\n'.join(str(l) for l in features_to_write))


pattern = re.compile('[\W_]+')
with open('osm_parser/cz.cbmap', encoding="utf-8") as fp:
    lines = fp.readlines()

features = []
for line in lines:
    split = line.strip().split(';')
    name = ';'.join(split[0:len(split)-2])
    lat, lon = (float(c) for c in split[-2:])
    cleared = pattern.sub('', name.lower())
    unaccented = unidecode.unidecode(cleared)
    features.append(Feature(unaccented, name, lat, lon))

sorted_features = sorted(features)
filtered_features = []
# Filter out close entries with same names
print(f'Got {len(sorted_features)} features. Filtering close features...')
for key, group in groupby(sorted_features, key=lambda x: x.cleaned_name):
    features_to_filter = list(group)
    features_far_apart = [features_to_filter[0]]
    for feature in features_to_filter[1:]:
        for accepted_feature in features_far_apart:
            if feature.distance(accepted_feature) < 500:
                break
        else:
            features_far_apart.append(feature)
    filtered_features.extend(features_far_apart)

print(f'Got {len(filtered_features)} features after filtering')

save_cbmap(filtered_features, 'Czechia')

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
    for feature in filtered_features:
        if (city['min_lat'] <= feature.lat <= city['max_lat']
                and city['min_lon'] <= feature.lon <= city['max_lon']):
            city_lines.append(feature)

    save_cbmap(city_lines, city['name'])
