"use client"

import { TableSkeleton } from "@/components/table-skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { searchProteinNeighbors, SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { searchIdentifiers } from "@/db/queries"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { InteractionResultsTable } from "@/features/interactions-browser/components/results-table"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { Search } from "lucide-react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

// Constants
const INTERACTIONS_PER_LOAD = 30

// Types
interface InteractionsBrowserProps {
  onEntitySelect?: (entityName: string) => void
  isLoading?: boolean
}

interface FilterCounts {
  interactionType: Record<string, number>
  entityTypeSource: Record<string, number>
  entityTypeTarget: Record<string, number>
  isDirected: { true: number; false: number }
  isStimulation: { true: number; false: number }
  isInhibition: { true: number; false: number }
  isUpstream: { true: number; false: number }
  isDownstream: { true: number; false: number }
}

interface InteractionState {
  interactions: SearchProteinNeighborsResponse['interactions']
  loadedInteractions: SearchProteinNeighborsResponse['interactions']
  hasMoreInteractions: boolean
  isLoading: boolean
  isLoadingMore: boolean
}

interface SortState {
  sortKey: string | null
  sortDirection: 'asc' | 'desc'
}

type Interaction = SearchProteinNeighborsResponse['interactions'][number]

// Utility functions
function getDefaultFilters(): InteractionsFilters {
  return {
    interactionType: [],
    entityTypeSource: [],
    entityTypeTarget: [],
    isDirected: null,
    isStimulation: null,
    isInhibition: null,
    isUpstream: null,
    isDownstream: null,
    minReferences: null,
  }
}

function parseFiltersFromUrl(filtersParam: string | null): InteractionsFilters {
  if (!filtersParam) return getDefaultFilters()
  try {
    return JSON.parse(filtersParam) as InteractionsFilters
  } catch {
    return getDefaultFilters()
  }
}

function getReferenceCount(interaction: Interaction): number {
  return interaction.references ? interaction.references.split(';').length : 0
}

function isUpstreamInteraction(interaction: Interaction, queryUpper: string): boolean {
  return interaction.isDirected === true && 
    (interaction.target === queryUpper || interaction.targetGenesymbol === queryUpper)
}

function isDownstreamInteraction(interaction: Interaction, queryUpper: string): boolean {
  return interaction.isDirected === true && 
    (interaction.source === queryUpper || interaction.sourceGenesymbol === queryUpper)
}

function applyFilter(
  interaction: Interaction,
  filterType: keyof InteractionsFilters,
  filterValue: any,
  queryUpper: string
): boolean {
  switch (filterType) {
    case 'interactionType':
      return filterValue.length === 0 || filterValue.includes(interaction.type || "")
    case 'entityTypeSource':
      return filterValue.length === 0 || filterValue.includes(interaction.entityTypeSource || "")
    case 'entityTypeTarget':
      return filterValue.length === 0 || filterValue.includes(interaction.entityTypeTarget || "")
    case 'isDirected':
      return filterValue === null || interaction.isDirected === filterValue
    case 'isStimulation':
      return filterValue === null || interaction.consensusStimulation === filterValue
    case 'isInhibition':
      return filterValue === null || interaction.consensusInhibition === filterValue
    case 'isUpstream':
      return filterValue === null || isUpstreamInteraction(interaction, queryUpper) === filterValue
    case 'isDownstream':
      return filterValue === null || isDownstreamInteraction(interaction, queryUpper) === filterValue
    case 'minReferences':
      return filterValue === null || getReferenceCount(interaction) >= filterValue
    default:
      return true
  }
}

function passesFilters(
  interaction: Interaction,
  filters: InteractionsFilters,
  query: string
): boolean {
  const queryUpper = query.toUpperCase()
  return Object.entries(filters).every(([key, value]) => 
    applyFilter(interaction, key as keyof InteractionsFilters, value, queryUpper)
  )
}

function passesFiltersExcept(
  interaction: Interaction,
  filters: InteractionsFilters,
  query: string,
  excluded: (keyof InteractionsFilters)[]
): boolean {
  const queryUpper = query.toUpperCase()
  return Object.entries(filters).every(([key, value]) => {
    if (excluded.includes(key as keyof InteractionsFilters)) return true
    return applyFilter(interaction, key as keyof InteractionsFilters, value, queryUpper)
  })
}

