package id.donugr.dgradmobbridge;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

class NativeSlotStore {
    private boolean enabled = false;
    private final Map<String, NativeSlotState> slots = new ConcurrentHashMap<>();

    void setEnabled(boolean value) {
        enabled = value;
        if (!enabled) {
            slots.clear();
        }
    }

    boolean isEnabled() {
        return enabled;
    }

    NativeSlotState getOrCreate(String slotId) {
        return slots.computeIfAbsent(slotId, NativeSlotState::new);
    }

    NativeSlotState put(NativeSlotState state) {
        slots.put(state.slotId, state);
        return state;
    }

    NativeSlotState get(String slotId) {
        return slots.get(slotId);
    }

    boolean contains(String slotId) {
        return slots.containsKey(slotId);
    }

    NativeSlotState remove(String slotId) {
        return slots.remove(slotId);
    }

    void clear() {
        slots.clear();
    }

    Map<String, NativeSlotState> snapshot() {
        return new ConcurrentHashMap<>(slots);
    }
}
