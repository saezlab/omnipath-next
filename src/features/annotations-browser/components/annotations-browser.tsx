"use client"

import { SearchBar } from "@/components/search-bar"
import { TableSkeleton } from "@/components/table-skeleton"
import { Button } from "@/components/ui/button"
import { getProteinAnnotations, getProteinInformation, GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { AnnotationsTable } from "@/features/annotations-browser/components/annotations-table"
import { AnnotationsFilterSidebar } from "@/features/annotations-browser/components/filter-sidebar"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"
import { useSyncUrl } from '@/hooks/use-sync-url'
import { useSearchStore } from "@/store/search-store"
import {
  Activity,
  Info,
  MapPin,
  SlidersHorizontal,
  Tag
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

const RESULTS_PER_PAGE = 20

interface SearchFilters {
  sources: string[]
  annotationTypes: string[]
  valueSearch: string
}

interface FilterCounts {
  sources: Record<string, number>
  annotationTypes: Record<string, number>
}

export function AnnotationsBrowser() {
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [proteinData, setProteinData] = useState<GetProteinInformationResponse | null>(null)
  const [isLoadingProtein, setIsLoadingProtein] = useState(false)

  // Use the URL sync hook
  useSyncUrl()

  // Get state and actions from the store
  const {
    annotationsQuery,
    annotationsResults,
    annotationsFilters,
    annotationsCurrentPage,
    setAnnotationsResults,
    setAnnotationsFilters,
    setAnnotationsCurrentPage,
    setSelectedAnnotation,
    setAnnotationsQuery,
  } = useSearchStore()

  const handleSearch = useCallback(async (searchQuery: string = annotationsQuery) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setIsLoadingProtein(true)
    setAnnotationsQuery(searchQuery)
    setAnnotationsCurrentPage(1)

    try {
      const [annotationsResponse, proteinResponse] = await Promise.all([
        getProteinAnnotations(searchQuery),
        getProteinInformation(searchQuery)
      ])
      
      setAnnotationsResults(annotationsResponse.annotations)
      setProteinData(proteinResponse)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingProtein(false)
    }
  }, [annotationsQuery, setAnnotationsQuery, setAnnotationsCurrentPage, setAnnotationsResults])

  useEffect(() => {
    if (annotationsQuery && annotationsResults.length === 0) {
      handleSearch()
    }
  }, [annotationsQuery, annotationsResults.length, handleSearch])

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
  const handleFilterChange = (type: keyof SearchFilters, value: string) => {
    setAnnotationsFilters((prev: SearchFilters) => {
      if (type === "valueSearch") {
        return { ...prev, [type]: value }
      }

      const currentValues = prev[type] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      return { ...prev, [type]: newValues }
    })
    setAnnotationsCurrentPage(1)
  }

  const clearFilters = () => {
    setAnnotationsFilters({
      sources: [],
      annotationTypes: [],
      valueSearch: "",
    })
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <SearchBar
          placeholder="Search for a protein..."
          onSearch={handleSearch}
          initialQuery={annotationsQuery}
          isLoading={isLoading}
        />
        
        {annotationsQuery && (
          <>
            <ProteinSummaryCard 
              proteinData={proteinData ?? undefined}
              isLoading={isLoadingProtein}
            />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {uniqueRecordCount} results
                  </span>
                </div>
              </div>

              <div className="flex gap-6">
                <AnnotationsFilterSidebar
                  filterCounts={filterCounts}
                  filters={annotationsFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  showMobileFilters={showMobileFilters}
                />

                <div className="flex-1">
                  {isLoading ? (
                    <TableSkeleton />
                  ) : (
                    <AnnotationsTable
                      currentResults={currentResults}
                      onSelectAnnotation={setSelectedAnnotation}
                      getCategoryIcon={getCategoryIcon}
                      getCategoryColor={getCategoryColor}
                      currentPage={annotationsCurrentPage}
                      totalPages={totalPages}
                      onPageChange={setAnnotationsCurrentPage}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

