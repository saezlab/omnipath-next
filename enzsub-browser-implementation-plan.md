# Plan for Implementing Enzyme-Substrate Browser

## Overview
Create an enzyme-substrate browser feature that allows users to search and explore post-translational modification data, following the same architecture as the existing browsers (intercell, annotations, complexes).

## Database Schema
The enz_sub table contains:
- **id**: Primary key
- **enzyme**: Enzyme protein identifier
- **enzymeGenesymbol**: Gene symbol of the enzyme
- **substrate**: Substrate protein identifier
- **substrateGenesymbol**: Gene symbol of the substrate
- **isoforms**: Isoform information
- **residueType**: Type of residue being modified (e.g., Ser, Thr, Tyr)
- **residueOffset**: Position of the modification
- **modification**: Type of modification (e.g., phosphorylation, ubiquitination)
- **sources**: Data sources
- **references**: Literature references
- **curationEffort**: Curation effort score
- **ncbiTaxId**: NCBI taxonomy identifier

## Implementation Steps

### 1. **Create Types Definition** (`src/features/enzsub-browser/types.ts`)
```typescript
export interface EnzSubEntry {
  id: number
  enzyme: string | null
  enzymeGenesymbol: string | null
  substrate: string | null
  substrateGenesymbol: string | null
  isoforms: string | null
  residueType: string | null
  residueOffset: number | null
  modification: string | null
  sources: string | null
  references: string | null
  curationEffort: number | null
  ncbiTaxId: number | null
}

export interface EnzSubFilters {
  sources: string[]
  residueTypes: string[]
  modifications: string[]
  hasResidueOffset: boolean | null
  curationEffortMin: number | null
  searchTerm: string
  enzymeSearch: string
  substrateSearch: string
}
```

### 2. **Create API Queries** (`src/features/enzsub-browser/api/queries.ts`)
- `getEnzSubData()` - fetch enzyme-substrate relationships for searched proteins
- Match against both enzyme and substrate identifiers (UniProt and gene symbols)
- Support filtering by modification type, residue type, and curation effort
- Return matching enzyme-substrate relationships

### 3. **Create EnzSub Table Component** (`src/features/enzsub-browser/components/enzsub-table.tsx`)
- Display enzyme-substrate relationships in a table format
- Show: Enzyme, Substrate, Modification, Residue Type, Position, Sources, Curation Effort
- Highlight searched proteins (enzyme or substrate)
- Export functionality for TSV/CSV
- Show modification details with proper formatting

### 4. **Create Filter Sidebar** (`src/features/enzsub-browser/components/filter-sidebar.tsx`)
Filters to implement:
- **Sources**: Dynamic list from data
- **Residue Types**: Filter by residue type (Ser, Thr, Tyr, etc.)
- **Modifications**: Filter by modification type (phosphorylation, etc.)
- **Has Residue Offset**: Filter entries with/without position information
- **Curation Effort**: Minimum curation effort threshold
- **Enzyme Search**: Search within enzyme identifiers
- **Substrate Search**: Search within substrate identifiers
- **General Search Term**: Search across all text fields

### 5. **Create Main Browser Component** (`src/features/enzsub-browser/components/enzsub-browser.tsx`)
- Fetch data when query changes
- Client-side filtering only
- Match searched proteins against both enzyme and substrate fields
- Handle URL parameters for filters
- Integrate with filter context
- Show role indicators (enzyme/substrate) for searched proteins

### 6. **Update Filter Context** (`src/contexts/filter-context.tsx`)
- Add `EnzSubFilterProps` interface
- Include enzsub in `FilterContextValue` union type
- Support enzsub filter data

### 7. **Add EnzSub Tab to Search Page** (`src/features/search/search-page.tsx`)
- Add "Enzyme-Substrate" tab to the tabs list
- Import and render `EnzSubBrowser` component
- Update placeholder text for enzyme-substrate search

### 8. **Update App Sidebar** (`src/components/layout/app-sidebar.tsx`)
- Import `EnzSubFilterSidebar`
- Add condition to render enzsub filters
- Update history item handling for enzsub type

### 9. **Update Search Store Types** (`src/types/chat.ts`)
- Add 'enzsub' to SearchHistoryItem type union

## Special Considerations

### Protein Role Display
Since proteins can be both enzymes and substrates:
1. Show role indicators (E/S badges) next to protein names
2. Allow filtering by role (enzyme only, substrate only, both)
3. Highlight the searched protein's role in each relationship

### Modification Details
- Parse and display modification types consistently
- Show residue position when available (e.g., "Ser123", "Thr456")
- Group related modifications or show modification pathways

### Curation Quality
- Use curation effort scores to indicate data reliability
- Provide filtering options based on curation quality
- Display curation effort as visual indicators (stars, bars)

### Search Strategy
When a user searches for a protein:
1. Find all relationships where the protein is an enzyme
2. Find all relationships where the protein is a substrate
3. Clearly indicate the role in each result
4. Allow role-specific filtering

## UI/UX Enhancements
1. **Role Badges**: Display enzyme (E) and substrate (S) badges clearly
2. **Modification Pills**: Show modification types as colored pills/badges
3. **Residue Visualization**: Format residue+position as "Ser123" style
4. **Expandable Details**: Show references and additional metadata on expand
5. **Pathway Context**: Group related modifications when possible
6. **Quality Indicators**: Visual curation effort indicators

## File Structure
```
src/features/enzsub-browser/
├── api/
│   └── queries.ts
├── components/
│   ├── enzsub-browser.tsx
│   ├── enzsub-table.tsx
│   └── filter-sidebar.tsx
└── types.ts
```

## Data Parsing Considerations
- **Sources**: Parse comma/semicolon-separated source lists
- **References**: Handle PubMed IDs and other reference formats  
- **Isoforms**: Parse isoform specifications if structured
- **Residue Info**: Combine residue type and offset for display

This implementation will provide a comprehensive enzyme-substrate browser with detailed filtering capabilities and clear visualization of protein roles in post-translational modifications, maintaining consistency with existing browser features.