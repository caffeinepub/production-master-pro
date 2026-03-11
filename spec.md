# Production Master Pro

## Current State
The app has a Quote Builder tab with client name, article name, custom work fields, PDF download, and WhatsApp text sharing. Fabric consumption in Item Master supports meters or grams unit selection.

## Requested Changes (Diff)

### Add
- **Quote History / Saved Quotes section** in the Quote Builder tab: every time a quote is generated, save it to localStorage. Show a "Saved Quotes" section below the form where users can view, re-open (load into form), download PDF, share on WhatsApp, or delete old quotes.
- **Fabric Consumption in KG**: add "KG" as a unit option alongside meters and grams in Item Master and Fabric Planner. Allow decimal values (e.g. 1.25 KG).

### Modify
- **WhatsApp sharing**: keep text-based WhatsApp sharing (PDF file attachment is not possible in browser web share API without native support). Improve the shared text format to include full quote breakdown clearly.
- **Quote data structure**: each saved quote stores client name, article name, work items, total CMT, and date/time of creation.

### Remove
- Nothing removed.

## Implementation Plan
1. In `QuoteBuilderTab.tsx`: on "Generate Quotation", auto-save quote to localStorage (`sg9_saved_quotes`). Add a collapsible "Saved Quotes" section showing saved quotes as cards with View/Download/Share/Delete actions. Add a `loadQuote(quote)` function to restore a quote into the form.
2. In `ItemMasterTab.tsx` and `FabricPlannerTab.tsx`: add "KG" as third option in the fabric unit selector. Ensure decimal values are supported and stored correctly.
