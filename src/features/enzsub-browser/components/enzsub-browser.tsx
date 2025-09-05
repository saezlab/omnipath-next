"use client"

import { TableSkeleton } from "@/components/table-skeleton"
import { getEnzSubData } from "@/features/enzsub-browser/api/queries"
import { searchIdentifiers } from "@/db/queries"
import { EnzSubTable } from "@/features/enzsub-browser/components/enzsub-table"
import { EnzSubEntry, EnzSubFilters } from "@/features/enzsub-browser/types"
import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

interface FilterCounts {
  sources: Record<string, number>
  residueTypes: Record<string, number>
  modifications: Record<string, number>
}

export function EnzSubBrowser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  const [isLoading, setIsLoading] = useState(false)
  const [enzSubResults, setEnzSubResults] = useState<EnzSubEntry[]>([])
  const [searchedProteins, setSearchedProteins] = useState<Set<string>>(new Set())
  const lastSearchedQuery = useRef('')
  
  // Get query from URL
  const enzSubQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const enzSubFilters = useMemo(() => {
    const filtersParam = searchParams.get('filters')
    if (!filtersParam) {
      return {
        sources: [],
        residueTypes: [],
        modifications: [],
        hasResidueOffset: null,
        curationEffortMin: null,
        searchTerm: '',
        enzymeSearch: '',
        substrateSearch: '',
      } as EnzSubFilters
    }
    try {
      return JSON.parse(filtersParam) as EnzSubFilters
    } catch {
      return {
        sources: [],
        residueTypes: [],
        modifications: [],
        hasResidueOffset: null,
        curationEffortMin: null,
        searchTerm: '',
        enzymeSearch: '',
        substrateSearch: '',
      } as EnzSubFilters
    }
  }, [searchParams])

  // Fetch enzyme-substrate data when query changes
  useEffect(() => {
    if (enzSubQuery && enzSubQuery !== lastSearchedQuery.current) {
      lastSearchedQuery.current = enzSubQuery
      
      const fetchData = async () => {
        setIsLoading(true)
        
        try {
          console.log(`Fetching identifier results for: "${enzSubQuery}" with species: 9606`);
          const identifierResults = await searchIdentifiers(enzSubQuery, 50, '9606');
          
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
          const enzSubResponse = await getEnzSubData(identifierResults)
          
          setEnzSubResults(enzSubResponse.enzSubData)
        } catch (error) {
          console.error("Error fetching EnzSub data:", error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchData()
    }
  }, [enzSubQuery])

  // Filter enzyme-substrate data based on selected filters
  const filteredEnzSubData = useMemo(() => {
    return enzSubResults.filter((entry) => {
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

      // Filter by residue offset presence
      if (enzSubFilters.hasResidueOffset === true) {
        if (entry.residueOffset === null) return false
      }

      // Filter by minimum curation effort
      if (enzSubFilters.curationEffortMin !== null) {
        if (!entry.curationEffort || entry.curationEffort < enzSubFilters.curationEffortMin) return false
      }

      // General search term filter
      if (enzSubFilters.searchTerm) {
        const searchTerm = enzSubFilters.searchTerm.toLowerCase()
        const matches = 
          (entry.enzyme?.toLowerCase().includes(searchTerm)) ||
          (entry.enzymeGenesymbol?.toLowerCase().includes(searchTerm)) ||
          (entry.substrate?.toLowerCase().includes(searchTerm)) ||
          (entry.substrateGenesymbol?.toLowerCase().includes(searchTerm)) ||
          (entry.modification?.toLowerCase().includes(searchTerm)) ||
          (entry.residueType?.toLowerCase().includes(searchTerm)) ||
          (entry.sources?.toLowerCase().includes(searchTerm))
        
        if (!matches) return false
      }

      // Enzyme-specific search
      if (enzSubFilters.enzymeSearch) {
        const enzymeSearchTerm = enzSubFilters.enzymeSearch.toLowerCase()
        const enzymeMatches = 
          (entry.enzyme?.toLowerCase().includes(enzymeSearchTerm)) ||
          (entry.enzymeGenesymbol?.toLowerCase().includes(enzymeSearchTerm))
        
        if (!enzymeMatches) return false
      }

      // Substrate-specific search
      if (enzSubFilters.substrateSearch) {
        const substrateSearchTerm = enzSubFilters.substrateSearch.toLowerCase()
        const substrateMatches = 
          (entry.substrate?.toLowerCase().includes(substrateSearchTerm)) ||
          (entry.substrateGenesymbol?.toLowerCase().includes(substrateSearchTerm))
        
        if (!substrateMatches) return false
      }

      return true
    })
  }, [enzSubResults, enzSubFilters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
      residueTypes: {},
      modifications: {},
    }

    enzSubResults.forEach(entry => {
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
  }, [enzSubResults])

  // Handle filter changes
  const handleFilterChange = useCallback((type: keyof EnzSubFilters, value: string | number | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const newFilters = { ...enzSubFilters }
    
    if (type === "searchTerm" || type === "enzymeSearch" || type === "substrateSearch") {
      newFilters[type] = value as string
    } else if (type === "curationEffortMin") {
      newFilters[type] = value as number | null
    } else if (type === "hasResidueOffset") {
      newFilters[type] = value as boolean | null
    } else {
      const currentValues = newFilters[type] as string[]
      newFilters[type] = currentValues.includes(value as string)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value as string]
    }
    
    // Update URL with new filters
    if (Object.values(newFilters).some(v => {
      if (typeof v === 'string') return v.length > 0
      if (Array.isArray(v)) return v.length > 0
      return v !== null
    })) {
      params.set('filters', JSON.stringify(newFilters))
    } else {
      params.delete('filters')
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, enzSubFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('filters')
    
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
    <div className="w-full h-full">
      {enzSubQuery ? (
        <div className="w-full h-full">
          {isLoading ? (
            <TableSkeleton />
          ) : filteredEnzSubData.length > 0 ? (
            <EnzSubTable
              currentResults={filteredEnzSubData}
              searchedProteins={searchedProteins}
            />
          ) : enzSubResults.length > 0 ? (
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
                No enzyme-substrate relationships found for &ldquo;{enzSubQuery}&rdquo;. Try searching for a different protein.
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