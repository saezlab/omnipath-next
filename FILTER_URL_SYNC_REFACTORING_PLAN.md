# Filter/URL Sync Refactoring Plan

## Current Architecture Overview
- **Server Component** (`search/page.tsx`): Fetches all data based on query
- **Client Component** (`SearchTabs`): Manages tab switching, passes data to browsers
- **Browser Components**: Client-side components that filter pre-fetched data locally
- **Issue**: Filtering logic is embedded within browser components, making them complex

## Key Improvements
1. **Extract filtering logic** into separate pure functions/hooks
2. **Simplify URL structure** - use flat query params instead of JSON
3. **Standardize filter handling** across all browsers
4. **Add debouncing** for text-based filters
5. **Centralize filter state management**

## New Architecture

```
┌─────────────────┐
│  Server Page    │ ← Fetches all data
└────────┬────────┘
         │
┌────────▼────────┐
│   SearchTabs    │ ← Passes data down
└────────┬────────┘
         │
┌────────▼────────┐
│  Browser Hook   │ ← Manages filters & filtering (NEW)
│  useXxxBrowser  │
└────────┬────────┘
         │
┌────────▼────────┐
│ Browser Component│ ← Pure presentation
└─────────────────┘
```

## Implementation Plan

### Phase 1: Create Filter Infrastructure

#### 1.1 Filter Service Layer
```typescript
// services/filters/annotations-filter.service.ts
export class AnnotationsFilterService {
  static filterData(
    data: Annotation[], 
    filters: AnnotationFilters
  ): Annotation[] {
    return data.filter(item => {
      // All filtering logic extracted here
      if (filters.sources?.length > 0) {
        if (!filters.sources.includes(item.source)) return false
      }
      // ... more filter logic
      return true
    })
  }
  
  static calculateCounts(data: Annotation[]): FilterCounts {
    // Calculate all filter counts
    return {
      sources: {},
      types: {},
      // ...
    }
  }
}
```

#### 1.2 Custom Hook per Browser
```typescript
// hooks/browsers/useAnnotationsBrowser.ts
export function useAnnotationsBrowser(data?: AnnotationsData) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Parse filters from URL
  const filters = useMemo(() => ({
    sources: searchParams.get('sources')?.split(',').filter(Boolean) || [],
    types: searchParams.get('types')?.split(',').filter(Boolean) || [],
    search: searchParams.get('search') || ''
  }), [searchParams])
  
  // Filter data using service
  const filteredData = useMemo(() => 
    data ? AnnotationsFilterService.filterData(data.annotations, filters) : [],
    [data, filters]
  )
  
  // Calculate counts
  const filterCounts = useMemo(() => 
    data ? AnnotationsFilterService.calculateCounts(data.annotations) : {},
    [data]
  )
  
  // Update filter function
  const updateFilter = useCallback((key: string, value: any) => {
    const params = new URLSearchParams(searchParams)
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','))
      } else {
        params.delete(key)
      }
    } else if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`?${params.toString()}`)
  }, [searchParams, router])
  
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    // Keep only q and tab
    const q = params.get('q')
    const tab = params.get('tab')
    params.clear()
    if (q) params.set('q', q)
    if (tab) params.set('tab', tab)
    router.push(`?${params.toString()}`)
  }, [searchParams, router])
  
  return {
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters,
    isLoading: !data
  }
}
```

#### 1.3 Simplified Browser Component
```typescript
// components/annotations-browser.tsx
export function AnnotationsBrowser({ data }: Props) {
  const {
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters
  } = useAnnotationsBrowser(data)
  
  // Only UI state remains here
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Component is now purely presentational
  return (
    <div>
      {filteredData.length > 0 ? (
        <AnnotationsTable data={filteredData} />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
```

### Phase 2: Shared Utilities

