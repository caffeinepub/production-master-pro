# Production Master Pro

## Current State

The app has 5 bottom nav tabs:
- Entry: Form to add production records (date, articleNo, masterName, dispatchedPcs, cutByMaster, rate, percentage). Calculates pendingPcs and finalAmount.
- History: Lists all production records with search/filter/delete.
- Masters: Groups records by master name, shows total pcs and payment.
- Articles: Groups records by article number, shows total pcs.
- Payment: Date-range filter showing net payment per master.

Backend stores `ProductionRecord` with: id, date, articleNo, masterName, dispatchedPcs, cutByMaster, rate, percentage, totalPcs, finalAmount.

## Requested Changes (Diff)

### Add

1. **Tailors tab** -- New bottom nav tab for tailor records linked to articles. Each tailor record has:
   - articleNo (text, links to an article)
   - tailorName (text)
   - color (text)
   - quantity (number -- pieces)
   - pcsRate (number -- rate per piece)
   - finalAmount (auto-calculated: quantity × pcsRate)
   - date (date)
   - dateFrom / dateTo (date range for filtering)

   Tab features:
   - Form to add a new tailor record (articleNo, tailorName, color, quantity, pcsRate; auto-calculate finalAmount)
   - List of tailor records filterable by article and date range
   - Summary showing total pcs and total amount per tailor per article

2. **Overlock tab** -- New bottom nav tab for overlock employee records. Each overlock record has:
   - articleNo (text)
   - employeeName (text)
   - quantity (number -- pieces)
   - pcsRate (number -- rate per piece)
   - rate (number -- additional rate field)
   - finalAmount (auto-calculated: quantity × pcsRate)
   - date (date)

   Tab features:
   - Form to add a new overlock record (articleNo, employeeName, quantity, pcsRate, rate; auto-calculate finalAmount)
   - List of overlock records filterable by article and date range
   - Summary showing total pcs and total amount per employee

### Modify

- `App.tsx` -- Add "tailor" and "overlock" to TabId union and render new tabs.
- `BottomNav.tsx` -- Add two new nav items: Tailors (Scissors icon) and Overlock (Layers icon). Bottom nav now has 7 items; use smaller text/icons to fit.
- Backend `main.mo` -- Add TailorRecord and OverlockRecord types with full CRUD and report functions.
- `backend.d.ts` -- Add TailorRecord and OverlockRecord interfaces and new backend methods.
- `useQueries.ts` -- Add hooks for tailor and overlock CRUD operations.

### Remove

Nothing removed.

## Implementation Plan

1. Update `main.mo` to add TailorRecord and OverlockRecord stable storage, CRUD functions, and report/filter functions.
2. Update `backend.d.ts` with new types and methods.
3. Create `TailorTab.tsx` component with add form, list with date range filter, and per-tailor summary.
4. Create `OverlockTab.tsx` component with add form, list with date range filter, and per-employee summary.
5. Update `useQueries.ts` with hooks: useGetTailorRecords, useAddTailorRecord, useDeleteTailorRecord, useGetOverlockRecords, useAddOverlockRecord, useDeleteOverlockRecord.
6. Update `App.tsx` to include new tabs.
7. Update `BottomNav.tsx` to add Tailors and Overlock nav items.
