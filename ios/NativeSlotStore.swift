import Foundation

final class NativeSlotStore {
    private(set) var enabled = false
    private var slots: [String: NativeSlotState] = [:]

    func setEnabled(_ value: Bool) {
        enabled = value
        if !enabled {
            slots.removeAll()
        }
    }

    func put(placementId: String, slotId: String, hostId: String, adUnitId: String, ttlMs: Double) {
        slots[slotId] = NativeSlotState(
            placementId: placementId,
            slotId: slotId,
            hostId: hostId,
            adUnitId: adUnitId,
            ttlMs: ttlMs,
            createdAtMs: Date().timeIntervalSince1970 * 1000,
            attached: false
        )
    }

    func get(slotId: String) -> NativeSlotState? {
        slots[slotId]
    }

    func update(_ state: NativeSlotState) {
        slots[state.slotId] = state
    }

    func remove(slotId: String) {
        slots.removeValue(forKey: slotId)
    }

    func clear() {
        slots.removeAll()
    }
}
