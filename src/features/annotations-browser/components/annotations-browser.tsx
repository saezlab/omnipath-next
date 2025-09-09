"use client"

import { GetProteinAnnotationsResponse } from "@/features/annotations-browser/api/queries"
import { SearchIdentifiersResponse } from "@/db/queries"
import { AnnotationsTable } from "@/features/annotations-browser/components/annotations-table"
import { useAnnotationsBrowser } from "@/features/annotations-browser/hooks/useAnnotationsBrowser"
import {
  Activity,
  Info,
  MapPin,
  Tag
} from "lucide-react"
import { useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { useFilters } from "@/contexts/filter-context"

// Helper functions for multi-query detection
function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

function isMultiQuery(queryString: string): boolean {
  return parseQueries(queryString).length > 1
}

interface AnnotationsBrowserProps {
  isLoading?: boolean
  identifierResults?: SearchIdentifiersResponse
  data?: GetProteinAnnotationsResponse
}

export function AnnotationsBrowser({ isLoading = false, data }: AnnotationsBrowserProps) {
  const searchParams = useSearchParams()
  const { setFilterData } = useFilters()
  
  const {
    filters,
    filterCounts,
    updateFilter,
    clearFilters,
    loadedSources,
    hasMoreSources,
    loadMoreSources,
    loadMoreRef,
    currentResults,
    uniqueRecordCount
  } = useAnnotationsBrowser(data)
  
  // Get query from URL
  const annotationsQuery = searchParams.get('q') || ''


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
      filters,
      filterCounts,
      onFilterChange: updateFilter,
      onClearFilters: clearFilters,
    } : null
    
    setFilterData(filterContextValue)
  }, [annotationsQuery, filters, filterCounts, updateFilter, clearFilters, setFilterData])

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden">
      {annotationsQuery ? (
        <div className="w-full h-full max-w-full overflow-x-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading annotations...</p>
            </div>
          ) : uniqueRecordCount > 0 || loadedSources.length > 0 ? (
            <>
              <AnnotationsTable
                currentResults={currentResults}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                uniqueRecordCount={uniqueRecordCount}
                isMultiQuery={isMultiQuery(annotationsQuery)}
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
          ) : data?.annotations?.length ?? 0 > 0 ? (
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

