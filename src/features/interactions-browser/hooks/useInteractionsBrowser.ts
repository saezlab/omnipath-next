import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchProteinNeighborsResponse } from '../api/queries'
import { InteractionsFilters } from '../types'
import { InteractionsFilterService } from '../services/interactions-filter.service'

type Interaction = SearchProteinNeighborsResponse['interactions'][number]

interface SortState {
  sortKey: string | null
  sortDirection: 'asc' | 'desc'
}

// Helper functions
function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

function isMultiQuery(queryString: string): boolean {
  return parseQueries(queryString).length > 1
}


export function useInteractionsBrowser(data?: SearchProteinNeighborsResponse) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL-derived state
  const query = (searchParams.get('q') || '').replace(/[,;]+$/, '')
  
  // Parse filters from URL using flat query params
  const filters = useMemo((): InteractionsFilters => {
    const interactionType = searchParams.get('interactionType')?.split(',').filter(Boolean) || []
    const entityTypeSource = searchParams.get('entityTypeSource')?.split(',').filter(Boolean) || []
    const entityTypeTarget = searchParams.get('entityTypeTarget')?.split(',').filter(Boolean) || []
    const topology = searchParams.get('topology')?.split(',').filter(Boolean) || []
    const direction = searchParams.get('direction')?.split(',').filter(Boolean) || []
    const sign = searchParams.get('sign')?.split(',').filter(Boolean) || []
    const minReferences = searchParams.get('minReferences') ? Number(searchParams.get('minReferences')) : null
    const search = searchParams.get('search') || ''
    
    return {
      interactionType,
      entityTypeSource,
      entityTypeTarget,
      topology,
      direction,
      sign,
      minReferences,
      search,
    }
  }, [searchParams])
  
  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    sortKey: 'referenceCount',
    sortDirection: 'desc'
  })

  // UI state
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Get interactions from data - memoized to prevent infinite loops
  const interactions = useMemo(() => 
    data?.interactions || [],
    [data]
  )
  
  // Filter data using service
  const filteredInteractions = useMemo(() => 
    query ? InteractionsFilterService.filterData(interactions, filters, query) : [],
    [interactions, filters, query]
  )
  
  // Calculate filter counts
  const filterCounts = useMemo(() => 
    query ? InteractionsFilterService.calculateCounts(interactions, filters, query) : {
      interactionType: {},
      entityTypeSource: {},
      entityTypeTarget: {},
      topology: {},
      direction: {},
      sign: {},
    },
    [interactions, filters, query]
  )
  
  // Sorted interactions
  const processedInteractions = useMemo(() => {
    if (!sortState.sortKey) return filteredInteractions
    
    return [...filteredInteractions].sort((a, b) => {
      const valA = InteractionsFilterService.getReferenceCount(a)
      const valB = InteractionsFilterService.getReferenceCount(b)
      
      if (valA < valB) return sortState.sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortState.sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredInteractions, sortState])
  
  // Reset sort when data changes
  useEffect(() => {
    if (data && query) {
      setSortState({
        sortKey: 'referenceCount',
        sortDirection: 'desc'
      })
    }
  }, [data, query])
  
  // Update filter function
  const updateFilter = useCallback((key: keyof InteractionsFilters, value: string | boolean | null | number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (key === "minReferences") {
      const numValue = Number(value) || null
      if (numValue !== null && numValue > 0) {
        params.set('minReferences', numValue.toString())
      } else {
        params.delete('minReferences')
      }
    } else if (key === "search") {
      const stringValue = value as string
      if (stringValue && stringValue.length > 0) {
        params.set('search', stringValue)
      } else {
        params.delete('search')
      }
    } else {
      // All other filters are array-based
      const currentValues = filters[key] as string[]
      const newValues = currentValues.includes(value as string)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as string]
      
      if (newValues.length > 0) {
        params.set(key, newValues.join(','))
      } else {
        params.delete(key)
      }
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [filters, searchParams, router])
  
  // Clear filters function
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Remove all filter-related params
    params.delete('interactionType')
    params.delete('entityTypeSource')
    params.delete('entityTypeTarget')
    params.delete('topology')
    params.delete('direction')
    params.delete('sign')
    params.delete('minReferences')
    params.delete('search')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  
  // Sort change function
  const handleSortChange = useCallback((key: string | null, direction: 'asc' | 'desc' | null) => {
    setSortState({
      sortKey: key,
      sortDirection: direction as 'asc' | 'desc'
    })
  }, [])
  
  // Interaction selection functions
  const handleSelectInteraction = useCallback((interaction: Interaction) => {
    setSelectedInteraction(interaction)
    setIsDetailsOpen(true)
  }, [])
  
  const closeDetails = useCallback(() => {
    setIsDetailsOpen(false)
  }, [])

  const setIsDetailsOpenWrapper = useCallback((open: boolean) => {
    setIsDetailsOpen(open)
  }, [])
  
  return {
    // Data
    query,
    filters,
    interactions,
    filteredInteractions,
    processedInteractions,
    filterCounts,
    isLoading: !data,
    
    // Filter functions
    updateFilter,
    clearFilters,
    
    // Sort functions
    sortState,
    handleSortChange,
    
    // UI state and functions
    selectedInteraction,
    isDetailsOpen,
    handleSelectInteraction,
    closeDetails,
    setIsDetailsOpen: setIsDetailsOpenWrapper,
    
    // Helper functions
    isMultiQuery: isMultiQuery(query),
    parseQueries: parseQueries(query),
  }
}