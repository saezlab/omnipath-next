"use client"

import { TableSkeleton } from "@/components/table-skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { searchProteinNeighbors, SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { searchIdentifiers } from "@/db/queries"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { InteractionResultsTable } from "@/features/interactions-browser/components/results-table"
import { useSearchStore } from "@/store/search-store"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { Search } from "lucide-react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

const INTERACTIONS_PER_LOAD = 30

interface InteractionsBrowserProps {
  onEntitySelect?: (entityName: string) => void
  isLoading?: boolean
}


interface FilterCounts {
  interactionType: Record<string, number>
  curationEffort: Record<string, number>
  entityTypeSource: Record<string, number>
  entityTypeTarget: Record<string, number>
  isDirected: { true: number; false: number }
  isStimulation: { true: number; false: number }
  isInhibition: { true: number; false: number }
  isUpstream: { true: number; false: number }
  isDownstream: { true: number; false: number }
}

export function InteractionsBrowser({ 
  onEntitySelect,
}: InteractionsBrowserProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { 
    addToSearchHistory, 
    currentSearchTerm, 
    setCurrentSearchTerm,
    currentIdentifierResults,
    currentIdentifierQuery,
    currentSpeciesFilter,
    setIdentifierResults
  } = useSearchStore()
  const { setFilterData } = useFilters()
  
  // Get query from URL
  const interactionsQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const interactionsFilters = useMemo(() => {
    const filtersParam = searchParams.get('filters')
    if (!filtersParam) {
      return {
        interactionType: [],
        curationEffort: [],
        entityTypeSource: [],
        entityTypeTarget: [],
        isDirected: null,
        isStimulation: null,
        isInhibition: null,
        isUpstream: null,
        isDownstream: null,
        minReferences: null,
      } as InteractionsFilters
    }
    try {
      return JSON.parse(filtersParam) as InteractionsFilters
    } catch {
      return {
        interactionType: [],
        curationEffort: [],
        entityTypeSource: [],
        entityTypeTarget: [],
        isDirected: null,
        isStimulation: null,
        isInhibition: null,
        isUpstream: null,
        isDownstream: null,
        minReferences: null,
      } as InteractionsFilters
    }
  }, [searchParams])

  const [interactions, setInteractions] = useState<SearchProteinNeighborsResponse['interactions']>([])
  const [selectedInteraction, setSelectedInteraction] = useState<SearchProteinNeighborsResponse['interactions'][number] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const lastSearchedQuery = useRef('')
  
  // Infinite scroll state
  const [loadedInteractions, setLoadedInteractions] = useState<SearchProteinNeighborsResponse['interactions']>([])
  const [hasMoreInteractions, setHasMoreInteractions] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>('referenceCount')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Single effect to handle both sync and fetch
  useEffect(() => {
    const queryToUse = interactionsQuery || currentSearchTerm
    
    // Sync shared search term when query changes from URL
    if (interactionsQuery && interactionsQuery !== currentSearchTerm) {
      setCurrentSearchTerm(interactionsQuery)
    }
    
    // Prevent duplicate searches
    if (queryToUse && queryToUse !== lastSearchedQuery.current) {
      lastSearchedQuery.current = queryToUse
      
      const fetchData = async () => {
        setIsLoading(true)
        
        // If no URL query but we have a shared search term, update URL
        if (!interactionsQuery && currentSearchTerm) {
          const params = new URLSearchParams(searchParams.toString())
          params.set('q', currentSearchTerm)
          const newUrl = `/interactions?${params.toString()}`
          router.push(newUrl, { scroll: false })
          
          // Add to search history
          addToSearchHistory(currentSearchTerm, 'interaction', newUrl)
        }
        
        try {
          // Check if we have cached identifier results for this query
          let identifierResults = currentIdentifierResults;
          
          if (!identifierResults || currentIdentifierQuery !== queryToUse) {
            // Need to fetch identifier results
            console.log(`Fetching identifier results for: "${queryToUse}" with species: ${currentSpeciesFilter}`);
            identifierResults = await searchIdentifiers(queryToUse, 50, currentSpeciesFilter);
            setIdentifierResults(queryToUse, identifierResults);
          } else {
            console.log(`Using cached identifier results for: "${queryToUse}"`);
          }
          
          // Now use the identifier results to get interactions
          const interactionsResponse = await searchProteinNeighbors(identifierResults)
          
          setInteractions(interactionsResponse.interactions)
          
          // Reset sort to default when new data loads
          setSortKey('referenceCount')
          setSortDirection('desc')
          setLoadedInteractions([])
          setHasMoreInteractions(interactionsResponse.interactions.length > INTERACTIONS_PER_LOAD)
          
          if (onEntitySelect) {
            onEntitySelect(queryToUse)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchData()
    }
  }, [interactionsQuery, currentSearchTerm, currentIdentifierResults, currentIdentifierQuery, currentSpeciesFilter, onEntitySelect, searchParams, router, addToSearchHistory, setCurrentSearchTerm, setIdentifierResults])

  // Calculate filter counts from interactions
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      interactionType: {},
      curationEffort: {},
      entityTypeSource: {},
      entityTypeTarget: {},
      isDirected: { true: 0, false: 0 },
      isStimulation: { true: 0, false: 0 },
      isInhibition: { true: 0, false: 0 },
      isUpstream: { true: 0, false: 0 },
      isDownstream: { true: 0, false: 0 },
    }

    // Helper function to filter interactions based on all filters except specified ones
    const filterInteractionsExcept = (excludedFilters: (keyof InteractionsFilters)[]) => {
      return interactions.filter((interaction) => {
        // Filter by interaction type
        if (!excludedFilters.includes('interactionType') &&
            interactionsFilters.interactionType && 
            interactionsFilters.interactionType.length > 0 && 
            !interactionsFilters.interactionType.includes(interaction.type || '')) {
          return false
        }


        // Filter by source entity type
        if (!excludedFilters.includes('entityTypeSource') &&
            interactionsFilters.entityTypeSource && 
            interactionsFilters.entityTypeSource.length > 0 && 
            !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource || '')) {
          return false
        }

        // Filter by target entity type
        if (!excludedFilters.includes('entityTypeTarget') &&
            interactionsFilters.entityTypeTarget && 
            interactionsFilters.entityTypeTarget.length > 0 && 
            !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget || '')) {
          return false
        }

        // Filter by direction
        if (!excludedFilters.includes('isDirected') &&
            interactionsFilters.isDirected !== null && 
            interaction.isDirected !== interactionsFilters.isDirected) {
          return false
        }

        // Filter by stimulation
        if (!excludedFilters.includes('isStimulation') &&
            interactionsFilters.isStimulation !== null && 
            interaction.consensusStimulation !== interactionsFilters.isStimulation) {
          return false
        }

        // Filter by inhibition
        if (!excludedFilters.includes('isInhibition') &&
            interactionsFilters.isInhibition !== null && 
            interaction.consensusInhibition !== interactionsFilters.isInhibition) {
          return false
        }

        // Filter by minimum references
        const referenceCount = interaction.references ? interaction.references.split(";").length : 0
        if (!excludedFilters.includes('minReferences') &&
            interactionsFilters.minReferences !== null && 
            referenceCount < interactionsFilters.minReferences) {
          return false
        }

        // Filter by upstream/downstream based on query protein position
        const queryUpper = interactionsQuery.toUpperCase()
        const isUpstream = interaction.isDirected === true && (interaction.target === queryUpper || interaction.targetGenesymbol === queryUpper)
        const isDownstream = interaction.isDirected === true && (interaction.source === queryUpper || interaction.sourceGenesymbol === queryUpper)
        
        if (!excludedFilters.includes('isUpstream') &&
            interactionsFilters.isUpstream !== null && 
            isUpstream !== interactionsFilters.isUpstream) {
          return false
        }
        if (!excludedFilters.includes('isDownstream') &&
            interactionsFilters.isDownstream !== null && 
            isDownstream !== interactionsFilters.isDownstream) {
          return false
        }

        return true
      })
    }

    // Count interaction types excluding interaction type filter
    const interactionTypeInteractions = filterInteractionsExcept(['interactionType'])
    interactionTypeInteractions.forEach((interaction) => {
      if (interaction.type) {
        counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1
      }
    })

    // Count source entity types excluding source entity type filter
    const sourceEntityInteractions = filterInteractionsExcept(['entityTypeSource'])
    sourceEntityInteractions.forEach((interaction) => {
      if (interaction.entityTypeSource) {
        counts.entityTypeSource[interaction.entityTypeSource] = (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1
      }
    })

    // Count target entity types excluding target entity type filter
    const targetEntityInteractions = filterInteractionsExcept(['entityTypeTarget'])
    targetEntityInteractions.forEach((interaction) => {
      if (interaction.entityTypeTarget) {
        counts.entityTypeTarget[interaction.entityTypeTarget] = (counts.entityTypeTarget[interaction.entityTypeTarget] || 0) + 1
      }
    })

    // Count all other properties using all filters
    const allFilteredInteractions = filterInteractionsExcept([])
    allFilteredInteractions.forEach((interaction) => {

      // Count curation effort
      if (interaction.curationEffort) {
        counts.curationEffort[interaction.curationEffort] = (counts.curationEffort[interaction.curationEffort] || 0) + 1
      }


      // Count boolean properties
      if (interaction.isDirected !== undefined) {
        counts.isDirected[interaction.isDirected?.toString() as 'true' | 'false']++
      }
      if (interaction.consensusStimulation !== undefined) {
        counts.isStimulation[interaction.consensusStimulation?.toString() as 'true' | 'false']++
      }
      if (interaction.consensusInhibition !== undefined) {
        counts.isInhibition[interaction.consensusInhibition?.toString() as 'true' | 'false']++
      }

      // Calculate and count upstream/downstream based on query protein position
      const queryUpper = interactionsQuery.toUpperCase()
      const isUpstream = interaction.isDirected === true && (interaction.target === queryUpper || interaction.targetGenesymbol === queryUpper)
      const isDownstream = interaction.isDirected === true && (interaction.source === queryUpper || interaction.sourceGenesymbol === queryUpper)
      counts.isUpstream[isUpstream.toString() as 'true' | 'false']++
      counts.isDownstream[isDownstream.toString() as 'true' | 'false']++
    })

    return counts
  }, [interactions, interactionsFilters, interactionsQuery])

  // Filter all interactions based on selected filters (for determining what to load)
  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      // Filter by interaction type
      if (interactionsFilters.interactionType && interactionsFilters.interactionType.length > 0 && !interactionsFilters.interactionType.includes(interaction.type || '')) {
        return false
      }


      // Filter by source entity type
      if (interactionsFilters.entityTypeSource && interactionsFilters.entityTypeSource.length > 0 && !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource || '')) {
        return false
      }

      // Filter by target entity type
      if (interactionsFilters.entityTypeTarget && interactionsFilters.entityTypeTarget.length > 0 && !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget || '')) {
        return false
      }

      // Filter by direction
      if (interactionsFilters.isDirected !== null && interaction.isDirected !== interactionsFilters.isDirected) {
        return false
      }

      // Filter by stimulation
      if (interactionsFilters.isStimulation !== null && interaction.consensusStimulation !== interactionsFilters.isStimulation) {
        return false
      }

      // Filter by inhibition
      if (interactionsFilters.isInhibition !== null && interaction.consensusInhibition !== interactionsFilters.isInhibition) {
        return false
      }

      // Filter by upstream/downstream based on query protein position
      const queryUpper = interactionsQuery.toUpperCase()
      const isUpstream = interaction.isDirected === true && (interaction.target === queryUpper || interaction.targetGenesymbol === queryUpper)
      const isDownstream = interaction.isDirected === true && (interaction.source === queryUpper || interaction.sourceGenesymbol === queryUpper)
      
      if (interactionsFilters.isUpstream !== null && isUpstream !== interactionsFilters.isUpstream) {
        return false
      }
      if (interactionsFilters.isDownstream !== null && isDownstream !== interactionsFilters.isDownstream) {
        return false
      }

      // Filter by minimum references
      const referenceCount = interaction.references ? interaction.references.split(";").length : 0
      if (interactionsFilters.minReferences !== null && referenceCount < interactionsFilters.minReferences) {
        return false
      }

      return true
    })
  }, [interactions, interactionsFilters, interactionsQuery])

  // Apply sorting to the full filtered dataset
  const filteredAndSortedInteractions = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredInteractions;
    
    return [...filteredInteractions].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;
      
      if (sortKey === 'referenceCount') {
        valA = a.references ? a.references.split(';').length : 0;
        valB = b.references ? b.references.split(';').length : 0;
      } else {
        const rawA = (a as any)[sortKey];
        const rawB = (b as any)[sortKey];
        valA = rawA === null || rawA === undefined ? '' : String(rawA);
        valB = rawB === null || rawB === undefined ? '' : String(rawB);
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInteractions, sortKey, sortDirection])

  // Load more interactions function
  const loadMoreInteractions = useCallback(() => {
    if (!hasMoreInteractions || isLoadingMore) return
    
    setIsLoadingMore(true)
    
    // Get next batch from the filtered and sorted interactions
    const nextBatch = filteredAndSortedInteractions.slice(
      loadedInteractions.length,
      loadedInteractions.length + INTERACTIONS_PER_LOAD
    )
    
    if (nextBatch.length === 0) {
      setHasMoreInteractions(false)
      setIsLoadingMore(false)
      return
    }
    
    // Add to loaded interactions - preserve the sorted order
    setLoadedInteractions(prev => [...prev, ...nextBatch])
    
    // Check if there are more to load
    if (loadedInteractions.length + nextBatch.length >= filteredAndSortedInteractions.length) {
      setHasMoreInteractions(false)
    }
    
    setIsLoadingMore(false)
  }, [filteredAndSortedInteractions, loadedInteractions, hasMoreInteractions, isLoadingMore])

  // Handle sorting changes
  const handleSortChange = useCallback((key: string | null, direction: 'asc' | 'desc' | null) => {
    setSortKey(key);
    setSortDirection(direction as 'asc' | 'desc');
    
    // Reset infinite scroll when sort changes
    setLoadedInteractions([]);
    setHasMoreInteractions(true);
    setIsLoadingMore(false);
  }, [])

  // Get displayed interactions for the table (filtered loaded interactions)
  const displayedInteractions = useMemo(() => {
    return loadedInteractions.filter((interaction) => {
      // Apply the same filters as filteredInteractions
      if (interactionsFilters.interactionType && interactionsFilters.interactionType.length > 0 && !interactionsFilters.interactionType.includes(interaction.type || '')) {
        return false
      }
      if (interactionsFilters.entityTypeSource && interactionsFilters.entityTypeSource.length > 0 && !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource || '')) {
        return false
      }
      if (interactionsFilters.entityTypeTarget && interactionsFilters.entityTypeTarget.length > 0 && !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget || '')) {
        return false
      }
      if (interactionsFilters.isDirected !== null && interaction.isDirected !== interactionsFilters.isDirected) {
        return false
      }
      if (interactionsFilters.isStimulation !== null && interaction.consensusStimulation !== interactionsFilters.isStimulation) {
        return false
      }
      if (interactionsFilters.isInhibition !== null && interaction.consensusInhibition !== interactionsFilters.isInhibition) {
        return false
      }
      
      const referenceCount = interaction.references ? interaction.references.split(";").length : 0
      if (interactionsFilters.minReferences !== null && referenceCount < interactionsFilters.minReferences) {
        return false
      }

      const queryUpper = interactionsQuery.toUpperCase()
      const isUpstream = interaction.isDirected === true && (interaction.target === queryUpper || interaction.targetGenesymbol === queryUpper)
      const isDownstream = interaction.isDirected === true && (interaction.source === queryUpper || interaction.sourceGenesymbol === queryUpper)
      
      if (interactionsFilters.isUpstream !== null && isUpstream !== interactionsFilters.isUpstream) {
        return false
      }
      if (interactionsFilters.isDownstream !== null && isDownstream !== interactionsFilters.isDownstream) {
        return false
      }

      return true
    })
  }, [loadedInteractions, interactionsFilters, interactionsQuery])

  const handleFilterChange = useCallback((type: keyof InteractionsFilters, value: string | boolean | null | number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Reset infinite scroll when filters change
    setLoadedInteractions([])
    setHasMoreInteractions(true)
    setIsLoadingMore(false)
    
    const newFilters = { ...interactionsFilters }
    
    if (type === "minReferences") {
      newFilters[type] = Number(value) || null
    } else if (
      type === "isDirected" ||
      type === "isStimulation" ||
      type === "isInhibition" ||
      type === "isUpstream" ||
      type === "isDownstream"
    ) {
      newFilters[type] = value as boolean | null
    } else {
      const currentValues = newFilters[type] as string[]
      newFilters[type] = currentValues.includes(value as string)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as string]
    }
    
    // Update URL with new filters
    if (Object.values(newFilters).some(v => v !== null && (Array.isArray(v) ? v.length > 0 : true))) {
      params.set('filters', JSON.stringify(newFilters))
    } else {
      params.delete('filters')
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, interactionsFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('filters')
    
    // Reset infinite scroll when filters are cleared
    setLoadedInteractions([])
    setHasMoreInteractions(true)
    setIsLoadingMore(false)
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])


  const handleSelectInteraction = (interaction: SearchProteinNeighborsResponse['interactions'][number]) => {
    setSelectedInteraction(interaction)
    setIsDetailsOpen(true)
  }

  // Update filter data in context when query or data changes
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

  // Reload first batch when filters or sorting change
  React.useEffect(() => {
    if (filteredAndSortedInteractions.length > 0 && loadedInteractions.length === 0) {
      const firstBatch = filteredAndSortedInteractions.slice(0, INTERACTIONS_PER_LOAD)
      setLoadedInteractions(firstBatch)
      setHasMoreInteractions(filteredAndSortedInteractions.length > INTERACTIONS_PER_LOAD)
    }
  }, [filteredAndSortedInteractions, loadedInteractions.length])

  return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto p-4">
          {interactionsQuery ? (
            <div className="w-full space-y-4">

              {/* Main Content */}
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : interactions.length > 0 ? (
                <div className="h-[calc(100vh-12rem)]">
                  <InteractionResultsTable
                    interactions={displayedInteractions}
                    exportData={filteredAndSortedInteractions}
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
                    searchPlaceholder={`Search in ${filteredAndSortedInteractions.length} interactions...`}
                    showExport={true}
                    infiniteScroll={true}
                    hasMore={hasMoreInteractions}
                    onLoadMore={loadMoreInteractions}
                    loadingMore={isLoadingMore}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
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