export function InteractionsBrowser({ 
  onEntitySelect,
}: InteractionsBrowserProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  const lastSearchedQuery = useRef('')
  
  // URL-derived state
  const interactionsQuery = searchParams.get('q') || ''
  const interactionsFilters = useMemo(() => 
    parseFiltersFromUrl(searchParams.get('interactions_filters')), 
    [searchParams]
  )

  // Interaction state
  const [interactionState, setInteractionState] = useState<InteractionState>({
    interactions: [],
    loadedInteractions: [],
    hasMoreInteractions: true,
    isLoading: false,
    isLoadingMore: false,
  })

  // UI state
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [filterVersion, setFilterVersion] = useState(0)

  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    sortKey: 'referenceCount',
    sortDirection: 'desc'
  })

  // Fetch interactions when query changes
  useEffect(() => {
    if (interactionsQuery && interactionsQuery !== lastSearchedQuery.current) {
      lastSearchedQuery.current = interactionsQuery
      
      const fetchData = async () => {
        setInteractionState(prev => ({ ...prev, isLoading: true }))
        try {
          console.log(`Fetching identifier results for: "${interactionsQuery}" with species: 9606`);
          const identifierResults = await searchIdentifiers(interactionsQuery, 50, '9606');
          const interactionsResponse = await searchProteinNeighbors(identifierResults)
          
          setInteractionState({
            interactions: interactionsResponse.interactions,
            loadedInteractions: [],
            hasMoreInteractions: interactionsResponse.interactions.length > INTERACTIONS_PER_LOAD,
            isLoading: false,
            isLoadingMore: false,
          })
          
          setSortState({
            sortKey: 'referenceCount',
            sortDirection: 'desc'
          })
          
          if (onEntitySelect) onEntitySelect(interactionsQuery)
        } catch (error) {
          console.error("Error fetching data:", error)
          setInteractionState(prev => ({ ...prev, isLoading: false }))
        }
      }
      fetchData()
    }
  }, [interactionsQuery, onEntitySelect])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      interactionType: {},
      entityTypeSource: {},
      entityTypeTarget: {},
      isDirected: { true: 0, false: 0 },
      isStimulation: { true: 0, false: 0 },
      isInhibition: { true: 0, false: 0 },
      isUpstream: { true: 0, false: 0 },
      isDownstream: { true: 0, false: 0 },
    }

    const queryUpper = interactionsQuery.toUpperCase()
    interactionState.interactions.forEach((interaction) => {
      // Count for array-based filters (excluding the filter being counted)
      if (passesFiltersExcept(interaction, interactionsFilters, interactionsQuery, ['interactionType']) && interaction.type) {
        counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1
      }
      if (passesFiltersExcept(interaction, interactionsFilters, interactionsQuery, ['entityTypeSource']) && interaction.entityTypeSource) {
        counts.entityTypeSource[interaction.entityTypeSource] = (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1
      }
      if (passesFiltersExcept(interaction, interactionsFilters, interactionsQuery, ['entityTypeTarget']) && interaction.entityTypeTarget) {
        counts.entityTypeTarget[interaction.entityTypeTarget] = (counts.entityTypeTarget[interaction.entityTypeTarget] || 0) + 1
      }
      
      // Count for boolean filters (include all matching interactions)
      if (passesFilters(interaction, interactionsFilters, interactionsQuery)) {
        if (interaction.isDirected !== undefined) {
          counts.isDirected[interaction.isDirected ? 'true' : 'false']++
        }
        if (interaction.consensusStimulation !== undefined) {
          counts.isStimulation[interaction.consensusStimulation ? 'true' : 'false']++
        }
        if (interaction.consensusInhibition !== undefined) {
          counts.isInhibition[interaction.consensusInhibition ? 'true' : 'false']++
        }
        
        const upstream = isUpstreamInteraction(interaction, queryUpper)
        const downstream = isDownstreamInteraction(interaction, queryUpper)
        counts.isUpstream[upstream ? 'true' : 'false']++
        counts.isDownstream[downstream ? 'true' : 'false']++
      }
    })
    return counts
  }, [interactionState.interactions, interactionsFilters, interactionsQuery])

  // Filtered and sorted interactions
  const processedInteractions = useMemo(() => {
    const filtered = interactionState.interactions.filter(i => 
      passesFilters(i, interactionsFilters, interactionsQuery)
    )
    
    if (!sortState.sortKey) return filtered
    
    return [...filtered].sort((a, b) => {
      const valA = getReferenceCount(a)
      const valB = getReferenceCount(b)
      
      if (valA < valB) return sortState.sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortState.sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [interactionState.interactions, interactionsFilters, interactionsQuery, sortState])

  // Infinite scroll
  const loadMoreInteractions = useCallback(() => {
    if (!interactionState.hasMoreInteractions || interactionState.isLoadingMore) return
    
    setInteractionState(prev => ({ ...prev, isLoadingMore: true }))
    
    const nextBatch = processedInteractions.slice(
      interactionState.loadedInteractions.length,
      interactionState.loadedInteractions.length + INTERACTIONS_PER_LOAD
    )
    
    if (nextBatch.length === 0) {
      setInteractionState(prev => ({ 
        ...prev, 
        hasMoreInteractions: false, 
        isLoadingMore: false 
      }))
      return
    }
    
    setInteractionState(prev => ({
      ...prev,
      loadedInteractions: [...prev.loadedInteractions, ...nextBatch],
      hasMoreInteractions: prev.loadedInteractions.length + nextBatch.length < processedInteractions.length,
      isLoadingMore: false
    }))
  }, [processedInteractions, interactionState.loadedInteractions, interactionState.hasMoreInteractions, interactionState.isLoadingMore])

  const handleSortChange = useCallback((key: string | null, direction: 'asc' | 'desc' | null) => {
    setSortState({
      sortKey: key,
      sortDirection: direction as 'asc' | 'desc'
    })
    setInteractionState(prev => ({
      ...prev,
      loadedInteractions: [],
      hasMoreInteractions: true,
      isLoadingMore: false
    }))
  }, [])

  const updateUrlWithFilters = useCallback((newFilters: InteractionsFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    const hasActiveFilters = Object.values(newFilters).some(v => 
      v !== null && (Array.isArray(v) ? v.length > 0 : true)
    )
    
    if (hasActiveFilters) {
      params.set('interactions_filters', JSON.stringify(newFilters))
    } else {
      params.delete('interactions_filters')
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleFilterChange = useCallback((type: keyof InteractionsFilters, value: string | boolean | null | number) => {
    setInteractionState(prev => ({
      ...prev,
      loadedInteractions: [],
      hasMoreInteractions: true,
      isLoadingMore: false
    }))
    setFilterVersion(prev => prev + 1)
    
    const newFilters = { ...interactionsFilters }
    
    if (type === "minReferences") {
      (newFilters as any)[type] = Number(value) || null
    } else if (["isDirected","isStimulation","isInhibition","isUpstream","isDownstream"].includes(type)) {
      (newFilters as any)[type] = value as boolean | null
    } else {
      const currentValues = (newFilters as any)[type] as string[]
      ;(newFilters as any)[type] = currentValues.includes(value as string)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as string]
    }
    
    updateUrlWithFilters(newFilters)
  }, [interactionsFilters, updateUrlWithFilters])

  const clearFilters = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      loadedInteractions: [],
      hasMoreInteractions: true,
      isLoadingMore: false
    }))
    setFilterVersion(prev => prev + 1)
    updateUrlWithFilters(getDefaultFilters())
  }, [updateUrlWithFilters])

  const handleSelectInteraction = (interaction: SearchProteinNeighborsResponse['interactions'][number]) => {
    setSelectedInteraction(interaction)
    setIsDetailsOpen(true)
  }

  useEffect(() => {
    const filterContextValue = interactionsQuery ? {
      type: "interactions" as const,
      filters: interactionsFilters,
      filterCounts,
      onFilterChange: handleFilterChange,
      onClearFilters: clearFilters,
    } : null
    setFilterData(filterContextValue)
  }, [interactionsQuery, interactionsFilters, filterCounts, handleFilterChange, clearFilters, setFilterData])

  // Load initial batch when interactions change
  useEffect(() => {
    if (processedInteractions.length > 0 && (interactionState.loadedInteractions.length === 0 || filterVersion > 0)) {
      const firstBatch = processedInteractions.slice(0, INTERACTIONS_PER_LOAD)
      setInteractionState(prev => ({
        ...prev,
        loadedInteractions: firstBatch,
        hasMoreInteractions: processedInteractions.length > INTERACTIONS_PER_LOAD
      }))
    }
  }, [processedInteractions, interactionState.loadedInteractions.length, filterVersion])

  return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto p-4">
          {interactionsQuery ? (
            <div className="w-full space-y-4">

              {/* Main Content */}
              {interactionState.isLoading ? (
                <TableSkeleton rows={5} />
              ) : interactionState.interactions.length > 0 ? (
                <div className="h-[calc(100vh-12rem)]">
                  <InteractionResultsTable
                    interactions={interactionState.loadedInteractions}
                    exportData={processedInteractions}
                    onSelectInteraction={handleSelectInteraction}
                    showSearch={true}
                    searchKeys={[
                        'sourceGenesymbol', 
                        'source', 
                        'targetGenesymbol', 
                        'target', 
                        'type', 
                        'sources'
                      ]}
                    searchPlaceholder={`Search in ${processedInteractions.length} interactions...`}
                    showExport={true}
                    infiniteScroll={true}
                    hasMore={interactionState.hasMoreInteractions}
                    onLoadMore={loadMoreInteractions}
                    loadingMore={interactionState.isLoadingMore}
                    sortKey={sortState.sortKey}
                    sortDirection={sortState.sortDirection}
                    onSortChange={handleSortChange}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No interactions found</h3>
                  <p className="text-muted-foreground max-w-md">
                    No interactions found for &ldquo;{interactionsQuery}&rdquo;. Try searching for a different protein or gene.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Welcome to Interactions Browser</h3>
              <p className="text-muted-foreground max-w-md">
                Search for proteins or genes to explore their interactions.
              </p>
            </div>
          )}
        </div>

        {/* Interaction Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle>
              Interaction Details
            </DialogTitle>
            {selectedInteraction && (
              <InteractionDetails selectedInteraction={selectedInteraction} />
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}

