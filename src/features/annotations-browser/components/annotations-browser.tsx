"use client"

import { TableSkeleton } from "@/components/table-skeleton"
import { getProteinAnnotations, getProteinInformation, GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { AnnotationsTable } from "@/features/annotations-browser/components/annotations-table"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"
import { useSearchStore } from "@/store/search-store"
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

const RESULTS_PER_PAGE = 20

interface FilterCounts {
  sources: Record<string, number>
  annotationTypes: Record<string, number>
}

export function AnnotationsBrowser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToSearchHistory, currentSearchTerm, setCurrentSearchTerm } = useSearchStore()
  const { setFilterData } = useFilters()
  
  const [isLoading, setIsLoading] = useState(false)
  const [proteinData, setProteinData] = useState<GetProteinInformationResponse | null>(null)
  const [isLoadingProtein, setIsLoadingProtein] = useState(false)
  const [annotationsResults, setAnnotationsResults] = useState<Annotation[]>([])
  const lastSearchedQuery = useRef('')
  
  // Get query from URL
  const annotationsQuery = searchParams.get('q') || ''
  
  // Get current page from URL
  const annotationsCurrentPage = parseInt(searchParams.get('page') || '1', 10)
  
  // Parse filters from URL
  const annotationsFilters = useMemo(() => {
    const filtersParam = searchParams.get('filters')
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

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Update shared search term
    setCurrentSearchTerm(searchQuery.trim())
    
    // Update URL with new query - this will trigger the effect to do the actual search
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', searchQuery)
    params.set('page', '1')
    const newUrl = `/annotations?${params.toString()}`
    router.push(newUrl, { scroll: false })
    
    // Add to search history with full URL
    addToSearchHistory(searchQuery, 'annotation', newUrl)
  }, [searchParams, router, addToSearchHistory, setCurrentSearchTerm])

  // Single effect to handle both sync and fetch
  useEffect(() => {
    const queryToUse = annotationsQuery || currentSearchTerm
    
    // Sync shared search term when query changes from URL
    if (annotationsQuery && annotationsQuery !== currentSearchTerm) {
      setCurrentSearchTerm(annotationsQuery)
    }
    
    // Prevent duplicate searches
    if (queryToUse && queryToUse !== lastSearchedQuery.current) {
      lastSearchedQuery.current = queryToUse
      
      const fetchData = async () => {
        setIsLoading(true)
        setIsLoadingProtein(true)
        
        // If no URL query but we have a shared search term, update URL
        if (!annotationsQuery && currentSearchTerm) {
          const params = new URLSearchParams(searchParams.toString())
          params.set('q', currentSearchTerm)
          params.set('page', '1')
          const newUrl = `/annotations?${params.toString()}`
          router.push(newUrl, { scroll: false })
          
          // Add to search history
          addToSearchHistory(currentSearchTerm, 'annotation', newUrl)
        }
        
        try {
          const [annotationsResponse, proteinResponse] = await Promise.all([
            getProteinAnnotations(queryToUse),
            getProteinInformation(queryToUse)
          ])
          
          setAnnotationsResults(annotationsResponse.annotations)
          setProteinData(proteinResponse)
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
          setIsLoadingProtein(false)
        }
      }
      
      fetchData()
    }
  }, [annotationsQuery, currentSearchTerm, searchParams, router, addToSearchHistory, setCurrentSearchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Get unique record count for pagination and display
  const uniqueRecordCount = new Set(filteredAnnotations.map(a => a.recordId)).size
  const totalPages = Math.ceil(uniqueRecordCount / RESULTS_PER_PAGE)
  const startIndex = (annotationsCurrentPage - 1) * RESULTS_PER_PAGE
  const endIndex = startIndex + RESULTS_PER_PAGE

  // Get unique recordIds for the current page
  const uniqueRecordIds = Array.from(new Set(filteredAnnotations.map(a => a.recordId))).slice(startIndex, endIndex)
  
  // Get all annotations for the records in the current page
  const currentResults = filteredAnnotations.filter(annotation => 
    uniqueRecordIds.includes(annotation.recordId)
  )

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
    
    // Update URL with new filters
    if (Object.values(newFilters).some(v => (typeof v === 'string' ? v.length > 0 : v.length > 0))) {
      params.set('filters', JSON.stringify(newFilters))
    } else {
      params.delete('filters')
    }
    params.set('page', '1')
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, annotationsFilters, router])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('filters')
    params.set('page', '1')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  
  const setAnnotationsCurrentPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

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
      <div className="flex flex-col gap-6 max-w-7xl mx-auto px-2 sm:px-4 pb-6">
        {annotationsQuery ? (
          <>
            <ProteinSummaryCard 
              proteinData={proteinData ?? undefined}
              isLoading={isLoadingProtein}
            />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {uniqueRecordCount} results
                  </span>
                </div>
              </div>

              {/* Main Content - Now uses full width */}
              <div className="w-full">
                {isLoading ? (
                  <TableSkeleton />
                ) : uniqueRecordCount > 0 ? (
                  <AnnotationsTable
                    currentResults={currentResults}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                    currentPage={annotationsCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setAnnotationsCurrentPage}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No annotations found</h3>
                    <p className="text-muted-foreground max-w-md">
                      No annotations found for &ldquo;{annotationsQuery}&rdquo;. Try searching for a different protein.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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

