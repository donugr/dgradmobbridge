import { Capacitor, type PluginListenerHandle } from "@capacitor/core"
import { loadCommunityAdmobModule } from "./community-admob"
import type { AdEvent, BannerOptions, BridgeResult, ConfigureOptions, ConsentInfo, ConsentStatus, DgrAdmobBridgePlugin, FullscreenOptions, NativeOptions, RuntimeInfo } from "./definitions"
import { NativeDgrAdmobBridge } from "./native"

const ERROR_CODES = {
  adsDisabled: "ADS_DISABLED",
  configMissing: "CONFIG_MISSING",
  dependencyMissing: "DEPENDENCY_MISSING",
  notReady: "NOT_READY",
  unsupported: "UNSUPPORTED",
} as const

const GOOGLE_TEST_AD_UNITS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
  app_open: "ca-app-pub-3940256099942544/9257395921",
  native: "ca-app-pub-3940256099942544/2247696110",
} as const

type InternalState = {
  configured: boolean
  enabled: boolean
  testMode: boolean
  applicationId: string
  placements: Record<string, string>
}

const state: InternalState = {
  configured: false,
  enabled: false,
  testMode: false,
  applicationId: "",
  placements: {},
}

const standardListenerHandles: PluginListenerHandle[] = []
const eventListeners = new Set<(event: AdEvent) => void>()
let nativeEventHandle: PluginListenerHandle | null = null
let standardListenersBound = false

function ok<T = undefined>(data?: T, status?: BridgeResult<T>["status"]): BridgeResult<T> {
  return {
    ok: true,
    status,
    ...(data === undefined ? {} : { data }),
  }
}

function fail<T = undefined>(code: string, message: string, status: BridgeResult<T>["status"] = "error"): BridgeResult<T> {
  return {
    ok: false,
    code,
    message,
    status,
  }
}

function resolvePlacementAdUnitId(placementId: string, explicitAdUnitId?: string) {
  return String(explicitAdUnitId ?? state.placements[placementId] ?? "").trim()
}

function resolveAdUnitId(
  format: keyof typeof GOOGLE_TEST_AD_UNITS,
  placementId: string,
  explicitAdUnitId?: string,
) {
  if (state.testMode) {
    return GOOGLE_TEST_AD_UNITS[format]
  }

  return resolvePlacementAdUnitId(placementId, explicitAdUnitId)
}

function ensureEnabled<T = undefined>() {
  if (!state.enabled) {
    return fail<T>(ERROR_CODES.adsDisabled, "Ads bridge is disabled.", "disabled")
  }

  return null
}

function ensurePlacementAdUnitId<T = undefined>(placementId: string, explicitAdUnitId?: string) {
  const adUnitId = resolvePlacementAdUnitId(placementId, explicitAdUnitId)
  if (!adUnitId) {
    return {
      error: fail<T>(ERROR_CODES.configMissing, `Missing ad unit id for placement "${placementId}".`),
      adUnitId: "",
    }
  }

  return {
    error: null,
    adUnitId,
  }
}

function normalizePlatform(): RuntimeInfo["platform"] {
  const platform = Capacitor.getPlatform()
  if (platform === "android" || platform === "ios") {
    return platform
  }

  return "web"
}

function emit(event: AdEvent) {
  for (const listener of eventListeners) {
    listener(event)
  }
}

function normalizeConsentStatus(value: unknown): ConsentStatus {
  const normalized = String(value ?? "").trim()
  if (normalized === "required" || normalized === "not_required" || normalized === "obtained" || normalized === "denied") {
    return normalized
  }

  return "unknown"
}

async function invokeCommunityMethod<T = unknown>(admob: Record<string, unknown>, methodName: string, ...args: unknown[]) {
  const candidate = admob[methodName]
  if (typeof candidate !== "function") {
    return null
  }

  return (await (candidate as (...methodArgs: unknown[]) => Promise<T> | T)(...args)) as T
}

