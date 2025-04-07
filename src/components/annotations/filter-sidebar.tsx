"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Activity, Tag, MapPin, Info } from "lucide-react"

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

interface FilterCounts {
  annotationCategory: Record<string, number>
  intercellSubcategory: Record<string, number>
  functionalSubcategory: Record<string, number>
  dataSources: Record<string, number>
}

interface AnnotationsFilterSidebarProps {
  filters: SearchFilters
  filterCounts: FilterCounts
  onFilterChange: (type: keyof SearchFilters, value: any) => void
  showMobileFilters: boolean
  onClearFilters: () => void
}

export function AnnotationsFilterSidebar({
  filters,
  filterCounts,
  onFilterChange,
  showMobileFilters,
  onClearFilters,
}: AnnotationsFilterSidebarProps) {
  return (
    <div className={`md:w-64 lg:w-72 shrink-0 space-y-4 ${showMobileFilters ? "block" : "hidden"} md:block`}>
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
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
                        onCheckedChange={() => onFilterChange("annotationCategory", category.value)}
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
                        onCheckedChange={() => onFilterChange("intercellSubcategory", subcategory.value)}
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
                        onCheckedChange={() => onFilterChange("functionalSubcategory", subcategory.value)}
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

          <AccordionItem value="entityType">
            <AccordionTrigger>Entity Types</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {ENTITY_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      id={`entity-${type.value}`}
                      checked={filters.entityType.includes(type.value)}
                      onCheckedChange={() => onFilterChange("entityType", type.value)}
                    />
                    <Label htmlFor={`entity-${type.value}`} className="ml-2 text-sm font-normal cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="taxonomy">
            <AccordionTrigger>Taxonomy</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {TAXONOMY_IDS.map((tax) => (
                  <div key={tax.value} className="flex items-center">
                    <Checkbox
                      id={`tax-${tax.value}`}
                      checked={filters.ncbiTaxId.includes(tax.value)}
                      onCheckedChange={() => onFilterChange("ncbiTaxId", tax.value)}
                    />
                    <Label htmlFor={`tax-${tax.value}`} className="ml-2 text-sm font-normal cursor-pointer">
                      {tax.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

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
                        onCheckedChange={() => onFilterChange("dataSources", source.value)}
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
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox
                    id="has-references"
                    checked={filters.hasReferences === true}
                    onCheckedChange={() =>
                      onFilterChange("hasReferences", filters.hasReferences === true ? null : true)
                    }
                  />
                  <Label htmlFor="has-references" className="ml-2 text-sm font-normal cursor-pointer">
                    Has references
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox
                    id="no-references"
                    checked={filters.hasReferences === false}
                    onCheckedChange={() =>
                      onFilterChange("hasReferences", filters.hasReferences === false ? null : false)
                    }
                  />
                  <Label htmlFor="no-references" className="ml-2 text-sm font-normal cursor-pointer">
                    No references
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="consensusScore">
            <AccordionTrigger>Consensus Score</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Min Score: {filters.minConsensusScore.toFixed(2)}</span>
                </div>
                <Slider
                  value={[filters.minConsensusScore]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => onFilterChange("minConsensusScore", value[0])}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

