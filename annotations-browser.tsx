"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TableIcon,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  SlidersHorizontal,
  Info,
  Tag,
  MapPin,
  Activity,
  Layers,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

// Filter options
const ENTITY_TYPES = [
  { value: "Protein", label: "Protein" },
  { value: "Gene", label: "Gene" },
  { value: "Complex", label: "Complex" },
  { value: "SmallMolecule", label: "Small Molecule" },
  { value: "miRNA", label: "miRNA" },
  { value: "lncRNA", label: "lncRNA" },
]

const ANNOTATION_CATEGORIES = [
  { value: "intercell", label: "Intercellular Communication", icon: <Activity className="h-4 w-4 mr-2" /> },
  { value: "functional", label: "Functional", icon: <Tag className="h-4 w-4 mr-2" /> },
  { value: "localization", label: "Localization", icon: <MapPin className="h-4 w-4 mr-2" /> },
  { value: "general", label: "General", icon: <Info className="h-4 w-4 mr-2" /> },
]

const INTERCELL_SUBCATEGORIES = [
  { value: "receptor", label: "Receptor" },
  { value: "ligand", label: "Ligand" },
  { value: "ligand_receptor", label: "Ligand-Receptor Pair" },
  { value: "ecm", label: "Extracellular Matrix" },
]

const FUNCTIONAL_SUBCATEGORIES = [
  { value: "GO:MF", label: "Molecular Function" },
  { value: "GO:BP", label: "Biological Process" },
  { value: "GO:CC", label: "Cellular Component" },
  { value: "pathway", label: "Pathway" },
]

const TAXONOMY_IDS = [
  { value: "9606", label: "Human (9606)" },
  { value: "10090", label: "Mouse (10090)" },
  { value: "10116", label: "Rat (10116)" },
]

