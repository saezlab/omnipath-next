"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TableIcon, Network, BarChart3, Download, Search, SlidersHorizontal } from "lucide-react"
import { FilterSidebar } from "@/features/interactions-browser/components/filter-sidebar"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { ResultsTable } from "@/features/interactions-browser/components/results-table"
import { Pagination } from "@/features/interactions-browser/components/pagination"
import { VisualizationPlaceholder } from "@/features/interactions-browser/components/visualization-placeholder"
import { exportToCSV } from "@/lib/utils/export"
import { useSearchStore, type InteractionsFilters } from "@/store/search-store"

const RESULTS_PER_PAGE = 10

interface ProteinCatalogProps {
  initialQuery?: string
  onEntitySelect?: (entityName: string) => void
  initialInteractions?: any[]
  isLoading?: boolean
}

type FilterValue = string[] | boolean | null | number

interface Filters {
  [key: string]: FilterValue
  interactionType: string[]
  curationEffort: string[]
  ncbiTaxId: string[]
  entityTypeSource: string[]
  entityTypeTarget: string[]
  isDirected: boolean | null
  isStimulation: boolean | null
  isInhibition: boolean | null
  consensusDirection: boolean | null
  consensusStimulation: boolean | null
  consensusInhibition: boolean | null
  minReferences: number
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

export function ProteinCatalog({ 
  initialQuery = "", 
  onEntitySelect,
  initialInteractions = [],
  isLoading = false
}: ProteinCatalogProps) {
  const {
    interactionsQuery,
    setInteractionsQuery,
    interactionsFilters,
    setInteractionsFilters
  } = useSearchStore()

  const [interactions, setInteractions] = useState<any[]>(initialInteractions)
  const [viewMode, setViewMode] = useState<"table" | "network" | "chart">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInteraction, setSelectedInteraction] = useState<any | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Load data when initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setInteractionsQuery(initialQuery)
    }
  }, [initialQuery])

  // Update interactions when initialInteractions changes
  useEffect(() => {
    setInteractions(initialInteractions)
  }, [initialInteractions])

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
      if (interactionsFilters.interactionType.length > 0 && !interactionsFilters.interactionType.includes(interaction.type)) {
        return false
      }

      // Filter by curation effort (if not counting curation effort)
      if (interactionsFilters.curationEffort.length > 0 && !interactionsFilters.curationEffort.includes(interaction.curationEffort)) {
        return false
      }

      // Filter by taxonomy ID (if not counting taxonomy)
      if (interactionsFilters.ncbiTaxId.length > 0 && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdSource) && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdTarget)) {
        return false
      }

      // Filter by source entity type (if not counting source entity types)
      if (interactionsFilters.entityTypeSource.length > 0 && !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource)) {
        return false
      }

      // Filter by target entity type (if not counting target entity types)
      if (interactionsFilters.entityTypeTarget.length > 0 && !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget)) {
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
        counts.isDirected[interaction.isDirected.toString() as 'true' | 'false']++
      }
      if (interaction.isStimulation !== undefined) {
        counts.isStimulation[interaction.isStimulation.toString() as 'true' | 'false']++
      }
      if (interaction.isInhibition !== undefined) {
        counts.isInhibition[interaction.isInhibition.toString() as 'true' | 'false']++
      }
      if (interaction.consensusDirection !== undefined) {
        counts.consensusDirection[interaction.consensusDirection.toString() as 'true' | 'false']++
      }
      if (interaction.consensusStimulation !== undefined) {
        counts.consensusStimulation[interaction.consensusStimulation.toString() as 'true' | 'false']++
      }
      if (interaction.consensusInhibition !== undefined) {
        counts.consensusInhibition[interaction.consensusInhibition.toString() as 'true' | 'false']++
      }
    })

    return counts
  }, [interactions, interactionsFilters])

  // Filter interactions based on selected filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      // Filter by interaction type
      if (interactionsFilters.interactionType.length > 0 && !interactionsFilters.interactionType.includes(interaction.type)) {
        return false
      }

      // Filter by curation effort
      if (interactionsFilters.curationEffort.length > 0 && !interactionsFilters.curationEffort.includes(interaction.curationEffort)) {
        return false
      }

      // Filter by taxonomy ID
      if (interactionsFilters.ncbiTaxId.length > 0 && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdSource) && 
          !interactionsFilters.ncbiTaxId.includes(interaction.ncbiTaxIdTarget)) {
        return false
      }

      // Filter by source entity type
      if (interactionsFilters.entityTypeSource.length > 0 && !interactionsFilters.entityTypeSource.includes(interaction.entityTypeSource)) {
        return false
      }

      // Filter by target entity type
      if (interactionsFilters.entityTypeTarget.length > 0 && !interactionsFilters.entityTypeTarget.includes(interaction.entityTypeTarget)) {
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

  const handleFilterChange = (type: keyof InteractionsFilters, value: any) => {
    setInteractionsFilters((prev) => {
      if (type === "minReferences") {
        return { ...prev, [type]: value }
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
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

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

  const handleSearch = () => {
    if (!interactionsQuery.trim()) return

    if (onEntitySelect) {
      onEntitySelect(interactionsQuery)
    }
  }

  const handleExport = () => {
    if (filteredInteractions.length === 0) return;
    const filename = `interactions_${interactionsQuery || 'export'}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(filteredInteractions, filename);
  };

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
        <div className="flex flex-col md:flex-row gap-4">
          <FilterSidebar
            filters={interactionsFilters}
            filterCounts={filterCounts}
            onFilterChange={handleFilterChange}
            showMobileFilters={showMobileFilters}
            onClearFilters={clearFilters}
          />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="w-4 h-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "network" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("network")}
                >
                  <Network className="w-4 h-4 mr-2" />
                  Network
                </Button>
                <Button
                  variant={viewMode === "chart" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("chart")}
                  disabled
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
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

            {isLoading ? (
              <div className="text-center py-8">Loading interactions...</div>
            ) : viewMode === "table" ? (
              <>
                <ResultsTable
                  currentResults={paginatedInteractions}
                  onSelectInteraction={setSelectedInteraction}
                />
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      startIndex={(currentPage - 1) * RESULTS_PER_PAGE}
                      endIndex={currentPage * RESULTS_PER_PAGE}
                      totalItems={filteredInteractions.length}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
                {selectedInteraction && (
                  <InteractionDetails selectedInteraction={selectedInteraction} />
                )}
              </>
            ) : (
              <VisualizationPlaceholder type={viewMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

