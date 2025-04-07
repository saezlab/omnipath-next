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
import { AnnotationsFilterSidebar } from "@/components/annotations/filter-sidebar"
import { EntityCard } from "@/components/annotations/entity-card"
import { AnnotationDetails } from "@/components/annotations/annotation-details"
import { Pagination } from "@/components/interactions/pagination"
import { VisualizationPlaceholder } from "@/components/interactions/visualization-placeholder"
import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const RESULTS_PER_PAGE = 10

// Sample data for demonstration
const SAMPLE_ENTITIES = [
  {
    entity_id: "ENT001",
    entity_type: "Protein",
    primary_identifier: "P12345",
    secondary_identifier: "BRCA1",
    name: "Breast cancer type 1 susceptibility protein",
    ncbi_tax_id: "9606",
  },
  {
    entity_id: "ENT002",
    entity_type: "Protein",
    primary_identifier: "P23456",
    secondary_identifier: "TP53",
    name: "Cellular tumor antigen p53",
    ncbi_tax_id: "9606",
  },
  {
    entity_id: "ENT003",
    entity_type: "Protein",
    primary_identifier: "P34567",
    secondary_identifier: "EGFR",
    name: "Epidermal growth factor receptor",
    ncbi_tax_id: "9606",
  },
  {
    entity_id: "ENT004",
    entity_type: "Complex",
    primary_identifier: "CPX001",
    secondary_identifier: "mTORC1",
    name: "mTOR Complex 1",
    ncbi_tax_id: "9606",
  },
  {
    entity_id: "ENT005",
    entity_type: "Gene",
    primary_identifier: "ENSG00000141510",
    secondary_identifier: "TP53",
    name: "Tumor protein p53",
    ncbi_tax_id: "9606",
  },
]

const SAMPLE_ANNOTATIONS = [
  // Intercell annotations
  {
    annotation_id: "ANN001",
    entity_id: "ENT003",
    category: "intercell",
    subcategory: "receptor",
    value: "receptor tyrosine kinase",
    scope: "cell surface",
    aspect: "transmembrane",
    is_secreted: false,
    is_plasma_membrane: true,
    is_transmembrane: true,
    consensus_score: 0.95,
    sources: ["Uniprot", "CellPhoneDB"],
    references: ["PMID:12345678", "PMID:23456789"],
  },
  {
    annotation_id: "ANN002",
    entity_id: "ENT003",
    category: "intercell",
    subcategory: "ligand_receptor",
    value: "EGF-EGFR",
    scope: "cell-cell communication",
    aspect: "binding",
    is_secreted: false,
    is_plasma_membrane: true,
    is_transmembrane: true,
    consensus_score: 0.9,
    sources: ["CellPhoneDB", "KEGG"],
    references: ["PMID:34567890"],
  },
  // Functional annotations
  {
    annotation_id: "ANN003",
    entity_id: "ENT003",
    category: "functional",
    subcategory: "GO:MF",
    term_id: "GO:0004713",
    term_name: "protein tyrosine kinase activity",
    sources: ["GO", "Uniprot"],
    references: ["PMID:45678901"],
  },
  {
    annotation_id: "ANN004",
    entity_id: "ENT003",
    category: "functional",
    subcategory: "GO:BP",
    term_id: "GO:0007169",
    term_name: "transmembrane receptor protein tyrosine kinase signaling pathway",
    sources: ["GO"],
    references: ["PMID:56789012"],
  },
  // Localization annotations
  {
    annotation_id: "ANN005",
    entity_id: "ENT003",
    category: "localization",
    location_term_id: "GO:0005886",
    location_name: "plasma membrane",
    sources: ["GO", "HPA"],
    references: ["PMID:67890123"],
  },
  {
    annotation_id: "ANN006",
    entity_id: "ENT003",
    category: "localization",
    location_term_id: "GO:0005789",
    location_name: "endoplasmic reticulum membrane",
    sources: ["HPA"],
    references: ["PMID:78901234"],
  },
  // General annotations
  {
    annotation_id: "ANN007",
    entity_id: "ENT003",
    category: "general",
    annotation_category: "disease",
    annotation_value: "non-small cell lung cancer",
    annotation_qualifier: "causative",
    sources: ["DisGeNET", "OMIM"],
    references: ["PMID:89012345", "PMID:90123456"],
  },
  {
    annotation_id: "ANN008",
    entity_id: "ENT003",
    category: "general",
    annotation_category: "drug",
    annotation_value: "Gefitinib",
    annotation_qualifier: "inhibitor",
    sources: ["DrugBank", "ChEMBL"],
    references: ["PMID:01234567"],
  },
  // Annotations for TP53
  {
    annotation_id: "ANN009",
    entity_id: "ENT002",
    category: "functional",
    subcategory: "GO:MF",
    term_id: "GO:0003700",
    term_name: "DNA-binding transcription factor activity",
    sources: ["GO", "Uniprot"],
    references: ["PMID:12345678"],
  },
  {
    annotation_id: "ANN010",
    entity_id: "ENT002",
    category: "functional",
    subcategory: "GO:BP",
    term_id: "GO:0006915",
    term_name: "apoptotic process",
    sources: ["GO"],
    references: ["PMID:23456789"],
  },
  {
    annotation_id: "ANN011",
    entity_id: "ENT002",
    category: "localization",
    location_term_id: "GO:0005634",
    location_name: "nucleus",
    sources: ["GO", "HPA"],
    references: ["PMID:34567890"],
  },
  {
    annotation_id: "ANN012",
    entity_id: "ENT002",
    category: "general",
    annotation_category: "disease",
    annotation_value: "Li-Fraumeni syndrome",
    annotation_qualifier: "causative",
    sources: ["OMIM"],
    references: ["PMID:45678901"],
  },
]

