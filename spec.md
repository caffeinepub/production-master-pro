# Production Master Pro

## Current State
The app already has an offline-first architecture including:
- IndexedDB/localStorage-based offlineCache.ts
- Sync queue (syncQueue.ts) for item_master, tailor, additional_work, dispatch
- SyncStatusIndicator in header (small pill: Online/Offline/Syncing)
- Manual Sync Now button in Backup tab
- Retry logic (retryUtils.ts) for transient canister errors
- Challan and Quotes already stored entirely in localStorage (no backend)

What is missing:
- Prominent "Offline Mode Active" banner visible across all tabs
- Server-busy detection (currently only uses navigator.onLine; doesn't detect when canister returns busy/overloaded errors)
- Global offline state context shared across the app
- "Sync Completed" toast notification after auto-sync finishes
- Sync queue auto-flush with dedup and success notification

## Requested Changes (Diff)

### Add
- `useOfflineMode.ts` hook: tracks both `navigator.onLine` (network) AND server-busy state (canister overloaded/stopped); exposes `isOffline`, `isServerBusy`, `markServerBusy()`, `markServerOnline()`, `pendingCount`
- `OfflineBanner.tsx` component: sticky banner below header showing "Offline Mode Active – Data will sync when server reconnects." when offline or server-busy; hides when online+synced; shows "Sync Completed" flash
- Global `OfflineModeContext` so any module can call `markServerBusy()` when all retries fail

### Modify
- `App.tsx`: add `<OfflineBanner />` between header and main content; wrap app in `OfflineModeProvider`
- `retryUtils.ts`: when all retries exhausted, dispatch `serverBusy` custom event that `useOfflineMode` listens to
- `syncQueue.ts`: after successful flush, dispatch `syncCompleted` custom event with synced count
- `SyncStatusIndicator.tsx`: add "Server Busy" state display
- `BackupRestoreTab.tsx`: add "Sync Data" button label (already has Sync Now)

### Remove
- Nothing removed

## Implementation Plan
1. Create `useOfflineMode.ts` with network + server-busy detection and custom event system
2. Create `OfflineBanner.tsx` with animated banner, offline indicator, and sync-complete flash
3. Update `retryUtils.ts` to dispatch `serverBusy` event on final failure
4. Update `syncQueue.ts` to dispatch `syncCompleted` event with count
5. Update `App.tsx` to include `OfflineBanner`
6. Update `SyncStatusIndicator.tsx` to show server-busy state
