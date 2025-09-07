"use client"

import { getEnzSubData, getEnzSubDataAmongProteins } from "@/features/enzsub-browser/api/queries"
import { SearchIdentifiersResponse } from "@/db/queries"
import { EnzSubTable } from "@/features/enzsub-browser/components/enzsub-table"
import { EnzSubEntry, EnzSubFilters } from "@/features/enzsub-browser/types"
import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  identifierResults?: SearchIdentifiersResponse
}

export function EnzSubBrowser({ identifierResults = [] }: EnzSubBrowserProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  const [enzSubState, setEnzSubState] = useState({
    results: [] as EnzSubEntry[],
    isLoading: false,
  })
  const [searchedProteins, setSearchedProteins] = useState<Set<string>>(new Set())
  const lastSearchedQuery = useRef('')
  
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

  // Fetch enzyme-substrate data when query changes
  useEffect(() => {
    if (enzSubQuery && enzSubQuery !== lastSearchedQuery.current && identifierResults.length > 0) {
      lastSearchedQuery.current = enzSubQuery
      
      const fetchData = async () => {
        setEnzSubState(prev => ({ ...prev, isLoading: true }))
        
        try {
          console.log(`Fetching enzyme-substrate data for: "${enzSubQuery}"`);
          
          // Store searched proteins for highlighting
          const searchedSet = new Set<string>()
          identifierResults.forEach(result => {
            searchedSet.add(result.uniprotAccession)
            if (result.identifierType.includes('gene')) {
              searchedSet.add(result.identifierValue.toUpperCase())
            }
          })
          setSearchedProteins(searchedSet)
          
          // Get enzyme-substrate relationships
          let enzSubResponse;
          if (isMultiQuery(enzSubQuery)) {
            // For multi-query, get relationships between the searched proteins only
            // Extract all protein IDs (uniprot accessions and gene symbols)
            const proteinIds = [
              ...identifierResults.map(r => r.uniprotAccession),
              ...identifierResults
                .filter(r => r.identifierType.includes('gene'))
                .map(r => r.identifierValue.toUpperCase())
            ];
            
            enzSubResponse = await getEnzSubDataAmongProteins(proteinIds);
          } else {
            // For single query, get all enzyme-substrate relationships
            enzSubResponse = await getEnzSubData(identifierResults);
          }
          
          setEnzSubState({
            results: enzSubResponse.enzSubData,
            isLoading: false,
          })
        } catch (error) {
          console.error("Error fetching EnzSub data:", error)
          setEnzSubState(prev => ({ ...prev, isLoading: false }))
        }
      }
      
      fetchData()
    }
  }, [enzSubQuery, identifierResults])

  // Filter enzyme-substrate data based on selected filters
  const filteredEnzSubData = useMemo(() => {
    return enzSubState.results.filter((entry) => {
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
  }, [enzSubState.results, enzSubFilters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
      residueTypes: {},
      modifications: {},
    }

    enzSubState.results.forEach(entry => {
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
  }, [enzSubState.results])

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
          {enzSubState.isLoading ? (
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
              searchedProteins={searchedProteins}
            />
          ) : enzSubState.results.length > 0 ? (
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
    </div>
  )
}