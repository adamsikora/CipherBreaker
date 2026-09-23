# CipherBreaker

Android app developed in Android Studio. This app purpose is to be helpful during Puzzle Hunts.

Suggestions and contributions welcome.

# Web app

The same tools as a progressive web app live in `pwa/` (TypeScript, Vite, Leaflet). It works offline
once opened and can be installed to the home screen on Android, iOS and desktop. Every push to
`master` that touches `pwa/` deploys it to GitHub Pages through `.github/workflows/pages.yml` —
Pages has to be set to "GitHub Actions" as the source in the repository settings. Locally, with Node
18+:

    cd pwa
    npm install
    npm test          # unit tests
    npm run build     # to pwa/dist/
    npm run preview   # serves the build

# Making a release

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
