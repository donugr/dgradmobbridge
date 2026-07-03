# `@donugr/dgradmobbridge`

Framework-agnostic Capacitor ads facade and native ads bridge.

Android-first early public release for a reusable Capacitor AdMob facade and native ads bridge.

## Quick Start

This is the fastest Android-first example for consumer apps.

### 1. Configure placements once at app startup

```ts
import { DgrAdmobBridge } from "@donugr/dgradmobbridge";

const placements = {
  "banner.dashboard.footer": "ca-app-pub-3940256099942544/6300978111",
  "interstitial.after-save.primary": "ca-app-pub-3940256099942544/1033173712",
  "rewarded.export.primary": "ca-app-pub-3940256099942544/5224354917",
  "appopen.launch.default": "ca-app-pub-3940256099942544/9257395921",
  "native.dashboard.primary": "ca-app-pub-3940256099942544/2247696110",
};

await DgrAdmobBridge.configure({
  enabled: true,
  testMode: true,
  placements,
});
```

Notes:

- `applicationId` is optional in JS for Android if the app already provides `com.google.android.gms.ads.APPLICATION_ID` in `AndroidManifest.xml`
- `testMode: true` makes the bridge use Google test ad unit ids internally for all supported formats during integration and testing
- `testMode: false` makes the bridge use real ad unit ids from your `placements` map or explicit `adUnitId`
- when `testMode: true`, `placements` may still be provided, but Google test ad unit ids are the ones actually used to request ads

Default testing example:

```ts
await DgrAdmobBridge.configure({
  enabled: true,
  testMode: true,
  placements,
});
```

Notes:

- `testMode` is the only runtime switch between testing and live ad-unit behavior
- Google test mode uses Google demo ad units internally
- production mode uses ad unit ids from app placements
- iOS currently keeps contract compatibility but full parity is still in progress

### 2. Banner example

```ts
await DgrAdmobBridge.showBanner({
  placementId: "banner.dashboard.footer",
  position: "bottom",
});
```

Hide or destroy later:

```ts
await DgrAdmobBridge.hideBanner("banner.dashboard.footer");
await DgrAdmobBridge.destroyBanner("banner.dashboard.footer");
```

### 3. Interstitial example

```ts
await DgrAdmobBridge.preloadInterstitial({
  placementId: "interstitial.after-save.primary",
});

await DgrAdmobBridge.showInterstitial("interstitial.after-save.primary");
```

### 4. Rewarded example

```ts
await DgrAdmobBridge.preloadRewarded({
  placementId: "rewarded.export.primary",
});

await DgrAdmobBridge.showRewarded("rewarded.export.primary");
```

### 5. App Open example

```ts
await DgrAdmobBridge.preloadAppOpen({
  placementId: "appopen.launch.default",
});

await DgrAdmobBridge.showAppOpen("appopen.launch.default");
```

### 6. Native ads: add a host element in the page

```html
<div id="dashboard-native-slot"></div>
```

### 7. Native ads: preload when needed

```ts
await DgrAdmobBridge.preloadNative({
  placementId: "native.dashboard.primary",
  slotId: "dashboard.primary.slot-1",
  hostId: "dashboard-native-slot",
});
```

### 8. Native ads: optionally calculate `hostRect`, then attach

```ts
import { DgrAdmobBridge, buildNativeHostRect } from "@donugr/dgradmobbridge";

const element = document.getElementById("dashboard-native-slot");

if (element) {
  const hostRect = buildNativeHostRect(element, {
    anchor: "top",
  });

  await DgrAdmobBridge.attachNative({
    placementId: "native.dashboard.primary",
    slotId: "dashboard.primary.slot-1",
    hostId: "dashboard-native-slot",
    hostRect,
  });
}
```

### 9. Listen to ad events

```ts
const listener = await DgrAdmobBridge.addListener("adEvent", (event) => {
  console.log("adEvent", event);
});
```

Expected phases include:

- `loaded`
- `failed`
- `attached`
- `detached`
- `clicked`
- `impression`
- `shown`
- `dismissed`
- `reward_earned`

### 10. Native ads: detach and destroy when leaving the page

```ts
await DgrAdmobBridge.detachNative("dashboard.primary.slot-1");
await DgrAdmobBridge.destroyNative("dashboard.primary.slot-1");

await listener.remove();
```

### 11. Recommended mental model

- `placements` = app-level map of placement keys to ad unit ids
- `placementId` = which ad inventory to use
- `slotId` = runtime instance id for one native ad slot
- `hostId` = logical UI host identity
- `hostRect` = optional positioning hint for Android native overlay placement

