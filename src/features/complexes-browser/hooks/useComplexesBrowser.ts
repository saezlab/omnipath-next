import { useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GetComplexesDataResponse } from '../api/queries'
import { ComplexesFilters } from '../types'
import { ComplexesFilterService } from '../services/complexes-filter.service'

export function useComplexesBrowser(data?: GetComplexesDataResponse) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Parse filters from URL - simple flat params
  const filters = useMemo((): ComplexesFilters => {
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    return { sources }
  }, [searchParams])
  
  // Filter data using service
  const filteredData = useMemo(() => 
    data ? ComplexesFilterService.filterData(data.complexEntries, filters) : [],
    [data, filters]
  )
  
  // Calculate counts
  const filterCounts = useMemo(() => 
    data ? ComplexesFilterService.calculateCounts(data.complexEntries) : { sources: {} },
    [data]
  )
  
  // Simple update filter function
  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (key === 'sources') {
      const currentSources = filters.sources
      const newSources = currentSources.includes(value)
        ? currentSources.filter(s => s !== value)
        : [...currentSources, value]
      
      if (newSources.length > 0) {
        params.set('sources', newSources.join(','))
      } else {
        params.delete('sources')
      }
    }
    
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [filters, searchParams, router])
  
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sources')
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  
  return {
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters,
    isLoading: !data
  }
}