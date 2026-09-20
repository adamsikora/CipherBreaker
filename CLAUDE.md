# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Android app (Kotlin) of helper tools for Puzzle Hunts. Single Gradle module `:app`, plus `utils/map/` — offline Python tooling that generates the map assets.

## Build & test

Don't invoke Gradle. Building, running and testing the app is done by the user in Android Studio — make the code changes and let them verify.

Unit tests are JUnit 4, plain JVM tests (no Robolectric, no mocking library) in `app/src/test/java/cz/civilizacehra/cipherbreaker/`, one `<Class>Test.kt` per tested file. Only code that does not touch the Android framework can be tested this way, so keep logic worth testing out of Activities — it lives in `internal` objects/classes next to them (`NumberAnalysis`, `Azimuth`, `Playfair`, `Grille`, `BaseReader`, `Dictionary`). There are no instrumented tests.

Running the tests:

- The user runs them in Android Studio (right-click `app/src/test` → Run Tests) or with `./gradlew testDebugUnitTest`.
- Claude runs them after every Kotlin change without Gradle, and says so in the summary:
  1. Compile the needed main sources together with the tests using the Kotlin compiler bundled with Android Studio (`<Android Studio>/plugins/Kotlin/kotlinc/lib`): `java -cp kotlin-preloader.jar org.jetbrains.kotlin.preloading.Preloader -cp kotlin-compiler.jar org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -jvm-target 17 -cp <classpath>;kotlin-stdlib.jar -d <out> <sources>`.
  2. Classpath comes from `~/.gradle/caches/modules-2/files-2.1` (junit, hamcrest-core, kotlinx-coroutines-core-jvm; `classes.jar` extracted from the play-services-maps, play-services-basement and androidx.core AARs for `Utils.kt`) plus `android.jar` of the compile SDK.
  3. Run `java -cp <out>;kotlin-stdlib.jar;<classpath> org.junit.runner.JUnitCore cz.civilizacehra.cipherbreaker.<Name>Test ...`.
  4. Type-check the whole app the same way: generate a stub `R.kt` from the `R.<type>.<name>` references in the sources and put `classes.jar` of every cached androidx/gms AAR on the classpath.

  This validates the Kotlin code only — not resources, the manifest or the Gradle build, which the user still verifies.

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
