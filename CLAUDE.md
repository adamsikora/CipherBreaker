# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Android app (Kotlin) of helper tools for Puzzle Hunts. Single Gradle module `:app`, plus `utils/` — offline Python tooling that generates the map and dictionary assets.

## Build & test

Verify every change to the app with Gradle and report the result. There is no `java` on PATH, so point `JAVA_HOME` at the JDK bundled with Android Studio, the same one the IDE builds with:

```
JAVA_HOME="C:/Program Files/Android/Android Studio2/jbr" ./gradlew testDebugUnitTest assembleDebug --console=plain
```

- Allowed tasks: `testDebugUnitTest`, `assembleDebug`, `assembleRelease`, `lintDebug`. `assembleRelease` only checks that the release variant builds, its APK is not what gets published. Add `--offline` if a dependency download fails, everything already used is cached.
- Never run `bundleRelease` or anything publishing — release bundles are made and uploaded by the user, see Releasing.
- Running the app and checking how it looks and behaves is still done by the user in Android Studio. Say what was and was not verified.

Unit tests are JUnit 4, plain JVM tests (no Robolectric, no mocking library) in `app/src/test/java/cz/civilizacehra/cipherbreaker/`, one `<Class>Test.kt` per tested file. Only code that does not touch the Android framework can be tested this way, so keep logic worth testing out of Activities — it lives in `internal` objects/classes next to them (`NumberAnalysis`, `Azimuth`, `Playfair`, `Grille`, `BaseReader`, `Dictionary`). There are no instrumented tests.

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

`utils/` is a uv project (Python 3.14, dependencies in `pyproject.toml`) with one package per kind of asset in `src/<package>/`, each listed in `module-name` under `[tool.uv.build-backend]`. Run everything from that directory. Data of a package lives in `data/<package>/input/` and `data/<package>/output/`, contents of both are gitignored.

- `map` — map assets, see below.
- `cz_dict` — Czech word lists. `uv run parse-morfflex data/cz_dict/input/czech-morfflex-2.1.tsv` (`src/cz_dict/parse_morfflex.py`) takes base forms of words from the [MorfFlex CZ](https://hdl.handle.net/11234/1-5833) dictionary (CC BY-NC-SA) and writes `<input>_all` (all the words) and `<input>_nouns` (common nouns only — no abbreviations, proper names or style-marked words) lists to `data/cz_dict/output/`, sorted regardless of case, each as `.cbdict` (one word per line) and `.cbfcdict` (front coded words with case kept in the leading letter, format is described in the script's docstring), both with the word count on the first line. The app does not read either of them yet.

### Map asset pipeline

Regenerating `Czechia.cbmap`, the only map asset — see @utils/README.md for the full flow:

1. Download an `.osm.pbf` extract from Geofabrik into `utils/data/map/input/`.
2. Run `uv run parse-osm data/map/input/<extract>.osm.pbf` (`src/map/parse_osm.py`). It writes `data/map/output/<extract>_raw.cbmap` (parsed `Display Name;lat;lon` lines before postprocessing) and `data/map/output/<extract>.cbmap` (keys added, same-name features within 500 m deduplicated); `-o` changes the output directory.
3. Copy the resulting `.cbmap` into `app/src/main/assets/` as `Czechia.cbmap` and update its line count in the `DictInfo` list in `PresmyslovnikActivity.kt` (the script prints the number of saved features).

`.cbmap` and `.canon` assets are newline-separated text with no header, one record per line: `cleanedkey:Display Name` for dictionaries, `cleanedkey:Display Name;lat;lon` for maps. The key is `unidecode`d, lowercased, non-alphanumerics stripped.

## Commits

Short imperative subject, capitalized, no trailing period, no type/scope prefix and no issue references — e.g. `Target API 37`, `Implement Playfair`, `Fix crash during factorization of large numbers`.
