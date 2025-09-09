"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { InteractionDetails } from "@/features/interactions-browser/components/interaction-details"
import { InteractionResultsTable } from "@/features/interactions-browser/components/results-table"
import { SearchIdentifiersResponse } from "@/db/queries"
import { Search } from "lucide-react"
import React, { useEffect } from "react"
import { useFilters } from "@/contexts/filter-context"
import { useInteractionsBrowser } from "../hooks/useInteractionsBrowser"


// Types
interface InteractionsBrowserProps {
  onEntitySelect?: (entityName: string) => void
  isLoading?: boolean
  identifierResults?: SearchIdentifiersResponse
  data?: SearchProteinNeighborsResponse
}

export function InteractionsBrowser({ 
  onEntitySelect,
  data,
  isLoading = false,
}: InteractionsBrowserProps) {
  const { setFilterData } = useFilters()
  
  // Use the hook for all state management
  const {
    query: interactionsQuery,
    filters: interactionsFilters,
    interactions,
    processedInteractions,
    filterCounts,
    updateFilter: handleFilterChange,
    clearFilters,
    sortState,
    handleSortChange,
    selectedInteraction,
    isDetailsOpen,
    handleSelectInteraction,
    setIsDetailsOpen,
    isMultiQuery: isMultiQueryValue,
    parseQueries,
  } = useInteractionsBrowser(data)

  // Call onEntitySelect when data changes
  useEffect(() => {
    if (data && interactionsQuery && onEntitySelect) {
      onEntitySelect(interactionsQuery)
    }
  }, [data, interactionsQuery, onEntitySelect])

  // Update filter context
  useEffect(() => {
    const filterContextValue = interactionsQuery ? {
      type: "interactions" as const,
      filters: interactionsFilters,
      filterCounts,
      onFilterChange: handleFilterChange,
      onClearFilters: clearFilters,
      isMultiQuery: isMultiQueryValue,
    } : null
    setFilterData(filterContextValue)
  }, [interactionsQuery, interactionsFilters, filterCounts, handleFilterChange, clearFilters, setFilterData, isMultiQueryValue])



  return (
    <div className="flex flex-col w-full h-full">
      {interactionsQuery ? (
        <div className="flex flex-col w-full h-full min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">
                Loading interactions...
              </p>
            </div>
          ) : interactions.length > 0 ? (
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
                {parseQueries.length > 1
                  ? `No interactions found for ${parseQueries.join(", ")}. Try searching for different proteins or genes.`
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

