# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Android app (Kotlin) of helper tools for Puzzle Hunts. Single Gradle module `:app`, plus `utils/map/` — offline Windows tooling that generates the map assets.

## Build & test

Don't invoke Gradle. Building, running and testing the app is done by the user in Android Studio — make the code changes and let them verify.

## Code style

No formatter or linter config in the repo — match the surrounding file.

- Kotlin only for app code; no Java.
- XML layouts with `findViewById`, held as `private val x by lazy { findViewById<T>(R.id.x) }`. No Compose, no view binding, no data binding.
- Activities extend `android.app.Activity`, not `AppCompatActivity`, even though appcompat is a dependency.
- Non-Activity helpers are `internal`. Flat package `cz.civilizacehra.cipherbreaker`, no subpackages.
- C++ (`app/src/main/cpp/`, `utils/map/osm_parser/`) uses tabs; C++14.
- Custom named styles live in `res/values/styles.xml` and are applied via `style="@style/..."`.

## Releasing

Version lives in three places that must stay in sync: `about_version` in `app/src/main/res/values/strings.xml`, and `versionCode` + `versionName` in `app/build.gradle`. Version bumps get their own commit. Release bundles are generated and uploaded to the Play Console manually — see @README.md.

## Map asset pipeline (`utils/map/`)

Regenerating `Czechia.cbmap` / `Prague.cbmap` / `Brno.cbmap` — see @utils/map/README.md for the full flow:

1. Build `utils/map/osm_parser.sln` (MSVC, toolset v141) and run the EXE. Its input OSM path and `cz.cbmap` output name are hardcoded in `osm_parser/main.cpp`.
2. Run `postprocess_parsed_map.py` from `utils/map/`. Needs `pip install unidecode haversine` (no requirements file).
3. Copy the resulting `.cbmap` files into `app/src/main/assets/`.

`.cbmap` and `.canon` assets are newline-separated text with no header, one record per line: `cleanedkey:Display Name` for dictionaries, `cleanedkey:Display Name;lat;lon` for maps. The key is `unidecode`d, lowercased, non-alphanumerics stripped.

## Commits

Short imperative subject, capitalized, no trailing period, no type/scope prefix and no issue references — e.g. `Target API 37`, `Implement Playfair`, `Fix crash during factorization of large numbers`.