`@donugr/dgradmobbridge` provides one reusable plugin surface for apps that want:

- one ads contract across multiple projects
- `Android + iOS` contract-first design
- standard ad formats and UMP powered by `@capacitor-community/admob`
- custom native ads bridge behavior on top of the community plugin

This package is intended to become a public npm package and a reusable GitHub plugin repository.

## What This Plugin Does

It provides one package surface for:

- Google UMP / consent orchestration
- banner, interstitial, rewarded, and app open pass-through
- ads enabled / disabled runtime gate
- native ads bridge contract and lifecycle

Current maturity:

- standard ads facade foundation is implemented
- Android native ads loading and host rendering foundation is implemented
- native ads host bridge contract is implemented
- iOS native ads parity is still in progress

## Installation

```bash
npm install @capacitor-community/admob
npm install @donugr/dgradmobbridge
npx cap sync
```

`@capacitor-community/admob` is a required peer dependency.

## Documentation

- [`CHANGELOG.md`](./CHANGELOG.md)
- [`docs/android-testing.md`](./docs/android-testing.md)
- [`docs/native-ads-lifecycle.md`](./docs/native-ads-lifecycle.md)
- [`RELEASING.md`](./RELEASING.md)

## Android Manifest Requirement

If `applicationId` is not passed from JS, Android consumer apps should provide:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-xxxxx~yyyyy" />
```

This allows the plugin to resolve `applicationId` from native app configuration automatically.

## Recommended Config Pattern

Recommended ownership model:

- `applicationId`
  from native app configuration such as Android manifest
- `placements`
  from runtime app config per flavor
- `adUnitId` passed directly per method call
  only for explicit overrides or special cases

## Peer Dependencies

Required peer dependencies:

- `@capacitor/core`
- `@capacitor-community/admob`

Why this is a peer dependency instead of a bundled dependency:

- consumer apps stay in control of the actual community AdMob plugin version
- this package acts as a facade and native-ads bridge, not a full replacement SDK wrapper
- native build ownership remains explicit inside the consuming app

## Publish Status

This repository is intended to become a reusable plugin package.

Current status:

- package metadata is publish-oriented
- peer dependency contract is defined
- TypeScript package build is available
- native Android and iOS plugin registration is present
- native ads full production SDK rendering is not finished yet

Package verification already checked:

- `npm pack --dry-run` passes
- tarball output is limited to publish-safe files only
- build output is generated from `prepare`

## Goals

`@donugr/dgradmobbridge` should provide one stable integration surface for:

- consent / Google UMP
- banner ads
- interstitial ads
- rewarded ads
- app open ads
- native ads host bridge
- ads enabled / disabled runtime gate
- unified event payloads

The plugin should not contain app-specific ad business rules such as cooldown policy, placement policy per page, or product decisions about when ads may be shown.

## Dependency Policy

If the peer dependency is missing, `configure()` must fail with a clear runtime error such as:

`DEPENDENCY_MISSING: @capacitor-community/admob`

## High-Level Architecture

### Responsibilities of `@capacitor-community/admob`

- consent / UMP
- banner
- interstitial
- rewarded
- app open

### Responsibilities of `@donugr/dgradmobbridge`

- unified JS contract
- dependency validation
- ads enabled / disabled gate
- placement config normalization
- native ads host-based bridge
- unified event interface
- safe noads behavior

### Responsibilities of the Consumer App

- when ads are allowed to show
- placement decisions per screen
- screen-specific cooldown logic
- build flavor policy such as ads vs noads
- UI wrapper components for Vue / React / others

## Contract Baseline

### Public Plugin Name

- Capacitor public plugin name: `DgrAdmobBridge`
- npm package: `@donugr/dgradmobbridge`
- Android namespace: `id.donugr.dgradmobbridge`
- iOS Swift plugin class: `DgrAdmobBridgePlugin`

### Core Types

```ts
type AdFormat = "banner" | "interstitial" | "rewarded" | "native" | "app_open";

type ConsentStatus = "unknown" | "required" | "not_required" | "obtained" | "denied";

type AvailabilityStatus = "ready" | "loading" | "not_ready" | "disabled" | "unsupported" | "error";

