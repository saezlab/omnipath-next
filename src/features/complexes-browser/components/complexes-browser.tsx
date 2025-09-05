"use client"

import { TableSkeleton } from "@/components/table-skeleton"
import { getComplexesData } from "@/features/complexes-browser/api/queries"
import { searchIdentifiers } from "@/db/queries"
import { ComplexesTable } from "@/features/complexes-browser/components/complexes-table"
import { ComplexEntry, ComplexesFilters, ParsedComplex } from "@/features/complexes-browser/types"
import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

interface FilterCounts {
  sources: Record<string, number>
}

export function ComplexesBrowser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  const [isLoading, setIsLoading] = useState(false)
  const [complexResults, setComplexResults] = useState<ComplexEntry[]>([])
  const lastSearchedQuery = useRef('')
  
  // Get query from URL
  const complexQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const complexFilters = useMemo(() => {
    const filtersParam = searchParams.get('filters')
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

  // Fetch complexes data when query changes
  useEffect(() => {
    if (complexQuery && complexQuery !== lastSearchedQuery.current) {
      lastSearchedQuery.current = complexQuery
      
      const fetchData = async () => {
        setIsLoading(true)
        
        try {
          console.log(`Fetching complexes data for: "${complexQuery}" with species: 9606`);
          const identifierResults = await searchIdentifiers(complexQuery, 50, '9606');
          
          const complexesResponse = await getComplexesData(identifierResults)
          
          setComplexResults(complexesResponse.complexEntries)
        } catch (error) {
          console.error("Error fetching complexes data:", error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchData()
    }
  }, [complexQuery])

  // Filter complex results based on selected filters
  const filteredComplexEntries = useMemo(() => {
    return complexResults.filter((entry) => {
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
  }, [complexResults, complexFilters, parseComplexData])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
    }

    complexResults.forEach(entry => {
      const parsedEntry = parseComplexData(entry)
      
      // Count sources
      parsedEntry.parsedSources.forEach(source => {
        counts.sources[source] = (counts.sources[source] || 0) + 1
      })
    })

    return counts
  }, [complexResults, parseComplexData])

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
      params.set('filters', JSON.stringify(newFilters))
    } else {
      params.delete('filters')
    }
    params.delete('page')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, complexFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('filters')
    params.delete('page')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-2 sm:px-4 pb-6 mt-4">
      {complexQuery ? (
        <>
          <div className="flex flex-col gap-4">
            <div className="w-full">
              {isLoading ? (
                <TableSkeleton />
              ) : filteredComplexEntries.length > 0 ? (
                <ComplexesTable entries={filteredComplexEntries} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No complexes found</h3>
                  <p className="text-muted-foreground max-w-md">
                    No complexes found containing &ldquo;{complexQuery}&rdquo;. Try searching for a different protein or adjusting your filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Complexes Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for a protein to explore protein complexes that contain it, including their components, stoichiometry, and sources.
          </p>
        </div>
      )}
    </div>
  )
}