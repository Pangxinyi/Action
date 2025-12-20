# EAS Build & Submit — Quick Guide

This project is configured to use EAS Build. Follow the steps below to build and submit releases to App Store Connect / Google Play.

## Prerequisites
- Install EAS CLI: `npm install -g eas-cli`
- Make sure you are logged in: `eas login`
- Add your iOS bundle identifier to `app.json` (`ios.bundleIdentifier`) and Android package to `app.json` (`android.package`). Replace the placeholders.

## Recommended Profiles
- `development`: development client (internal distribution)
- `production`: store distribution (App Store / Play Store)

The default profiles are in `eas.json`.

## Build commands
- iOS production: `npm run eas:build:ios` (requires Apple credentials / App Store Connect access)
- Android production: `npm run eas:build:android`

## Credentials & Submissions
- EAS can automatically manage credentials, or you can provide an App Store Connect API key.
- For iOS submission you can use `eas submit --platform ios` or upload the .ipa manually via Transporter / App Store Connect.

## Notes & Tips
- If you need to create App Store Connect API key, follow: https://docs.expo.dev/build/setup/#app-store-connect-api-key
- If you prefer to keep Apple credentials offline, run `eas build` from your machine and follow interactive prompts.

If you'd like, I can:
- Add an App Store submission step (`eas submit`) to package.json (requires credentials)
- Prepare TestFlight release notes and a short QA checklist for import/export flows

Tell me whether you want me to: A) prepare the `eas submit` script and `eas.json` adjustments, or B) run the build now (you will need to log in / provide credentials locally).
