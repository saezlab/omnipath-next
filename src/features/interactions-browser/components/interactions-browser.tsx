"use client"

import { SearchBar } from "@/components/search-bar"
import { TableSkeleton } from "@/components/table-skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { searchProteinNeighbors, SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { getProteinInformation, GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { InteractionResultsTable } from "@/features/interactions-browser/components/results-table"
import { useSearchStore } from "@/store/search-store"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { useFilters } from "@/contexts/filter-context"

const RESULTS_PER_PAGE = 15

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
  const { addToSearchHistory } = useSearchStore()
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
  const [proteinData, setProteinData] = useState<GetProteinInformationResponse | null>(null)
  const [isLoadingProtein, setIsLoadingProtein] = useState(false)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setIsLoadingProtein(true)
    
    // Update URL with new query
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', searchQuery)
    const newUrl = `/interactions?${params.toString()}`
    router.push(newUrl, { scroll: false })
    
    // Add to search history with full URL
    addToSearchHistory(searchQuery, 'interaction', newUrl)

    try {
      const [interactionsResponse, proteinResponse] = await Promise.all([
        searchProteinNeighbors(searchQuery),
        getProteinInformation(searchQuery)
      ])
      
      setInteractions(interactionsResponse.interactions)
      setProteinData(proteinResponse)
      if (onEntitySelect) {
        onEntitySelect(searchQuery)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingProtein(false)
    }
  }, [searchParams, router, addToSearchHistory, onEntitySelect])

  // Fetch interactions when query changes
  useEffect(() => {
    if (interactionsQuery) {
      const fetchData = async () => {
        setIsLoading(true)
        setIsLoadingProtein(true)
        
        try {
          const [interactionsResponse, proteinResponse] = await Promise.all([
            searchProteinNeighbors(interactionsQuery),
            getProteinInformation(interactionsQuery)
          ])
          
          setInteractions(interactionsResponse.interactions)
          setProteinData(proteinResponse)
          if (onEntitySelect) {
            onEntitySelect(interactionsQuery)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
          setIsLoadingProtein(false)
        }
      }
      
      fetchData()
    }
  }, [interactionsQuery, onEntitySelect])

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

  // Filter interactions based on selected filters
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

  const handleFilterChange = useCallback((type: keyof InteractionsFilters, value: string | boolean | null | number) => {
    const params = new URLSearchParams(searchParams.toString())
    
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

  return (
      <div className="w-full">
        <SearchBar
          placeholder="Search for proteins, genes, or other biological entities..."
          onSearch={(query) => handleSearch(query)}
          isLoading={isLoading}
          initialQuery={interactionsQuery}
        />

        {interactionsQuery && (
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <ProteinSummaryCard 
              proteinData={proteinData ?? undefined}
              isLoading={isLoadingProtein}
              defaultExpanded={false}
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto p-4">
          {interactionsQuery ? (
            <div className="w-full">
              {/* Main Content - Now uses full width */}
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : interactions.length > 0 ? (
                <div className="space-y-6"> 

                  {/* Interactions Section */}
                  <div className="space-y-4">
                    {/* Results display based on view mode */}
                  <Card className="bg-background py-0 border border-primary/20 hover:border-primary/40 transition-all duration-200">
                          <InteractionResultsTable
                            interactions={filteredInteractions}
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
                            searchPlaceholder="Search interactions..."
                            resultsPerPage={RESULTS_PER_PAGE}
                          />
                  </Card>
                  </div>
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

