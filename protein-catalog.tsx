"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TableIcon,
  Network,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  FileText,
  SlidersHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const RESULTS_PER_PAGE = 10

// Sample data for demonstration
const SAMPLE_INTERACTIONS = [
  {
    source: "P12345",
    sourceGenesymbol: "BRCA1",
    target: "P23456",
    targetGenesymbol: "TP53",
    isDirected: true,
    isStimulation: true,
    isInhibition: false,
    type: "PPI",
    curationEffort: "High",
    ncbiTaxIdSource: "9606",
    entityTypeSource: "protein",
    ncbiTaxIdTarget: "9606",
    entityTypeTarget: "protein",
    consensusDirection: true,
    consensusStimulation: true,
    consensusInhibition: false,
    references: "PMID:12345678;PMID:23456789",
  },
  {
    source: "P34567",
    sourceGenesymbol: "EGFR",
    target: "P45678",
    targetGenesymbol: "SRC",
    isDirected: true,
    isStimulation: false,
    isInhibition: true,
    type: "TF-target",
    curationEffort: "Medium",
    ncbiTaxIdSource: "9606",
    entityTypeSource: "protein",
    ncbiTaxIdTarget: "9606",
    entityTypeTarget: "gene",
    consensusDirection: true,
    consensusStimulation: false,
    consensusInhibition: true,
    references: "PMID:34567890;PMID:45678901;PMID:56789012",
  },
  {
    source: "P56789",
    sourceGenesymbol: "IL6",
    target: "P67890",
    targetGenesymbol: "IL6R",
    isDirected: true,
    isStimulation: true,
    isInhibition: false,
    type: "ligand-receptor",
    curationEffort: "Low",
    ncbiTaxIdSource: "9606",
    entityTypeSource: "protein",
    ncbiTaxIdTarget: "10090",
    entityTypeTarget: "protein",
    consensusDirection: true,
    consensusStimulation: true,
    consensusInhibition: false,
    references: "PMID:67890123",
  },
  {
    source: "P78901",
    sourceGenesymbol: "TNF",
    target: "P89012",
    targetGenesymbol: "TNFR1",
    isDirected: true,
    isStimulation: true,
    isInhibition: false,
    type: "ligand-receptor",
    curationEffort: "High",
    ncbiTaxIdSource: "9606",
    entityTypeSource: "protein",
    ncbiTaxIdTarget: "9606",
    entityTypeTarget: "protein",
    consensusDirection: true,
    consensusStimulation: true,
    consensusInhibition: false,
    references: "PMID:78901234;PMID:89012345",
  },
  {
    source: "P90123",
    sourceGenesymbol: "AKT1",
    target: "P01234",
    targetGenesymbol: "MTOR",
    isDirected: true,
    isStimulation: true,
    isInhibition: false,
    type: "PPI",
    curationEffort: "Medium",
    ncbiTaxIdSource: "9606",
    entityTypeSource: "protein",
    ncbiTaxIdTarget: "9606",
    entityTypeTarget: "protein",
    consensusDirection: true,
    consensusStimulation: true,
    consensusInhibition: false,
    references: "PMID:90123456;PMID:01234567",
  },
]

// Filter options
const INTERACTION_TYPES = [
  { value: "PPI", label: "Protein-Protein Interaction (PPI)" },
  { value: "TF-target", label: "TF-target" },
  { value: "ligand-receptor", label: "Ligand-Receptor" },
]

const CURATION_EFFORT = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
]

const ENTITY_TYPES = [
  { value: "protein", label: "Protein" },
  { value: "gene", label: "Gene" },
  { value: "RNA", label: "RNA" },
  { value: "small molecule", label: "Small Molecule" },
]

const TAXONOMY_IDS = [
  { value: "9606", label: "Human (9606)" },
  { value: "10090", label: "Mouse (10090)" },
  { value: "10116", label: "Rat (10116)" },
]

interface SearchFilters {
  interactionType: string[]
  curationEffort: string[]
  ncbiTaxIdSource: string[]
  entityTypeSource: string[]
  ncbiTaxIdTarget: string[]
  entityTypeTarget: string[]
  isDirected: boolean | null
  isStimulation: boolean | null
  isInhibition: boolean | null
  consensusDirection: boolean | null
  consensusStimulation: boolean | null
  consensusInhibition: boolean | null
  minReferences: number
}

