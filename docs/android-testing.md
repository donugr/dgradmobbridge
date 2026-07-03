# Android Testing Guide

This guide is the practical checklist for validating `@donugr/dgradmobbridge` on a real Android device.

## Scope

Use this guide to verify:

- plugin installation and Capacitor sync
- `configure()` behavior
- `testMode` behavior
- standard ads facade readiness
- native ads lifecycle
- runtime info payload consistency

## Prerequisites

- Android consumer app already installs:
  - `@capacitor-community/admob`
  - `@donugr/dgradmobbridge`
- consumer app has run:
  - `npm install`
  - `npx cap sync android`
- app provides `com.google.android.gms.ads.APPLICATION_ID` in `AndroidManifest.xml`
  or passes `applicationId` from JS
- test device has internet access

## Recommended First Pass

### 1. Configure the plugin at app startup

Use a minimal call first:

```ts
await DgrAdmobBridge.configure({
  enabled: true,
  testMode: true,
  placements: {
    "banner.dashboard.footer": "unused-in-google-test-mode",
    "native.dashboard.primary": "unused-in-google-test-mode",
  },
})
```

Expected result:

- `ok === true`
- `status === "ready"`

### 2. Check runtime info immediately

Call:

```ts
const runtimeInfo = await DgrAdmobBridge.getRuntimeInfo()
```

Verify:

- `platform === "android"`
- `enabled === true`
- `testMode === true`
- `applicationIdConfigured === true`
- `applicationIdSource === "js"` or `"android_manifest"`
- `placementsConfigured` matches the number of non-empty placement entries

### 3. Verify standard banner behavior

Call:

```ts
await DgrAdmobBridge.showBanner({
  placementId: "banner.dashboard.footer",
  position: "bottom",
})
```

Expected result:

- no runtime crash
- banner event flow should begin
- Google test banner should appear when the consumer app and peer dependency are wired correctly

### 4. Verify native ads preload flow

Call:

```ts
await DgrAdmobBridge.preloadNative({
  placementId: "native.dashboard.primary",
  slotId: "dashboard.primary.slot-1",
  hostId: "dashboard-native-slot",
})
```

Expected result:

- returns `loading` or `ready`
- listener should later emit `loaded` on success

### 5. Verify native attach flow

After preload, call:

```ts
await DgrAdmobBridge.attachNative({
  placementId: "native.dashboard.primary",
  slotId: "dashboard.primary.slot-1",
  hostId: "dashboard-native-slot",
})
```

Expected result:

- returns `ready` if slot is usable
- listener emits `attached`
- ad becomes visible in the host area or overlay region

## Event Verification

Register one listener while testing:

```ts
const handle = await DgrAdmobBridge.addListener("adEvent", (event) => {
  console.log("[dgradmobbridge]", event)
})
```

Minimum event checks:

- native success path:
  - `loaded`
  - `attached`
  - `impression`
- native cleanup path:
  - `detached`
- standard formats:
  - at least `loaded` or `failed` should be observable depending on the format and placement timing

## Test Matrix

Run at least these scenarios:

1. `enabled: false`
   - ads methods should return disabled-style behavior
2. `enabled: true`, `testMode: true`
   - Google test ad units should be used internally
3. `enabled: true`, `testMode: false`
   - real placement ad units should be used
4. missing `applicationId`
   - `configure()` should fail clearly
5. empty native placement in production mode
   - native load should fail with config-related feedback

## Native Ads Real-World Lifecycle Checks

During page navigation, verify:

- first open:
  - preload
  - attach
- leave page:
  - detach
  - destroy when slot is no longer needed
- return to page:
  - preload again if prior slot was destroyed

## Things To Watch Closely

- no unexpected crash if consumer app forgets a placement key
- no stale visible native view after leaving the page
- no duplicate overlay host stacking
- `getRuntimeInfo()` remains truthful after reconfigure

## Release Gate Suggestion

Before marking Android stable for a release candidate:

1. verify `testMode: true`
2. verify `testMode: false`
3. verify at least one banner
4. verify at least one native preload + attach + detach + destroy cycle
5. capture logs and screenshots from one real device session
