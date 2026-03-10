# Production Master Pro

## Current State
The backend uses `let itemMasters = Map.empty<Nat, ItemMaster>()` (and same pattern for all other record types). These are heap-allocated maps with no stable storage. Every canister upgrade wipes all data. This causes "Failed to save item" and "Failed to load data" errors because after each deployment the canister starts fresh.

## Requested Changes (Diff)

### Add
- `stable var` backing arrays for all entity types (ItemMaster, TailorRecord, DispatchRecord, AdditionalWorkRecord, ProductionRecord, OverlockRecord)
- `stable var nextId` so IDs survive upgrades
- `system func preupgrade()` to snapshot all maps to stable arrays
- `system func postupgrade()` to restore all maps from stable arrays

### Modify
- All entity storage maps changed from `let` (heap) to `var` (mutable, restored from stable arrays on upgrade)
- `nextId` changed from `var` (heap, resets to 0) to `stable var`

### Remove
- Nothing removed

## Implementation Plan
1. Declare `stable var` arrays for each record type as backup storage
2. Change `var nextId = 0` to `stable var nextId = 0`
3. Change all `let mapName = Map.empty()` to `var mapName = Map.empty()` (mutable binding)
4. Add `preupgrade` system function that writes all map entries to stable arrays
5. Add `postupgrade` system function that reconstructs all maps from stable arrays
6. All other logic (CRUD, queries, validation) remains unchanged
