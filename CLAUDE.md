# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Android app (Kotlin) of helper tools for Puzzle Hunts. Single Gradle module `:app`, plus `utils/map/` — offline Python tooling that generates the map assets.

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

## Map asset pipeline (`utils/map/`)

Regenerating `Czechia.cbmap`, the only map asset — see @utils/map/README.md for the full flow. `utils/map/` is a uv project (Python 3.14, package `map` in `src/map/`, dependencies in `pyproject.toml`); run everything from that directory:

1. Download an `.osm.pbf` extract from Geofabrik into `utils/map/data/` (contents are gitignored).
2. Run `uv run parse-osm data/<extract>.osm.pbf` (`src/map/parse_osm.py`). The input path is the only argument; it writes `data/<extract>_raw.cbmap` (parsed `Display Name;lat;lon` lines before postprocessing) and `data/<extract>.cbmap` (keys added, same-name features within 500 m deduplicated).
3. Copy the resulting `.cbmap` into `app/src/main/assets/` as `Czechia.cbmap` and update its line count in the `DictInfo` list in `PresmyslovnikActivity.kt` (the script prints the number of saved features).

`.cbmap` and `.canon` assets are newline-separated text with no header, one record per line: `cleanedkey:Display Name` for dictionaries, `cleanedkey:Display Name;lat;lon` for maps. The key is `unidecode`d, lowercased, non-alphanumerics stripped.

## Commits

Short imperative subject, capitalized, no trailing period, no type/scope prefix and no issue references — e.g. `Target API 37`, `Implement Playfair`, `Fix crash during factorization of large numbers`.
