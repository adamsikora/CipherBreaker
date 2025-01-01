# CipherBreaker #

Android app developed in Android Studio. This app purpose is to be helpful during Puzzle Hunts.

Suggestions and contributions welcome.

# Making a release #

1. Bump version in `AboutActivity.kt`
2. Bump `versionCode` and `versionName` in `app/build.gradle`
3. `Build` -> `Make Project`
4. `Build` -> `Generate Signed App Bundle / APK`
5. fill passwords on second page
6. Select `release` type
7. Go to https://play.google.com/console/u/0/developers/9107065660987941348/app-list
8. `Cipher Breaker` -> `Test and release` -> `Production` -> `Create new release`
9. Upload generated App Bundle from `app/release/app-release.aab` to `App bundles` space
10. Fill in new version to `Release details` -> `release name`
11. `Next` -> `Save` -> `Go to publishing overview` -> `Send 1 change for review` and wait 