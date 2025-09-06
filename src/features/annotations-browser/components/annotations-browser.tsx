"use client"

import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"
import { searchIdentifiers } from "@/db/queries"
import { AnnotationsTable } from "@/features/annotations-browser/components/annotations-table"
import { Annotation, SearchFilters } from "@/features/annotations-browser/types"
import {
  Activity,
  Info,
  MapPin,
  Tag
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

const SOURCES_PER_LOAD = 4

interface FilterCounts {
  sources: Record<string, number>
  annotationTypes: Record<string, number>
}

interface AnnotationsBrowserProps {
  isLoading?: boolean
}

export function AnnotationsBrowser({ isLoading }: AnnotationsBrowserProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setFilterData } = useFilters()
  
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const [annotationsResults, setAnnotationsResults] = useState<Annotation[]>([])
  const [loadedSources, setLoadedSources] = useState<string[]>([])
  const [hasMoreSources, setHasMoreSources] = useState(true)
  const lastSearchedQuery = useRef('')
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Get query from URL
  const annotationsQuery = searchParams.get('q') || ''
  
  // Parse filters from URL
  const annotationsFilters = useMemo(() => {
    const filtersParam = searchParams.get('annotations_filters')
    if (!filtersParam) {
      return {
        sources: [],
        annotationTypes: [],
        valueSearch: '',
      } as SearchFilters
    }
    try {
      return JSON.parse(filtersParam) as SearchFilters
    } catch {
      return {
        sources: [],
        annotationTypes: [],
        valueSearch: '',
      } as SearchFilters
    }
  }, [searchParams])


  // Fetch annotations when query changes
  useEffect(() => {
    // Only use URL query as source of truth
    if (annotationsQuery && annotationsQuery !== lastSearchedQuery.current) {
      lastSearchedQuery.current = annotationsQuery
      
      const fetchData = async () => {
        setInternalIsLoading(true)
        
        // Reset infinite scroll state for new search
        setLoadedSources([])
        setHasMoreSources(true)
        
        try {
          // Always fetch fresh identifier results - no caching
          console.log(`Fetching identifier results for: "${annotationsQuery}" with species: 9606`);
          const identifierResults = await searchIdentifiers(annotationsQuery, 50, '9606'); // Default to human
          
          // Now use the identifier results to get annotations
          const annotationsResponse = await getProteinAnnotations(identifierResults)
          
          setAnnotationsResults(annotationsResponse.annotations)
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setInternalIsLoading(false)
        }
      }
      
      fetchData()
    }
  }, [annotationsQuery])

  // Get all unique sources from all annotations (for infinite scroll management)
  // Keep natural database order - don't sort to prevent layout shifts
  const allUniqueSources = useMemo(() => {
    const seenSources = new Set<string>()
    const sources: string[] = []
    
    // Preserve order of appearance in database
    annotationsResults.forEach(annotation => {
      if (annotation.source && !seenSources.has(annotation.source)) {
        seenSources.add(annotation.source)
        sources.push(annotation.source)
      }
    })
    
    return sources
  }, [annotationsResults])

  // Filter annotations based on selected filters
  const filteredAnnotations = useMemo(() => {
    // First, find all recordIds that match the value search in any field
    const matchingRecordIds = new Set<number>()
    
    annotationsResults.forEach((annotation) => {
      const searchTerm = annotationsFilters.valueSearch.toLowerCase()
      if (searchTerm) {
        // Check if any field contains the search term
        const matches = 
          (annotation.value?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.label?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.source?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.genesymbol?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.uniprot?.toLowerCase().includes(searchTerm) || false)
        
        if (matches && annotation.recordId) {
          matchingRecordIds.add(annotation.recordId)
        }
      }
    })

    // Then filter annotations based on all criteria
    return annotationsResults.filter((annotation) => {
      // Filter by source
      if (annotationsFilters.sources.length > 0 && annotation.source) {
        const sourceMatch = annotationsFilters.sources.some(filterSource => 
          filterSource.toLowerCase() === annotation.source?.toLowerCase()
        )
        if (!sourceMatch) return false
      }

      // Filter by annotation type
      if (annotationsFilters.annotationTypes.length > 0 && annotation.label) {
        const typeMatch = annotationsFilters.annotationTypes.some(filterType => 
          filterType.toLowerCase() === annotation.label?.toLowerCase()
        )
        if (!typeMatch) return false
      }

      // Filter by value search - include all annotations for matching records
      if (annotationsFilters.valueSearch && matchingRecordIds.size > 0) {
        if (!annotation.recordId || !matchingRecordIds.has(annotation.recordId)) {
          return false
        }
      }

      return true
    })
  }, [annotationsResults, annotationsFilters])

  // Calculate filter counts based on unique records
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
      annotationTypes: {},
    }

    // Get unique records first
    const uniqueRecords = new Set(annotationsResults.map(a => a.recordId))
    
    // For each unique record, count its sources and types
    uniqueRecords.forEach(recordId => {
      const recordAnnotations = annotationsResults.filter(a => a.recordId === recordId)
      
      // Count unique sources for this record
      const uniqueSources = new Set(recordAnnotations.map(a => a.source?.toLowerCase()))
      uniqueSources.forEach(source => {
        if (source) {
          counts.sources[source] = (counts.sources[source] || 0) + 1
        }
      })

      // Count unique types for this record
      const uniqueTypes = new Set(recordAnnotations.map(a => a.label?.toLowerCase()))
      uniqueTypes.forEach(type => {
        if (type) {
          counts.annotationTypes[type] = (counts.annotationTypes[type] || 0) + 1
        }
      })
    })

    return counts
  }, [annotationsResults])

  // Load more sources function
  const loadMoreSources = useCallback(() => {
    if (!hasMoreSources) return
    
    const filteredSources = allUniqueSources.filter(source => {
      if (annotationsFilters.sources.length > 0) {
        return annotationsFilters.sources.some(filterSource => 
          filterSource.toLowerCase() === source.toLowerCase()
        )
      }
      return true
    })
    
    const nextSources = filteredSources.slice(
      loadedSources.length, 
      loadedSources.length + SOURCES_PER_LOAD
    )
    
    if (nextSources.length === 0) {
      setHasMoreSources(false)
      return
    }
    
    setLoadedSources(prev => [...prev, ...nextSources])
    
    // Check if there are more sources to load
    if (loadedSources.length + nextSources.length >= filteredSources.length) {
      setHasMoreSources(false)
    }
  }, [allUniqueSources, annotationsFilters.sources, loadedSources, hasMoreSources])

  // Initialize loading the first batch of sources
  useEffect(() => {
    if (allUniqueSources.length > 0 && loadedSources.length === 0 && annotationsResults.length > 0) {
      loadMoreSources()
    }
  }, [allUniqueSources, loadedSources.length, annotationsResults.length, loadMoreSources])

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreSources && !isLoading) {
          loadMoreSources()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => observer.disconnect()
  }, [hasMoreSources, isLoading, loadMoreSources])

  // Get annotations for currently loaded sources
  const currentResults = filteredAnnotations.filter(annotation => 
    loadedSources.includes(annotation.source || '')
  )

  // Get unique record count for display
  const uniqueRecordCount = new Set(currentResults.map(a => a.recordId)).size

  // Handle filter changes
  const handleFilterChange = useCallback((type: keyof SearchFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const newFilters = { ...annotationsFilters }
    
    if (type === "valueSearch") {
      newFilters[type] = value
    } else {
      const currentValues = newFilters[type] as string[]
      newFilters[type] = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
    }
    
    // Reset infinite scroll state when filters change
    setLoadedSources([])
    setHasMoreSources(true)
    
    // Update URL with new filters
    if (Object.values(newFilters).some(v => (typeof v === 'string' ? v.length > 0 : v.length > 0))) {
      params.set('annotations_filters', JSON.stringify(newFilters))
    } else {
      params.delete('annotations_filters')
    }
    params.delete('page') // Remove page parameter
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, annotationsFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('annotations_filters')
    params.delete('page') // Remove page parameter
    
    // Reset infinite scroll state when filters are cleared
    setLoadedSources([])
    setHasMoreSources(true)
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  

  // Get category icon
  const getCategoryIcon = (label: string | null) => {
    if (!label) return <Tag className="h-4 w-4" />
    if (label.includes("localization") || label.includes("location")) {
      return <MapPin className="h-4 w-4" />
    }
    if (label.includes("function") || label.includes("pathway")) {
      return <Activity className="h-4 w-4" />
    }
    if (label.includes("cancer") || label.includes("disease")) {
      return <Info className="h-4 w-4" />
    }
    return <Tag className="h-4 w-4" />
  }

  // Get category color
  const getCategoryColor = (label: string | null) => {
    if (!label) return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    if (label.includes("localization") || label.includes("location")) {
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    }
    if (label.includes("function") || label.includes("pathway")) {
      return "bg-green-100 text-green-800 hover:bg-green-200"
    }
    if (label.includes("cancer") || label.includes("disease")) {
      return "bg-red-100 text-red-800 hover:bg-red-200"
    }
    return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  // Update filter data in context when query or data changes
  useEffect(() => {
    const filterContextValue = annotationsQuery ? {
      type: "annotations" as const,
      filters: annotationsFilters,
      filterCounts,
      onFilterChange: handleFilterChange,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [annotationsQuery, annotationsFilters, filterCounts, handleFilterChange, clearFilters, setFilterData])

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden">
      {annotationsQuery ? (
        <div className="w-full h-full max-w-full overflow-x-hidden">
          {uniqueRecordCount > 0 || loadedSources.length > 0 ? (
            <>
              <AnnotationsTable
                currentResults={currentResults}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                uniqueRecordCount={uniqueRecordCount}
              />
              
              {/* Sentinel for infinite scroll */}
              {hasMoreSources && loadedSources.length >= 1 && (
                <div ref={loadMoreRef} className="h-4 flex justify-center py-8">
                  <div className="text-muted-foreground text-sm">Loading more sources...</div>
                </div>
              )}
              
              {!hasMoreSources && loadedSources.length > 0 && (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground text-sm">All sources loaded</div>
                </div>
              )}
            </>
          ) : annotationsResults.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results match your filters</h3>
              <p className="text-muted-foreground max-w-md">
                Try adjusting your filter criteria to see more annotations.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No annotations found</h3>
              <p className="text-muted-foreground max-w-md">
                No annotations found for &ldquo;{annotationsQuery}&rdquo;. Try searching for a different protein.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Annotations Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for a protein to explore its annotations and functional information.
          </p>
        </div>
      )}
    </div>
  )
}