type BridgeResult<T = undefined> = {
  ok: boolean;
  status?: AvailabilityStatus;
  code?: string;
  message?: string;
  data?: T;
};
```

### Configure Contract

```ts
type ConfigureOptions = {
  enabled: boolean;
  testMode: boolean;
  applicationId?: string;
  placements?: Record<string, string>;
};
```

Android-first resolve order for `applicationId`:

1. use `configure({ applicationId })` if provided and non-empty
2. otherwise read `com.google.android.gms.ads.APPLICATION_ID` from the Android app manifest
3. if neither source provides a valid value, `configure()` must fail clearly

### Consent Contract

```ts
type ConsentInfo = {
  status: ConsentStatus;
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
};
```

### Runtime Info Contract

```ts
type RuntimeInfo = {
  platform: "android" | "ios" | "web";
  enabled: boolean;
  applicationIdConfigured: boolean;
  applicationIdSource: "js" | "android_manifest" | "ios_plist" | "missing";
};
```

Current implementation status:

- Android returns real `applicationIdConfigured` and `applicationIdSource`
- iOS parity for this field is still pending

### Banner Contract

```ts
type BannerOptions = {
  placementId: string;
  containerId?: string;
  position?: "top" | "bottom";
  autoRefreshIntervalMs?: number;
};
```

### Fullscreen Contract

```ts
type FullscreenOptions = {
  placementId: string;
};
```

### Native Contract

```ts
type NativeHostRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  anchor?: "top" | "bottom";
};

type NativeOptions = {
  placementId: string;
  slotId: string;
  hostId: string;
  adUnitId?: string;
  ttlMs?: number;
  hostRect?: NativeHostRect;
};
```

### DOM Host Helper

This package also exports a framework-agnostic helper for DOM-based apps:

```ts
import { buildNativeHostRect } from "@donugr/dgradmobbridge";
```

Use it to translate a DOM element's bounding box into an optional `hostRect` payload for native placement.

## Public Method Blueprint

```ts
configure(options: ConfigureOptions): Promise<BridgeResult>
getRuntimeInfo(): Promise<BridgeResult<{ platform: "android" | "ios" | "web"; enabled: boolean }>>

requestConsentInfo(): Promise<BridgeResult<ConsentInfo>>
showConsentFormIfRequired(): Promise<BridgeResult<ConsentInfo>>
showPrivacyOptionsForm(): Promise<BridgeResult<ConsentInfo>>
getConsentStatus(): Promise<BridgeResult<ConsentInfo>>
resetConsentForTesting(): Promise<BridgeResult>

loadBanner(options: BannerOptions): Promise<BridgeResult>
showBanner(options: BannerOptions): Promise<BridgeResult>
hideBanner(placementId: string): Promise<BridgeResult>
destroyBanner(placementId: string): Promise<BridgeResult>

preloadInterstitial(options: FullscreenOptions): Promise<BridgeResult>
isInterstitialReady(placementId: string): Promise<BridgeResult<{ ready: boolean }>>
showInterstitial(placementId: string): Promise<BridgeResult>

preloadRewarded(options: FullscreenOptions): Promise<BridgeResult>
isRewardedReady(placementId: string): Promise<BridgeResult<{ ready: boolean }>>
showRewarded(placementId: string): Promise<BridgeResult>

preloadAppOpen(options: FullscreenOptions): Promise<BridgeResult>
isAppOpenReady(placementId: string): Promise<BridgeResult<{ ready: boolean }>>
showAppOpen(placementId: string): Promise<BridgeResult>

preloadNative(options: NativeOptions): Promise<BridgeResult>
isNativeReady(slotId: string): Promise<BridgeResult<{ ready: boolean }>>
attachNative(options: NativeOptions): Promise<BridgeResult>
detachNative(slotId: string): Promise<BridgeResult>
destroyNative(slotId: string): Promise<BridgeResult>
refreshNative(options: NativeOptions): Promise<BridgeResult>

