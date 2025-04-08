"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  TableIcon,
  BarChart3,
  Download,
  Search,
  SlidersHorizontal,
  Info,
  Tag,
  MapPin,
  Activity,
  Layers,
} from "lucide-react"
import { AnnotationsFilterSidebar } from "@/features/annotations-browser/components/filter-sidebar"
import { EntityCard } from "@/features/annotations-browser/components/entity-card"
import { AnnotationDetails } from "@/features/annotations-browser/components/annotation-details"
import { Pagination } from "@/features/interactions-browser/components/pagination"
import { VisualizationPlaceholder } from "@/features/interactions-browser/components/visualization-placeholder"
import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"

const RESULTS_PER_PAGE = 10

interface Annotation {
  uniprot: string | null
  genesymbol: string | null
  entityType: string | null
  source: string | null
  label: string | null
  value: string | null
  recordId: number | null
}

interface SearchFilters {
  sources: string[]
  annotationTypes: string[]
  valueSearch: string
}

interface FilterCounts {
  sources: Record<string, number>
  annotationTypes: Record<string, number>
}

interface AnnotationsTableProps {
  currentResults: Annotation[]
  onSelectAnnotation: (annotation: Annotation) => void
  getCategoryIcon: (label: string | null) => React.ReactNode
  getCategoryColor: (label: string | null) => string
}

export function AnnotationsTable({
  currentResults,
  onSelectAnnotation,
  getCategoryIcon,
  getCategoryColor,
}: AnnotationsTableProps) {
  if (currentResults.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No annotations found matching the current filters.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Gene Symbol</TableHead>
          <TableHead>UniProt ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentResults.map((annotation) => (
          <TableRow
            key={`${annotation.recordId}-${annotation.source}-${annotation.label}-${annotation.value}`}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectAnnotation(annotation)}
          >
            <TableCell>
              <Badge className={getCategoryColor(annotation.label)}>
                <div className="flex items-center gap-1">
                  {getCategoryIcon(annotation.label)}
                  {annotation.label || "Unknown"}
                </div>
              </Badge>
            </TableCell>
            <TableCell>{annotation.source || "Unknown"}</TableCell>
            <TableCell>{annotation.value || "N/A"}</TableCell>
            <TableCell>{annotation.genesymbol || "N/A"}</TableCell>
            <TableCell>{annotation.uniprot || "N/A"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface AnnotationsBrowserProps {
  initialQuery?: string
  onEntitySelect?: (entityName: string) => void
}

export function AnnotationsBrowser({ initialQuery = "", onEntitySelect }: AnnotationsBrowserProps) {
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>({
    sources: [],
    annotationTypes: [],
    valueSearch: "",
  })
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "chart">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      handleSearch()
    }
  }, [initialQuery])

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setCurrentPage(1)

    try {
      const response = await getProteinAnnotations(query)
      setAnnotations(response.annotations)
    } catch (error) {
      console.error("Error fetching annotations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter annotations based on selected filters
  const filteredAnnotations = useMemo(() => {
    return annotations.filter((annotation) => {
      // Filter by source
      if (filters.sources.length > 0 && annotation.source && !filters.sources.includes(annotation.source)) {
        return false
      }

      // Filter by annotation type
      if (filters.annotationTypes.length > 0 && annotation.label && !filters.annotationTypes.includes(annotation.label)) {
        return false
      }

      // Filter by value search
      if (filters.valueSearch && annotation.value && !annotation.value.toLowerCase().includes(filters.valueSearch.toLowerCase())) {
        return false
      }

      return true
    })
  }, [annotations, filters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: FilterCounts = {
      sources: {},
      annotationTypes: {},
    }

    annotations.forEach((annotation) => {
      // Count sources
      if (annotation.source) {
        counts.sources[annotation.source] = (counts.sources[annotation.source] || 0) + 1
      }

      // Count annotation types
      if (annotation.label) {
        counts.annotationTypes[annotation.label] = (counts.annotationTypes[annotation.label] || 0) + 1
      }
    })

    return counts
  }, [annotations])

  const totalPages = Math.ceil(filteredAnnotations.length / RESULTS_PER_PAGE)
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE
  const endIndex = startIndex + RESULTS_PER_PAGE
  const currentResults = filteredAnnotations.slice(startIndex, endIndex)

  // Handle filter changes
  const handleFilterChange = (type: keyof SearchFilters, value: any) => {
    setFilters((prev) => {
      if (type === "valueSearch") {
        return { ...prev, [type]: value }
      }

      const currentValues = prev[type] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      return { ...prev, [type]: newValues }
    })
  }

  const clearFilters = () => {
    setFilters({
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
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
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
          <AnnotationsFilterSidebar
            filters={filters}
            filterCounts={filterCounts}
            onFilterChange={handleFilterChange}
            showMobileFilters={showMobileFilters}
            onClearFilters={clearFilters}
          />

          {/* Main Content */}
          <div className="flex-1">
            {annotations.length > 0 ? (
              <div className="space-y-6">
                {/* Annotations Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Annotations ({filteredAnnotations.length} total)
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="flex items-center gap-1"
                      >
                        <TableIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Table</span>
                      </Button>
                      <Button
                        variant={viewMode === "chart" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("chart")}
                        className="flex items-center gap-1"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Charts</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  </div>

                  {/* Results display based on view mode */}
                  {viewMode === "table" ? (
                    <Card>
                      <CardContent className="p-0">
                        <AnnotationsTable
                          currentResults={currentResults}
                          onSelectAnnotation={(annotation) => setSelectedAnnotation(annotation)}
                          getCategoryIcon={getCategoryIcon}
                          getCategoryColor={getCategoryColor}
                        />
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          startIndex={startIndex}
                          endIndex={endIndex}
                          totalItems={filteredAnnotations.length}
                          onPageChange={setCurrentPage}
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
                  <AnnotationDetails
                    selectedAnnotation={selectedAnnotation}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                  />
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

