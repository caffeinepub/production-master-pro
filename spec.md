# Production Master Pro

## Current State
The app is a full-stack garment factory management system on ICP with Internet Identity auth. Backend uses Motoko stable storage. Frontend uses React + TypeScript. All major tabs (Item Master, Tailor, Additional Work, Dispatch, Payment, Finished Stock, Fabric Planner, Quote Builder) are implemented. The app occasionally fails with IC0508 (canister stopped) and similar transient errors that surface as raw system error messages to the user.

## Requested Changes (Diff)

### Add
- `retryUtils.ts`: async retry helper with 3 attempts, exponential backoff, and clean error message translation (IC0508 → "Server temporarily busy. Please try again.", reject/replica → "Connection interrupted. Retrying…")
- `ErrorBoundary.tsx`: React class component catching unhandled render errors, preventing full app crash, showing a "Recover" button
- Backend try/catch wrappers on all major write methods: addItemMaster, updateItemMaster, addTailorEntry, addAdditionalWorkRecord, addDispatchRecord, addPayment and their update/delete counterparts
- Loading state and disabled-button protection in all save handlers
- Input validation in all forms (required fields, no negatives, no empty article names)

### Modify
- `main.tsx`: wrap `<App />` with `<ErrorBoundary>`
- `ItemMasterTab.tsx`, `TailorTab.tsx`, `AdditionalWorkTab.tsx`, `DispatchTab.tsx`: replace raw catch blocks with `withRetry()` calls and clean error messages
- All tab load functions: use `.catch(() => [])` already in place, no change needed — keep as is
- Error toast messages: replace raw IC error strings with user-friendly equivalents

### Remove
- Raw IC error codes/strings exposed to user (IC0508, reject code, replica rejection)

## Implementation Plan
1. Write `src/frontend/src/utils/retryUtils.ts` with `withRetry<T>(fn, retries=3)` and `cleanErrorMessage(err)` helpers
2. Write `src/frontend/src/components/ErrorBoundary.tsx`
3. Update `src/frontend/src/main.tsx` to wrap App with ErrorBoundary
4. Update ItemMasterTab save handler to use withRetry
5. Update TailorTab, AdditionalWorkTab, DispatchTab save handlers similarly
6. Add try/catch to all Motoko backend write methods
7. Validate and deploy
