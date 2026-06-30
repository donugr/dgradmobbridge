import Foundation

struct NativeSlotState {
    let placementId: String
    let slotId: String
    let hostId: String
    let adUnitId: String
    let ttlMs: Double
    let createdAtMs: Double
    var attached: Bool

    func isExpired(nowMs: Double) -> Bool {
        ttlMs > 0 && createdAtMs + ttlMs <= nowMs
    }
}