#### 2.1 Generic Filter Hook Factory
```typescript
// hooks/createFilterHook.ts
export function createFilterHook<TData, TFilters>({
  filterService,
  parseUrlFilters,
  serializeFilters
}: FilterHookConfig<TData, TFilters>) {
  return function useFilter(data?: TData[]) {
    const searchParams = useSearchParams()
    const router = useRouter()
    
    const filters = useMemo(() => 
      parseUrlFilters(searchParams),
      [searchParams]
    )
    
    const filteredData = useMemo(() =>
      data ? filterService.filterData(data, filters) : [],
      [data, filters]
    )
    
    // ... common logic
    
    return { filters, filteredData, updateFilter, clearFilters }
  }
}
```

#### 2.2 Debounced Text Filter Component
```typescript
// components/shared/DebouncedSearchFilter.tsx
export function DebouncedSearchFilter({ 
  value, 
  onChange, 
  placeholder,
  delay = 300 
}: Props) {
  const [localValue, setLocalValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)
  
  useEffect(() => {
    if (localValue === value) return
    
    setIsDebouncing(true)
    const timer = setTimeout(() => {
      onChange(localValue)
      setIsDebouncing(false)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [localValue, value, onChange, delay])
  
  return (
    <div className="relative">
      <input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
      />
      {isDebouncing && <Spinner />}
    </div>
  )
}
```

### Phase 3: URL Structure Standardization

#### Before (Complex JSON)
```
?q=EGFR&tab=annotations&annotations_filters={"sources":["GO","KEGG"],"types":["function"]}
```

#### After (Simple flat params)
```
?q=EGFR&tab=annotations&sources=GO,KEGG&types=function&search=kinase
```

#### Benefits:
- Human-readable URLs
- Easier to share
- Smaller URL size
- Better SEO
- Simpler parsing logic

### Phase 4: Filter Services for Each Browser

#### 4.1 Annotations Filter Service
```typescript
// services/filters/annotations-filter.service.ts
- filterBySources()
- filterByTypes()
- filterBySearch()
- calculateSourceCounts()
- calculateTypeCounts()
```

#### 4.2 Interactions Filter Service
```typescript
// services/filters/interactions-filter.service.ts
- filterByInteractionType()
- filterByTopology()
- filterByDirection()
- filterBySign()
- filterByMinReferences()
- calculateInteractionCounts()
```

#### 4.3 Complexes Filter Service
```typescript
// services/filters/complexes-filter.service.ts
- filterBySources()
- parseComplexData()
- calculateComplexCounts()
```

#### 4.4 EnzSub Filter Service
```typescript
// services/filters/enzsub-filter.service.ts
- filterBySources()
- filterByResidueTypes()
- filterByModifications()
- calculateModificationCounts()
```

#### 4.5 Intercell Filter Service
```typescript
// services/filters/intercell-filter.service.ts
- filterByAspects()
- filterByBooleanFields()
- calculateAspectCounts()
```

### Phase 5: Context Simplification

Update the FilterContext to work with the new architecture:

```typescript
// contexts/filter-context.tsx
interface FilterContextValue {
  filters: Record<string, any>
  counts: Record<string, any>
  updateFilter: (key: string, value: any) => void
  clearFilters: () => void
  activeTab: string
}
```

## File Structure

```
src/
├── features/
│   ├── annotations-browser/
│   │   ├── components/
│   │   │   └── annotations-browser.tsx (simplified)
│   │   ├── hooks/
│   │   │   └── useAnnotationsBrowser.ts (NEW)
│   │   └── services/
│   │       └── annotations-filter.service.ts (NEW)
│   ├── interactions-browser/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── [other browsers...]
├── hooks/
│   ├── createFilterHook.ts (NEW)
│   └── useDebounceFilter.ts (NEW)
└── utils/
    └── url-filters.ts (NEW)
```

## Migration Strategy

### Step 1: Pilot with Simplest Browser
1. Start with `ComplexesBrowser` (least complex filtering)
2. Extract filtering logic to service
3. Create custom hook
4. Simplify component
5. Test thoroughly

### Step 2: Gradual Rollout
1. Apply pattern to each browser one by one

### Step 3: Cleanup
1. Remove old filter parsing code
2. Delete unused utilities