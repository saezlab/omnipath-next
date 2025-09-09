"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { GetComplexesDataResponse } from "@/features/complexes-browser/api/queries"
import { ComplexesTable } from "@/features/complexes-browser/components/complexes-table"
import { ComplexDetails } from "@/features/complexes-browser/components/complex-details"
import { ComplexEntry } from "@/features/complexes-browser/types"
import { useComplexesBrowser } from "@/features/complexes-browser/hooks/useComplexesBrowser"
import { Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

interface ComplexesBrowserProps {
  data?: GetComplexesDataResponse
  isLoading?: boolean
}

export function ComplexesBrowser({ data, isLoading = false }: ComplexesBrowserProps) {
  const searchParams = useSearchParams()
  const { setFilterData } = useFilters()
  
  const {
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters
  } = useComplexesBrowser(data)
  
  // Only UI state remains here
  const [selectedEntry, setSelectedEntry] = useState<ComplexEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Get query from URL
  const complexQuery = searchParams.get('q') || ''

  const handleSelectEntry = (entry: ComplexEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  // Update filter data in context when query or data changes
  useEffect(() => {
    const filterContextValue = complexQuery ? {
      type: "complexes" as const,
      filters,
      filterCounts,
      onFilterChange: updateFilter,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [complexQuery, filters, filterCounts, updateFilter, clearFilters, setFilterData])

  return (
    <div className="w-full h-full">
      {complexQuery ? (
        <div className="w-full h-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading complexes data...</p>
            </div>
          ) : (data?.complexEntries?.length ?? 0) > 0 ? (
            filteredData.length > 0 ? (
              <ComplexesTable entries={filteredData} onSelectEntry={handleSelectEntry} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results match your filters</h3>
                <p className="text-muted-foreground max-w-md">
                  Try adjusting your filter criteria to see more complexes.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No complexes found</h3>
              <p className="text-muted-foreground max-w-md">
                No complexes found containing &ldquo;{complexQuery}&rdquo;. Try searching for a different protein.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Complexes Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for a protein to explore protein complexes that contain it, including their components, stoichiometry, and sources.
          </p>
        </div>
      )}
      
      {/* Complex Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            Complex Details
          </DialogTitle>
          <ComplexDetails selectedEntry={selectedEntry} />
        </DialogContent>
      </Dialog>
    </div>
  )
}