"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { GetEnzSubDataResponse } from "@/features/enzsub-browser/api/queries"
import { EnzSubTable } from "@/features/enzsub-browser/components/enzsub-table"
import { EnzSubDetails } from "@/features/enzsub-browser/components/enzsub-details"
import { EnzSubEntry, EnzSubFilters } from "@/features/enzsub-browser/types"
import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
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

interface FilterCounts {
  sources: Record<string, number>
  residueTypes: Record<string, number>
  modifications: Record<string, number>
}


interface EnzSubBrowserProps {
  data?: GetEnzSubDataResponse
  isLoading?: boolean
}

export function EnzSubBrowser({ data, isLoading = false }: EnzSubBrowserProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  // Use data directly from props instead of internal state
  const enzSubData = data?.enzSubData || []
  
  const [selectedEntry, setSelectedEntry] = useState<EnzSubEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Get query from URL
  const enzSubQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const enzSubFilters = useMemo(() => {
    const filtersParam = searchParams.get('enzsub_filters')
    if (!filtersParam) {
      return {
        sources: [],
        residueTypes: [],
        modifications: [],
      } as EnzSubFilters
    }
    try {
      return JSON.parse(filtersParam) as EnzSubFilters
    } catch {
      return {
        sources: [],
        residueTypes: [],
        modifications: [],
      } as EnzSubFilters
    }
  }, [searchParams])


  // Filter enzyme-substrate data based on selected filters
  const filteredEnzSubData = useMemo(() => {
    return enzSubData.filter((entry) => {
      // Filter by sources
      if (enzSubFilters.sources.length > 0 && entry.sources) {
        const entrySources = entry.sources.split(';').map(s => s.trim().toLowerCase())
        const sourceMatch = enzSubFilters.sources.some(filterSource => 
          entrySources.includes(filterSource.toLowerCase())
        )
        if (!sourceMatch) return false
      }

      // Filter by residue types
      if (enzSubFilters.residueTypes.length > 0 && entry.residueType) {
        if (!enzSubFilters.residueTypes.includes(entry.residueType)) return false
      }

      // Filter by modifications
      if (enzSubFilters.modifications.length > 0 && entry.modification) {
        const modificationMatch = enzSubFilters.modifications.some(filterMod => 
          entry.modification?.toLowerCase().includes(filterMod.toLowerCase())
        )
        if (!modificationMatch) return false
      }


      return true
    })
  }, [enzSubData, enzSubFilters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
      residueTypes: {},
      modifications: {},
    }

    enzSubData.forEach(entry => {
      // Count sources (split by semicolon)
      if (entry.sources) {
        const sources = entry.sources.split(';').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)
        sources.forEach(source => {
          counts.sources[source] = (counts.sources[source] || 0) + 1
        })
      }

      // Count residue types
      if (entry.residueType) {
        counts.residueTypes[entry.residueType] = (counts.residueTypes[entry.residueType] || 0) + 1
      }

      // Count modifications
      if (entry.modification) {
        const modKey = entry.modification.toLowerCase()
        counts.modifications[modKey] = (counts.modifications[modKey] || 0) + 1
      }
    })

    return counts
  }, [enzSubData])

  // Handle filter changes
  const handleFilterChange = useCallback((type: keyof EnzSubFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const newFilters = { ...enzSubFilters }
    
    const currentValues = newFilters[type] as string[]
    newFilters[type] = currentValues.includes(value as string)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value as string]
    
    // Update URL with new filters
    if (Object.values(newFilters).some(v => {
      if (Array.isArray(v)) return v.length > 0
      return false
    })) {
      params.set('enzsub_filters', JSON.stringify(newFilters))
    } else {
      params.delete('enzsub_filters')
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, enzSubFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('enzsub_filters')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleSelectEntry = (entry: EnzSubEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  // Update filter data in context when query or data changes
  useEffect(() => {
    const filterContextValue = enzSubQuery ? {
      type: "enzsub" as const,
      filters: enzSubFilters,
      filterCounts,
      onFilterChange: handleFilterChange,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [enzSubQuery, enzSubFilters, filterCounts, handleFilterChange, clearFilters, setFilterData])

  return (
    <div className="flex flex-col w-full h-full">
      {enzSubQuery ? (
        <div className="flex flex-col w-full h-full min-h-0">
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
          ) : filteredEnzSubData.length > 0 ? (
            <EnzSubTable
              currentResults={filteredEnzSubData}
              onSelectEntry={handleSelectEntry}
            />
          ) : enzSubData.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results match your filters</h3>
              <p className="text-muted-foreground max-w-md">
                Try adjusting your filter criteria to see more enzyme-substrate relationships.
              </p>
            </div>
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