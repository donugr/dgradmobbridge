# Native Ads Lifecycle

This document explains the intended lifecycle contract for native ads in `@donugr/dgradmobbridge`.

## Core Terms

### `placementId`

Stable inventory key chosen by the consumer app.

Example:

- `native.dashboard.primary`
- `native.feed.inline`

### `slotId`

Runtime instance key for one mounted native ad flow.

Examples:

- `dashboard.primary.slot-1`
- `feed.inventory.row-6`

`slotId` should be unique for the currently active native slot instance.

### `hostId`

Logical identity of the UI host where the consumer app expects the native ad to appear.

Examples:

- `dashboard-native-slot`
- `feed-row-6-native-slot`

### `hostRect`

Optional host positioning hint, mainly for Android overlay alignment.

## Lifecycle Summary

Recommended order:

1. `configure()`
2. `preloadNative()`
3. `isNativeReady()` optional check
4. `attachNative()`
5. `detachNative()` when leaving visible context
6. `destroyNative()` when slot is no longer needed

## Preload

Use `preloadNative()` when:

- page is about to show the slot
- you want the ad request to begin before visual attach
- slot content should be prepared before entering the viewport

Expected outcomes:

- `loading`
- later `loaded` event
- or `failed`

## Attach

Use `attachNative()` only after:

- the slot identity is known
- the host UI exists
- the ad is expected to become visible soon

Expected outcomes:

- `ready` on attach success
- `attached` event

## Detach

Use `detachNative()` when:

- page becomes hidden
- route changes
- host element is no longer valid

Detach should be treated as visual unmount, not final disposal.

## Destroy

Use `destroyNative()` when:

- route is fully left
- slot will not be reused
- you want a clean lifecycle reset

Destroy should be considered the final cleanup step for that slot instance.

## Refresh

Use `refreshNative()` when:

- the slot remains conceptually the same
- you want a new ad request for that slot
- you intentionally replace the current loaded ad

Do not auto-refresh aggressively while the ad is currently visible unless the product policy clearly allows it.

## Recommended Consumer Rules

### Safe Rule Set

1. one visual host should map to one active `slotId`
2. do not attach the same `slotId` to multiple hosts
3. destroy slots when a page is permanently left
4. keep page-level cooldown or frequency logic in the consumer app, not in the plugin

### Route Example

For a dashboard page:

1. page enter
   - `preloadNative`
2. host mounted
   - `attachNative`
3. page hidden or replaced
   - `detachNative`
4. page disposed
   - `destroyNative`

## Suggested Failure Handling

If `preloadNative()` or `attachNative()` fails:

- log the bridge result
- do not crash the page
- keep the slot area empty or collapse it gracefully
- allow a controlled retry from the app layer if needed

## Event Expectations

Common native phases:

- `loaded`
- `failed`
- `attached`
- `detached`
- `clicked`
- `impression`

Consumer apps should treat events as telemetry and UI orchestration signals, not as the only source of truth for app business decisions.
