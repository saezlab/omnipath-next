"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries"
import { FilterSidebar } from "@/features/interactions-browser/components/filter-sidebar"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { Pagination } from "@/features/interactions-browser/components/pagination"
import { ResultsTable } from "@/features/interactions-browser/components/results-table"
import { VisualizationPlaceholder } from "@/features/interactions-browser/components/visualization-placeholder"
import { exportToCSV } from "@/lib/utils/export"
import { useSearchStore, type InteractionsFilters } from "@/store/search-store"
import { BarChart3, Download, Network, Search, SlidersHorizontal, TableIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { FilterSkeleton } from "@/components/filter-skeleton"
import { TableSkeleton } from "@/components/table-skeleton"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { useSyncUrl } from '@/hooks/use-sync-url'
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
  consensusDirection: { true: number; false: number }
  consensusStimulation: { true: number; false: number }
  consensusInhibition: { true: number; false: number }
}

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
  const [viewMode, setViewMode] = useState<"table" | "network" | "chart">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInteraction, setSelectedInteraction] = useState<SearchProteinNeighborsResponse['interactions'][number] | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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
      consensusDirection: { true: 0, false: 0 },
      consensusStimulation: { true: 0, false: 0 },
      consensusInhibition: { true: 0, false: 0 },
    }

    // First, filter interactions based on all filters except the one being counted
    const filteredInteractions = interactions.filter((interaction) => {
      // Filter by interaction type (if not counting interaction types)
      if (interactionsFilters.interactionType.length > 0 && !interactionsFilters.interactionType.includes(interaction.type || '')) {
        return false
      }

      // Filter by taxonomy ID (if not counting taxonomy)
      if (interactionsFilters.ncbiTaxId.length > 0 && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdSource?.toString() || '') && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdTarget?.toString() || '')) {
        return false
      }

      // Filter by source entity type (if not counting source entity types)
      if (interactionsFilters.entityTypeSource.length > 0 && !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource || '')) {
        return false
      }

      // Filter by target entity type (if not counting target entity types)
      if (interactionsFilters.entityTypeTarget.length > 0 && !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget || '')) {
        return false
      }

      // Filter by direction (if not counting direction)
      if (interactionsFilters.isDirected !== null && interaction.isDirected !== interactionsFilters.isDirected) {
        return false
      }

      // Filter by stimulation (if not counting stimulation)
      if (interactionsFilters.isStimulation !== null && interaction.isStimulation !== interactionsFilters.isStimulation) {
        return false
      }

      // Filter by inhibition (if not counting inhibition)
      if (interactionsFilters.isInhibition !== null && interaction.isInhibition !== interactionsFilters.isInhibition) {
        return false
      }

      // Filter by consensus direction (if not counting consensus direction)
      if (interactionsFilters.consensusDirection !== null && interaction.consensusDirection !== interactionsFilters.consensusDirection) {
        return false
      }

      // Filter by consensus stimulation (if not counting consensus stimulation)
      if (interactionsFilters.consensusStimulation !== null && interaction.consensusStimulation !== interactionsFilters.consensusStimulation) {
        return false
      }

      // Filter by consensus inhibition (if not counting consensus inhibition)
      if (interactionsFilters.consensusInhibition !== null && interaction.consensusInhibition !== interactionsFilters.consensusInhibition) {
        return false
      }

      // Filter by minimum references
      const referenceCount = interaction.references ? interaction.references.split(";").length : 0
      if (referenceCount < interactionsFilters.minReferences) {
        return false
      }

      return true
    })

    // Then count the remaining interactions
    filteredInteractions.forEach((interaction) => {
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

      // Count source entity types
      if (interaction.entityTypeSource) {
        counts.entityTypeSource[interaction.entityTypeSource] = (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1
      }

      // Count target entity types
      if (interaction.entityTypeTarget) {
        counts.entityTypeTarget[interaction.entityTypeTarget] = (counts.entityTypeTarget[interaction.entityTypeTarget] || 0) + 1
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
      if (interaction.consensusDirection !== undefined) {
        counts.consensusDirection[interaction.consensusDirection?.toString() as 'true' | 'false']++
      }
      if (interaction.consensusStimulation !== undefined) {
        counts.consensusStimulation[interaction.consensusStimulation?.toString() as 'true' | 'false']++
      }
      if (interaction.consensusInhibition !== undefined) {
        counts.consensusInhibition[interaction.consensusInhibition?.toString() as 'true' | 'false']++
      }
    })

    return counts
  }, [interactions, interactionsFilters])

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

      // Filter by consensus direction
      if (interactionsFilters.consensusDirection !== null && interaction.consensusDirection !== interactionsFilters.consensusDirection) {
        return false
      }

      // Filter by consensus stimulation
      if (interactionsFilters.consensusStimulation !== null && interaction.consensusStimulation !== interactionsFilters.consensusStimulation) {
        return false
      }

      // Filter by consensus inhibition
      if (interactionsFilters.consensusInhibition !== null && interaction.consensusInhibition !== interactionsFilters.consensusInhibition) {
        return false
      }

      // Filter by minimum references
      const referenceCount = interaction.references ? interaction.references.split(";").length : 0
      if (referenceCount < interactionsFilters.minReferences) {
        return false
      }

      return true
    })
  }, [interactions, interactionsFilters])

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
        type === "consensusDirection" ||
        type === "consensusStimulation" ||
        type === "consensusInhibition"
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
      consensusDirection: null,
      consensusStimulation: null,
      consensusInhibition: null,
      minReferences: 0,
    })
    setCurrentPage(1)
  }

  const handleSearch = async () => {
    if (!interactionsQuery.trim()) return

    setIsLoading(true)
    setCurrentPage(1)

    try {
      const response = await searchProteinNeighbors(interactionsQuery)
      setInteractionsResults(response.interactions)
      setInteractions(response.interactions)
      if (onEntitySelect) {
        onEntitySelect(interactionsQuery)
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
      {/* Search Bar */}
      <div className="w-full bg-background sticky top-0 z-10 border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex w-full items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for proteins, genes, or other biological entities..."
                  className="w-full pl-9"
                  value={interactionsQuery}
                  onChange={(e) => setInteractionsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                    >
                      <TableIcon className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === "network" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("network")}
                      disabled
                    >
                      <Network className="h-4 w-4 mr-2" />
                      Network
                    </Button>
                    <Button
                      variant={viewMode === "chart" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("chart")}
                      disabled
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Chart
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={filteredInteractions.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Interactions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Interactions ({filteredInteractions.length} total)
                    </h3>
                  </div>

                  {/* Results display based on view mode */}
                  {viewMode === "table" ? (
                    <Card>
                      <CardContent className="p-0">
                        <ResultsTable
                          currentResults={paginatedInteractions}
                          onSelectInteraction={handleSelectInteraction}
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
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        <VisualizationPlaceholder type={viewMode} />
                      </CardContent>
                    </Card>
                  )}
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
            Interaction Details: {selectedInteraction?.sourceGenesymbol || selectedInteraction?.source} → {selectedInteraction?.targetGenesymbol || selectedInteraction?.target}
          </DialogTitle>
          {selectedInteraction && (
            <InteractionDetails selectedInteraction={selectedInteraction} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

