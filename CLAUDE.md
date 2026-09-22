# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Android app (Kotlin) of helper tools for Puzzle Hunts. Single Gradle module `:app`, plus `utils/` — offline Python tooling that generates the map and dictionary assets.

## Build & test

Verify every change to the app with Gradle and report the result:

```
./gradlew testDebugUnitTest assembleDebug --console=plain
```

- There is no `java` on PATH. `JAVA_HOME` is set under `env` in `.claude/settings.local.json` (not in the repo) to the JDK bundled with Android Studio, the same one the IDE builds with: `C:/Program Files/Android/Android Studio2/jbr`. Run the command as it is, alone and without a `JAVA_HOME=...` prefix, pipes or other commands, so that it matches the `Bash(./gradlew:*)` permission rule.

- Allowed tasks: `testDebugUnitTest`, `assembleDebug`, `assembleRelease`, `lintDebug`. `assembleRelease` only checks that the release variant builds, its APK is not what gets published. Add `--offline` if a dependency download fails, everything already used is cached.
- Never run `bundleRelease` or anything publishing — release bundles are made and uploaded by the user, see Releasing.
- Running the app and checking how it looks and behaves is still done by the user in Android Studio. Say what was and was not verified.

Unit tests are JUnit 4, plain JVM tests (no Robolectric, no mocking library) in `app/src/test/java/cz/civilizacehra/cipherbreaker/`, one `<Class>Test.kt` per tested file. Only code that does not touch the Android framework can be tested this way, so keep logic worth testing out of Activities — it lives in `internal` objects/classes next to them (`NumberAnalysis`, `Azimuth`, `Playfair`, `Grille`, `BaseReader`, `Dictionary`, `DictionaryKey`). There are no instrumented tests.

## Code style

No formatter or linter config in the repo — match the surrounding file.

- Kotlin only for app code; no Java.
- XML layouts with `findViewById`, held as `private val x by lazy { findViewById<T>(R.id.x) }`. No Compose, no view binding, no data binding.
- Activities extend `android.app.Activity` (`FragmentActivity` where a map fragment is needed). appcompat is not a dependency, only `androidx.core` and `androidx.fragment`.
- Non-Activity helpers are `internal`. Flat package `cz.civilizacehra.cipherbreaker`, no subpackages.
- Custom named styles live in `res/values/styles.xml` and are applied via `style="@style/..."`.

## Releasing

Version lives in three places that must stay in sync: `about_version` in `app/src/main/res/values/strings.xml`, and `versionCode` + `versionName` in `app/build.gradle`. Version bumps get their own commit. Release bundles are generated and uploaded to the Play Console manually — see @README.md.

## Asset tooling (`utils/`)

`utils/` is a uv project (Python 3.14, dependencies in `pyproject.toml`) with one package per kind of asset in `src/<package>/` and `common` for the code they share, each listed in `module-name` under `[tool.uv.build-backend]`. Run everything from that directory. Data of a package lives in `data/<package>/input/` and `data/<package>/output/`, contents of both are gitignored.