async function ensureCommunityDependency<T = undefined>() {
  const module = await loadCommunityAdmobModule()
  if (!module?.AdMob) {
    return {
      error: fail<T>(ERROR_CODES.dependencyMissing, "Missing required dependency: @capacitor-community/admob"),
      module: null,
    }
  }

  return {
    error: null,
    module,
  }
}

async function ensureNativeEventBridge() {
  if (nativeEventHandle) {
    return
  }

  nativeEventHandle = await NativeDgrAdmobBridge.addListener("adEvent", (event) => {
    emit(event)
  }).catch(() => null)
}

async function bindStandardAdMobListeners(module: NonNullable<Awaited<ReturnType<typeof loadCommunityAdmobModule>>>) {
  if (standardListenersBound) {
    return
  }

  type BindingGroup = {
    format: AdEvent["format"]
    placementId: string
    enumObject?: Record<string, string>
    mappings: Array<{ key: string; phase: AdEvent["phase"] }>
  }

  const groups: BindingGroup[] = [
    {
      format: "banner",
      placementId: "banner.global",
      enumObject: module.BannerAdPluginEvents,
      mappings: [
        { key: "Loaded", phase: "loaded" },
        { key: "FailedToLoad", phase: "failed" },
        { key: "Opened", phase: "shown" },
        { key: "Closed", phase: "dismissed" },
        { key: "AdImpression", phase: "impression" },
      ],
    },
    {
      format: "interstitial",
      placementId: "interstitial.global",
      enumObject: module.InterstitialAdPluginEvents,
      mappings: [
        { key: "Loaded", phase: "loaded" },
        { key: "FailedToLoad", phase: "failed" },
        { key: "Opened", phase: "shown" },
        { key: "Closed", phase: "dismissed" },
        { key: "FailedToShow", phase: "failed" },
      ],
    },
    {
      format: "rewarded",
      placementId: "rewarded.global",
      enumObject: module.RewardAdPluginEvents,
      mappings: [
        { key: "Loaded", phase: "loaded" },
        { key: "FailedToLoad", phase: "failed" },
        { key: "Opened", phase: "shown" },
        { key: "Closed", phase: "dismissed" },
        { key: "FailedToShow", phase: "failed" },
        { key: "Rewarded", phase: "reward_earned" },
      ],
    },
    {
      format: "app_open",
      placementId: "appopen.global",
      enumObject: module.AppOpenAdPluginEvents,
      mappings: [
        { key: "Loaded", phase: "loaded" },
        { key: "FailedToLoad", phase: "failed" },
        { key: "Opened", phase: "shown" },
        { key: "Closed", phase: "dismissed" },
        { key: "FailedToShow", phase: "failed" },
      ],
    },
  ]

  for (const group of groups) {
    if (!group.enumObject) {
      continue
    }

    for (const mapping of group.mappings) {
      const eventName = group.enumObject[mapping.key]
      if (!eventName) {
        continue
      }

      const handle = await invokeCommunityMethod<PluginListenerHandle | null>(module.AdMob, "addListener", eventName, (payload?: { code?: string; message?: string }) => {
        emit({
          format: group.format,
          placementId: group.placementId,
          phase: mapping.phase,
          code: payload?.code,
          message: payload?.message,
        })
      }).catch(() => null)

      if (handle) {
        standardListenerHandles.push(handle as PluginListenerHandle)
      }
    }
  }

  standardListenersBound = true
}

async function configureNativeBridge(options: ConfigureOptions) {
  await ensureNativeEventBridge()
  return NativeDgrAdmobBridge.configure(options).catch(() => fail("NATIVE_BRIDGE_FAILED", "Failed to configure native bridge."))
}