export function ProteinCatalog() {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    interactionType: [],
    curationEffort: [],
    ncbiTaxIdSource: [],
    entityTypeSource: [],
    ncbiTaxIdTarget: [],
    entityTypeTarget: [],
    isDirected: null,
    isStimulation: null,
    isInhibition: null,
    consensusDirection: null,
    consensusStimulation: null,
    consensusInhibition: null,
    minReferences: 0,
  })
  const [interactions, setInteractions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "network" | "chart">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInteraction, setSelectedInteraction] = useState<any | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // For demo purposes, load sample data
  const handleSearch = async () => {
    setIsLoading(true)
    setCurrentPage(1)

    // Simulate API call
    setTimeout(() => {
      setInteractions(SAMPLE_INTERACTIONS)
      setIsLoading(false)
    }, 800)
  }

  // Filter interactions based on selected filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      // Filter by interaction type
      if (filters.interactionType.length > 0 && !filters.interactionType.includes(interaction.type)) {
        return false
      }

      // Filter by curation effort
      if (filters.curationEffort.length > 0 && !filters.curationEffort.includes(interaction.curationEffort)) {
        return false
      }

      // Filter by source taxonomy ID
      if (filters.ncbiTaxIdSource.length > 0 && !filters.ncbiTaxIdSource.includes(interaction.ncbiTaxIdSource)) {
        return false
      }

      // Filter by source entity type
      if (filters.entityTypeSource.length > 0 && !filters.entityTypeSource.includes(interaction.entityTypeSource)) {
        return false
      }

      // Filter by target taxonomy ID
      if (filters.ncbiTaxIdTarget.length > 0 && !filters.ncbiTaxIdTarget.includes(interaction.ncbiTaxIdTarget)) {
        return false
      }

      // Filter by target entity type
      if (filters.entityTypeTarget.length > 0 && !filters.entityTypeTarget.includes(interaction.entityTypeTarget)) {
        return false
      }

      // Filter by direction
      if (filters.isDirected !== null && interaction.isDirected !== filters.isDirected) {
        return false
      }

      // Filter by stimulation
      if (filters.isStimulation !== null && interaction.isStimulation !== filters.isStimulation) {
        return false
      }

      // Filter by inhibition
      if (filters.isInhibition !== null && interaction.isInhibition !== filters.isInhibition) {
        return false
      }

      // Filter by consensus direction
      if (filters.consensusDirection !== null && interaction.consensusDirection !== filters.consensusDirection) {
        return false
      }

      // Filter by consensus stimulation
      if (filters.consensusStimulation !== null && interaction.consensusStimulation !== filters.consensusStimulation) {
        return false
      }

      // Filter by consensus inhibition
      if (filters.consensusInhibition !== null && interaction.consensusInhibition !== filters.consensusInhibition) {
        return false
      }

      // Filter by minimum references
      if (filters.minReferences > 0) {
        const refCount = interaction.references ? interaction.references.split(";").length : 0
        if (refCount < filters.minReferences) {
          return false
        }
      }

      return true
    })
  }, [interactions, filters])

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      interactionType: {} as Record<string, number>,
      curationEffort: {} as Record<string, number>,
      ncbiTaxIdSource: {} as Record<string, number>,
      entityTypeSource: {} as Record<string, number>,
      ncbiTaxIdTarget: {} as Record<string, number>,
      entityTypeTarget: {} as Record<string, number>,
    }

    interactions.forEach((interaction) => {
      // Count interaction types
      counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1

      // Count curation efforts
      counts.curationEffort[interaction.curationEffort] = (counts.curationEffort[interaction.curationEffort] || 0) + 1

      // Count source taxonomy IDs
      counts.ncbiTaxIdSource[interaction.ncbiTaxIdSource] =
        (counts.ncbiTaxIdSource[interaction.ncbiTaxIdSource] || 0) + 1

      // Count source entity types
      counts.entityTypeSource[interaction.entityTypeSource] =
        (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1

      // Count target taxonomy IDs
      counts.ncbiTaxIdTarget[interaction.ncbiTaxIdTarget] =
        (counts.ncbiTaxIdTarget[interaction.ncbiTaxIdTarget] || 0) + 1

      // Count target entity types
      counts.entityTypeTarget[interaction.entityTypeTarget] =
        (counts.entityTypeTarget[interaction.entityTypeTarget] || 0) + 1
    })

    return counts
  }, [interactions])

  const totalPages = Math.ceil(filteredInteractions.length / RESULTS_PER_PAGE)
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE
  const endIndex = startIndex + RESULTS_PER_PAGE
  const currentResults = filteredInteractions.slice(startIndex, endIndex)

  // Handle filter changes
  const handleFilterChange = (type: keyof SearchFilters, value: any) => {
    setFilters((prev) => {
      if (type === "minReferences") {
        return { ...prev, [type]: value }
      }

      if (
        type === "isDirected" ||
        type === "isStimulation" ||
        type === "isInhibition" ||
        type === "consensusDirection" ||
        type === "consensusStimulation" ||
        type === "consensusInhibition"
      ) {
        return { ...prev, [type]: value }
      }

      const currentValues = prev[type] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      return { ...prev, [type]: newValues }
    })
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
                      interactionType: [],
                      curationEffort: [],
                      ncbiTaxIdSource: [],
                      entityTypeSource: [],
                      ncbiTaxIdTarget: [],
                      entityTypeTarget: [],
                      isDirected: null,
                      isStimulation: null,
                      isInhibition: null,
                      consensusDirection: null,
                      consensusStimulation: null,
                      consensusInhibition: null,
                      minReferences: 0,
                    })
                  }
                >
                  Clear all
                </Button>
              </div>

              <Accordion type="multiple" defaultValue={["interactionType", "properties"]} className="w-full">
                <AccordionItem value="interactionType">
                  <AccordionTrigger>Interaction Type</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {INTERACTION_TYPES.map((type) => (
                        <div key={type.value} className="flex items-center justify-between">
                          <Label
                            htmlFor={`type-${type.value}`}
                            className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                          >
                            <Checkbox
                              id={`type-${type.value}`}
                              checked={filters.interactionType.includes(type.value)}
                              onCheckedChange={() => handleFilterChange("interactionType", type.value)}
                            />
                            {type.label}
                          </Label>
                          <Badge variant="outline" className="ml-auto">
                            {filterCounts.interactionType[type.value] || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="curation">
                  <AccordionTrigger>Curation Effort</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {CURATION_EFFORT.map((effort) => (
                        <div key={effort.value} className="flex items-center justify-between">
                          <Label
                            htmlFor={`effort-${effort.value}`}
                            className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                          >
                            <Checkbox
                              id={`effort-${effort.value}`}
                              checked={filters.curationEffort.includes(effort.value)}
                              onCheckedChange={() => handleFilterChange("curationEffort", effort.value)}
                            />
                            {effort.label}
                          </Label>
                          <Badge variant="outline" className="ml-auto">
                            {filterCounts.curationEffort[effort.value] || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="source">
                  <AccordionTrigger>Source Entity</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Taxonomy ID</Label>
                        <div className="space-y-2 mt-2">
                          {TAXONOMY_IDS.map((tax) => (
                            <div key={tax.value} className="flex items-center justify-between">
                              <Label
                                htmlFor={`source-tax-${tax.value}`}
                                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                              >
                                <Checkbox
                                  id={`source-tax-${tax.value}`}
                                  checked={filters.ncbiTaxIdSource.includes(tax.value)}
                                  onCheckedChange={() => handleFilterChange("ncbiTaxIdSource", tax.value)}
                                />
                                {tax.label}
                              </Label>
                              <Badge variant="outline" className="ml-auto">
                                {filterCounts.ncbiTaxIdSource[tax.value] || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Entity Type</Label>
                        <div className="space-y-2 mt-2">
                          {ENTITY_TYPES.map((type) => (
                            <div key={type.value} className="flex items-center justify-between">
                              <Label
                                htmlFor={`source-type-${type.value}`}
                                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                              >
                                <Checkbox
                                  id={`source-type-${type.value}`}
                                  checked={filters.entityTypeSource.includes(type.value)}
                                  onCheckedChange={() => handleFilterChange("entityTypeSource", type.value)}
                                />
                                {type.label}
                              </Label>
                              <Badge variant="outline" className="ml-auto">
                                {filterCounts.entityTypeSource[type.value] || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="target">
                  <AccordionTrigger>Target Entity</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Taxonomy ID</Label>
                        <div className="space-y-2 mt-2">
                          {TAXONOMY_IDS.map((tax) => (
                            <div key={tax.value} className="flex items-center justify-between">
                              <Label
                                htmlFor={`target-tax-${tax.value}`}
                                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                              >
                                <Checkbox
                                  id={`target-tax-${tax.value}`}
                                  checked={filters.ncbiTaxIdTarget.includes(tax.value)}
                                  onCheckedChange={() => handleFilterChange("ncbiTaxIdTarget", tax.value)}
                                />
                                {tax.label}
                              </Label>
                              <Badge variant="outline" className="ml-auto">
                                {filterCounts.ncbiTaxIdTarget[tax.value] || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Entity Type</Label>
                        <div className="space-y-2 mt-2">
                          {ENTITY_TYPES.map((type) => (
                            <div key={type.value} className="flex items-center justify-between">
                              <Label
                                htmlFor={`target-type-${type.value}`}
                                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                              >
                                <Checkbox
                                  id={`target-type-${type.value}`}
                                  checked={filters.entityTypeTarget.includes(type.value)}
                                  onCheckedChange={() => handleFilterChange("entityTypeTarget", type.value)}
                                />
                                {type.label}
                              </Label>
                              <Badge variant="outline" className="ml-auto">
                                {filterCounts.entityTypeTarget[type.value] || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="properties">
                  <AccordionTrigger>Interaction Properties</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is-directed" className="text-sm">
                          Is Directed
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.isDirected === null ? "Any" : filters.isDirected ? "Yes" : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("isDirected", null)}>
                              Any
                              {filters.isDirected === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("isDirected", true)}>
                              Yes
                              {filters.isDirected === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("isDirected", false)}>
                              No
                              {filters.isDirected === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="is-stimulation" className="text-sm">
                          Is Stimulation
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.isStimulation === null ? "Any" : filters.isStimulation ? "Yes" : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("isStimulation", null)}>
                              Any
                              {filters.isStimulation === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("isStimulation", true)}>
                              Yes
                              {filters.isStimulation === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("isStimulation", false)}>
                              No
                              {filters.isStimulation === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="is-inhibition" className="text-sm">
                          Is Inhibition
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.isInhibition === null ? "Any" : filters.isInhibition ? "Yes" : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("isInhibition", null)}>
                              Any
                              {filters.isInhibition === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("isInhibition", true)}>
                              Yes
                              {filters.isInhibition === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("isInhibition", false)}>
                              No
                              {filters.isInhibition === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="consensus">
                  <AccordionTrigger>Consensus Properties</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="consensus-direction" className="text-sm">
                          Consensus Direction
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.consensusDirection === null ? "Any" : filters.consensusDirection ? "Yes" : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusDirection", null)}>
                              Any
                              {filters.consensusDirection === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusDirection", true)}>
                              Yes
                              {filters.consensusDirection === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusDirection", false)}>
                              No
                              {filters.consensusDirection === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="consensus-stimulation" className="text-sm">
                          Consensus Stimulation
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.consensusStimulation === null
                                ? "Any"
                                : filters.consensusStimulation
                                  ? "Yes"
                                  : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusStimulation", null)}>
                              Any
                              {filters.consensusStimulation === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusStimulation", true)}>
                              Yes
                              {filters.consensusStimulation === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusStimulation", false)}>
                              No
                              {filters.consensusStimulation === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="consensus-inhibition" className="text-sm">
                          Consensus Inhibition
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {filters.consensusInhibition === null
                                ? "Any"
                                : filters.consensusInhibition
                                  ? "Yes"
                                  : "No"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusInhibition", null)}>
                              Any
                              {filters.consensusInhibition === null && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusInhibition", true)}>
                              Yes
                              {filters.consensusInhibition === true && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFilterChange("consensusInhibition", false)}>
                              No
                              {filters.consensusInhibition === false && <Check className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="references">
                  <AccordionTrigger>References</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="min-references" className="text-sm">
                            Minimum References
                          </Label>
                          <span className="text-sm font-medium">{filters.minReferences}</span>
                        </div>
                        <Slider
                          id="min-references"
                          min={0}
                          max={5}
                          step={1}
                          value={[filters.minReferences]}
                          onValueChange={(value) => handleFilterChange("minReferences", value[0])}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5+</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {interactions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Results ({filteredInteractions.length} interactions)</h3>
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
                      variant={viewMode === "network" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("network")}
                      className="flex items-center gap-1"
                    >
                      <Network className="h-4 w-4" />
                      <span className="hidden sm:inline">Network</span>
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
                            <TableHead>Source (Gene)</TableHead>
                            <TableHead>Target (Gene)</TableHead>
                            <TableHead className="hidden md:table-cell">Type</TableHead>
                            <TableHead className="hidden lg:table-cell">Direction</TableHead>
                            <TableHead className="hidden lg:table-cell">References</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentResults.map((interaction, index) => (
                            <TableRow
                              key={index}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedInteraction(interaction)}
                            >
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{interaction.source}</span>
                                  <span className="text-sm text-muted-foreground">{interaction.sourceGenesymbol}</span>
                                  <span className="text-xs text-muted-foreground md:hidden">{interaction.type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{interaction.target}</span>
                                  <span className="text-sm text-muted-foreground">{interaction.targetGenesymbol}</span>
                                  <span className="text-xs text-muted-foreground lg:hidden">
                                    {interaction.isDirected ? "Directed" : "Undirected"}
                                    {interaction.isStimulation && " (Stim)"}
                                    {interaction.isInhibition && " (Inhib)"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{interaction.type}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {interaction.isDirected ? "Directed" : "Undirected"}
                                {interaction.isStimulation && " (Stimulation)"}
                                {interaction.isInhibition && " (Inhibition)"}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {interaction.references ? interaction.references.split(";").length : 0}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {startIndex + 1}-{Math.min(endIndex, filteredInteractions.length)} of{" "}
                            {filteredInteractions.length} results
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
                ) : viewMode === "network" ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-[16/9] rounded-lg border bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-muted-foreground">Network visualization</p>
                          <p className="text-xs text-muted-foreground">Select nodes to explore relationships</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-[16/9] rounded-lg border bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-muted-foreground">Chart visualization</p>
                          <p className="text-xs text-muted-foreground">
                            Distribution of interaction types and properties
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="references">References</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="rounded-lg border bg-card p-4">
                    {selectedInteraction ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Source</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">ID</p>
                                <p>{selectedInteraction.source}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Gene Symbol</p>
                                <p>{selectedInteraction.sourceGenesymbol}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Taxonomy ID</p>
                                <p>{selectedInteraction.ncbiTaxIdSource}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Entity Type</p>
                                <p className="capitalize">{selectedInteraction.entityTypeSource}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Target</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">ID</p>
                                <p>{selectedInteraction.target}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Gene Symbol</p>
                                <p>{selectedInteraction.targetGenesymbol}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Taxonomy ID</p>
                                <p>{selectedInteraction.ncbiTaxIdTarget}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Entity Type</p>
                                <p className="capitalize">{selectedInteraction.entityTypeTarget}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Interaction Properties</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Type</p>
                              <p>{selectedInteraction.type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Curation Effort</p>
                              <p>{selectedInteraction.curationEffort}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Is Directed</p>
                              <p>{selectedInteraction.isDirected ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Is Stimulation</p>
                              <p>{selectedInteraction.isStimulation ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Is Inhibition</p>
                              <p>{selectedInteraction.isInhibition ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Consensus Direction</p>
                              <p>{selectedInteraction.consensusDirection ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Consensus Stimulation</p>
                              <p>{selectedInteraction.consensusStimulation ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Consensus Inhibition</p>
                              <p>{selectedInteraction.consensusInhibition ? "Yes" : "No"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Select an entry to view details</p>
                        <p className="text-xs text-muted-foreground">Detailed information will appear here</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="references" className="rounded-lg border bg-card p-4">
                    {selectedInteraction ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground">References</h4>
                        {selectedInteraction.references ? (
                          <div className="text-sm space-y-3">
                            {selectedInteraction.references.split(";").map((ref, index) => {
                              // Extract the source and PubMed ID
                              const [source, pubmedId] = ref.split(":")

                              return (
                                <div key={index} className="flex items-start gap-3">
                                  <span className="text-muted-foreground min-w-[2rem]">[{index + 1}]</span>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {source}
                                      </Badge>
                                      <a
                                        href={`https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {pubmedId}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No references available for this interaction
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Select an entry to view references</p>
                        <p className="text-xs text-muted-foreground">Publication references will appear here</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No interactions found</h3>
                <p className="text-muted-foreground max-w-md">
                  Search for proteins, genes, or other biological entities to find interactions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

