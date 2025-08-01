"use client"
import { FilterCard } from "@/components/filter-card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchFilters } from "@/features/annotations-browser/types"

// Filter options
const SOURCE_GROUPS = {
  "Cell-cell communication": [
    { value: "Baccin2019", label: "Baccin 2019" },
    { value: "CellCall", label: "CellCall" },
    { value: "CellCellInteractions", label: "Cell-Cell Interactions" },
    { value: "CellChatDB", label: "CellChatDB" },
    { value: "CellChatDB_complex", label: "CellChatDB Complexes" },
    { value: "Cellinker", label: "Cellinker" },
    { value: "Cellinker_complex", label: "Cellinker Complexes" },
    { value: "CellPhoneDB", label: "CellPhoneDB" },
    { value: "CellPhoneDB_complex", label: "CellPhoneDB Complexes" },
    { value: "CellTalkDB", label: "CellTalkDB" },
    { value: "connectomeDB2020", label: "ConnectomeDB" },
    { value: "EMBRACE", label: "EMBRACE" },
    { value: "Guide2Pharma", label: "Guide2Pharma" },
    { value: "iTALK", label: "iTALK" },
    { value: "HPMR", label: "HPMR" },
    { value: "ICELLNET", label: "ICELLNET" },
    { value: "ICELLNET_complex", label: "ICELLNET Complexes" },
    { value: "Kirouac2010", label: "Kirouac 2010" },
    { value: "LRdb", label: "LRdb" },
    { value: "Ramilowski2015", label: "Ramilowski 2015" },
    { value: "scConnect", label: "scConnect" },
    { value: "scConnect_complex", label: "scConnect Complexes" },
    { value: "SignaLink_function", label: "SignaLink Function" },
    { value: "Surfaceome", label: "Surfaceome" },
    { value: "talklr", label: "talklr" },
  ],
  "Localization (subcellular)": [
    { value: "ComPPI", label: "ComPPI" },
    { value: "Exocarta", label: "Exocarta" },
    { value: "HPA_subcellular", label: "HPA Subcellular" },
    { value: "HPA_secretome", label: "HPA Secretome" },
    { value: "HumanCellMap", label: "Human Cell Map" },
    { value: "LOCATE", label: "LOCATE" },
    { value: "Ramilowski_location", label: "Ramilowski Location" },
    { value: "UniProt_location", label: "UniProt Location" },
    { value: "Vesiclepedia", label: "Vesiclepedia" },
    { value: "Wang", label: "Wang" },
  ],
  "Membrane localization & topology": [
    { value: "Almen2009", label: "Almen 2009" },
    { value: "CellPhoneDB", label: "CellPhoneDB" },
    { value: "CSPA", label: "CSPA" },
    { value: "LOCATE", label: "LOCATE" },
    { value: "Membranome", label: "Membranome" },
    { value: "OPM", label: "OPM" },
    { value: "Phobius", label: "Phobius" },
    { value: "Ramilowski_location", label: "Ramilowski Location" },
    { value: "TopDB", label: "TopDB" },
    { value: "UniProt_topology", label: "Topology" },
  ],
  "Extracellular matrix, adhesion": [
    { value: "Matrisome", label: "Matrisome" },
    { value: "MatrixDB", label: "MatrixDB" },
    { value: "Integrins", label: "Integrins" },
    { value: "MCAM", label: "MCAM" },
    { value: "Zhong2015", label: "Zhong 2015" },
  ],
  "Vesicles, secretome": [
    { value: "Almen2009", label: "Almen 2009" },
    { value: "Exocarta", label: "Exocarta" },
    { value: "Vesiclepedia", label: "Vesiclepedia" },
  ],
  "Function, pathway": [
    { value: "CellChatDB", label: "CellChatDB" },
    { value: "GO_Intercell", label: "GO Intercell" },
    { value: "KEGG", label: "KEGG" },
    { value: "KEGG-PC", label: "KEGG-PC" },
    { value: "NetPath", label: "NetPath" },
    { value: "SignaLink_pathway", label: "SignaLink Pathway" },
    { value: "SignaLink_function", label: "SignaLink Function" },
    { value: "CORUM_Funcat", label: "CORUM Funcat" },
    { value: "CORUM_GO", label: "CORUM GO" },
    { value: "SIGNOR", label: "SIGNOR" },
    { value: "PROGENy", label: "PROGENy" },
    { value: "MSigDB", label: "MSigDB" },
    { value: "UniProt_keyword", label: "Keywords" },
    { value: "Wang", label: "Wang" },
  ],
  "Signatures": [
    { value: "CytoSig", label: "CytoSig" },
    { value: "PanglaoDB", label: "PanglaoDB" },
    { value: "PROGENy", label: "PROGENy" },
  ],
  "Disease, cancer": [
    { value: "DisGeNet", label: "DisGeNet" },
    { value: "CancerGeneCensus", label: "Cancer Gene Census" },
    { value: "IntOGen", label: "IntOGen" },
    { value: "CancerSEA", label: "CancerSEA" },
    { value: "CancerDrugsDB", label: "CancerDrugsDB" },
    { value: "DGIdb", label: "DGIdb" },
    { value: "CPAD", label: "CPAD" },
  ],
  "Protein classes & families": [
    { value: "Adhesome", label: "Adhesome" },
    { value: "DGIdb", label: "DGIdb" },
    { value: "UniProt_family", label: "Protein Family" },
    { value: "GPCRdb", label: "GPCRdb" },
    { value: "HPMR", label: "HPMR" },
    { value: "kinase.com", label: "Kinase.com" },
    { value: "Phosphatome", label: "Phosphatome" },
    { value: "TFcensus", label: "TFcensus" },
    { value: "TCDB", label: "TCDB" },
    { value: "InterPro", label: "InterPro" },
    { value: "HGNC", label: "HGNC" },
    { value: "OPM", label: "OPM" },
  ],
  "Cell type, tissue": [
    { value: "HPA_tissue", label: "HPA Tissue" },
    { value: "CSPA_celltype", label: "CSPA Cell Type" },
    { value: "CellTypist", label: "CellTypist" },
    { value: "UniProt_tissue", label: "UniProt Tissue" },
    { value: "EMBRACE", label: "EMBRACE" },
  ],
  "Transcription factors": [
    { value: "Lambert2018", label: "Lambert 2018" },
    { value: "TFcensus", label: "TFcensus" },
  ],
}

