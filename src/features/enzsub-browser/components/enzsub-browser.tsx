"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { GetEnzSubDataResponse } from "@/features/enzsub-browser/api/queries"
import { EnzSubTable } from "@/features/enzsub-browser/components/enzsub-table"
import { EnzSubDetails } from "@/features/enzsub-browser/components/enzsub-details"
import { EnzSubEntry } from "@/features/enzsub-browser/types"
import { useEnzSubBrowser } from "@/features/enzsub-browser/hooks/useEnzSubBrowser"
import { Info } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

// Helper functions for multi-query detection
function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

function isMultiQuery(queryString: string): boolean {
  return parseQueries(queryString).length > 1
}

interface EnzSubBrowserProps {
  data?: GetEnzSubDataResponse
  isLoading?: boolean
}

export function EnzSubBrowser({ data, isLoading = false }: EnzSubBrowserProps) {
  const searchParams = useSearchParams()
  const { setFilterData } = useFilters()
  
  const {
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters
  } = useEnzSubBrowser(data)
  
  // Only UI state remains here
  const [selectedEntry, setSelectedEntry] = useState<EnzSubEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Get query from URL
  const enzSubQuery = searchParams.get('q') || ''

  const handleSelectEntry = (entry: EnzSubEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  // Memoize filter context value to prevent infinite updates
  const filterContextValue = useMemo(() => {
    return enzSubQuery ? {
      type: "enzsub" as const,
      filters,
      filterCounts,
      onFilterChange: updateFilter,
      onClearFilters: clearFilters,
      isMultiQuery: isMultiQuery(enzSubQuery),
    } : null
  }, [enzSubQuery, filters, filterCounts, updateFilter, clearFilters])

  // Update filter context only when memoized value changes
  useEffect(() => {
    setFilterData(filterContextValue)
  }, [filterContextValue, setFilterData])

  return (
    <div className="w-full h-full">
      {enzSubQuery ? (
        <div className="w-full h-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">
                {isMultiQuery(enzSubQuery) 
                  ? "Loading enzyme-substrate relationships between proteins..." 
                  : "Loading enzyme-substrate data..."
                }
              </p>
            </div>
          ) : (data?.enzSubData?.length ?? 0) > 0 ? (
            filteredData.length > 0 ? (
              <EnzSubTable
                currentResults={filteredData}
                onSelectEntry={handleSelectEntry}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results match your filters</h3>
                <p className="text-muted-foreground max-w-md">
                  Try adjusting your filter criteria to see more enzyme-substrate relationships.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No enzyme-substrate relationships found</h3>
              <p className="text-muted-foreground max-w-md">
                {isMultiQuery(enzSubQuery) 
                  ? `No enzyme-substrate relationships found between ${parseQueries(enzSubQuery).join(", ")}. Try searching for different proteins or genes.`
                  : `No enzyme-substrate relationships found for "${enzSubQuery}". Try searching for a different protein.`
                }
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Enzyme-Substrate Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for a protein to explore its role in enzyme-substrate relationships and post-translational modifications.
          </p>
        </div>
      )}
      
      {/* EnzSub Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            Enzyme-Substrate Relationship Details
          </DialogTitle>
          <EnzSubDetails selectedEntry={selectedEntry} />
        </DialogContent>
      </Dialog>
    </div>
  )
}