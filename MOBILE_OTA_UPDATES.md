# Mobile OTA Updates

Both mobile apps now use the same EAS Update channel model:

- `development`: internal development-client builds
- `staging`: internal QA / UAT builds
- `production`: store builds for real users

## Required setup per app

Each app needs its own Expo project ID in its local env file:

```bash
# parent-app/.env.local
EXPO_PUBLIC_EAS_PROJECT_ID=<expo-project-id-for-parent-app>

# staff-app/.env.local
EXPO_PUBLIC_EAS_PROJECT_ID=<expo-project-id-for-staff-app>
```

You can get the project ID from Expo after running `eas project:init` inside the
app directory if the project has not already been linked.

## Build channels

Each app now includes an `eas.json` with three profiles:

- `development` -> channel `development`
- `staging` -> channel `staging`
- `production` -> channel `production`

Build commands run from the app directory:

```bash
eas build --profile development --platform ios
eas build --profile staging --platform android
eas build --profile production --platform all
```

## Publish OTA fixes

Publish updates from the app directory so `APP_ENV` and the API URL mapping stay
aligned with the channel:

```bash
APP_ENV=staging EXPO_PUBLIC_APP_ENV=staging eas update --channel staging --message "Fix login error handling"
APP_ENV=production EXPO_PUBLIC_APP_ENV=production eas update --channel production --message "Patch fee summary crash"
```

The app runtime is pinned with `runtimeVersion.policy = "appVersion"`, so OTA
updates flow only to binaries on the same app version. When you ship native code
changes, bump the app version and build a new binary before publishing OTA
updates for that native runtime.
