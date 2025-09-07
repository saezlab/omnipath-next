"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { searchProteinNeighbors, SearchProteinNeighborsResponse, getInteractionsAmongProteins } from "@/features/interactions-browser/api/queries"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { InteractionResultsTable } from "@/features/interactions-browser/components/results-table"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { SearchIdentifiersResponse } from "@/db/queries"
import { Search } from "lucide-react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"


// Types
interface InteractionsBrowserProps {
  onEntitySelect?: (entityName: string) => void
  isLoading?: boolean
  identifierResults?: SearchIdentifiersResponse
}

interface FilterCounts {
  interactionType: Record<string, number>
  entityTypeSource: Record<string, number>
  entityTypeTarget: Record<string, number>
  topology: Record<string, number>
  direction: Record<string, number>
  sign: Record<string, number>
}

interface InteractionState {
  interactions: SearchProteinNeighborsResponse['interactions']
  isLoading: boolean
}

interface SortState {
  sortKey: string | null
  sortDirection: 'asc' | 'desc'
}

type Interaction = SearchProteinNeighborsResponse['interactions'][number]

// Utility functions
function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

function isMultiQuery(queryString: string): boolean {
  return parseQueries(queryString).length > 1
}

function getDefaultFilters(): InteractionsFilters {
  return {
    interactionType: [],
    entityTypeSource: [],
    entityTypeTarget: [],
    topology: [],
    direction: [],
    sign: [],
    minReferences: null,
    search: '',
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
  filterValue: string[] | number | string | null,
  queryUpper: string,
  originalQuery?: string
): boolean {
  switch (filterType) {
    case 'interactionType':
      return Array.isArray(filterValue) && (filterValue.length === 0 || filterValue.includes(interaction.type || ""))
    case 'entityTypeSource':
      return Array.isArray(filterValue) && (filterValue.length === 0 || filterValue.includes(interaction.entityTypeSource || ""))
    case 'entityTypeTarget':
      return Array.isArray(filterValue) && (filterValue.length === 0 || filterValue.includes(interaction.entityTypeTarget || ""))
    case 'topology':
      if (!Array.isArray(filterValue) || filterValue.length === 0) return true
      const topologyMatches = []
      if (filterValue.includes('directed') && interaction.isDirected === true) topologyMatches.push(true)
      if (filterValue.includes('undirected') && interaction.isDirected === false) topologyMatches.push(true)
      return topologyMatches.length > 0
    case 'direction':
      // Disable direction filter for multi-queries
      if (originalQuery && isMultiQuery(originalQuery)) return true
      if (!Array.isArray(filterValue) || filterValue.length === 0) return true
      const directionMatches = []
      if (filterValue.includes('upstream') && isUpstreamInteraction(interaction, queryUpper)) directionMatches.push(true)
      if (filterValue.includes('downstream') && isDownstreamInteraction(interaction, queryUpper)) directionMatches.push(true)
      return directionMatches.length > 0
    case 'sign':
      if (!Array.isArray(filterValue) || filterValue.length === 0) return true
      const signMatches = []
      if (filterValue.includes('stimulation') && interaction.consensusStimulation === true) signMatches.push(true)
      if (filterValue.includes('inhibition') && interaction.consensusInhibition === true) signMatches.push(true)
      return signMatches.length > 0
    case 'minReferences':
      return filterValue === null || (typeof filterValue === 'number' && getReferenceCount(interaction) >= filterValue)
    case 'search':
      if (!filterValue || typeof filterValue !== 'string') return true
      const searchTerm = filterValue.toLowerCase()
      return [
        interaction.sourceGenesymbol,
        interaction.source,
        interaction.targetGenesymbol,
        interaction.target,
        interaction.type,
        interaction.sources
      ].some(field => field?.toLowerCase().includes(searchTerm))
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
    applyFilter(interaction, key as keyof InteractionsFilters, value, queryUpper, query)
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
    return applyFilter(interaction, key as keyof InteractionsFilters, value, queryUpper, query)
  })
}

