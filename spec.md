# Production Master Pro

## Current State

- App has 7 tabs: Entry, History, Master Report (labeled "Masters" in nav), Article Report, Payment, Tailor, Overlock.
- In `BottomNav.tsx`, the `master_report` tab is labeled "Masters".
- In `AppHeader.tsx`, the `master_report` tab title is "Master Payment Report".
- In `EntryTab.tsx`, the field label is "Master Name" with a datalist sourced from `useGetMasterNames()`.
- In `MasterReportTab.tsx`, it shows master cards with total pcs produced and total payment. No drill-down detail view.
- In `HistoryTab.tsx`, records show `masterName` and have Edit/Delete functionality.
- `PaymentTab.tsx` is open to everyone, no password protection. It shows date-range filtered payment breakdown by master.
- The `ProductionRecord` in `backend.d.ts` has a `masterName` field (string).
- `useGetMasterReport()` returns `Array<[string, number, number]>` = [masterName, totalPcs, totalAmount].
- `useGetRecords()` returns all production records.

## Requested Changes (Diff)

### Add
- `PartyHeadTab.tsx` (rename/replace `MasterReportTab.tsx`): Replace "Masters" concept with "Party Head" throughout. Each Party Head card is clickable and opens a detail view showing article-wise breakdown with columns: Article No, Dispatched PCS, Pending PCS. Show totals at bottom.
- Password protection for the Payment tab: On first access, show a PIN entry screen (password: 8807). Once entered correctly, show the Payment content. Lock again when user navigates away.
- Edit option in `EntryTab.tsx` area is not needed here — History already has Edit. But the Party Head detail view should have Edit on its records.

### Modify
- `BottomNav.tsx`: Change label from "Masters" to "Party Head" for the `master_report` tab.
- `AppHeader.tsx`: Change title from "Master Payment Report" to "Party Head Report" for `master_report` tab.
- `EntryTab.tsx`: Change label "Master Name" -> "Party Name". Change placeholder "Type or select master name" -> "Type or select party name". Change error message "Master Name is required" -> "Party Name is required". Change toast description to use party name instead.
- `MasterReportTab.tsx`: Rename/rewrite as `PartyHeadTab.tsx`. Change all "Master" references to "Party Head". Add clickable cards that open a detail dialog/view. Detail view shows article-wise table: Article No | Dispatched PCS | Pending PCS, with totals row.
- `PaymentTab.tsx`: Wrap the entire content in a password gate. Show PIN input screen first (password "8807"). After correct PIN, show normal Payment content. Reset lock when tab is deactivated.
- `HistoryTab.tsx`: Change label "Master Name" -> "Party Name" in the Edit dialog. Change placeholder and label text accordingly.

### Remove
- Nothing removed from the data model. The backend `masterName` field stays as-is (just relabeled in UI).

## Implementation Plan

1. **BottomNav.tsx** - Change "Masters" nav label to "Party Head"
2. **AppHeader.tsx** - Change `master_report` title to "Party Head Report"
3. **EntryTab.tsx** - Rename "Master Name" label/placeholder/error/toast to "Party Name"
4. **MasterReportTab.tsx** - Rewrite as Party Head tab:
   - Change all "Master" -> "Party Head" in UI text
   - Make each party card clickable to open detail dialog
   - Detail dialog: filter all records by masterName, group by articleNo, show table with Article No, Dispatched PCS, Pending PCS columns, plus totals row
5. **PaymentTab.tsx** - Add password gate (PIN: 8807):
   - Track `isUnlocked` state (default false)
   - When `isUnlocked` is false, show PIN entry UI with numeric keypad or input
   - On correct PIN ("8807"), set `isUnlocked = true`
   - Reset `isUnlocked` to false when tab changes (pass a prop or use effect)
   - In `App.tsx`, reset payment lock when switching away from payment tab
6. **HistoryTab.tsx** - Update Edit dialog to use "Party Name" label instead of "Master Name"
