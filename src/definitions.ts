import type { PluginListenerHandle } from "@capacitor/core"

export type AdFormat = "banner" | "interstitial" | "rewarded" | "native" | "app_open"

export type ConsentStatus = "unknown" | "required" | "not_required" | "obtained" | "denied"

export type AvailabilityStatus = "ready" | "loading" | "not_ready" | "disabled" | "unsupported" | "error"

export type BridgeResult<T = undefined> = {
  ok: boolean
  status?: AvailabilityStatus
  code?: string
  message?: string
  data?: T
}

export type ConfigureOptions = {
  enabled: boolean
  testMode: boolean
  applicationId?: string
  placements?: Record<string, string>
}

export type ApplicationIdSource = "js" | "android_manifest" | "ios_plist" | "missing"

export type ConsentInfo = {
  status: ConsentStatus
  canRequestAds: boolean
  privacyOptionsRequired: boolean
}

export type RuntimeInfo = {
  platform: "android" | "ios" | "web"
  enabled: boolean
  applicationIdConfigured: boolean
  applicationIdSource: ApplicationIdSource
  testMode?: boolean
  usingTestDevice?: boolean
  placementsConfigured?: number
}

export type BannerOptions = {
  placementId: string
  adUnitId?: string
  containerId?: string
  position?: "top" | "bottom"
  autoRefreshIntervalMs?: number
}

export type FullscreenOptions = {
  placementId: string
  adUnitId?: string
}

export type NativeHostAnchor = "top" | "bottom"

export type NativeHostRect = {
  x: number
  y: number
  width: number
  height: number
  anchor?: NativeHostAnchor
}

export type NativeOptions = {
  placementId: string
  slotId: string
  hostId: string
  adUnitId?: string
  ttlMs?: number
  hostRect?: NativeHostRect
}

export type AdEvent = {
  format: AdFormat
  placementId: string
  slotId?: string
  phase: "loaded" | "failed" | "shown" | "dismissed" | "clicked" | "impression" | "reward_earned" | "attached" | "detached" | "consent_updated"
  code?: string
  message?: string
}

export type DgrAdmobBridgePlugin = {
  configure(options: ConfigureOptions): Promise<BridgeResult>
  getRuntimeInfo(): Promise<BridgeResult<RuntimeInfo>>
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
  addListener(eventName: "adEvent", listenerFunc: (event: AdEvent) => void): Promise<PluginListenerHandle>
  removeAllListeners(): Promise<void>
}
