# Cipher Breaker

Helper tools for Puzzle Hunts: dictionary search over Czech and English word lists and a map of
Czechia, binary and ternary decoders, a turning grille, an azimuth calculator, name days, number
analysis and prime factorization, and a Playfair cipher helper. Suggestions and contributions are
welcome.

## Web app

The main application is a progressive web app in `pwa/` (TypeScript, Vite, Leaflet), published at
https://adamsikora.github.io/CipherBreaker/. It works offline once opened and can be installed to
the home screen on Android, iOS and desktop. Every push to `master` that touches `pwa/` deploys it
through `.github/workflows/pages.yml`; Pages has to be set to "GitHub Actions" as the source in the
repository settings. Installed apps update on their own after a deployment, through the service
worker.

Development needs Node 18+:

    cd pwa
    npm install
    npm test            # unit tests
    npm run typecheck
    npm run build       # to pwa/dist/
    npm run preview     # serves the build
    npm run dev         # dev server without the service worker

The version on the About screen is the one in `pwa/package.json`.

## Android app

The original app in `app/`, developed in Android Studio and published on Google Play. It is
deprecated in favour of the web app: it still gets fixes, new features go to the web app.

### Making a release

1. Bump `about_version` in `strings.xml`
2. Bump `versionCode` and `versionName` in `app/build.gradle`
3. `Build` -> `Assemble Project`
4. `Build` -> `Generate Signed App Bundle / APK`
5. fill passwords on second page
6. Select `release` type
7. Go to https://play.google.com/console/u/0/developers/9107065660987941348/app-list
8. `Cipher Breaker` -> `Test and release` -> `Production` -> `Create new release`
9. Upload generated App Bundle from `app/release/app-release.aab` to `App bundles` space
10. Fill in new version to `Release details` -> `release name`
11. `Next` -> `Save` -> `Go to publishing overview` -> `Send 1 change for review` and wait

## Assets

The dictionaries and the map are made from MorfFlex CZ and OpenStreetMap data by the Python tooling
in `utils/`, see [utils/README.md](utils/README.md).
