type CommunityAdMobModule = {
  AdMob: Record<string, (...args: unknown[]) => Promise<unknown> | unknown>
  BannerAdPosition?: Record<string, string>
  BannerAdSize?: Record<string, string>
  BannerAdPluginEvents?: Record<string, string>
  InterstitialAdPluginEvents?: Record<string, string>
  RewardAdPluginEvents?: Record<string, string>
  AppOpenAdPluginEvents?: Record<string, string>
}

type CommunityAdmobLoadResult = {
  module: CommunityAdMobModule | null
  errorMessage?: string
}

let cachedModule: CommunityAdMobModule | null | undefined
let cachedLoadResult: CommunityAdmobLoadResult | undefined

export async function loadCommunityAdmobModule() {
  if (cachedLoadResult !== undefined) {
    return cachedLoadResult
  }

  try {
    cachedModule = (await import("@capacitor-community/admob")) as unknown as CommunityAdMobModule
    cachedLoadResult = {
      module: cachedModule,
    }
  } catch (error) {
    cachedModule = null
    cachedLoadResult = {
      module: null,
      errorMessage: error instanceof Error ? error.message : String(error ?? "Unknown error"),
    }
  }

  return cachedLoadResult
}
