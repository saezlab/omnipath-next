import { useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GetEnzSubDataResponse } from '../api/queries'
import { EnzSubFilters } from '../types'
import { EnzSubFilterService } from '../services/enzsub-filter.service'

export function useEnzSubBrowser(data?: GetEnzSubDataResponse) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Parse filters from URL - simple flat params
  const filters = useMemo((): EnzSubFilters => {
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    const residueTypes = searchParams.get('residueTypes')?.split(',').filter(Boolean) || []
    const modifications = searchParams.get('modifications')?.split(',').filter(Boolean) || []
    
    return { 
      sources,
      residueTypes,
      modifications
    }
  }, [searchParams])
  
  // Filter data using service
  const filteredData = useMemo(() => 
    data?.enzSubData ? EnzSubFilterService.filterData(data.enzSubData, filters) : [],
    [data, filters]
  )
  
  // Calculate counts
  const filterCounts = useMemo(() => 
    data?.enzSubData ? EnzSubFilterService.calculateCounts(data.enzSubData) : { 
      sources: {}, 
      residueTypes: {}, 
      modifications: {} 
    },
    [data]
  )
  
  // Simple update filter function
  const updateFilter = useCallback((key: keyof EnzSubFilters, value: string) => {
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
    } else if (key === 'residueTypes') {
      const currentTypes = filters.residueTypes
      const newTypes = currentTypes.includes(value)
        ? currentTypes.filter(t => t !== value)
        : [...currentTypes, value]
      
      if (newTypes.length > 0) {
        params.set('residueTypes', newTypes.join(','))
      } else {
        params.delete('residueTypes')
      }
    } else if (key === 'modifications') {
      const currentMods = filters.modifications
      const newMods = currentMods.includes(value)
        ? currentMods.filter(m => m !== value)
        : [...currentMods, value]
      
      if (newMods.length > 0) {
        params.set('modifications', newMods.join(','))
      } else {
        params.delete('modifications')
      }
    }
    
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [filters, searchParams, router])
  
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sources')
    params.delete('residueTypes')
    params.delete('modifications')
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