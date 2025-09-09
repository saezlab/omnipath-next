import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GetProteinAnnotationsResponse } from '../api/queries'
import { SearchFilters } from '../types'
import { AnnotationsFilterService } from '../services/annotations-filter.service'

const SOURCES_PER_LOAD = 4

export function useAnnotationsBrowser(data?: GetProteinAnnotationsResponse) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Infinite scroll state
  const [loadedSources, setLoadedSources] = useState<string[]>([])
  const [hasMoreSources, setHasMoreSources] = useState(true)
  
  // Parse filters from URL - simple flat params
  const filters = useMemo((): SearchFilters => {
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    const annotationTypes = searchParams.get('types')?.split(',').filter(Boolean) || []
    const valueSearch = searchParams.get('search') || ''
    
    return { sources, annotationTypes, valueSearch }
  }, [searchParams])
  
  // Filter data using service
  const filteredData = useMemo(() => 
    data ? AnnotationsFilterService.filterData(data.annotations, filters) : [],
    [data, filters]
  )
  
  // Calculate counts
  const filterCounts = useMemo(() => 
    data ? AnnotationsFilterService.calculateCounts(data.annotations) : { sources: {}, annotationTypes: {} },
    [data]
  )
  
  // Reset infinite scroll state when new data arrives or query changes
  const query = searchParams.get('q') || ''
  useEffect(() => {
    if (data && query) {
      setLoadedSources([])
      setHasMoreSources(true)
    }
  }, [data, query])
  
  // Load more sources function
  const loadMoreSources = useCallback(() => {
    if (!hasMoreSources) return
    
    // Get sources that have filtered data
    const sourcesWithData = [...new Set(
      filteredData
        .map(annotation => annotation.source)
        .filter((source): source is string => Boolean(source))
    )]
    const nextSources = sourcesWithData.slice(
      loadedSources.length, 
      loadedSources.length + SOURCES_PER_LOAD
    )
    
    if (nextSources.length === 0) {
      setHasMoreSources(false)
      return
    }
    
    setLoadedSources(prev => [...prev, ...nextSources])
    
    if (loadedSources.length + nextSources.length >= sourcesWithData.length) {
      setHasMoreSources(false)
    }
  }, [filteredData, loadedSources, hasMoreSources])
  
  // Reset and load sources when filters change
  useEffect(() => {
    if (filteredData.length > 0) {
      // Always reset and reload when filtered data changes
      setLoadedSources([])
      setHasMoreSources(true)
    }
  }, [filteredData.length])

  // Load first batch when loadedSources is empty
  useEffect(() => {
    if (filteredData.length > 0 && loadedSources.length === 0) {
      loadMoreSources()
    }
  }, [filteredData.length, loadedSources.length, loadMoreSources])
  
  // Get annotations for currently loaded sources
  const currentResults = filteredData.filter(annotation => 
    loadedSources.includes(annotation.source || '')
  )
  
  // Get unique record count for display
  const uniqueRecordCount = new Set(currentResults.map(a => a.recordId)).size
  
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
    } else if (key === 'types') {
      const currentTypes = filters.annotationTypes
      const newTypes = currentTypes.includes(value)
        ? currentTypes.filter(t => t !== value)
        : [...currentTypes, value]
      
      if (newTypes.length > 0) {
        params.set('types', newTypes.join(','))
      } else {
        params.delete('types')
      }
    } else if (key === 'search') {
      if (value && value.length > 0) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
    }
    
    // Reset infinite scroll state when filters change
    setLoadedSources([])
    setHasMoreSources(true)
    
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [filters, searchParams, router])
  
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sources')
    params.delete('types')
    params.delete('search')
    params.delete('page')
    
    // Reset infinite scroll state when filters are cleared
    setLoadedSources([])
    setHasMoreSources(true)
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  
  return {
    filters,
    filteredData,
    filterCounts,
    updateFilter,
    clearFilters,
    isLoading: !data,
    // Infinite scroll related
    loadedSources,
    hasMoreSources,
    loadMoreSources,
    loadMoreRef,
    currentResults,
    uniqueRecordCount
  }
}