- `map` — map assets, see below.
- `cz_dict` — Czech word lists. `uv run parse-morfflex data/cz_dict/input/czech-morfflex-2.1.tsv` (`src/cz_dict/parse_morfflex.py`) takes base forms of words from the [MorfFlex CZ](https://hdl.handle.net/11234/1-5833) dictionary (CC BY-NC-SA) and writes `<input>_all` (all the words) and `<input>_nouns` (common nouns only — no abbreviations, proper names or style-marked words) lists to `data/cz_dict/output/`, sorted regardless of case, each as `.cbdict` (one word per line) and `.cbfcdict` (front coded words with case kept in the leading letter, format is described in `src/common/front_coding.py`), both with the word count on the first line. `uv run parse-canon data/cz_dict/input/<dict>.canon ...` (`src/cz_dict/parse_canon.py`) converts `.canon` dictionaries copied from the app assets to the same pair of files: keys are dropped, duplicate words removed, words sorted regardless of case. The `en.cbdict` and `*_old.cbdict` assets of the app were made this way, `cs_morfflex_all.cbdict` and `cs_morfflex_nouns.cbdict` are copies of the MorfFlex `_all` and `_nouns` lists.

### Map asset pipeline

`Czechia.cbmap` is the only map asset. Map files are made from OpenStreetMap data — see @utils/README.md for the full flow:

1. Download an `.osm.pbf` extract from Geofabrik into `utils/data/map/input/`.
2. Run `uv run parse-osm data/map/input/<extract>.osm.pbf` (`src/map/parse_osm.py`). It takes named features, removes `;` from their names, deduplicates same-name features within 500 m and writes them sorted by name regardless of case to `data/map/output/` as `<extract>.cbmap` (`Display Name;lat;lon` lines, coordinates with 5 decimal places) and `<extract>.cbfcmap` (the same lines front coded the same way as `.cbfcdict`), both with the feature count on the first line; `-o` changes the output directory.

3. Copy the resulting `.cbmap` into `app/src/main/assets/` as `Czechia.cbmap`.

### Dictionary and map assets

The app reads `.cbdict` dictionaries and the `.cbmap` map from `app/src/main/assets/` (Git LFS), they are listed in `PresmyslovnikActivity.kt`. Both are newline-separated text: number of the entries on the first line (used for the progress bar), then one entry per line, a word for dictionaries and `Display Name;lat;lon` for maps. Entries are searched by a key that is not stored, `DictionaryKey` makes it of every entry during the search: diacritics removed, lowercased, everything but a-z and digits stripped. With the Diacritics checkbox, which only Regex, Hamming and Levenshtein modes have, the key keeps letters with their diacritics, still lowercased and without anything but letters and digits. `parse_osm.py` deduplicates by an `unidecode` based key that differs only for a few names with characters out of Latin script. Front coded `.cbfcdict` and `.cbfcmap` are not read by the app yet.

## PWA (`pwa/`)

A port of the app to a progressive web app with all the tools of the app — the plan and its status are in `pwa/PLAN.md`. TypeScript with no UI framework, built with Vite, tested with Vitest, maps with Leaflet on OpenStreetMap tiles; needs Node 18+ (the machine has Node 24). Every push to `master` that touches `pwa/` is built and deployed to GitHub Pages by `.github/workflows/pages.yml`. Run everything with `npm --prefix pwa <script>` from the repo root, or in `pwa/`:

- `npm test` — Vitest unit tests in `pwa/test/`, one file per logic module, ported from the JUnit tests. `npm run typecheck` runs `tsc`. Verify every change with both.
- `npm run build` — builds to `pwa/dist/` (gitignored) with the service worker, which precaches the page and all the dictionaries so the app works offline from the first load. `npm run preview -- --host 127.0.0.1 --port 4173` serves the build; `npm run dev` is the dev server without the service worker.

Layout: `src/logic/` holds the ported logic (`dictionary-key`, `string-utils`, `front-coding`, `dictionary` = Dictionary + MapDictionary, `base-reader`, `grille`, `playfair`, `number-analysis` with `bigint` for ULong, `azimuth`, `holiday`, `format`), `src/shell/` the app shell (`router` with `#/<tool>` hashes and the `Tool` interface, `dom` with the `h()` element builder, `toast`, `storage` = localStorage counterpart of SharedPreferences, `layout` = fixed settings above a divider with only the results scrolling, `location` = geolocation, `icons` generated from the app's vector drawables), `src/components/` reusable pieces (`endless-rows`, `cell-grid`, `map-view`, `map-picker`), `src/tools/` one module per screen, `src/workers/search-worker.ts` the search off the main thread. `public/assets/` (Git LFS) holds the front coded `.cbfcdict`/`.cbfcmap` files made by `utils/`. Icons and the reader legends are inline SVG, there are no raster images apart from the app icons. Saved state uses the same keys as the app's SharedPreferences, in `localStorage` per tool. The Android app does not use anything from here.

## Commits

Short imperative subject, capitalized, no trailing period, no type/scope prefix and no issue references — e.g. `Target API 37`, `Implement Playfair`, `Fix crash during factorization of large numbers`.
