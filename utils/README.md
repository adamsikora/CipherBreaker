Offline tooling that makes the dictionary and map assets of the apps, a uv project (Python 3.14).
Run everything from this directory. The web app reads the front coded `.cbfcdict` and `.cbfcmap`
files from `pwa/public/assets/`, the Android app the plain `.cbdict` and `.cbmap` files from
`app/src/main/assets/`.

## Map

1. Download map in .osm.pbf format from: http://download.geofabrik.de/europe/czech-republic.html
2. Put it to data/map/input/
3. Run `uv run parse-osm data/map/input/czech-republic-latest.osm.pbf`, it creates in
   data/map/output/ named features without the close ones of the same name, sorted by name
   regardless of case, with the number of features on the first line as:
   - czech-republic-latest.cbmap - one `name;lat;lon` feature per line, names are without
     semicolons, coordinates have 5 decimal places
   - czech-republic-latest.cbfcmap - the same lines front coded, the same way as .cbfcdict below

4. Copy czech-republic-latest.cbfcmap to pwa/public/assets/ as Czechia.cbfcmap, and
   czech-republic-latest.cbmap to app/src/main/assets/ as Czechia.cbmap for the Android app

## Czech dictionary

1. Download MorfFlex CZ from: https://hdl.handle.net/11234/1-5833
2. Unpack it to data/cz_dict/input/
3. Run `uv run parse-morfflex data/cz_dict/input/czech-morfflex-2.1.tsv`, it creates in
   data/cz_dict/output/ lists of base forms of all the words (czech-morfflex-2.1_all) and of common
   nouns (czech-morfflex-2.1_nouns, without abbreviations, proper names and words marked as
   colloquial, archaic, vulgar...), sorted regardless of case, each with the number of words on the
   first line as:
   - .cbdict - one word per line
   - .cbfcdict - front coded words: a letter with the number of characters shared with the previous
     word (a = 0, b = 1, ...) and the rest of the word in lower case. The letter is in upper case
     when the first letter of the word is. Words with other upper case letters start with = and are
     in their original case, see src/common/front_coding.py for details

4. Copy the `_all` and `_nouns` lists to the assets: `.cbfcdict` to pwa/public/assets/ as
   cs.cbfcdict and cs_nouns.cbfcdict, `.cbdict` to app/src/main/assets/ as cs_morfflex_all.cbdict
   and cs_morfflex_nouns.cbdict

### Dictionaries of the app

The English dictionary and the `_old` Czech ones of the Android app were made from .canon files of
`cleanedkey:word` lines, which the app used to read:

1. Put .canon files to data/cz_dict/input/
2. Run `uv run parse-canon data/cz_dict/input/cs.canon data/cz_dict/input/en.canon ...`, for every
   file it creates in data/cz_dict/output/ a list of its words without the keys and without
   duplicates, sorted regardless of case, as .cbdict and .cbfcdict described above
