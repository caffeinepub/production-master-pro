# Production Master Pro

## Current State
The app has 7 tabs: Entry, History, Master Report, Article Report, Payment, Tailor, Overlock.
- Tailor and Overlock tabs have edit functionality per record (delete + re-add pattern).
- Production History (HistoryTab) has delete only, no edit.
- Article Report shows total pcs per article with a progress bar, plus a summary card showing grand total.
- WhatsApp sharing in Tailor/Overlock sends an overall summary (total pcs + total amount for the person), not broken down by article.

## Requested Changes (Diff)

### Add
- Edit button on every Production History record card (opens an edit dialog, same delete+re-add pattern used in Tailor/Overlock).
- Article-wise WhatsApp message: when sharing to an employee/tailor via WhatsApp, include a breakdown per article (article no, pcs, amount) in the message body.

### Modify
- HistoryTab: add Edit button alongside Delete, and an edit Dialog with all production record fields pre-filled.
- TailorTab shareOnWhatsApp: build per-article breakdown from filteredRecords for the given tailor name.
- OverlockTab shareOnWhatsApp: build per-article breakdown from filteredRecords for the given employee name.
- ArticleReportTab: the total production summary card is already there; ensure it is prominent and clearly labeled.

### Remove
- Nothing removed.

## Implementation Plan
1. HistoryTab: add `editingRecord` state, `editForm` state, `editSaving` state. Add pencil button to RecordCard. Wire up Edit Dialog with all fields (date, articleNo, masterName, dispatchedPcs, cutByMaster, rate, percentage). Edit saves by calling deleteRecord then addRecord.
2. TailorTab: update `shareOnWhatsApp` function to accept an `articleBreakdown` parameter (array of [articleNo, qty, amount]). Build this breakdown from filteredRecords filtered by tailor name. Include formatted breakdown in WhatsApp message.
3. OverlockTab: same as TailorTab but for employee name.
4. ArticleReportTab: verify total production summary card is clear; no structural changes needed.
