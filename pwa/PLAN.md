# Plan: porting Cipher Breaker to a PWA

The Android app is 2,838 lines of Kotlin across 10 screens plus 948 lines of unit tests. Only two
parts touch anything harder than forms: the dictionary search (heavy data) and the two map screens.
The app uses no sensors and locks no orientation, so nothing platform-specific is lost.

## 1. Decisions

| Decision | Choice | Why |
|---|---|---|
| Stack | TypeScript, no UI framework, built with Vite | Matches the app's plain-views style; TS types replace Kotlin's; Vite gives bundling, hashing and the service worker precache list (`vite-plugin-pwa`). Needs Node 18+. |
| Structure | One single-page app, `#/tool` routes, one module per tool | Shared shell, toast and header; each tool module exposes `mount(container)` / `unmount()`, like an Activity. |
| Maps | Leaflet with OpenStreetMap tiles | Free, no API key; markers, polylines, fitBounds, long press and pixel↔latlng projection. Tiles need network, as Google Maps does now. |
| Dictionaries | Only the four front-coded files, 25 MB (9 MB gzipped), precached on first load | Done in the prototype. The three `_old` lists (60 MB) are dropped. |
| Tests | Vitest, porting the 11 JUnit files one-to-one | The logic classes are pure; the tests are the spec of the port. |
| Hosting | GitHub Pages, deployed by a GitHub Action | Static files only. Pages does not serve Git LFS content, so the Action checks out with `lfs: true` and copies the assets into the build. |
| Android | Keep the native app; wrap the PWA as a Trusted Web Activity later if the port replaces it | No decision needed until the port is complete. |

## 2. Layout of the result

```
pwa/
  index.html, manifest, icons, sw (generated)
  src/
    shell/       router, header with back button, toast, storage helper, clipboard
    logic/       dictionary-key, string-utils, dictionary, map-dictionary, base-reader,
                 grille, playfair, number-analysis, azimuth, holiday, format
    workers/     search-worker
    tools/       dictionary, binary-reader, ternary-reader, grille-helper, azimuth-finder,
                 name-days, number-analyzer, playfair-helper, about
    components/  cell-grid (Grille + Playfair), endless-rows (readers, number analyzer),
                 map-view (Leaflet wrapper), map-picker
  assets/        cbfcdict/cbfcmap (LFS), holidays.json, legend PNGs
  test/          one file per logic module
```

## 3. Phases

### Phase 0 — Foundation and logic (largest step, no visible screen yet)

- Vite + TypeScript + Vitest in `pwa/`, the prototype keeps working meanwhile.
- Port the logic modules (~1,000 lines): `DictionaryKey`, `StringUtils`, `Dictionary`/`MapDictionary`
  (from the prototype worker), `BaseReader`, `Grille`, `Playfair`, `NumberAnalysis`, `Azimuth`,
  `Holiday`, `Utils` formatting. Port each JUnit file before its module and make it pass.
- Watch for: `NumberAnalysis` uses `ULong` up to 2^64 → `BigInt`; Java vs JS regex differ only in
  exotic syntax; `Collator("cs")` → `Intl.Collator("cs")`; weekday maths → `Date`.
- App shell: menu with the 10 entries in the app's order (Princip Trainer stays an external link),
  router, header, toast, `localStorage` wrapper with the same keys as `SharedPreferences`, service
  worker with precached shell and assets, install prompt handling.

### Phase 1 — Dictionary Searcher

- Move the prototype into the new structure. Add: pick position from a map (Leaflet modal returning
  a coordinate, the only two-way screen), coordinate formatting, saved position.
- Memory: the prototype keeps all keys of every loaded dictionary. Keep at most one dictionary
  decoded at a time and measure on a low-end phone.

### Phase 2 — Simple tools

- About: static page, version from `package.json`.
- Number Analyzer: two selects, endless list of input rows, `<sup>` exponents, `inputmode` switching.
- Name Day Searcher: `holidays.txt` (7 KB) inlined as JSON; four pickers, live regex validation,
  sort switch.

### Phase 3 — Binary and Ternary readers

- One `endless-rows` component (30 rows added when scrolled to the bottom), shared with Number Analyzer.
- Clickable digit cells cycling through values; the platform drawables become small images or CSS
  shapes; copy the `ternary*.png` and `black/white_horizontal.png` legends.
- Ternary: collapsible settings panel with three radio groups and the CH switch.

### Phase 4 — Grille Helper and Playfair Helper

