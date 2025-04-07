"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TableIcon, Network, BarChart3, Download, Search, SlidersHorizontal } from "lucide-react"
import { FilterSidebar } from "@/components/interactions/filter-sidebar"
import { InteractionDetails } from "@/components/interactions/interaction-details"
import { ResultsTable } from "@/components/interactions/results-table"
import { Pagination } from "@/components/interactions/pagination"
import { VisualizationPlaceholder } from "@/components/interactions/visualization-placeholder"

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
  ncbiTaxIdSource: string[]
  entityTypeSource: string[]
  ncbiTaxIdTarget: string[]
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
  ncbiTaxIdSource: Record<string, number>
  entityTypeSource: Record<string, number>
  ncbiTaxIdTarget: Record<string, number>
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
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<Filters>({
    interactionType: [],
    curationEffort: [],
    ncbiTaxIdSource: [],
    entityTypeSource: [],
    ncbiTaxIdTarget: [],
    entityTypeTarget: [],
    isDirected: null,
    isStimulation: null,
    isInhibition: null,
    consensusDirection: null,
    consensusStimulation: null,
    consensusInhibition: null,
    minReferences: 0,
  })
  const [interactions, setInteractions] = useState<any[]>(initialInteractions)
  const [viewMode, setViewMode] = useState<"table" | "network" | "chart">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInteraction, setSelectedInteraction] = useState<any | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Load data when initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
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
      ncbiTaxIdSource: {},
      entityTypeSource: {},
      ncbiTaxIdTarget: {},
      entityTypeTarget: {},
      isDirected: { true: 0, false: 0 },
      isStimulation: { true: 0, false: 0 },
      isInhibition: { true: 0, false: 0 },
      consensusDirection: { true: 0, false: 0 },
      consensusStimulation: { true: 0, false: 0 },
      consensusInhibition: { true: 0, false: 0 },
    }

    interactions.forEach((interaction) => {
      // Count interaction types
      if (interaction.type) {
        counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1
      }

      // Count curation effort
      if (interaction.curationEffort) {
        counts.curationEffort[interaction.curationEffort] = (counts.curationEffort[interaction.curationEffort] || 0) + 1
      }

      // Count source taxonomy IDs
      if (interaction.ncbiTaxIdSource) {
        counts.ncbiTaxIdSource[interaction.ncbiTaxIdSource] = (counts.ncbiTaxIdSource[interaction.ncbiTaxIdSource] || 0) + 1
      }

      // Count source entity types
      if (interaction.entityTypeSource) {
        counts.entityTypeSource[interaction.entityTypeSource] = (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1
      }

      // Count target taxonomy IDs
      if (interaction.ncbiTaxIdTarget) {
        counts.ncbiTaxIdTarget[interaction.ncbiTaxIdTarget] = (counts.ncbiTaxIdTarget[interaction.ncbiTaxIdTarget] || 0) + 1
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
  }, [interactions])

  // Filter interactions based on selected filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      // Filter by interaction type
      if (filters.interactionType.length > 0 && !filters.interactionType.includes(interaction.type)) {
        return false
      }

      // Filter by curation effort
      if (filters.curationEffort.length > 0 && !filters.curationEffort.includes(interaction.curationEffort)) {
        return false
      }

      // Filter by source taxonomy ID
      if (filters.ncbiTaxIdSource.length > 0 && !filters.ncbiTaxIdSource.includes(interaction.ncbiTaxIdSource)) {
        return false
      }

      // Filter by source entity type
      if (filters.entityTypeSource.length > 0 && !filters.entityTypeSource.includes(interaction.entityTypeSource)) {
        return false
      }

      // Filter by target taxonomy ID
      if (filters.ncbiTaxIdTarget.length > 0 && !filters.ncbiTaxIdTarget.includes(interaction.ncbiTaxIdTarget)) {
        return false
      }

      // Filter by target entity type
      if (filters.entityTypeTarget.length > 0 && !filters.entityTypeTarget.includes(interaction.entityTypeTarget)) {
        return false
      }

      // Filter by direction
      if (filters.isDirected !== null && interaction.isDirected !== filters.isDirected) {
        return false
      }

      // Filter by stimulation
      if (filters.isStimulation !== null && interaction.isStimulation !== filters.isStimulation) {
        return false
      }

      // Filter by inhibition
      if (filters.isInhibition !== null && interaction.isInhibition !== filters.isInhibition) {
        return false
      }

      // Filter by consensus direction
      if (filters.consensusDirection !== null && interaction.consensusDirection !== filters.consensusDirection) {
        return false
      }

      // Filter by consensus stimulation
      if (filters.consensusStimulation !== null && interaction.consensusStimulation !== filters.consensusStimulation) {
        return false
      }

      // Filter by consensus inhibition
      if (filters.consensusInhibition !== null && interaction.consensusInhibition !== filters.consensusInhibition) {
        return false
      }

      // Filter by minimum references
      if (interaction.references) {
        const referenceCount = interaction.references.split(";").length
        if (referenceCount < filters.minReferences) {
          return false
        }
      }

      return true
    })
  }, [interactions, filters])

  // Calculate pagination
  const totalPages = Math.ceil(filteredInteractions.length / RESULTS_PER_PAGE)
  const paginatedInteractions = filteredInteractions.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  )

  const handleFilterChange = (type: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      if (Array.isArray(prev[type])) {
        const array = prev[type] as string[]
        if (array.includes(value)) {
          newFilters[type] = array.filter((v) => v !== value)
        } else {
          newFilters[type] = [...array, value]
        }
      } else {
        newFilters[type] = value
      }
      return newFilters
    })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      interactionType: [],
      curationEffort: [],
      ncbiTaxIdSource: [],
      entityTypeSource: [],
      ncbiTaxIdTarget: [],
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <FilterSidebar
          filters={filters}
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
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Chart
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
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
  )
}