async function configure(options: ConfigureOptions): Promise<BridgeResult> {
  const normalizedOptions: ConfigureOptions = {
    ...options,
    testMode: Boolean(options.testMode),
  }

  state.enabled = normalizedOptions.enabled
  state.testMode = normalizedOptions.testMode
  state.applicationId = String(normalizedOptions.applicationId ?? "").trim()
  state.placements = {
    ...(normalizedOptions.placements ?? {}),
  }
  state.configured = true

  if (!normalizedOptions.enabled) {
    await configureNativeBridge(normalizedOptions)
    return ok(undefined, "disabled")
  }

  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await bindStandardAdMobListeners(dependency.module)
  await configureNativeBridge(normalizedOptions)

  if (typeof dependency.module.AdMob.initialize === "function") {
    await invokeCommunityMethod(dependency.module.AdMob, "initialize", {
      initializeForTesting: normalizedOptions.testMode,
    }).catch(() => undefined)
  }

  return ok(undefined, "ready")
}

async function getRuntimeInfo(): Promise<BridgeResult<RuntimeInfo>> {
  if (normalizePlatform() === "android") {
    return NativeDgrAdmobBridge.getRuntimeInfo().catch(() => fail("NATIVE_BRIDGE_FAILED", "Failed to get Android runtime info."))
  }

  return ok({
    platform: normalizePlatform(),
    enabled: state.enabled,
    applicationIdConfigured: Boolean(state.applicationId),
    applicationIdSource: state.applicationId ? "js" : "missing",
    testMode: state.testMode,
    usingTestDevice: false,
    placementsConfigured: Object.keys(state.placements).filter((key) => String(state.placements[key] ?? "").trim().length > 0).length,
  }, state.enabled ? "ready" : "disabled")
}

async function requestConsentInfo(): Promise<BridgeResult<ConsentInfo>> {
  const disabled = ensureEnabled<ConsentInfo>()
  if (disabled) {
    return disabled
  }

  const dependency = await ensureCommunityDependency<ConsentInfo>()
  if (dependency.error) {
    return dependency.error
  }

  const result = (await invokeCommunityMethod<Record<string, unknown> | null>(dependency.module.AdMob, "requestConsentInfo").catch(() => null)) ?? null
  if (!result) {
    return fail(ERROR_CODES.unsupported, "Consent info is not available from the community AdMob plugin.", "unsupported")
  }

  const consentInfo: ConsentInfo = {
    status: normalizeConsentStatus(result.status),
    canRequestAds: Boolean(result.canRequestAds),
    privacyOptionsRequired: Boolean(result.isPrivacyOptionsRequired ?? result.privacyOptionsRequired),
  }
  emit({
    format: "banner",
    placementId: "consent.global",
    phase: "consent_updated",
  })
  return ok(consentInfo, consentInfo.canRequestAds ? "ready" : "not_ready")
}

async function showConsentFormIfRequired(): Promise<BridgeResult<ConsentInfo>> {
  const consent = await requestConsentInfo()
  if (!consent.ok || !consent.data) {
    return consent
  }

  if (consent.data.canRequestAds) {
    return consent
  }

  const dependency = await ensureCommunityDependency<ConsentInfo>()
  if (dependency.error) {
    return dependency.error
  }

  const result = (await invokeCommunityMethod<Record<string, unknown> | null>(dependency.module.AdMob, "showConsentForm").catch(() => null)) ?? null
  if (!result) {
    return fail(ERROR_CODES.unsupported, "Consent form is not available from the community AdMob plugin.", "unsupported")
  }

  const consentInfo: ConsentInfo = {
    status: normalizeConsentStatus(result.status),
    canRequestAds: Boolean(result.canRequestAds),
    privacyOptionsRequired: Boolean(result.isPrivacyOptionsRequired ?? result.privacyOptionsRequired),
  }
  emit({
    format: "banner",
    placementId: "consent.global",
    phase: "consent_updated",
  })
  return ok(consentInfo, consentInfo.canRequestAds ? "ready" : "not_ready")
}

async function showPrivacyOptionsForm(): Promise<BridgeResult<ConsentInfo>> {
  const disabled = ensureEnabled<ConsentInfo>()
  if (disabled) {
    return disabled
  }

  const dependency = await ensureCommunityDependency<ConsentInfo>()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "showPrivacyOptionsForm").catch(() => undefined)
  return getConsentStatus()
}

async function getConsentStatus(): Promise<BridgeResult<ConsentInfo>> {
  return requestConsentInfo()
}

