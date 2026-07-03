# Changelog

All notable changes to `@donugr/dgradmobbridge` will be documented in this file.

The format is inspired by Keep a Changelog and this project follows SemVer pragmatically during the early `0.x` phase.

## [0.1.3] - 2026-07-03

Android native ads lifecycle and publish-readiness update.

### Added

- automatic native slot cleanup on Android activity destroy via plugin lifecycle handling
- native slot runtime diagnostics in `getRuntimeInfo()` for active, loading, and attached slot counts
- native telemetry events for preload reuse/skip and attach/layout no-op scenarios

### Changed

- native attach now skips identical host re-attach work when the host and layout fingerprint have not changed
- native host layout updates now avoid unnecessary relayout operations when the effective rect is unchanged
- native preload and refresh flows now guard against duplicate concurrent loading for the same placement
- release metadata has been aligned to `0.1.3` across package, Android, and CocoaPods manifests

## [0.1.2] - 2026-07-03

Peer dependency runtime-resolution fix.

### Changed

- plugin peer dependency loader now imports `@capacitor-community/admob` with a bundler-friendly literal import path
- runtime dependency error now clearly states that the peer dependency must be installed in the consumer app
- consumer apps should no longer need app-side Vite transform workarounds for the community AdMob dependency check

## [0.1.1] - 2026-07-03

Documentation and publish-readiness update.

### Added

- release checklist documentation
- Android testing guide
- native ads lifecycle guide

### Changed

- public plugin mode documentation now reflects the simplified `testMode`-only contract
- package publish file list now includes supporting release and docs artifacts used by the public README

## [0.1.0] - 2026-07-03

Initial public Android-first foundation.

### Added

- framework-agnostic Capacitor plugin surface under `DgrAdmobBridge`
- standard ads facade for banner, interstitial, rewarded, and app open flows
- consent helper surface built around `@capacitor-community/admob`
- Android native ads bridge with preload, attach, detach, destroy, and refresh lifecycle
- DOM host rectangle helper export for WebView-driven native placement
- Android applicationId resolve order from JS config or manifest meta-data
- reusable plugin repository metadata for GitHub and npm publishing

### Changed

- simplified runtime mode contract to use `testMode` as the only main switch
- Google test ad units are used internally whenever `testMode` is `true`
- production placements are used whenever `testMode` is `false`

### Known Limitations

- iOS native ads implementation is still contract-compatible but not feature-parity complete
- consumer apps still own page-level placement policy, cooldown logic, and analytics decisions
- real-device QA should remain the final source of truth before production rollout