interface FilterCounts {
  sources: Record<string, number>
  annotationTypes: Record<string, number>
}

interface AnnotationsFilterSidebarProps {
  filters: SearchFilters
  onFilterChange: (type: keyof SearchFilters, value: string) => void
  filterCounts: FilterCounts
  showMobileFilters: boolean
  onClearFilters: () => void
}

export function AnnotationsFilterSidebar({
  filters,
  onFilterChange,
  filterCounts,
  showMobileFilters,
  onClearFilters,
}: AnnotationsFilterSidebarProps) {
  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'valueSearch' && !value) return count
    if (Array.isArray(value)) return count + value.length
    return count
  }, 0)

  return (
    <FilterCard
      title="Filters"
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearFilters}
      showMobileFilters={showMobileFilters}
      className="border border-primary/20"
    >
      {Object.entries(SOURCE_GROUPS).map(([groupName, sources]) => {
        let filteredSources = sources
          .filter(source => (filterCounts.sources[source.value.toLowerCase()] || 0) > 0)
          .sort((a, b) => {
            const countA = filterCounts.sources[a.value.toLowerCase()] || 0;
            const countB = filterCounts.sources[b.value.toLowerCase()] || 0;
            return countB - countA;
          });

        // For "Other" category, add any uncategorized sources
        if (groupName === "Other") {
          // Get all sources that exist in filterCounts
          const allAvailableSources = Object.keys(filterCounts.sources);

          // Get all categorized sources (excluding "Other")
          const categorizedSources = new Set();
          Object.entries(SOURCE_GROUPS).forEach(([key, groupSources]) => {
            if (key !== "Other") {
              groupSources.forEach(source => {
                categorizedSources.add(source.value.toLowerCase());
              });
            }
          });

          // Find uncategorized sources
          const uncategorizedSources = allAvailableSources
            .filter(source => !categorizedSources.has(source) && (filterCounts.sources[source] || 0) > 0)
            .map(source => ({
              value: source,
              label: source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, ' ')
            }));

          // Add uncategorized sources to the "Other" category
          filteredSources = [...filteredSources, ...uncategorizedSources]
            .sort((a, b) => {
              const countA = filterCounts.sources[a.value.toLowerCase()] || 0;
              const countB = filterCounts.sources[b.value.toLowerCase()] || 0;
              return countB - countA;
            });
        }

        // Only render the group if it has sources with non-zero counts
        if (filteredSources.length === 0) return null;

        return (
          <div key={groupName} className="mb-4">
            <h4 className="text-sm font-medium mb-2">{groupName}</h4>
            <div className="space-y-2">
              {filteredSources.map((source) => (
                <div key={source.value} className="flex items-center justify-between group">
                  <Label
                    htmlFor={`source-${source.value}`}
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer group-hover:text-primary transition-colors ${
                      filters.sources.includes(source.value) ? "text-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`source-${source.value}`}
                      checked={filters.sources.includes(source.value)}
                      onCheckedChange={() => onFilterChange("sources", source.value)}
                      className={filters.sources.includes(source.value) ? "border-primary" : ""}
                    />
                    {source.label}
                  </Label>
                  <Badge
                    variant={filters.sources.includes(source.value) ? "default" : "outline"}
                    className={`ml-auto group-hover:bg-primary/10 transition-colors ${
                      filters.sources.includes(source.value) ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {filterCounts.sources[source.value.toLowerCase()] || 0}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Accordion type="single" className="w-full">
        <AccordionItem value="valueSearch">
          <AccordionTrigger>Value Search</AccordionTrigger>
          <AccordionContent>
            <Input
              type="text"
              placeholder="Search annotation values..."
              value={filters.valueSearch}
              onChange={(e) => onFilterChange("valueSearch", e.target.value)}
              className={`w-full ${filters.valueSearch ? "border-primary" : ""}`}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </FilterCard>
  )
}

