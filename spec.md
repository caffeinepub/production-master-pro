# Production Master Pro

## Current State
TailorTab has an add-record form where tailors enter article number, quantity stitched, rate, etc. Production records in EntryTab store `cutByMaster` (total cutting quantity assigned to party head) per article. There is no linkage between tailor stitching entries and the total cutting quantity from production records.

## Requested Changes (Diff)

### Add
- When an article number is selected/entered in the Tailor form, automatically look up total `cutByMaster` from all production records matching that article.
- Compute total pieces already stitched by all tailors for that article (sum of tailor record quantities).
- Compute and display "Remaining Cutting" = totalCutByMaster - totalStitched.
- Show an info card in the Tailor add-form showing: Total Cut by Master, Already Stitched, Remaining pieces for the selected article.
- Validation: block saving if quantity entered > remaining cutting quantity; show clear error message.

### Modify
- TailorTab validate() function: add check for quantity vs remaining cutting.
- TailorTab form: after article selection, fetch/compute remaining and show info banner.

### Remove
- Nothing removed.

## Implementation Plan
1. In TailorTab.tsx, import and use `useGetRecords` to fetch production records.
2. Derive `articleCuttingMap`: for each articleNo, sum `cutByMaster` across all production records.
3. Derive `articleStitchedMap`: for each articleNo, sum `quantity` across all tailor records.
4. When `form.articleNo` is set, compute `remainingCutting = articleCuttingMap[articleNo] - articleStitchedMap[articleNo]`.
5. Render an info banner below the Article No field showing the cutting stats (only when articleNo matches a production record).
6. In validate(), if `remainingCutting >= 0` and `quantity > remainingCutting`, add error "Cannot exceed remaining cutting of X pcs".
