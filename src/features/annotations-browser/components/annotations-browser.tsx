"use client"

import { DataCard } from "@/components/data-card"
import { FilterSkeleton } from "@/components/filter-skeleton"
import { SearchBar } from "@/components/search-bar"
import { TableSkeleton } from "@/components/table-skeleton"
import { Button } from "@/components/ui/button"
import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"
import { AnnotationsTable } from "@/features/annotations-browser/components/annotations-table"
import { AnnotationsFilterSidebar } from "@/features/annotations-browser/components/filter-sidebar"
import { VisualizationPlaceholder } from "@/features/interactions-browser/components/visualization-placeholder"
import { useSyncUrl } from '@/hooks/use-sync-url'
import { exportToCSV } from "@/lib/utils/export"
import { useSearchStore } from "@/store/search-store"
import {
  Activity,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
  Tag
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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

interface PivotedAnnotationRecord {
  recordId: number | null;
  source: string | null;
  geneSymbol: string | null;
  uniprotId: string | null;
  values: Record<string, string | null>;
}

type ViewMode = "table" | "network" | "chart"

export function AnnotationsBrowser() {
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")

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

  useEffect(() => {
    if (annotationsQuery && annotationsResults.length === 0) {
      handleSearch()
    }
  }, [])

  const handleSearch = async (searchQuery: string = annotationsQuery) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setAnnotationsCurrentPage(1)

    try {
      const response = await getProteinAnnotations(searchQuery)
      setAnnotationsResults(response.annotations)
    } catch (error) {
      console.error("Error fetching annotations:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleExport = () => {
    if (filteredAnnotations.length === 0) return;
    
    // Pivot all filtered annotations
    const pivotedData = filteredAnnotations.reduce((acc: PivotedAnnotationRecord[], annotation) => {
      const existingRecord = acc.find(item => item.recordId === annotation.recordId);
      
      if (existingRecord) {
        existingRecord.values[annotation.label || ''] = annotation.value;
      } else {
        acc.push({
          recordId: annotation.recordId,
          source: annotation.source,
          geneSymbol: annotation.genesymbol,
          uniprotId: annotation.uniprot,
          values: {
            [annotation.label || '']: annotation.value
          }
        });
      }
      
      return acc;
    }, []);

    // Flatten the pivoted data for CSV export
    const flattenedData = pivotedData.map(record => {
      const baseRecord = {
        'Record ID': record.recordId,
        'Source': record.source,
        'Gene Symbol': record.geneSymbol,
        'UniProt ID': record.uniprotId
      };
      
      // Add all annotation values
      return { ...baseRecord, ...record.values };
    });

    const filename = `annotations_${annotationsQuery || 'export'}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(flattenedData, filename);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <SearchBar
            initialQuery={annotationsQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Search for a protein..."
          />
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredAnnotations.length === 0}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <AnnotationsFilterSidebar
            filters={annotationsFilters}
            onFilterChange={handleFilterChange}
            filterCounts={filterCounts}
            showMobileFilters={showMobileFilters}
            onClearFilters={clearFilters}
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
    </div>
  )
}

