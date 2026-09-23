# CLAUDE.md

Guidance for Claude Code in this repository. What the apps are and how they are built, run and
released is in @README.md and @utils/README.md; this file holds what is not obvious from there or
from the code.

## Project

Helper tools for Puzzle Hunts. The progressive web app in `pwa/` is the main application. The
Android app in `app/` is deprecated since September 2026: it stays published and buildable, but gets
only fixes and the label and tool name changes that keep it in line with the PWA. `utils/` generates
the dictionary and map assets of both.

## Permissions

Bash commands are matched against the allow rules and the read block as typed, so run `./gradlew`,
`npm` and `git` bare: from the repo root, without a `cd`, an environment prefix, pipes or other
commands chained to them. `JAVA_HOME` for Gradle is set under `env` in `.claude/settings.local.json`
(not in the repo) to the JDK bundled with Android Studio.

## PWA (`pwa/`)

Verify every change with `npm test --prefix pwa`, `npm run typecheck --prefix pwa` and
`npm run build --prefix pwa` and report the results. The look and behaviour can be checked in Chrome
on `npm run preview --prefix pwa -- --host 127.0.0.1 --port 4173`; unregister the service worker of
the previous build first, or the page keeps coming from its cache. Phones are tested by the user,
say what was and was not verified.

- `src/logic/` is the logic ported from the Android app, one module per Kotlin file, tested in
  `test/` by ports of the JUnit tests. Keep logic out of `src/tools/` (one module per screen), it is
  what gets tested. `src/shell/` is the app shell: hash router with the `Tool` interface, the `h()`
  element builder, toast, `storage` over localStorage, `layout` with fixed settings above scrolling
  results, geolocation, icons. `src/components/` are reusable pieces, `src/workers/` the search off
  the main thread.
- Saved state uses the keys of the Android app's SharedPreferences, in `localStorage` per tool.
- Icons and legends are inline SVG generated from the app's vector drawables; no raster images apart
  from the app icons.
- Installed apps update through the service worker after every deployment, a version bump is not
  needed for that. The About version comes from `package.json`; bump it with the lock file in a
  commit of its own.

## Android app (`app/`)

Verify every change with `./gradlew testDebugUnitTest assembleDebug --console=plain` and report the
result. Also allowed: `assembleRelease` (a build check only, its APK is not published) and
`lintDebug`; add `--offline` if a download fails. Never run `bundleRelease` or anything publishing,
releases are made by the user. Running the app is done by the user in Android Studio, say what was
and was not verified.

- Unit tests are plain JVM JUnit 4 in `app/src/test/`, one `<Class>Test.kt` per tested file, no
  Robolectric, mocking or instrumented tests. Keep logic worth testing out of Activities, in the
  `internal` objects and classes next to them.
- Kotlin only. XML layouts with `findViewById`, held as `private val x by lazy { ... }`; no Compose,
  view binding or data binding. Activities extend `android.app.Activity` (`FragmentActivity` for a
  map); only `androidx.core` and `androidx.fragment`, no appcompat. Flat package, no subpackages.
  Named styles in `res/values/styles.xml`.
- The version is in three places that must stay in sync: `about_version` in `strings.xml`,
  `versionCode` and `versionName` in `app/build.gradle`; the PWA has its own in `pwa/package.json`,
  see above. Version bumps get their own commit.

## Assets

Both apps list their dictionaries in the dictionary screen (`src/tools/dictionary.ts`,
`PresmyslovnikActivity.kt`); the files are Git LFS. Entries are searched by a key made of every
entry during the search and not stored: diacritics removed, lowercased, everything but a-z and
digits stripped. With the Diacritics checkbox (Regex, Hamming and Levenshtein modes only) letters
keep their diacritics. `parse_osm.py` deduplicates by an `unidecode` based key that differs only for
a few names out of Latin script.

## Style

No formatter or linter for the code, match the surrounding file. Markdown is wrapped at 100 columns
(`.editorconfig`, `.prettierrc`); run `npm run format:md --prefix pwa` after editing a `.md` file.

## Commits

Directly on `master`. Short imperative subject, capitalized, no trailing period, no type/scope
prefix and no issue references — e.g. `Target API 37`, `Implement Playfair`,
`Fix crash during factorization of large numbers`.
