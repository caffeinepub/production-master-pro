# Production Master Pro

## Current State
The app has Entry, History, Party Head (Master Report), Article Report, Payment, Tailor, and Overlock tabs. All text input fields (Party Name, Article Number, Size, etc.) are plain `<input>` elements with no autocomplete or dropdown behavior.

## Requested Changes (Diff)

### Add
- A reusable `SearchableDropdown` component that:
  - Shows a text input with a dropdown arrow icon on the right
  - On focus/click, opens a dropdown list of previously saved values from localStorage
  - Allows typing to filter/search existing options
  - Shows an "Add new" option when typed value is not in the list
  - On selecting "Add new", saves the new value to localStorage for future use
  - Keyboard navigable and scrollable
- A `useDropdownOptions` hook to read/write option lists per field key from localStorage

### Modify
- EntryTab: Replace plain inputs for Party Name and Article Number with `SearchableDropdown`
- TailorTab: Replace plain inputs for Party Name (if present), Article Number, and Size with `SearchableDropdown`
- OverlockTab: Replace plain inputs for Employee Name, Article Number, and Size with `SearchableDropdown`

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/hooks/useDropdownOptions.ts` — manages localStorage option lists per key
2. Create `src/frontend/src/components/SearchableDropdown.tsx` — reusable combobox UI
3. Update EntryTab to use SearchableDropdown for Party Name and Article Number
4. Update TailorTab to use SearchableDropdown for Article Number and Size
5. Update OverlockTab to use SearchableDropdown for Employee Name, Article Number, and Size
6. Validate (lint + typecheck + build) and fix any errors
