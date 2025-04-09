"use client"

import { FilterSkeleton } from "@/components/filter-skeleton"
import { TableSkeleton } from "@/components/table-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"
import { AnnotationsTable } from "@/features/annotations-browser/components/annotations-table"
import { AnnotationsFilterSidebar } from "@/features/annotations-browser/components/filter-sidebar"
import { Pagination } from "@/features/interactions-browser/components/pagination"
import { VisualizationPlaceholder } from "@/features/interactions-browser/components/visualization-placeholder"
import { useSyncUrl } from '@/hooks/use-sync-url'
import { exportToCSV } from "@/lib/utils/export"
import { useSearchStore } from "@/store/search-store"
import {
  Activity,
  BarChart3,
  Download,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
  TableIcon,
  Tag,
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

export function AnnotationsBrowser() {
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Use the URL sync hook
  useSyncUrl()

  // Get state and actions from the store
  const {
    annotationsQuery,
    annotationsResults,
    annotationsFilters,
    annotationsViewMode,
    annotationsCurrentPage,
    setAnnotationsQuery,
    setAnnotationsResults,
    setAnnotationsFilters,
    setAnnotationsViewMode,
    setAnnotationsCurrentPage,
    setSelectedAnnotation,
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
      sources: ["UniProt_keyword"],
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
        'Gene Symbol': record.geneSymbol || 'N/A',
        'UniProt ID': record.uniprotId || 'N/A'
      };
      
      // Add all annotation values
      return { ...baseRecord, ...record.values };
    });

    const filename = `annotations_${annotationsQuery || 'export'}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(flattenedData, filename);
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="w-full bg-background sticky top-0 z-10 border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex w-full items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for proteins or genes..."
                  className="w-full pl-9"
                  value={annotationsQuery}
                  onChange={(e) => setAnnotationsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={() => handleSearch()} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          {isLoading ? (
            <FilterSkeleton />
          ) : (
            <AnnotationsFilterSidebar
              filters={annotationsFilters}
              onFilterChange={handleFilterChange}
              filterCounts={filterCounts}
              showMobileFilters={showMobileFilters}
              onClearFilters={clearFilters}
            />
          )}

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : annotationsResults.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant={annotationsViewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnnotationsViewMode("table")}
                    >
                      <TableIcon className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={annotationsViewMode === "chart" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnnotationsViewMode("chart")}
                      disabled
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Chart
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={filteredAnnotations.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Annotations Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Annotations ({uniqueRecordCount} total)
                    </h3>
                  </div>

                  {/* Results display based on view mode */}
                  {annotationsViewMode === "table" ? (
                    <Card>
                      <CardContent className="p-0">
                        <AnnotationsTable
                          currentResults={currentResults}
                          onSelectAnnotation={(annotation) => setSelectedAnnotation(annotation)}
                          getCategoryIcon={getCategoryIcon}
                          getCategoryColor={getCategoryColor}
                        />
                        <Pagination
                          currentPage={annotationsCurrentPage}
                          totalPages={totalPages}
                          startIndex={startIndex}
                          endIndex={endIndex}
                          totalItems={uniqueRecordCount}
                          onPageChange={setAnnotationsCurrentPage}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        <VisualizationPlaceholder type="chart" />
                      </CardContent>
                    </Card>
                  )}

                  {/* Annotation Details */}
{/*                   <AnnotationDetails
                    selectedAnnotation={selectedAnnotation}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                  /> */}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No annotations found</h3>
                <p className="text-muted-foreground max-w-md">
                  Search for proteins or genes to explore their annotations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