const DATA_SOURCES = [
  { value: "Uniprot", label: "UniProt" },
  { value: "GO", label: "Gene Ontology" },
  { value: "HPA", label: "Human Protein Atlas" },
  { value: "CellPhoneDB", label: "CellPhoneDB" },
  { value: "KEGG", label: "KEGG" },
  { value: "DisGeNET", label: "DisGeNET" },
  { value: "OMIM", label: "OMIM" },
  { value: "DrugBank", label: "DrugBank" },
  { value: "ChEMBL", label: "ChEMBL" },
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

export function AnnotationsBrowser() {
  const [query, setQuery] = useState("")
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

  // For demo purposes, load sample data
  const handleSearch = async () => {
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
      } else {
        setSelectedEntity(null)
        setAnnotations([])
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
          <div className={`md:w-64 lg:w-72 shrink-0 space-y-4 ${showMobileFilters ? "block" : "hidden"} md:block`}>
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
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
                >
                  Clear all
                </Button>
              </div>

              <Accordion type="multiple" defaultValue={["annotationCategory", "dataSources"]} className="w-full">
                <AccordionItem value="annotationCategory">
                  <AccordionTrigger>Annotation Categories</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {ANNOTATION_CATEGORIES.map((category) => (
                        <div key={category.value} className="flex items-center justify-between">
                          <Label
                            htmlFor={`category-${category.value}`}
                            className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                          >
                            <Checkbox
                              id={`category-${category.value}`}
                              checked={filters.annotationCategory.includes(category.value)}
                              onCheckedChange={() => handleFilterChange("annotationCategory", category.value)}
                            />
                            <div className="flex items-center">
                              {category.icon}
                              {category.label}
                            </div>
                          </Label>
                          <Badge variant="outline" className="ml-auto">
                            {filterCounts.annotationCategory[category.value] || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {filters.annotationCategory.includes("intercell") && (
                  <AccordionItem value="intercellSubcategory">
                    <AccordionTrigger>Intercell Subcategories</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {INTERCELL_SUBCATEGORIES.map((subcategory) => (
                          <div key={subcategory.value} className="flex items-center justify-between">
                            <Label
                              htmlFor={`intercell-${subcategory.value}`}
                              className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                            >
                              <Checkbox
                                id={`intercell-${subcategory.value}`}
                                checked={filters.intercellSubcategory.includes(subcategory.value)}
                                onCheckedChange={() => handleFilterChange("intercellSubcategory", subcategory.value)}
                              />
                              {subcategory.label}
                            </Label>
                            <Badge variant="outline" className="ml-auto">
                              {filterCounts.intercellSubcategory[subcategory.value] || 0}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {filters.annotationCategory.includes("functional") && (
                  <AccordionItem value="functionalSubcategory">
                    <AccordionTrigger>Functional Subcategories</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {FUNCTIONAL_SUBCATEGORIES.map((subcategory) => (
                          <div key={subcategory.value} className="flex items-center justify-between">
                            <Label
                              htmlFor={`functional-${subcategory.value}`}
                              className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                            >
                              <Checkbox
                                id={`functional-${subcategory.value}`}
                                checked={filters.functionalSubcategory.includes(subcategory.value)}
                                onCheckedChange={() => handleFilterChange("functionalSubcategory", subcategory.value)}
                              />
                              {subcategory.label}
                            </Label>
                            <Badge variant="outline" className="ml-auto">
                              {filterCounts.functionalSubcategory[subcategory.value] || 0}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="dataSources">
                  <AccordionTrigger>Data Sources</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {DATA_SOURCES.map((source) => (
                        <div key={source.value} className="flex items-center justify-between">
                          <Label
                            htmlFor={`source-${source.value}`}
                            className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                          >
                            <Checkbox
                              id={`source-${source.value}`}
                              checked={filters.dataSources.includes(source.value)}
                              onCheckedChange={() => handleFilterChange("dataSources", source.value)}
                            />
                            {source.label}
                          </Label>
                          <Badge variant="outline" className="ml-auto">
                            {filterCounts.dataSources[source.value] || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="references">
                  <AccordionTrigger>References</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="has-references" className="text-sm">
                          Has References
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.hasReferences === null ? "Any" : filters.hasReferences ? "Yes" : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("hasReferences", null)}>
                              Any
                              {filters.hasReferences === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("hasReferences", true)}>
                              Yes
                              {filters.hasReferences === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("hasReferences", false)}>
                              No
                              {filters.hasReferences === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedEntity ? (
              <div className="space-y-6">
                {/* Entity Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <span className="text-xl">{selectedEntity.secondary_identifier}</span>
                        <Badge variant="outline" className="ml-2">
                          {selectedEntity.entity_type}
                        </Badge>
                      </div>
                      <Badge variant="secondary">
                        {TAXONOMY_IDS.find((tax) => tax.value === selectedEntity.ncbi_tax_id)?.label ||
                          selectedEntity.ncbi_tax_id}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Primary Identifier</p>
                        <p className="font-medium">{selectedEntity.primary_identifier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Secondary Identifier</p>
                        <p className="font-medium">{selectedEntity.secondary_identifier}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedEntity.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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

                  {viewMode === "table" ? (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead className="hidden md:table-cell">Sources</TableHead>
                              <TableHead className="hidden lg:table-cell">References</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentResults.map((annotation, index) => (
                              <TableRow
                                key={index}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedAnnotation(annotation)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(annotation.category)}
                                    <div>
                                      <Badge className={`${getCategoryColor(annotation.category)} capitalize`}>
                                        {annotation.category}
                                      </Badge>
                                      {annotation.subcategory && (
                                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                                          {annotation.subcategory.replace("_", " ")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    {annotation.category === "functional" ? (
                                      <>
                                        <span className="text-xs text-muted-foreground">{annotation.term_id}</span>
                                        <span>{annotation.term_name}</span>
                                      </>
                                    ) : annotation.category === "localization" ? (
                                      <>
                                        <span className="text-xs text-muted-foreground">
                                          {annotation.location_term_id}
                                        </span>
                                        <span>{annotation.location_name}</span>
                                      </>
                                    ) : annotation.category === "general" ? (
                                      <>
                                        <span className="text-xs text-muted-foreground capitalize">
                                          {annotation.annotation_category}
                                        </span>
                                        <span>{annotation.annotation_value}</span>
                                        {annotation.annotation_qualifier && (
                                          <span className="text-xs text-muted-foreground capitalize">
                                            ({annotation.annotation_qualifier})
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <span>{annotation.value}</span>
                                        {annotation.scope && (
                                          <span className="text-xs text-muted-foreground">{annotation.scope}</span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex flex-wrap gap-1">
                                    {annotation.sources.map((source, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  {annotation.references ? annotation.references.length : 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Showing {startIndex + 1}-{Math.min(endIndex, filteredAnnotations.length)} of{" "}
                              {filteredAnnotations.length} results
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Previous</span>
                              </Button>
                              <div className="text-sm">
                                Page {currentPage} of {totalPages}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                              >
                                <span className="hidden sm:inline mr-1">Next</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        <div className="aspect-[16/9] rounded-lg border bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-muted-foreground">Chart visualization</p>
                            <p className="text-xs text-muted-foreground">
                              Distribution of annotation categories and sources
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Annotation Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Annotation Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedAnnotation ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(selectedAnnotation.category)}
                            <Badge className={`${getCategoryColor(selectedAnnotation.category)} capitalize`}>
                              {selectedAnnotation.category}
                            </Badge>
                            {selectedAnnotation.subcategory && (
                              <Badge variant="outline" className="capitalize">
                                {selectedAnnotation.subcategory.replace("_", " ")}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category-specific details */}
                            {selectedAnnotation.category === "functional" ? (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Term ID</p>
                                  <p className="font-medium">{selectedAnnotation.term_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Term Name</p>
                                  <p className="font-medium">{selectedAnnotation.term_name}</p>
                                </div>
                              </>
                            ) : selectedAnnotation.category === "localization" ? (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Location Term ID</p>
                                  <p className="font-medium">{selectedAnnotation.location_term_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Location Name</p>
                                  <p className="font-medium">{selectedAnnotation.location_name}</p>
                                </div>
                              </>
                            ) : selectedAnnotation.category === "general" ? (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Category</p>
                                  <p className="font-medium capitalize">{selectedAnnotation.annotation_category}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Value</p>
                                  <p className="font-medium">{selectedAnnotation.annotation_value}</p>
                                </div>
                                {selectedAnnotation.annotation_qualifier && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Qualifier</p>
                                    <p className="font-medium capitalize">{selectedAnnotation.annotation_qualifier}</p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Value</p>
                                  <p className="font-medium">{selectedAnnotation.value}</p>
                                </div>
                                {selectedAnnotation.scope && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Scope</p>
                                    <p className="font-medium">{selectedAnnotation.scope}</p>
                                  </div>
                                )}
                                {selectedAnnotation.aspect && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Aspect</p>
                                    <p className="font-medium">{selectedAnnotation.aspect}</p>
                                  </div>
                                )}
                                {selectedAnnotation.is_secreted !== undefined && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Is Secreted</p>
                                    <p className="font-medium">{selectedAnnotation.is_secreted ? "Yes" : "No"}</p>
                                  </div>
                                )}
                                {selectedAnnotation.is_plasma_membrane !== undefined && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Is Plasma Membrane</p>
                                    <p className="font-medium">
                                      {selectedAnnotation.is_plasma_membrane ? "Yes" : "No"}
                                    </p>
                                  </div>
                                )}
                                {selectedAnnotation.is_transmembrane !== undefined && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Is Transmembrane</p>
                                    <p className="font-medium">{selectedAnnotation.is_transmembrane ? "Yes" : "No"}</p>
                                  </div>
                                )}
                                {selectedAnnotation.consensus_score !== undefined && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Consensus Score</p>
                                    <p className="font-medium">{selectedAnnotation.consensus_score.toFixed(2)}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Sources and References */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Sources</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedAnnotation.sources.map((source, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {selectedAnnotation.references && selectedAnnotation.references.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">References</p>
                              <div className="text-sm space-y-1">
                                {selectedAnnotation.references.map((ref, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <a
                                      href={`https://pubmed.ncbi.nlm.nih.gov/${ref.replace("PMID:", "")}/`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {ref}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Search className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Select an annotation to view details</p>
                          <p className="text-xs text-muted-foreground">Detailed information will appear here</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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