async function resetConsentForTesting(): Promise<BridgeResult> {
  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  if (typeof dependency.module.AdMob.resetConsentInfo !== "function") {
    return fail(ERROR_CODES.unsupported, "resetConsentInfo is not available from the community AdMob plugin.", "unsupported")
  }

  await invokeCommunityMethod(dependency.module.AdMob, "resetConsentInfo").catch(() => undefined)
  return ok()
}

async function showBanner(options: BannerOptions): Promise<BridgeResult> {
  const disabled = ensureEnabled()
  if (disabled) {
    return disabled
  }

  const adUnitId = resolveAdUnitId("banner", options.placementId, options.adUnitId)
  if (!adUnitId) {
    return fail(ERROR_CODES.configMissing, `Missing ad unit id for placement "${options.placementId}".`)
  }

  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  const positionMap = dependency.module.BannerAdPosition ?? {}
  const sizeMap = dependency.module.BannerAdSize ?? {}

  await invokeCommunityMethod(dependency.module.AdMob, "showBanner", {
    adId: adUnitId,
    adSize: sizeMap.BANNER ?? "BANNER",
    position: options.position === "top" ? positionMap.TOP_CENTER ?? "TOP_CENTER" : positionMap.BOTTOM_CENTER ?? "BOTTOM_CENTER",
    isTesting: state.testMode,
  }).catch(() => undefined)

  return ok(undefined, "loading")
}

async function loadBanner(options: BannerOptions): Promise<BridgeResult> {
  return showBanner(options)
}

async function hideBanner(_placementId: string): Promise<BridgeResult> {
  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "hideBanner").catch(() => undefined)
  return ok()
}

async function destroyBanner(_placementId: string): Promise<BridgeResult> {
  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "removeBanner").catch(() => undefined)
  return ok()
}

async function preloadInterstitial(options: FullscreenOptions): Promise<BridgeResult> {
  const disabled = ensureEnabled()
  if (disabled) {
    return disabled
  }

  const adUnitId = resolveAdUnitId("interstitial", options.placementId, options.adUnitId)
  if (!adUnitId) {
    return fail(ERROR_CODES.configMissing, `Missing ad unit id for placement "${options.placementId}".`)
  }

  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "prepareInterstitial", {
    adId: adUnitId,
    isTesting: state.testMode,
  }).catch(() => undefined)

  return ok(undefined, "loading")
}

async function isInterstitialReady(_placementId: string): Promise<BridgeResult<{ ready: boolean }>> {
  return ok({
    ready: true,
  }, "ready")
}

async function showInterstitial(_placementId: string): Promise<BridgeResult> {
  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "showInterstitial").catch(() => undefined)
  return ok()
}

async function preloadRewarded(options: FullscreenOptions): Promise<BridgeResult> {
  const disabled = ensureEnabled()
  if (disabled) {
    return disabled
  }

  const adUnitId = resolveAdUnitId("rewarded", options.placementId, options.adUnitId)
  if (!adUnitId) {
    return fail(ERROR_CODES.configMissing, `Missing ad unit id for placement "${options.placementId}".`)
  }

  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "prepareRewardVideoAd", {
    adId: adUnitId,
    isTesting: state.testMode,
  }).catch(() => undefined)

  return ok(undefined, "loading")
}

async function isRewardedReady(_placementId: string): Promise<BridgeResult<{ ready: boolean }>> {
  return ok({
    ready: true,
  }, "ready")
}

async function showRewarded(_placementId: string): Promise<BridgeResult> {
  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "showRewardVideoAd").catch(() => undefined)
  return ok()
}

async function preloadAppOpen(options: FullscreenOptions): Promise<BridgeResult> {
  const disabled = ensureEnabled()
  if (disabled) {
    return disabled
  }

  const adUnitId = resolveAdUnitId("app_open", options.placementId, options.adUnitId)
  if (!adUnitId) {
    return fail(ERROR_CODES.configMissing, `Missing ad unit id for placement "${options.placementId}".`)
  }

  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "loadAppOpen", {
    adId: adUnitId,
  }).catch(() => undefined)

  return ok(undefined, "loading")
}

