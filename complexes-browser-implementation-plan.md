# Plan for Implementing Complexes Browser

## Overview
Create a complexes browser feature that allows users to search and explore protein complexes data, following the same architecture as the intercell browser.

## Database Schema
The complexes table contains:
- **id**: Primary key
- **name**: Complex name
- **components**: Component proteins
- **componentsGenesymbols**: Gene symbols of components
- **stoichiometry**: Stoichiometric information
- **sources**: Data sources
- **references**: Literature references
- **identifiers**: External identifiers

## Implementation Steps

### 1. **Create Types Definition** (`src/features/complexes-browser/types.ts`)
```typescript
export interface ComplexEntry {
  id: number
  name: string | null
  components: string | null
  componentsGenesymbols: string | null
  stoichiometry: string | null
  sources: string | null
  references: string | null
  identifiers: string | null
}

export interface ComplexesFilters {
  sources: string[]
  hasName: boolean | null
  hasStoichiometry: boolean | null
  componentCount: number | null
  searchTerm: string
}
```

### 2. **Create API Queries** (`src/features/complexes-browser/api/queries.ts`)
- `getComplexesData()` - fetch complexes containing searched proteins
- Parse components/componentsGenesymbols to match against search results
- Return matching complexes

### 3. **Create Complexes Table Component** (`src/features/complexes-browser/components/complexes-table.tsx`)
- Display complex information in a table format
- Show: Name, Components (as gene symbols), Stoichiometry, Sources
- Parse and display components as badges or chips
- Export functionality for TSV/CSV

### 4. **Create Filter Sidebar** (`src/features/complexes-browser/components/filter-sidebar.tsx`)
Filters to implement:
- **Sources**: Dynamic list from data
- **Has Name**: Filter complexes with/without names
- **Has Stoichiometry**: Filter by stoichiometry presence
- **Component Count**: Filter by number of components
- **Search Term**: Search within complex names and components

### 5. **Create Main Browser Component** (`src/features/complexes-browser/components/complexes-browser.tsx`)
- Fetch data when query changes
- Client-side filtering only
- Parse components field to match against searched proteins
- Handle URL parameters for filters
- Integrate with filter context

### 6. **Update Filter Context** (`src/contexts/filter-context.tsx`)
- Add `ComplexesFilterProps` interface
- Include complexes in `FilterContextValue` union type
- Support complexes filter data

### 7. **Add Complexes Tab to Search Page** (`src/features/search/search-page.tsx`)
- Add "Complexes" tab to the tabs list
- Import and render `ComplexesBrowser` component
- Update placeholder text for complexes search

### 8. **Update App Sidebar** (`src/components/layout/app-sidebar.tsx`)
- Import `ComplexesFilterSidebar`
- Add condition to render complexes filters
- Update history item handling for complexes type

### 9. **Update Search Store Types** (`src/types/chat.ts`)
- Add 'complexes' to SearchHistoryItem type union

## Special Considerations

### Parsing Components
Since components are stored as text fields, we need to:
1. Parse the `components` field (likely comma or semicolon separated)
2. Parse the `componentsGenesymbols` field similarly
3. Match these against the searched protein identifiers

### Stoichiometry Display
- Parse stoichiometry information if structured
- Display in a user-friendly format (e.g., "2:1:1" or as badges)

### Complex Matching Logic
When a user searches for a protein:
1. Find all complexes where the protein appears in `components` or `componentsGenesymbols`
2. Highlight the searched protein within the complex
3. Show all components of matching complexes

## UI/UX Enhancements
1. **Component Pills**: Display each component as a clickable pill/badge
2. **Stoichiometry Visualization**: Show stoichiometry ratios visually if possible
3. **Expandable Rows**: Allow expanding to see full details including references
4. **Component Search**: Enable searching for specific components within results

## File Structure
```
src/features/complexes-browser/
├── api/
│   └── queries.ts
├── components/
│   ├── complexes-browser.tsx
│   ├── complexes-table.tsx
│   └── filter-sidebar.tsx
└── types.ts
```

This implementation will provide a fully functional complexes browser with client-side filtering, consistent with the existing intercell and annotations browsers.