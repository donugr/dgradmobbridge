type CommunityAdMobModule = {
  AdMob: Record<string, (...args: unknown[]) => Promise<unknown> | unknown>
  BannerAdPosition?: Record<string, string>
  BannerAdSize?: Record<string, string>
  BannerAdPluginEvents?: Record<string, string>
  InterstitialAdPluginEvents?: Record<string, string>
  RewardAdPluginEvents?: Record<string, string>
  AppOpenAdPluginEvents?: Record<string, string>
}

let cachedModule: CommunityAdMobModule | null | undefined

export async function loadCommunityAdmobModule() {
  if (cachedModule !== undefined) {
    return cachedModule
  }

  try {
    const moduleName = "@capacitor-community/admob"
    cachedModule = (await import(moduleName)) as CommunityAdMobModule
  } catch {
    cachedModule = null
  }

  return cachedModule
}
