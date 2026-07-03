import Capacitor
import Foundation

@objc(DgrAdmobBridgePlugin)
public class DgrAdmobBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DgrAdmobBridgePlugin"
    public let jsName = "DgrAdmobBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRuntimeInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "preloadNative", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isNativeReady", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "attachNative", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "detachNative", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "destroyNative", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshNative", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearAll", returnType: CAPPluginReturnPromise)
    ]

    private let codeAdsDisabled = "ADS_DISABLED"
    private let codeConfigMissing = "CONFIG_MISSING"
    private let codeNotReady = "NOT_READY"
    private let slotStore = NativeSlotStore()
    private var testMode = false

    private func success(status: String, data: [String: Any]? = nil) -> [String: Any] {
        var result: [String: Any] = [
            "ok": true,
            "status": status
        ]
        if let data {
            result["data"] = data
        }
        return result
    }

    private func failure(code: String, message: String, status: String) -> [String: Any] {
        [
            "ok": false,
            "code": code,
            "message": message,
            "status": status
        ]
    }

    private func notifyEvent(placementId: String, slotId: String, phase: String, message: String) {
        notifyListeners("adEvent", data: [
            "format": "native",
            "placementId": placementId,
            "slotId": slotId,
            "phase": phase,
            "message": message
        ])
    }

    @objc func configure(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled") ?? false
        testMode = call.getBool("testMode") ?? false
        slotStore.setEnabled(enabled)
        call.resolve(success(status: enabled ? "ready" : "disabled"))
    }

    @objc func getRuntimeInfo(_ call: CAPPluginCall) {
        call.resolve(success(status: slotStore.enabled ? "ready" : "disabled", data: [
            "platform": "ios",
            "enabled": slotStore.enabled,
            "applicationIdConfigured": false,
            "applicationIdSource": "missing",
            "testMode": testMode,
            "usingTestDevice": false,
            "placementsConfigured": 0
        ]))
    }

    @objc func preloadNative(_ call: CAPPluginCall) {
        guard slotStore.enabled else {
            call.resolve(failure(code: codeAdsDisabled, message: "Ads bridge is disabled.", status: "disabled"))
            return
        }

        let placementId = call.getString("placementId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let slotId = call.getString("slotId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let hostId = call.getString("hostId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let adUnitId = call.getString("adUnitId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let ttlMs = call.getDouble("ttlMs") ?? 60000

        guard !placementId.isEmpty, !slotId.isEmpty, !hostId.isEmpty else {
            call.resolve(failure(code: codeConfigMissing, message: "placementId, slotId, and hostId are required.", status: "error"))
            return
        }

        slotStore.put(placementId: placementId, slotId: slotId, hostId: hostId, adUnitId: adUnitId, ttlMs: ttlMs)
        notifyEvent(placementId: placementId, slotId: slotId, phase: "loaded", message: "Native bridge slot prepared. SDK ad loading is pending implementation.")
        call.resolve(success(status: "ready"))
    }

    @objc func isNativeReady(_ call: CAPPluginCall) {
        let slotId = call.getString("slotId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let slot = slotStore.get(slotId: slotId)
        let nowMs = Date().timeIntervalSince1970 * 1000
        let ready = slot != nil && !(slot?.isExpired(nowMs: nowMs) ?? true)

        call.resolve(success(status: ready ? "ready" : "not_ready", data: [
            "ready": ready
        ]))
    }

    @objc func attachNative(_ call: CAPPluginCall) {
        let slotId = call.getString("slotId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard var slot = slotStore.get(slotId: slotId) else {
            call.resolve(failure(code: codeNotReady, message: "Native slot is not ready or has expired.", status: "not_ready"))
            return
        }

        let nowMs = Date().timeIntervalSince1970 * 1000
        guard !slot.isExpired(nowMs: nowMs) else {
            slotStore.remove(slotId: slotId)
            call.resolve(failure(code: codeNotReady, message: "Native slot is not ready or has expired.", status: "not_ready"))
            return
        }

        slot.attached = true
        slotStore.update(slot)
        notifyEvent(placementId: slot.placementId, slotId: slot.slotId, phase: "attached", message: "Native slot attached. Host rendering integration is pending implementation.")
        call.resolve(success(status: "ready"))
    }

    @objc func detachNative(_ call: CAPPluginCall) {
        let slotId = call.getString("slotId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard var slot = slotStore.get(slotId: slotId) else {
            call.resolve(success(status: "not_ready"))
            return
        }

        slot.attached = false
        slotStore.update(slot)
        notifyEvent(placementId: slot.placementId, slotId: slot.slotId, phase: "detached", message: "Native slot detached.")
        call.resolve(success(status: "ready"))
    }

    @objc func destroyNative(_ call: CAPPluginCall) {
        let slotId = call.getString("slotId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if let slot = slotStore.get(slotId: slotId) {
            notifyEvent(placementId: slot.placementId, slotId: slot.slotId, phase: "detached", message: "Native slot destroyed.")
        }
        slotStore.remove(slotId: slotId)
        call.resolve(success(status: "ready"))
    }

    @objc func refreshNative(_ call: CAPPluginCall) {
        guard slotStore.enabled else {
            call.resolve(failure(code: codeAdsDisabled, message: "Ads bridge is disabled.", status: "disabled"))
            return
        }

        let placementId = call.getString("placementId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let slotId = call.getString("slotId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let hostId = call.getString("hostId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let adUnitId = call.getString("adUnitId")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let ttlMs = call.getDouble("ttlMs") ?? 60000

        guard !placementId.isEmpty, !slotId.isEmpty, !hostId.isEmpty else {
            call.resolve(failure(code: codeConfigMissing, message: "placementId, slotId, and hostId are required.", status: "error"))
            return
        }

        slotStore.put(placementId: placementId, slotId: slotId, hostId: hostId, adUnitId: adUnitId, ttlMs: ttlMs)
        notifyEvent(placementId: placementId, slotId: slotId, phase: "loaded", message: "Native slot refreshed. SDK ad loading is pending implementation.")
        call.resolve(success(status: "ready"))
    }

    @objc func clearAll(_ call: CAPPluginCall) {
        slotStore.clear()
        call.resolve(success(status: slotStore.enabled ? "ready" : "disabled"))
    }
}
