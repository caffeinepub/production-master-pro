# Production Master Pro

## Current State
- App has tabs: Entry, History, Master Report, Article Report, Payment, Tailor, Overlock
- Backend: ProductionRecords, TailorRecords, OverlockRecords
- TailorTab validates against total cutting quantity from ProductionRecords
- EntryTab has a "Calculation Result" section at top
- Fields use "Cut by Master PCS" label

## Requested Changes (Diff)

### Add
- New **Item Master** tab (replaces Article Report tab position/name) for creating articles before any tailor entry
  - Fields: Article Number, Total Quantity, Size-wise Ratio (S/M/L/XL/XXL quantities)
  - Validation: sum of size quantities must equal Total Quantity
  - History with Edit/Delete
- New **Dispatch** tab
  - Fields: Article Number (dropdown from Item Master), Remaining Quantity (auto), Dispatch Quantity, Sale Price, Percentage
  - Formula: Final Payment = Dispatch Quantity × Sale Price × Percentage / 100
  - Validation: Dispatch Quantity must not exceed Remaining Quantity
  - History with Edit/Delete
- Backend: ItemMaster and DispatchRecord data types and CRUD functions
- Backend: size-wise quantity tracking per article (deducted by tailor entries by size)

### Modify
- Rename "Article Report" tab to "Item Master"
- Remove "Calculation Result" display from top section of Entry tab
- Rename field label "Cut by Master PCS" to "Total Quantity" in Entry/related tabs
- TailorTab: validate entries against Item Master size-wise quantities (not production records), block if article not in Item Master
- BottomNav and App.tsx: add Item Master and Dispatch tabs, remove old Article Report tab

### Remove
- "Calculation Result" section from EntryTab header/top area
- ArticleReportTab (replaced by ItemMasterTab)

## Implementation Plan
1. Update backend (main.mo) to add ItemMaster and DispatchRecord types, CRUD, and size-wise remaining quantity queries
2. Update App.tsx tabs list (add item_master and dispatch, remove article_report)
3. Update BottomNav with new tabs
4. Create ItemMasterTab component
5. Create DispatchTab component
6. Update TailorTab to validate against ItemMaster size quantities
7. Update EntryTab to remove Calculation Result section and rename field labels
8. Remove ArticleReportTab usage
