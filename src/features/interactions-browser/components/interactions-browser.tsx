"use client"

import { DataCard } from "@/components/data-card"
import { FilterSkeleton } from "@/components/filter-skeleton"
import { SearchBar } from "@/components/search-bar"
import { TableSkeleton } from "@/components/table-skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { searchProteinNeighbors, SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { FilterSidebar } from "@/features/interactions-browser/components/filter-sidebar"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { Pagination } from "@/features/interactions-browser/components/pagination"
import { ResultsTable } from "@/features/interactions-browser/components/results-table"
import { VisualizationPlaceholder } from "@/features/interactions-browser/components/visualization-placeholder"
import { useSyncUrl } from '@/hooks/use-sync-url'
import { exportToCSV } from "@/lib/utils/export"
import { useSearchStore, type InteractionsFilters } from "@/store/search-store"
import { Search, SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const RESULTS_PER_PAGE = 15

interface InteractionsBrowserProps {
  onEntitySelect?: (entityName: string) => void
  isLoading?: boolean
}


interface FilterCounts {
  interactionType: Record<string, number>
  curationEffort: Record<string, number>
  ncbiTaxId: Record<string, number>
  entityTypeSource: Record<string, number>
  entityTypeTarget: Record<string, number>
  isDirected: { true: number; false: number }
  isStimulation: { true: number; false: number }
  isInhibition: { true: number; false: number }
  isUpstream: { true: number; false: number }
  isDownstream: { true: number; false: number }
}

type ViewMode = "table" | "network" | "chart"

export function InteractionsBrowser({ 
  onEntitySelect,
}: InteractionsBrowserProps) {
  // Use the URL sync hook
  useSyncUrl()

  const {
    interactionsQuery,
    setInteractionsQuery,
    interactionsFilters,
    setInteractionsFilters,
    interactionsResults,
    setInteractionsResults
  } = useSearchStore()

  const [interactions, setInteractions] = useState<SearchProteinNeighborsResponse['interactions']>([])
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInteraction, setSelectedInteraction] = useState<SearchProteinNeighborsResponse['interactions'][number] | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Sync local interactions state with store
  useEffect(() => {
    setInteractions(interactionsResults)
  }, [interactionsResults])

  useEffect(() => {
    if (interactionsQuery && interactionsResults.length === 0) {
      handleSearch()
    }
  }, [])

  // Calculate filter counts from interactions
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      interactionType: {},
      curationEffort: {},
      ncbiTaxId: {},
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
            interactionsFilters.interactionType.length > 0 && 
            !interactionsFilters.interactionType.includes(interaction.type || '')) {
          return false
        }

        // Filter by taxonomy ID
        if (!excludedFilters.includes('ncbiTaxId') &&
            interactionsFilters.ncbiTaxId.length > 0 && 
            !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdSource?.toString() || '') && 
            !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdTarget?.toString() || '')) {
          return false
        }

        // Filter by source entity type
        if (!excludedFilters.includes('entityTypeSource') &&
            interactionsFilters.entityTypeSource.length > 0 && 
            !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource || '')) {
          return false
        }

        // Filter by target entity type
        if (!excludedFilters.includes('entityTypeTarget') &&
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
            interaction.isStimulation !== interactionsFilters.isStimulation) {
          return false
        }

        // Filter by inhibition
        if (!excludedFilters.includes('isInhibition') &&
            interactionsFilters.isInhibition !== null && 
            interaction.isInhibition !== interactionsFilters.isInhibition) {
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
        const isUpstream = interaction.isDirected === true && (interaction.target === interactionsQuery || interaction.targetGenesymbol === interactionsQuery)
        const isDownstream = interaction.isDirected === true && (interaction.source === interactionsQuery || interaction.sourceGenesymbol === interactionsQuery)
        
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
      // Count interaction types
      if (interaction.type) {
        counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1
      }

      // Count curation effort
      if (interaction.curationEffort) {
        counts.curationEffort[interaction.curationEffort] = (counts.curationEffort[interaction.curationEffort] || 0) + 1
      }

      // Count taxonomy IDs
      if (interaction.ncbiTaxIdSource) {
        counts.ncbiTaxId[interaction.ncbiTaxIdSource] = (counts.ncbiTaxId[interaction.ncbiTaxIdSource] || 0) + 1
      }
      if (interaction.ncbiTaxIdTarget) {
        counts.ncbiTaxId[interaction.ncbiTaxIdTarget] = (counts.ncbiTaxId[interaction.ncbiTaxIdTarget] || 0) + 1
      }

      // Count boolean properties
      if (interaction.isDirected !== undefined) {
        counts.isDirected[interaction.isDirected?.toString() as 'true' | 'false']++
      }
      if (interaction.isStimulation !== undefined) {
        counts.isStimulation[interaction.isStimulation?.toString() as 'true' | 'false']++
      }
      if (interaction.isInhibition !== undefined) {
        counts.isInhibition[interaction.isInhibition?.toString() as 'true' | 'false']++
      }

      // Calculate and count upstream/downstream based on query protein position
      const isUpstream = interaction.isDirected === true && (interaction.target === interactionsQuery || interaction.targetGenesymbol === interactionsQuery)
      const isDownstream = interaction.isDirected === true && (interaction.source === interactionsQuery || interaction.sourceGenesymbol === interactionsQuery)
      counts.isUpstream[isUpstream.toString() as 'true' | 'false']++
      counts.isDownstream[isDownstream.toString() as 'true' | 'false']++
    })

    return counts
  }, [interactions, interactionsFilters, interactionsQuery])

  // Filter interactions based on selected filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      // Filter by interaction type
      if (interactionsFilters.interactionType.length > 0 && !interactionsFilters.interactionType.includes(interaction.type || '')) {
        return false
      }

      // Filter by taxonomy ID
      if (interactionsFilters.ncbiTaxId.length > 0 && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdSource?.toString() || '') && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdTarget?.toString() || '')) {
        return false
      }

      // Filter by source entity type
      if (interactionsFilters.entityTypeSource.length > 0 && !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource || '')) {
        return false
      }

      // Filter by target entity type
      if (interactionsFilters.entityTypeTarget.length > 0 && !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget || '')) {
        return false
      }

      // Filter by direction
      if (interactionsFilters.isDirected !== null && interaction.isDirected !== interactionsFilters.isDirected) {
        return false
      }

      // Filter by stimulation
      if (interactionsFilters.isStimulation !== null && interaction.isStimulation !== interactionsFilters.isStimulation) {
        return false
      }

      // Filter by inhibition
      if (interactionsFilters.isInhibition !== null && interaction.isInhibition !== interactionsFilters.isInhibition) {
        return false
      }

      // Filter by upstream/downstream based on query protein position
      const isUpstream = interaction.isDirected === true && (interaction.target === interactionsQuery || interaction.targetGenesymbol === interactionsQuery)
      const isDownstream = interaction.isDirected === true && (interaction.source === interactionsQuery || interaction.sourceGenesymbol === interactionsQuery)
      
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredInteractions.length / RESULTS_PER_PAGE)
  const paginatedInteractions = filteredInteractions.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  )

  const handleFilterChange = (type: keyof InteractionsFilters, value: string | boolean | null | number) => {
    setInteractionsFilters((prev) => {
      if (type === "minReferences") {
        return { ...prev, [type]: Number(value) || 0 }
      }

      if (
        type === "isDirected" ||
        type === "isStimulation" ||
        type === "isInhibition" ||
        type === "isUpstream" ||
        type === "isDownstream"
      ) {
        return { ...prev, [type]: value }
      }

      const currentValues = prev[type] as string[]
      const newValues = currentValues.includes(value as string)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as string]

      return { ...prev, [type]: newValues }
    })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setInteractionsFilters({
      interactionType: [],
      curationEffort: [],
      ncbiTaxId: [],
      entityTypeSource: [],
      entityTypeTarget: [],
      isDirected: null,
      isStimulation: null,
      isInhibition: null,
      isUpstream: null,
      isDownstream: null,
      minReferences: null,
    })
    setCurrentPage(1)
  }

  const handleSearch = async (searchQuery: string = interactionsQuery) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setCurrentPage(1)
    setInteractionsQuery(searchQuery)

    try {
      const response = await searchProteinNeighbors(searchQuery)
      setInteractionsResults(response.interactions)
      setInteractions(response.interactions)
      if (onEntitySelect) {
        onEntitySelect(searchQuery)
      }
    } catch (error) {
      console.error("Error fetching interactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (filteredInteractions.length === 0) return;
    const filename = `interactions_${interactionsQuery || 'export'}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(filteredInteractions, filename);
  };

  const handleSelectInteraction = (interaction: SearchProteinNeighborsResponse['interactions'][number]) => {
    setSelectedInteraction(interaction)
    setIsDetailsOpen(true)
  }

  return (
    <div className="w-full">
      <SearchBar
        placeholder="Search for proteins, genes, or other biological entities..."
        onSearch={(query) => handleSearch(query)}
        isLoading={isLoading}
        initialQuery={interactionsQuery}
      />

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          {isLoading ? (
            <FilterSkeleton />
          ) : (
            <FilterSidebar
              filters={interactionsFilters}
              filterCounts={filterCounts}
              onFilterChange={handleFilterChange}
              showMobileFilters={showMobileFilters}
              onClearFilters={clearFilters}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : interactionsResults.length > 0 ? (
              <div className="space-y-6"> 

                {/* Interactions Section */}
                <div className="space-y-4">
                  {/* Results display based on view mode */}
                  <DataCard<ViewMode>
                    title="Interactions"
                    totalItems={filteredInteractions.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onExport={handleExport}
                    headerActions={
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search within table..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="md:hidden"
                          onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    }
                  >
                    {viewMode === "table" ? (
                      <>
                        <ResultsTable
                          currentResults={paginatedInteractions}
                          onSelectInteraction={handleSelectInteraction}
                          searchTerm={searchTerm}
                        />
                        {totalPages > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            startIndex={(currentPage - 1) * RESULTS_PER_PAGE}
                            endIndex={currentPage * RESULTS_PER_PAGE}
                            totalItems={filteredInteractions.length}
                            onPageChange={setCurrentPage}
                          />
                        )}
                      </>
                    ) : (
                      <VisualizationPlaceholder type={viewMode} />
                    )}
                  </DataCard>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No interactions found</h3>
                <p className="text-muted-foreground max-w-md">
                  Search for proteins or genes to explore their interactions.
                </p>
              </div>
            )}
          </div>
        </div>
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

