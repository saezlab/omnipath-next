"use client"

import { TableSkeleton } from "@/components/table-skeleton"
import { getIntercellData } from "@/features/intercell-browser/api/queries"
import { searchIdentifiers } from "@/db/queries"
import { IntercellTable } from "@/features/intercell-browser/components/intercell-table"
import { IntercellEntry, IntercellFilters } from "@/features/intercell-browser/types"
import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

interface FilterCounts {
  aspects: Record<string, number>
  sources: Record<string, number>
  databases: Record<string, number>
  scopes: Record<string, number>
  transmitter: { true: number; false: number }
  receiver: { true: number; false: number }
  secreted: { true: number; false: number }
  plasmaMembraneTransmembrane: { true: number; false: number }
  plasmaMembranePeripheral: { true: number; false: number }
}

export function IntercellBrowser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  const [isLoading, setIsLoading] = useState(false)
  const [intercellResults, setIntercellResults] = useState<IntercellEntry[]>([])
  const lastSearchedQuery = useRef('')
  
  // Get query from URL
  const intercellQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const intercellFilters = useMemo(() => {
    const filtersParam = searchParams.get('filters')
    if (!filtersParam) {
      return {
        aspects: [],
        sources: [],
        databases: [],
        scopes: [],
        transmitter: null,
        receiver: null,
        secreted: null,
        plasmaMembraneTransmembrane: null,
        plasmaMembranePeripheral: null,
      } as IntercellFilters
    }
    try {
      return JSON.parse(filtersParam) as IntercellFilters
    } catch {
      return {
        aspects: [],
        sources: [],
        databases: [],
        scopes: [],
        transmitter: null,
        receiver: null,
        secreted: null,
        plasmaMembraneTransmembrane: null,
        plasmaMembranePeripheral: null,
      } as IntercellFilters
    }
  }, [searchParams])

  // Fetch intercell data when query changes
  useEffect(() => {
    if (intercellQuery && intercellQuery !== lastSearchedQuery.current) {
      lastSearchedQuery.current = intercellQuery
      
      const fetchData = async () => {
        setIsLoading(true)
        
        try {
          console.log(`Fetching intercell data for: "${intercellQuery}" with species: 9606`);
          const identifierResults = await searchIdentifiers(intercellQuery, 50, '9606');
          
          const intercellResponse = await getIntercellData(identifierResults)
          
          setIntercellResults(intercellResponse.intercellEntries)
        } catch (error) {
          console.error("Error fetching intercell data:", error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchData()
    }
  }, [intercellQuery])

  // Filter intercell results based on selected filters
  const filteredIntercellEntries = useMemo(() => {
    return intercellResults.filter((entry) => {
      // Filter by aspects
      if (intercellFilters.aspects.length > 0 && entry.aspect) {
        const aspectMatch = intercellFilters.aspects.some(filterAspect => 
          filterAspect.toLowerCase() === entry.aspect?.toLowerCase()
        )
        if (!aspectMatch) return false
      }

      // Filter by sources
      if (intercellFilters.sources.length > 0 && entry.source) {
        const sourceMatch = intercellFilters.sources.some(filterSource => 
          filterSource.toLowerCase() === entry.source?.toLowerCase()
        )
        if (!sourceMatch) return false
      }

      // Filter by databases
      if (intercellFilters.databases.length > 0 && entry.database) {
        const databaseMatch = intercellFilters.databases.some(filterDatabase => 
          filterDatabase.toLowerCase() === entry.database?.toLowerCase()
        )
        if (!databaseMatch) return false
      }

      // Filter by scopes
      if (intercellFilters.scopes.length > 0 && entry.scope) {
        const scopeMatch = intercellFilters.scopes.some(filterScope => 
          filterScope.toLowerCase() === entry.scope?.toLowerCase()
        )
        if (!scopeMatch) return false
      }

      // Filter by boolean fields
      if (intercellFilters.transmitter !== null && entry.transmitter !== intercellFilters.transmitter) {
        return false
      }

      if (intercellFilters.receiver !== null && entry.receiver !== intercellFilters.receiver) {
        return false
      }

      if (intercellFilters.secreted !== null && entry.secreted !== intercellFilters.secreted) {
        return false
      }

      if (intercellFilters.plasmaMembraneTransmembrane !== null && entry.plasmaMembraneTransmembrane !== intercellFilters.plasmaMembraneTransmembrane) {
        return false
      }

      if (intercellFilters.plasmaMembranePeripheral !== null && entry.plasmaMembranePeripheral !== intercellFilters.plasmaMembranePeripheral) {
        return false
      }

      return true
    })
  }, [intercellResults, intercellFilters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      aspects: {},
      sources: {},
      databases: {},
      scopes: {},
      transmitter: { true: 0, false: 0 },
      receiver: { true: 0, false: 0 },
      secreted: { true: 0, false: 0 },
      plasmaMembraneTransmembrane: { true: 0, false: 0 },
      plasmaMembranePeripheral: { true: 0, false: 0 },
    }

    intercellResults.forEach(entry => {
      // Count aspects
      if (entry.aspect) {
        counts.aspects[entry.aspect] = (counts.aspects[entry.aspect] || 0) + 1
      }

      // Count sources
      if (entry.source) {
        counts.sources[entry.source] = (counts.sources[entry.source] || 0) + 1
      }

      // Count databases
      if (entry.database) {
        counts.databases[entry.database] = (counts.databases[entry.database] || 0) + 1
      }

      // Count scopes
      if (entry.scope) {
        counts.scopes[entry.scope] = (counts.scopes[entry.scope] || 0) + 1
      }

      // Count boolean fields
      if (entry.transmitter === true) counts.transmitter.true++
      if (entry.transmitter === false) counts.transmitter.false++
      
      if (entry.receiver === true) counts.receiver.true++
      if (entry.receiver === false) counts.receiver.false++
      
      if (entry.secreted === true) counts.secreted.true++
      if (entry.secreted === false) counts.secreted.false++
      
      if (entry.plasmaMembraneTransmembrane === true) counts.plasmaMembraneTransmembrane.true++
      if (entry.plasmaMembraneTransmembrane === false) counts.plasmaMembraneTransmembrane.false++
      
      if (entry.plasmaMembranePeripheral === true) counts.plasmaMembranePeripheral.true++
      if (entry.plasmaMembranePeripheral === false) counts.plasmaMembranePeripheral.false++
    })

    return counts
  }, [intercellResults])

  // Handle filter changes
  const handleFilterChange = useCallback((type: keyof IntercellFilters, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const newFilters = { ...intercellFilters }
    
    if (Array.isArray(newFilters[type])) {
      const currentValues = newFilters[type] as string[]
      if (typeof value === 'string') {
        const updatedValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value]
        
        // Type-safe assignment for array fields
        if (type === 'aspects') newFilters.aspects = updatedValues
        else if (type === 'sources') newFilters.sources = updatedValues
        else if (type === 'databases') newFilters.databases = updatedValues
        else if (type === 'scopes') newFilters.scopes = updatedValues
      }
    } else {
      // Type-safe assignment for boolean fields
      if (type === 'transmitter') newFilters.transmitter = value as boolean | null
      else if (type === 'receiver') newFilters.receiver = value as boolean | null
      else if (type === 'secreted') newFilters.secreted = value as boolean | null
      else if (type === 'plasmaMembraneTransmembrane') newFilters.plasmaMembraneTransmembrane = value as boolean | null
      else if (type === 'plasmaMembranePeripheral') newFilters.plasmaMembranePeripheral = value as boolean | null
    }
    
    // Update URL with new filters
    if (Object.values(newFilters).some(v => 
      Array.isArray(v) ? v.length > 0 : v !== null
    )) {
      params.set('filters', JSON.stringify(newFilters))
    } else {
      params.delete('filters')
    }
    params.delete('page')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, intercellFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('filters')
    params.delete('page')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // Update filter data in context when query or data changes
  useEffect(() => {
    const filterContextValue = intercellQuery ? {
      type: "intercell" as const,
      filters: intercellFilters,
      filterCounts,
      onFilterChange: handleFilterChange,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [intercellQuery, intercellFilters, filterCounts, handleFilterChange, clearFilters, setFilterData])

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-2 sm:px-4 pb-6 mt-4">
      {intercellQuery ? (
        <>
          <div className="flex flex-col gap-4">
            <div className="w-full">
              {isLoading ? (
                <TableSkeleton />
              ) : filteredIntercellEntries.length > 0 ? (
                <IntercellTable entries={filteredIntercellEntries} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No intercell data found</h3>
                  <p className="text-muted-foreground max-w-md">
                    No intercell data found for &ldquo;{intercellQuery}&rdquo;. Try searching for a different protein or adjusting your filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Intercell Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for a protein to explore its intercellular communication roles and cellular localization data.
          </p>
        </div>
      )}
    </div>
  )
}