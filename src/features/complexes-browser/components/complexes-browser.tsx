"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { GetComplexesDataResponse } from "@/features/complexes-browser/api/queries"
import { ComplexesTable } from "@/features/complexes-browser/components/complexes-table"
import { ComplexDetails } from "@/features/complexes-browser/components/complex-details"
import { ComplexEntry, ComplexesFilters, ParsedComplex } from "@/features/complexes-browser/types"
import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

interface FilterCounts {
  sources: Record<string, number>
}


interface ComplexesBrowserProps {
  data?: GetComplexesDataResponse
  isLoading?: boolean
}

export function ComplexesBrowser({ data, isLoading = false }: ComplexesBrowserProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  // Use data directly from props instead of internal state
  const complexEntries = data?.complexEntries || []
  
  const [selectedEntry, setSelectedEntry] = useState<ComplexEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Get query from URL
  const complexQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const complexFilters = useMemo(() => {
    const filtersParam = searchParams.get('complexes_filters')
    if (!filtersParam) {
      return {
        sources: [],
      } as ComplexesFilters
    }
    try {
      return JSON.parse(filtersParam) as ComplexesFilters
    } catch {
      return {
        sources: [],
      } as ComplexesFilters
    }
  }, [searchParams])

  // Parse complex data
  const parseComplexData = useCallback((complex: ComplexEntry): ParsedComplex => {
    const parsedComponents = complex.components?.split(/[;,]/).map(c => c.trim()).filter(Boolean) || []
    const parsedGeneSymbols = complex.componentsGenesymbols?.split(/[;,]/).map(g => g.trim()).filter(Boolean) || []
    const parsedSources = complex.sources?.split(/[;,]/).map(s => s.trim()).filter(Boolean) || []
    
    return {
      ...complex,
      parsedComponents,
      parsedGeneSymbols,
      parsedSources,
      componentCount: parsedGeneSymbols.length || parsedComponents.length
    }
  }, [])


  // Filter complex results based on selected filters
  const filteredComplexEntries = useMemo(() => {
    return complexEntries.filter((entry) => {
      const parsedEntry = parseComplexData(entry)
      
      // Filter by sources
      if (complexFilters.sources.length > 0) {
        const sourceMatch = complexFilters.sources.some(filterSource => 
          parsedEntry.parsedSources.some(source => 
            source.toLowerCase().includes(filterSource.toLowerCase())
          )
        )
        if (!sourceMatch) return false
      }

      return true
    })
  }, [complexEntries, complexFilters, parseComplexData])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
    }

    complexEntries.forEach(entry => {
      const parsedEntry = parseComplexData(entry)
      
      // Count sources
      parsedEntry.parsedSources.forEach(source => {
        counts.sources[source] = (counts.sources[source] || 0) + 1
      })
    })

    return counts
  }, [complexEntries, parseComplexData])

  // Handle filter changes
  const handleFilterChange = useCallback((type: keyof ComplexesFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const newFilters = { ...complexFilters }
    
    if (type === 'sources') {
      const currentSources = newFilters.sources
      newFilters.sources = currentSources.includes(value)
        ? currentSources.filter(s => s !== value)
        : [...currentSources, value]
    }
    
    // Update URL with new filters
    if (newFilters.sources.length > 0) {
      params.set('complexes_filters', JSON.stringify(newFilters))
    } else {
      params.delete('complexes_filters')
    }
    params.delete('page')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, complexFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('complexes_filters')
    params.delete('page')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleSelectEntry = (entry: ComplexEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  // Update filter data in context when query or data changes
  useEffect(() => {
    const filterContextValue = complexQuery ? {
      type: "complexes" as const,
      filters: complexFilters,
      filterCounts,
      onFilterChange: handleFilterChange,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [complexQuery, complexFilters, filterCounts, handleFilterChange, clearFilters, setFilterData])

  return (
    <div className="w-full h-full">
      {complexQuery ? (
        <div className="w-full h-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading complexes data...</p>
            </div>
          ) : complexEntries.length > 0 ? (
            filteredComplexEntries.length > 0 ? (
              <ComplexesTable entries={filteredComplexEntries} onSelectEntry={handleSelectEntry} />
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