const TAXONOMY_IDS = [
  { value: "9606", label: "Human (9606)" },
  { value: "10090", label: "Mouse (10090)" },
  { value: "10116", label: "Rat (10116)" },
]

interface SearchFilters {
  entityType: string[]
  ncbiTaxId: string[]
  annotationCategory: string[]
  intercellSubcategory: string[]
  functionalSubcategory: string[]
  dataSources: string[]
  hasReferences: boolean | null
  minConsensusScore: number
}

interface AnnotationsBrowserProps {
  initialQuery?: string
  onEntitySelect?: (entityName: string) => void
}

interface AnnotationsTableProps {
  currentResults: any[]
  onSelectAnnotation: (annotation: any) => void
  getCategoryIcon: (category: string) => React.ReactNode
  getCategoryColor: (category: string) => string
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
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Category</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="hidden md:table-cell">Sources</TableHead>
            <TableHead className="hidden lg:table-cell">Score</TableHead>
            <TableHead className="w-[80px] text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentResults.map((annotation) => (
            <TableRow key={annotation.annotation_id}>
              <TableCell>
                <Badge className={`flex items-center gap-1 ${getCategoryColor(annotation.category)}`}>
                  {getCategoryIcon(annotation.category)}
                  <span className="capitalize">{annotation.category}</span>
                </Badge>
                {annotation.subcategory && (
                  <span className="text-xs text-muted-foreground block mt-1">{annotation.subcategory}</span>
                )}
              </TableCell>
              <TableCell>
                {annotation.term_name ||
                  annotation.location_name ||
                  annotation.value ||
                  annotation.annotation_value ||
                  "N/A"}
                {annotation.term_id && (
                  <span className="text-xs text-muted-foreground block">{annotation.term_id}</span>
                )}
                {annotation.location_term_id && (
                  <span className="text-xs text-muted-foreground block">{annotation.location_term_id}</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {annotation.sources.map((source: string) => (
                    <Badge key={source} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {annotation.consensus_score ? (
                  <span className="font-mono">{annotation.consensus_score.toFixed(2)}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onSelectAnnotation(annotation)} title="View details">
                  <Info className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function AnnotationsBrowser({ initialQuery = "", onEntitySelect }: AnnotationsBrowserProps) {
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>({
    entityType: [],
    ncbiTaxId: [],
    annotationCategory: [],
    intercellSubcategory: [],
    functionalSubcategory: [],
    dataSources: [],
    hasReferences: null,
    minConsensusScore: 0,
  })
  const [entities, setEntities] = useState<typeof SAMPLE_ENTITIES>([])
  const [selectedEntity, setSelectedEntity] = useState<(typeof SAMPLE_ENTITIES)[0] | null>(null)
  const [annotations, setAnnotations] = useState<typeof SAMPLE_ANNOTATIONS>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "chart">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAnnotation, setSelectedAnnotation] = useState<(typeof SAMPLE_ANNOTATIONS)[0] | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      handleSearch()
    }
  }, [initialQuery])

  // For demo purposes, load sample data
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setCurrentPage(1)

    // Simulate API call
    setTimeout(() => {
      // Filter entities based on query
      const filteredEntities = SAMPLE_ENTITIES.filter(
        (entity) =>
          entity.primary_identifier.toLowerCase().includes(query.toLowerCase()) ||
          entity.secondary_identifier.toLowerCase().includes(query.toLowerCase()) ||
          entity.name.toLowerCase().includes(query.toLowerCase()),
      )

      setEntities(filteredEntities)

      // If we have a match, select the first entity and load its annotations
      if (filteredEntities.length > 0) {
        const firstEntity = filteredEntities[0]
        setSelectedEntity(firstEntity)

        // Get annotations for this entity
        const entityAnnotations = SAMPLE_ANNOTATIONS.filter(
          (annotation) => annotation.entity_id === firstEntity.entity_id,
        )

        setAnnotations(entityAnnotations)
        if (onEntitySelect) {
          onEntitySelect(firstEntity.secondary_identifier)
        }
      } else {
        setSelectedEntity(null)
        setAnnotations([])
        if (onEntitySelect) {
          onEntitySelect("")
        }
      }

      setIsLoading(false)
    }, 800)
  }

  // Handle entity selection
  const handleEntitySelect = (entity: (typeof SAMPLE_ENTITIES)[0]) => {
    setSelectedEntity(entity)

    // Get annotations for this entity
    const entityAnnotations = SAMPLE_ANNOTATIONS.filter((annotation) => annotation.entity_id === entity.entity_id)

    setAnnotations(entityAnnotations)
    setCurrentPage(1)

    if (onEntitySelect) {
      onEntitySelect(entity.secondary_identifier)
    }
  }

  // Filter annotations based on selected filters
  const filteredAnnotations = useMemo(() => {
    return annotations.filter((annotation) => {
      // Filter by annotation category
      if (filters.annotationCategory.length > 0 && !filters.annotationCategory.includes(annotation.category)) {
        return false
      }

      // Filter by intercell subcategory
      if (
        filters.intercellSubcategory.length > 0 &&
        annotation.category === "intercell" &&
        !filters.intercellSubcategory.includes(annotation.subcategory)
      ) {
        return false
      }

      // Filter by functional subcategory
      if (
        filters.functionalSubcategory.length > 0 &&
        annotation.category === "functional" &&
        !filters.functionalSubcategory.includes(annotation.subcategory)
      ) {
        return false
      }

      // Filter by data sources
      if (
        filters.dataSources.length > 0 &&
        !annotation.sources.some((source) => filters.dataSources.includes(source))
      ) {
        return false
      }

      // Filter by has references
      if (filters.hasReferences !== null) {
        const hasRefs = annotation.references && annotation.references.length > 0
        if (hasRefs !== filters.hasReferences) {
          return false
        }
      }

      // Filter by minimum consensus score
      if (
        filters.minConsensusScore > 0 &&
        (!annotation.consensus_score || annotation.consensus_score < filters.minConsensusScore)
      ) {
        return false
      }

      return true
    })
  }, [annotations, filters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      annotationCategory: {} as Record<string, number>,
      intercellSubcategory: {} as Record<string, number>,
      functionalSubcategory: {} as Record<string, number>,
      dataSources: {} as Record<string, number>,
    }

    annotations.forEach((annotation) => {
      // Count annotation categories
      counts.annotationCategory[annotation.category] = (counts.annotationCategory[annotation.category] || 0) + 1

      // Count intercell subcategories
      if (annotation.category === "intercell" && annotation.subcategory) {
        counts.intercellSubcategory[annotation.subcategory] =
          (counts.intercellSubcategory[annotation.subcategory] || 0) + 1
      }

      // Count functional subcategories
      if (annotation.category === "functional" && annotation.subcategory) {
        counts.functionalSubcategory[annotation.subcategory] =
          (counts.functionalSubcategory[annotation.subcategory] || 0) + 1
      }

      // Count data sources
      annotation.sources.forEach((source) => {
        counts.dataSources[source] = (counts.dataSources[source] || 0) + 1
      })
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
      if (type === "minConsensusScore") {
        return { ...prev, [type]: value }
      }

      if (type === "hasReferences") {
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
      entityType: [],
      ncbiTaxId: [],
      annotationCategory: [],
      intercellSubcategory: [],
      functionalSubcategory: [],
      dataSources: [],
      hasReferences: null,
      minConsensusScore: 0,
    })
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "intercell":
        return <Activity className="h-4 w-4" />
      case "functional":
        return <Tag className="h-4 w-4" />
      case "localization":
        return <MapPin className="h-4 w-4" />
      case "general":
        return <Info className="h-4 w-4" />
      default:
        return <Layers className="h-4 w-4" />
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "intercell":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "functional":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "localization":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "general":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Get taxonomy label
  const getTaxonomyLabel = (taxId: string) => {
    const taxonomy = TAXONOMY_IDS.find((tax) => tax.value === taxId)
    return taxonomy ? taxonomy.label : taxId
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
                  placeholder="Search for proteins, genes, or other biological entities..."
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
            {selectedEntity ? (
              <div className="space-y-6">
                {/* Entity Card */}
                <EntityCard entity={selectedEntity} taxonomyLabel={getTaxonomyLabel(selectedEntity.ncbi_tax_id)} />

                {/* Annotations Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Annotations ({filteredAnnotations.length} total)</h3>
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
                          onSelectAnnotation={setSelectedAnnotation}
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
                <h3 className="text-lg font-medium mb-2">No entity selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Search for proteins, genes, or other biological entities to explore their annotations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