export function InteractionsBrowser({ 
  onEntitySelect,
  identifierResults = [],
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
    isLoading: false,
  })

  // UI state
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    sortKey: 'referenceCount',
    sortDirection: 'desc'
  })

  // Fetch interactions when query changes
  useEffect(() => {
    if (interactionsQuery && interactionsQuery !== lastSearchedQuery.current && identifierResults.length > 0) {
      lastSearchedQuery.current = interactionsQuery
      
      const fetchData = async () => {
        setInteractionState(prev => ({ ...prev, isLoading: true }))
        try {
          console.log(`Fetching interactions for: "${interactionsQuery}" with species: 9606`);
          
          let interactionsResponse;
          if (isMultiQuery(interactionsQuery)) {
            // For multi-query, get interactions between the searched proteins only
            // Extract all protein IDs (uniprot accessions and gene symbols)
            const proteinIds = [
              ...identifierResults.map(r => r.uniprotAccession),
              ...identifierResults
                .filter(r => r.identifierType.includes('gene'))
                .map(r => r.identifierValue.toUpperCase())
            ];
            
            interactionsResponse = await getInteractionsAmongProteins(proteinIds);
          } else {
            // For single query, get all neighbor interactions
            interactionsResponse = await searchProteinNeighbors(identifierResults);
          }
          
          setInteractionState({
            interactions: interactionsResponse.interactions,
            isLoading: false,
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
  }, [interactionsQuery, identifierResults, onEntitySelect])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      interactionType: {},
      entityTypeSource: {},
      entityTypeTarget: {},
      topology: {},
      direction: {},
      sign: {},
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
      
      // Count for new array-based filters
      if (passesFiltersExcept(interaction, interactionsFilters, interactionsQuery, ['topology'])) {
        if (interaction.isDirected === true) {
          counts.topology['directed'] = (counts.topology['directed'] || 0) + 1
        } else if (interaction.isDirected === false) {
          counts.topology['undirected'] = (counts.topology['undirected'] || 0) + 1
        }
      }
      
      // Skip direction counting for multi-queries
      if (!isMultiQuery(interactionsQuery) && passesFiltersExcept(interaction, interactionsFilters, interactionsQuery, ['direction'])) {
        const upstream = isUpstreamInteraction(interaction, queryUpper)
        const downstream = isDownstreamInteraction(interaction, queryUpper)
        if (upstream) {
          counts.direction['upstream'] = (counts.direction['upstream'] || 0) + 1
        }
        if (downstream) {
          counts.direction['downstream'] = (counts.direction['downstream'] || 0) + 1
        }
      }
      
      if (passesFiltersExcept(interaction, interactionsFilters, interactionsQuery, ['sign'])) {
        if (interaction.consensusStimulation === true) {
          counts.sign['stimulation'] = (counts.sign['stimulation'] || 0) + 1
        }
        if (interaction.consensusInhibition === true) {
          counts.sign['inhibition'] = (counts.sign['inhibition'] || 0) + 1
        }
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


  const handleSortChange = useCallback((key: string | null, direction: 'asc' | 'desc' | null) => {
    setSortState({
      sortKey: key,
      sortDirection: direction as 'asc' | 'desc'
    })
  }, [])

  const updateUrlWithFilters = useCallback((newFilters: InteractionsFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    const hasActiveFilters = Object.entries(newFilters).some(([key, v]) => {
      if (key === 'search') return v !== ''
      return v !== null && (Array.isArray(v) ? v.length > 0 : true)
    })
    
    if (hasActiveFilters) {
      params.set('interactions_filters', JSON.stringify(newFilters))
    } else {
      params.delete('interactions_filters')
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleFilterChange = useCallback((type: keyof InteractionsFilters, value: string | boolean | null | number) => {
    const newFilters = { ...interactionsFilters }
    
    if (type === "minReferences") {
      newFilters[type] = Number(value) || null
    } else if (type === "search") {
      newFilters[type] = value as string
    } else {
      // All other filters are array-based
      const currentValues = newFilters[type] as string[]
      newFilters[type] = currentValues.includes(value as string)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as string]
    }
    
    updateUrlWithFilters(newFilters)
  }, [interactionsFilters, updateUrlWithFilters])

  const clearFilters = useCallback(() => {
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
      isMultiQuery: isMultiQuery(interactionsQuery),
    } : null
    setFilterData(filterContextValue)
  }, [interactionsQuery, interactionsFilters, filterCounts, handleFilterChange, clearFilters, setFilterData])



  return (
    <div className="flex flex-col w-full h-full">
      {interactionsQuery ? (
        <div className="flex flex-col w-full h-full min-h-0">
          {interactionState.isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">
                {isMultiQuery(interactionsQuery) 
                  ? "Loading interactions between proteins..." 
                  : "Loading interactions..."
                }
              </p>
            </div>
          ) : interactionState.interactions.length > 0 ? (
            <InteractionResultsTable
              data={processedInteractions}
              exportData={processedInteractions}
              onSelectInteraction={handleSelectInteraction}
              showExport={true}
              infiniteScroll={true}
              resultsPerPage={30}
              sortKey={sortState.sortKey}
              sortDirection={sortState.sortDirection}
              onSortChange={handleSortChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No interactions found</h3>
              <p className="text-muted-foreground max-w-md">
                {isMultiQuery(interactionsQuery) 
                  ? `No interactions found between ${parseQueries(interactionsQuery).join(", ")}. Try searching for different proteins or genes.`
                  : `No interactions found for "${interactionsQuery}". Try searching for a different protein or gene.`
                }
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Interactions Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for proteins or genes to explore their interactions.
          </p>
        </div>
      )}

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