- One `cell-grid` component replacing ~560 lines of duplicated Kotlin: N×M single-letter inputs,
  auto-advance, Enter/Backspace navigation, long press to mark holes (Grille only), colour states,
  cell size from viewport width.
- Grille: size select 4–10, warning line, four rotation readouts. Playfair: width and height selects,
  ciphertext input, live encrypt/decrypt.
- Watch for: virtual keyboards on iOS and Android differ in auto-advance and long press; test early.

### Phase 5 — Azimuth Finder and map picker

- `map-view` wrapper over Leaflet: marker with custom icon, polyline, fitBounds/setZoom, long press
  (Leaflet `contextmenu` plus a touch-hold fallback), rotation off.
- Arrow head: an SVG marker at the destination rotated to the bearing, the line shortened with
  `latLngToLayerPoint`, the same trick the app does with `projection`.
- Current location, copy to clipboard (`navigator.clipboard`), open in mapy.cz link.

### Phase 6 — PWA polish and release

- Real maskable icons, splash colours, `navigator.storage.persist()` so iOS keeps the 25 MB cache,
  update flow (new service worker → "Reload for update" toast).
- Test offline on Android Chrome and iOS Safari installed to the home screen; Lighthouse PWA audit.
- GitHub Action: build, fetch LFS assets, deploy to Pages. Update `README.md` and `CLAUDE.md`.
- Optional afterwards: TWA wrapper for Play, retiring the Android app.

## 4. Order and size

| Phase | Kotlin it replaces | Effort |
|---|---|---|
| 0 Foundation + logic + tests | ~1,000 lines logic, 948 tests | large |
| 1 Dictionary Searcher | 255 + prototype | medium |
| 2 About, Number Analyzer, Name Days | 340 | small |
| 3 Readers | 236 + base | medium |
| 4 Grid editors | 566 | medium–large |
| 5 Maps | 300 | medium |
| 6 Polish, hosting | — | medium |

Phases 2–5 are independent once phase 0 is done: cheapest first, maps last because Leaflet is the
one dependency that may need tuning.

## 5. Risks

- iOS storage: Safari may evict the cache of a site not installed to the home screen after a week
  unused. Installing and `persist()` mitigate it; the dictionaries re-download otherwise (9 MB).
- Memory on low-end phones: 1M decoded words plus keys. Fallback: one big string with offsets and
  keys computed per search, as the app does.
- Map tiles are online-only and OpenStreetMap's tile policy discourages heavy app use; a keyed
  provider (MapTiler, mapy.cz API) may be needed if usage grows.
- Keyboard behaviour in the cell grids on mobile browsers, the part most likely to need iteration.

## 6. Status

- 2026-09-22: plan written. Prototype of the Dictionary Searcher (plain JS, no build) committed.
- 2026-09-22: Phase 0 done — Vite + TypeScript + Vitest set up (Node 24), all logic modules ported
  with 110 tests, app shell (menu with the app's icons, router, toast, storage, service worker
  precaching the dictionaries). Phase 1 mostly done: the Dictionary Searcher tool is ported;
  picking the position from a map is still missing (needs the Leaflet map of phase 5).
- 2026-09-22: Phase 2 done — About, Number Analyzer (with the `endless-rows` component) and
  Name Day Searcher ported and checked in Chrome.
- 2026-09-22: Phase 3 done — Binary and Ternary readers ported (`tools/readers.ts`), legend
  images copied to `public/legend/`. The ternary legend uses the order 1, 3, 2, 4, 5, 6 of the
  app's layout XML, which matches the images; the app's mode listener sets 1–6, which does not.
- 2026-09-22: Phase 4 done — `cell-grid` component (typing advances, Enter/Backspace navigate,
  long press or right click marks holes), Grille Helper and Playfair Helper ported with the app's
  default states and saved-state keys. Keyboard behaviour on phones is untested.
- 2026-09-22: Phase 5 done — `map-view` (Leaflet + OpenStreetMap tiles, long press / right click,
  the app's start marker, the arrow with its head kept over the destination), `map-picker`
  overlay used by the Dictionary Searcher, Azimuth Finder with clipboard and mapy.cz link,
  shared `shell/location`. Long press on touch screens and geolocation are untested here.
- 2026-09-22: Phase 6 — icons made from the app's `icon.png` (plus a maskable one), persistent
  storage requested, GitHub Pages workflow added (`.github/workflows/pages.yml`, Pages source has
  to be set to GitHub Actions once), README and CLAUDE.md updated. Still open: testing on
  phones (offline, installed to the home screen, keyboards in the grids, long press on maps),
  a Lighthouse audit, and the optional TWA wrapper for Play.
