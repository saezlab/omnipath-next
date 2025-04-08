"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Activity, Tag, MapPin, Info } from "lucide-react"
import { Input } from "@/components/ui/input"

// Filter options
const SOURCE_GROUPS = {
  "UniProt": [
    { value: "UniProt_family", label: "Protein Family" },
    { value: "UniProt_keyword", label: "Keywords" },
    { value: "UniProt_location", label: "Location" },
    { value: "UniProt_tissue", label: "Tissue" },
    { value: "UniProt_topology", label: "Topology" },
  ],
  "Cell Communication": [
    { value: "CellPhoneDB", label: "CellPhoneDB" },
    { value: "CellChatDB", label: "CellChatDB" },
    { value: "CellTalkDB", label: "CellTalkDB" },
    { value: "ICELLNET", label: "ICELLNET" },
  ],
  "Localization": [
    { value: "HPA_subcellular", label: "HPA Subcellular" },
    { value: "HPA_secretome", label: "HPA Secretome" },
    { value: "ComPPI", label: "ComPPI" },
    { value: "LOCATE", label: "LOCATE" },
  ],
  "Function/Pathway": [
    { value: "GO_Intercell", label: "GO Intercell" },
    { value: "KEGG", label: "KEGG" },
    { value: "NetPath", label: "NetPath" },
    { value: "SignaLink_pathway", label: "SignaLink Pathway" },
  ],
  "Disease/Cancer": [
    { value: "DisGeNet", label: "DisGeNet" },
    { value: "CancerGeneCensus", label: "Cancer Gene Census" },
    { value: "IntOGen", label: "IntOGen" },
  ]
}

const ANNOTATION_TYPES = {
  "Location/Subcellular": [
    { value: "localization", label: "Localization" },
    { value: "location", label: "Location" },
    { value: "topology", label: "Topology" },
    { value: "membrane", label: "Membrane" },
    { value: "transmembrane", label: "Transmembrane" },
    { value: "secreted", label: "Secreted" },
  ],
  "Function/Pathway": [
    { value: "function", label: "Function" },
    { value: "pathway", label: "Pathway" },
    { value: "pathway_category", label: "Pathway Category" },
    { value: "role", label: "Role" },
  ],
  "Cell/Tissue": [
    { value: "cell_type", label: "Cell Type" },
    { value: "tissue", label: "Tissue" },
    { value: "tissue_type", label: "Tissue Type" },
    { value: "cell_subtype", label: "Cell Subtype" },
  ],
  "Disease/Cancer": [
    { value: "cancer", label: "Cancer" },
    { value: "disease", label: "Disease" },
    { value: "effect_on_cancer", label: "Effect on Cancer" },
    { value: "tumour_types_somatic", label: "Somatic Tumor Types" },
    { value: "tumour_types_germline", label: "Germline Tumor Types" },
  ],
  "Protein Classification": [
    { value: "family", label: "Family" },
    { value: "subfamily", label: "Subfamily" },
    { value: "classification", label: "Classification" },
    { value: "gpcr_class", label: "GPCR Class" },
    { value: "receptor_class", label: "Receptor Class" },
  ]
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

        <Accordion type="multiple" defaultValue={["sources", "annotationTypes"]} className="w-full">
          <AccordionItem value="sources">
            <AccordionTrigger>Data Sources</AccordionTrigger>
            <AccordionContent>
              {Object.entries(SOURCE_GROUPS).map(([groupName, sources]) => (
                <div key={groupName} className="mb-4">
                  <h4 className="text-sm font-medium mb-2">{groupName}</h4>
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <div key={source.value} className="flex items-center justify-between">
                        <Label
                          htmlFor={`source-${source.value}`}
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id={`source-${source.value}`}
                            checked={filters.sources.includes(source.value)}
                            onCheckedChange={() => onFilterChange("sources", source.value)}
                          />
                          {source.label}
                        </Label>
                        <Badge variant="outline" className="ml-auto">
                          {filterCounts.sources[source.value] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="annotationTypes">
            <AccordionTrigger>Annotation Types</AccordionTrigger>
            <AccordionContent>
              {Object.entries(ANNOTATION_TYPES).map(([groupName, types]) => (
                <div key={groupName} className="mb-4">
                  <h4 className="text-sm font-medium mb-2">{groupName}</h4>
                  <div className="space-y-2">
                    {types.map((type) => (
                      <div key={type.value} className="flex items-center justify-between">
                        <Label
                          htmlFor={`type-${type.value}`}
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id={`type-${type.value}`}
                            checked={filters.annotationTypes.includes(type.value)}
                            onCheckedChange={() => onFilterChange("annotationTypes", type.value)}
                          />
                          {type.label}
                        </Label>
                        <Badge variant="outline" className="ml-auto">
                          {filterCounts.annotationTypes[type.value] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="valueSearch">
            <AccordionTrigger>Value Search</AccordionTrigger>
            <AccordionContent>
              <Input
                type="text"
                placeholder="Search annotation values..."
                value={filters.valueSearch}
                onChange={(e) => onFilterChange("valueSearch", e.target.value)}
                className="w-full"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