clearAll(): Promise<BridgeResult>
```

## Event Blueprint

```ts
type AdEvent = {
  format: AdFormat;
  placementId: string;
  slotId?: string;
  phase:
    | "loaded"
    | "failed"
    | "shown"
    | "dismissed"
    | "clicked"
    | "impression"
    | "reward_earned"
    | "attached"
    | "detached"
    | "consent_updated";
  code?: string;
  message?: string;
};
```

All platforms should emit the same event shape.

## Behavior Matrix

### Banner

- supports `load`, `show`, `hide`, `destroy`
- may support timer-based auto refresh
- default auto refresh should be off

### Interstitial

- supports preload and readiness checks
- no timer-based visual auto refresh
- app layer decides when it may be shown

### Rewarded

- same preload pattern as interstitial
- must emit reward-earned event explicitly

### App Open

- preload-based
- app layer controls whether showing is allowed
- should be guarded by startup/resume policy

### Native Ads

- host-based, not Vue-specific payload-first rendering
- attach to a host container by `hostId`
- supports `slotId` lifecycle
- refresh should be explicit or TTL-driven
- no visual timer swap while visible
- optional `hostRect` may be supplied for more precise native overlay placement

## Placement Naming Convention

Use readable, stable placement names:

- `banner.dashboard.footer`
- `interstitial.after-save-bahan`
- `rewarded.export.report`
- `appopen.launch.default`
- `native.dashboard.primary`

Use more technical slot identifiers only for native host instances:

- `dashboard.primary.slot-1`
- `report.inline.slot-1`
- `feed.inventory.row-6`

## Consent Flow

Recommended startup order for ads-enabled builds:

1. `configure()`
2. `requestConsentInfo()`
3. `showConsentFormIfRequired()`
4. `getConsentStatus()`
5. if `canRequestAds === true`, allow preloading ads

If the build or runtime is noads:

- `configure({ enabled: false, ... })`
- all ad-loading methods return `disabled`
- consent flow should not block app startup

## Installation Strategy

This package should not silently bundle its own copy of `@capacitor-community/admob`.

## Native Host Positioning

Current Android behavior:

- if `hostRect` is not provided, native ads use a safe overlay fallback near the bottom of the screen
- if `hostRect` is provided, Android uses that rectangle to position the native host container more precisely
- `hostId` still remains required as the logical slot identity

Example:

```ts
import { DgrAdmobBridge, buildNativeHostRect } from "@donugr/dgradmobbridge";

const element = document.getElementById("dashboard-native-slot");

if (element) {
  const hostRect = buildNativeHostRect(element, {
    anchor: "top",
  });

  await DgrAdmobBridge.attachNative({
    placementId: "native.dashboard.primary",
    slotId: "dashboard.primary.slot-1",
    hostId: "dashboard-native-slot",
    hostRect,
  });
}
```

Notes:

- this helper is optional
- it is framework-agnostic and works with Vue, React, or plain DOM
- exact visual alignment still depends on the WebView/native overlay model of the consumer app

## Package Structure

Repository structure:

- `src/`
  JS/TS facade and shared contract
- `android/`
  Android plugin source
- `ios/`
  iOS plugin source
- `README.md`
  public GitHub and npm landing page
- `package.json`
  npm metadata, peer dependency policy, publish contract
- `DgrAdmobBridge.podspec`
  iOS CocoaPods publish metadata

Publish tarball structure from `npm pack --dry-run`:

- `android/build.gradle`
- `android/src/main/**`
- `ios/**`
- `dist/**`
- `DgrAdmobBridge.podspec`
- `LICENSE`
- `README.md`
- `package.json`

Files intentionally excluded from publish package:

- `node_modules/`
- `.git/`
- `.github/`
- local native build outputs
- raw repository-only clutter

## Current Status

Current state:

- package identity defined
- dependency policy defined
- public contract defined
- TypeScript facade implemented
- runtime dependency validation implemented
- pass-through surface for `@capacitor-community/admob` standard ads implemented
- Android native plugin registration implemented
- Android native ad loading implemented
- Android native host view binding implemented
- iOS native plugin registration implemented
- native slot lifecycle placeholder bridge implemented for iOS
- package TypeScript build verified
- repository-ready `.gitignore` added

What is already usable now:

- one import surface for the plugin package
- dependency guard for missing `@capacitor-community/admob`
- ads enabled / disabled gate
- pass-through design for consent, banner, interstitial, rewarded, and app open
- Android native ads preload / attach / detach / destroy / refresh flow
- optional DOM-to-native `hostRect` helper for browser-driven positioning

What is not fully production-complete yet:

- full iOS native ads rendering parity
- exact DOM-backed host alignment strategy for every consumer app layout
- full device QA with installed peer dependency and native platform builds

## Current Limitations

Standard ads:

- the facade is implemented against expected `@capacitor-community/admob` APIs
- final runtime verification still depends on installing the peer dependency in the consuming app

Native ads:

- Android can now load, bind, and attach native ads with a host overlay strategy
- `preloadNative`, `attachNative`, `detachNative`, and `refreshNative` are wired with consistent result shapes and events
- iOS native ads still need parity work
- some consumer apps may still want custom `hostRect` measurement and alignment tuning

This means the package is already a stronger Android-first foundation for native ads, but it is not yet final cross-platform production-native integration.
