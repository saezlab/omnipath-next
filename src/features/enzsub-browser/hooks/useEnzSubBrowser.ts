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
    const onlyBetweenQueryProteins = searchParams.get('onlyBetweenQueryProteins') === 'true'
    
    return { 
      sources,
      residueTypes,
      modifications,
      onlyBetweenQueryProteins
    }
  }, [searchParams])
  
  // Extract query proteins from URL
  const query = searchParams.get('q') || ''
  const queryProteins = useMemo(() => 
    query ? query.split(/[,;]/).map(q => q.trim()).filter(q => q.length > 0) : [],
    [query]
  )
  
  // Filter data using service
  const filteredData = useMemo(() => 
    data?.enzSubData ? EnzSubFilterService.filterData(data.enzSubData, filters, queryProteins) : [],
    [data, filters, queryProteins]
  )
  
  // Calculate counts
  const filterCounts = useMemo(() => 
    data?.enzSubData ? EnzSubFilterService.calculateCounts(data.enzSubData, filters, queryProteins) : { 
      sources: {}, 
      residueTypes: {}, 
      modifications: {},
      onlyBetweenQueryProteins: { true: 0, false: 0 }
    },
    [data, filters, queryProteins]
  )
  
  // Simple update filter function
  const updateFilter = useCallback((key: keyof EnzSubFilters, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (key === 'sources') {
      const stringValue = value as string
      const currentSources = filters.sources
      const newSources = currentSources.includes(stringValue)
        ? currentSources.filter(s => s !== stringValue)
        : [...currentSources, stringValue]
      
      if (newSources.length > 0) {
        params.set('sources', newSources.join(','))
      } else {
        params.delete('sources')
      }
    } else if (key === 'residueTypes') {
      const stringValue = value as string
      const currentTypes = filters.residueTypes
      const newTypes = currentTypes.includes(stringValue)
        ? currentTypes.filter(t => t !== stringValue)
        : [...currentTypes, stringValue]
      
      if (newTypes.length > 0) {
        params.set('residueTypes', newTypes.join(','))
      } else {
        params.delete('residueTypes')
      }
    } else if (key === 'modifications') {
      const stringValue = value as string
      const currentMods = filters.modifications
      const newMods = currentMods.includes(stringValue)
        ? currentMods.filter(m => m !== stringValue)
        : [...currentMods, stringValue]
      
      if (newMods.length > 0) {
        params.set('modifications', newMods.join(','))
      } else {
        params.delete('modifications')
      }
    } else if (key === 'onlyBetweenQueryProteins') {
      const boolValue = value as boolean
      if (boolValue) {
        params.set('onlyBetweenQueryProteins', 'true')
      } else {
        params.delete('onlyBetweenQueryProteins')
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
    params.delete('onlyBetweenQueryProteins')
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