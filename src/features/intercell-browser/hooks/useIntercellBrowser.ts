import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GetIntercellDataResponse } from '../api/queries'
import { IntercellFilters } from '../types'
import { IntercellFilterService } from '../services/intercell-filter.service'
import { useFilters } from '@/contexts/filter-context'

export function useIntercellBrowser(data?: GetIntercellDataResponse) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  // Get query from URL
  const query = searchParams.get('q') || ''
  
  // Parse filters from URL - simple flat params
  const filters = useMemo((): IntercellFilters => {
    const aspects = searchParams.get('aspects')?.split(',').filter(Boolean) || []
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    const databases = searchParams.get('databases')?.split(',').filter(Boolean) || []
    const scopes = searchParams.get('scopes')?.split(',').filter(Boolean) || []
    const parents = searchParams.get('parents')?.split(',').filter(Boolean) || []
    
    // Parse boolean params - convert string values to boolean or null
    const parseBooleanParam = (param: string | null): boolean | null => {
      if (param === 'true') return true
      if (param === 'false') return false
      return null
    }
    
    return {
      aspects,
      sources,
      databases,
      scopes,
      parents,
      transmitter: parseBooleanParam(searchParams.get('transmitter')),
      receiver: parseBooleanParam(searchParams.get('receiver')),
      secreted: parseBooleanParam(searchParams.get('secreted')),
      plasmaMembraneTransmembrane: parseBooleanParam(searchParams.get('plasmaMembraneTransmembrane')),
      plasmaMembranePeripheral: parseBooleanParam(searchParams.get('plasmaMembranePeripheral')),
    }
  }, [searchParams])
  
  // Filter data using service
  const filteredData = useMemo(() => 
    data ? IntercellFilterService.filterData(data.intercellEntries, filters) : [],
    [data, filters]
  )
  
  // Calculate counts
  const filterCounts = useMemo(() =>
    data ? IntercellFilterService.calculateCounts(data.intercellEntries) : {
      aspects: {},
      sources: {},
      databases: {},
      scopes: {},
      parents: {},
      transmitter: { true: 0, false: 0 },
      receiver: { true: 0, false: 0 },
      secreted: { true: 0, false: 0 },
      plasmaMembraneTransmembrane: { true: 0, false: 0 },
      plasmaMembranePeripheral: { true: 0, false: 0 },
    },
    [data]
  )
  
  // Simple update filter function
  const updateFilter = useCallback((key: keyof IntercellFilters, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (key === 'aspects' || key === 'sources' || key === 'databases' || key === 'scopes' || key === 'parents') {
      // Handle array filters
      const currentValues = filters[key] as string[]
      if (typeof value === 'string') {
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
        
        if (newValues.length > 0) {
          params.set(key, newValues.join(','))
        } else {
          params.delete(key)
        }
      }
    } else {
      // Handle boolean filters
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }
    
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [filters, searchParams, router])
  
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('aspects')
    params.delete('sources')
    params.delete('databases')
    params.delete('scopes')
    params.delete('parents')
    params.delete('transmitter')
    params.delete('receiver')
    params.delete('secreted')
    params.delete('plasmaMembraneTransmembrane')
    params.delete('plasmaMembranePeripheral')
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  
  // Update filter data in context when query or data changes
  useEffect(() => {
    const filterContextValue = query ? {
      type: "intercell" as const,
      filters,
      filterCounts,
      onFilterChange: updateFilter,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [query, filters, filterCounts, updateFilter, clearFilters, setFilterData])
  
  return {
    query,
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters,
    isLoading: !data
  }
}