async function isAppOpenReady(_placementId: string): Promise<BridgeResult<{ ready: boolean }>> {
  const dependency = await ensureCommunityDependency<{ ready: boolean }>()
  if (dependency.error) {
    return dependency.error
  }

  if (typeof dependency.module.AdMob.isAppOpenLoaded !== "function") {
    return fail(ERROR_CODES.unsupported, "App open readiness is not available from the community AdMob plugin.", "unsupported")
  }

  const loaded = ((await invokeCommunityMethod<{ value?: boolean }>(dependency.module.AdMob, "isAppOpenLoaded").catch(() => ({ value: false }))) ?? { value: false }) as { value?: boolean }
  return ok({
    ready: Boolean(loaded?.value),
  }, loaded?.value ? "ready" : "not_ready")
}

async function showAppOpen(_placementId: string): Promise<BridgeResult> {
  const dependency = await ensureCommunityDependency()
  if (dependency.error) {
    return dependency.error
  }

  await invokeCommunityMethod(dependency.module.AdMob, "showAppOpen").catch(() => undefined)
  return ok()
}

async function preloadNative(options: NativeOptions): Promise<BridgeResult> {
  const disabled = ensureEnabled()
  if (disabled) {
    return disabled
  }

  return NativeDgrAdmobBridge.preloadNative(options)
}

async function isNativeReady(slotId: string): Promise<BridgeResult<{ ready: boolean }>> {
  return NativeDgrAdmobBridge.isNativeReady({
    slotId,
  })
}

async function attachNative(options: NativeOptions): Promise<BridgeResult> {
  return NativeDgrAdmobBridge.attachNative(options)
}

async function detachNative(slotId: string): Promise<BridgeResult> {
  return NativeDgrAdmobBridge.detachNative({
    slotId,
  })
}

async function destroyNative(slotId: string): Promise<BridgeResult> {
  return NativeDgrAdmobBridge.destroyNative({
    slotId,
  })
}

async function refreshNative(options: NativeOptions): Promise<BridgeResult> {
  return NativeDgrAdmobBridge.refreshNative(options)
}

async function clearAll(): Promise<BridgeResult> {
  for (const handle of standardListenerHandles.splice(0, standardListenerHandles.length)) {
    await handle.remove().catch(() => undefined)
  }
  standardListenersBound = false

  if (nativeEventHandle) {
    await nativeEventHandle.remove().catch(() => undefined)
    nativeEventHandle = null
  }

  await NativeDgrAdmobBridge.clearAll().catch(() => undefined)
  return ok()
}

async function addListener(eventName: "adEvent", listenerFunc: (event: AdEvent) => void): Promise<PluginListenerHandle> {
  if (eventName !== "adEvent") {
    throw new Error(`Unsupported event name: ${eventName}`)
  }

  eventListeners.add(listenerFunc)
  await ensureNativeEventBridge()

  return {
    remove: async () => {
      eventListeners.delete(listenerFunc)
    },
  }
}

async function removeAllListeners() {
  eventListeners.clear()
  await clearAll()
}

export const DgrAdmobBridge: DgrAdmobBridgePlugin = {
  configure,
  getRuntimeInfo,
  requestConsentInfo,
  showConsentFormIfRequired,
  showPrivacyOptionsForm,
  getConsentStatus,
  resetConsentForTesting,
  loadBanner,
  showBanner,
  hideBanner,
  destroyBanner,
  preloadInterstitial,
  isInterstitialReady,
  showInterstitial,
  preloadRewarded,
  isRewardedReady,
  showRewarded,
  preloadAppOpen,
  isAppOpenReady,
  showAppOpen,
  preloadNative,
  isNativeReady,
  attachNative,
  detachNative,
  destroyNative,
  refreshNative,
  clearAll,
  addListener,
  removeAllListeners,
}

export * from "./definitions"
export * from "./dom-host-rect"
