import { registerPlugin } from "@capacitor/core"
import type { AdEvent, BridgeResult, ConfigureOptions, NativeOptions, RuntimeInfo } from "./definitions"

type NativeDgrAdmobBridgePlugin = {
  configure(options: ConfigureOptions): Promise<BridgeResult>
  getRuntimeInfo(): Promise<BridgeResult<RuntimeInfo>>
  preloadNative(options: NativeOptions): Promise<BridgeResult>
  isNativeReady(options: { slotId: string }): Promise<BridgeResult<{ ready: boolean }>>
  attachNative(options: NativeOptions): Promise<BridgeResult>
  detachNative(options: { slotId: string }): Promise<BridgeResult>
  destroyNative(options: { slotId: string }): Promise<BridgeResult>
  refreshNative(options: NativeOptions): Promise<BridgeResult>
  clearAll(): Promise<BridgeResult>
  addListener(eventName: "adEvent", listenerFunc: (event: AdEvent) => void): Promise<{ remove: () => Promise<void> }>
}

export const NativeDgrAdmobBridge = registerPlugin<NativeDgrAdmobBridgePlugin>("DgrAdmobBridge")
