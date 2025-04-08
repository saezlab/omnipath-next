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
    { value: "CellPhoneDB_complex", label: "CellPhoneDB Complexes" },
    { value: "CellChatDB", label: "CellChatDB" },
    { value: "CellChatDB_complex", label: "CellChatDB Complexes" },
    { value: "CellTalkDB", label: "CellTalkDB" },
    { value: "ICELLNET", label: "ICELLNET" },
    { value: "ICELLNET_complex", label: "ICELLNET Complexes" },
    { value: "CellCall", label: "CellCall" },
    { value: "CellCellInteractions", label: "Cell-Cell Interactions" },
    { value: "Cellinker", label: "Cellinker" },
    { value: "Cellinker_complex", label: "Cellinker Complexes" },
    { value: "scConnect", label: "scConnect" },
    { value: "scConnect_complex", label: "scConnect Complexes" },
    { value: "iTALK", label: "iTALK" },
    { value: "talklr", label: "talklr" },
    { value: "LRdb", label: "LRdb" },
    { value: "connectomeDB2020", label: "ConnectomeDB" },
  ],
  "Localization/Subcellular": [
    { value: "HPA_subcellular", label: "HPA Subcellular" },
    { value: "HPA_secretome", label: "HPA Secretome" },
    { value: "ComPPI", label: "ComPPI" },
    { value: "LOCATE", label: "LOCATE" },
    { value: "Membranome", label: "Membranome" },
    { value: "Surfaceome", label: "Surfaceome" },
    { value: "OPM", label: "OPM" },
    { value: "TopDB", label: "TopDB" },
    { value: "TCDB", label: "TCDB" },
    { value: "Phobius", label: "Phobius" },
    { value: "Ramilowski_location", label: "Ramilowski Location" },
  ],
  "Function/Pathway": [
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
  ],
  "Disease/Cancer": [
    { value: "DisGeNet", label: "DisGeNet" },
    { value: "CancerGeneCensus", label: "Cancer Gene Census" },
    { value: "IntOGen", label: "IntOGen" },
    { value: "CancerSEA", label: "CancerSEA" },
    { value: "CancerDrugsDB", label: "CancerDrugsDB" },
    { value: "DGIdb", label: "DGIdb" },
    { value: "CPAD", label: "CPAD" },
  ],
  "Protein Classification": [
    { value: "GPCRdb", label: "GPCRdb" },
    { value: "kinase.com", label: "Kinase.com" },
    { value: "Phosphatome", label: "Phosphatome" },
    { value: "TFcensus", label: "TFcensus" },
    { value: "InterPro", label: "InterPro" },
    { value: "HGNC", label: "HGNC" },
  ],
  "Extracellular Matrix": [
    { value: "Matrisome", label: "Matrisome" },
    { value: "MatrixDB", label: "MatrixDB" },
    { value: "Adhesome", label: "Adhesome" },
    { value: "Integrins", label: "Integrins" },
    { value: "MCAM", label: "MCAM" },
  ],
  "Vesicles/Secretome": [
    { value: "Exocarta", label: "Exocarta" },
    { value: "Vesiclepedia", label: "Vesiclepedia" },
    { value: "HPMR", label: "HPMR" },
  ],
  "Cell Type/Tissue": [
    { value: "HPA_tissue", label: "HPA Tissue" },
    { value: "CSPA", label: "CSPA" },
    { value: "CSPA_celltype", label: "CSPA Cell Type" },
    { value: "CellTypist", label: "CellTypist" },
    { value: "PanglaoDB", label: "PanglaoDB" },
    { value: "HumanCellMap", label: "Human Cell Map" },
  ],
  "Literature/Reviews": [
    { value: "Almen2009", label: "Almen 2009" },
    { value: "Baccin2019", label: "Baccin 2019" },
    { value: "Kirouac2010", label: "Kirouac 2010" },
    { value: "Lambert2018", label: "Lambert 2018" },
    { value: "Ramilowski2015", label: "Ramilowski 2015" },
    { value: "Wang", label: "Wang" },
    { value: "Zhong2015", label: "Zhong 2015" },
  ],
  "Pharmacology": [
    { value: "Guide2Pharma", label: "Guide2Pharma" },
    { value: "CytoSig", label: "CytoSig" },
  ],
  "Other": [
    { value: "EMBRACE", label: "EMBRACE" },
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
    { value: "tmh", label: "Transmembrane Helices" },
    { value: "tm_helices", label: "Transmembrane Helices" },
    { value: "cytoplasmic", label: "Cytoplasmic" },
    { value: "non_cytoplasmic", label: "Non-cytoplasmic" },
    { value: "signal_peptide", label: "Signal Peptide" },
    { value: "tmregions", label: "Transmembrane Regions" },
    { value: "phobius_transmembrane", label: "Phobius Transmembrane" },
    { value: "phobius_secreted", label: "Phobius Secreted" },
    { value: "sosui_transmembrane", label: "SOSUI Transmembrane" },
    { value: "tmhmm_transmembrane", label: "TMHMM Transmembrane" },
    { value: "gpi", label: "GPI-anchored" },
    { value: "uniprot_cell_surface", label: "UniProt Cell Surface" },
    { value: "secreted_class", label: "Secreted Class" },
  ],
  "Function/Pathway": [
    { value: "function", label: "Function" },
    { value: "pathway", label: "Pathway" },
    { value: "pathway_category", label: "Pathway Category" },
    { value: "role", label: "Role" },
    { value: "go", label: "GO Term" },
    { value: "funcat", label: "FunCat" },
    { value: "effect_on_pathway", label: "Effect on Pathway" },
    { value: "has_catalytic_activity", label: "Catalytic Activity" },
    { value: "has_protein_substrates", label: "Protein Substrates" },
    { value: "has_non_protein_substrates", label: "Non-protein Substrates" },
  ],
  "Cell/Tissue": [
    { value: "cell_type", label: "Cell Type" },
    { value: "tissue", label: "Tissue" },
    { value: "tissue_type", label: "Tissue Type" },
    { value: "cell_subtype", label: "Cell Subtype" },
    { value: "organ", label: "Organ" },
    { value: "tissues", label: "Tissues" },
    { value: "cell_ontology", label: "Cell Ontology" },
    { value: "n_cell_types", label: "Number of Cell Types" },
    { value: "endothelial_cell", label: "Endothelial Cell" },
    { value: "microglia", label: "Microglia" },
    { value: "mural_cell", label: "Mural Cell" },
    { value: "neuron", label: "Neuron" },
  ],
  "Disease/Cancer": [
    { value: "cancer", label: "Cancer" },
    { value: "disease", label: "Disease" },
    { value: "effect_on_cancer", label: "Effect on Cancer" },
    { value: "tumour_types_somatic", label: "Somatic Tumor Types" },
    { value: "tumour_types_germline", label: "Germline Tumor Types" },
    { value: "pathology", label: "Pathology" },
    { value: "prognostic", label: "Prognostic" },
    { value: "favourable", label: "Favourable" },
    { value: "effect_on_cancer_outcome", label: "Effect on Cancer Outcome" },
    { value: "cancer_syndrome", label: "Cancer Syndrome" },
    { value: "germline", label: "Germline" },
    { value: "somatic", label: "Somatic" },
    { value: "mutation_type", label: "Mutation Type" },
  ],
  "Protein Classification": [
    { value: "family", label: "Family" },
    { value: "subfamily", label: "Subfamily" },
    { value: "classification", label: "Classification" },
    { value: "gpcr_class", label: "GPCR Class" },
    { value: "receptor_class", label: "Receptor Class" },
    { value: "receptor", label: "Receptor" },
    { value: "peripheral", label: "Peripheral" },
    { value: "integrin", label: "Integrin" },
    { value: "in MCAM", label: "MCAM" },
    { value: "in Integrins", label: "Integrins" },
  ],
  "Transcription Factors": [
    { value: "is_tf", label: "Is Transcription Factor" },
    { value: "tfcensus_class", label: "TF Census Class" },
    { value: "tfclass", label: "TF Class" },
    { value: "tfcat_annot", label: "TF Cat Annotation" },
    { value: "tf_disagree", label: "TF Disagreement" },
    { value: "tf_assessment", label: "TF Assessment" },
    { value: "binding_domain", label: "Binding Domain" },
    { value: "binding_mode", label: "Binding Mode" },
    { value: "binding_disagree", label: "Binding Disagreement" },
    { value: "cisbp", label: "CIS-BP" },
  ],
  "Drug/Pharmacology": [
    { value: "drug_label", label: "Drug Label" },
    { value: "who_approved", label: "WHO Approved" },
    { value: "generic", label: "Generic" },
    { value: "fda_approved", label: "FDA Approved" },
    { value: "ema_approved", label: "EMA Approved" },
    { value: "european_national_approved", label: "European National Approved" },
    { value: "indications", label: "Indications" },
    { value: "approval_year", label: "Approval Year" },
  ],
  "Statistics/Evidence": [
    { value: "score", label: "Score" },
    { value: "weight", label: "Weight" },
    { value: "p_value", label: "P-value" },
    { value: "level", label: "Level" },
    { value: "status", label: "Status" },
    { value: "n_high", label: "High Expression" },
    { value: "n_medium", label: "Medium Expression" },
    { value: "n_low", label: "Low Expression" },
    { value: "n_not_detected", label: "Not Detected" },
    { value: "dsi", label: "DSI" },
    { value: "dpi", label: "DPI" },
    { value: "nof_pmids", label: "Number of PMIDs" },
    { value: "nof_snps", label: "Number of SNPs" },
    { value: "high_confidence", label: "High Confidence" },
    { value: "curated", label: "Curated" },
    { value: "oncodrive_role_prob", label: "Oncodrive Role Probability" },
  ],
  "References": [
    { value: "pmid", label: "PMID" },
    { value: "references", label: "References" },
    { value: "sources", label: "Sources" },
    { value: "tfcat_pmids", label: "TF Cat PMIDs" },
  ],
  "Other": [
    { value: "collection", label: "Collection" },
    { value: "geneset", label: "Gene Set" },
    { value: "keyword", label: "Keyword" },
    { value: "vesicle", label: "Vesicle" },
    { value: "type", label: "Type" },
    { value: "mainclass", label: "Main Class" },
    { value: "interpro_id", label: "InterPro ID" },
    { value: "organism", label: "Organism" },
    { value: "category", label: "Category" },
    { value: "cls", label: "CLS" },
    { value: "method", label: "Method" },
    { value: "value", label: "Value" },
    { value: "human", label: "Human" },
    { value: "mouse", label: "Mouse" },
    { value: "features", label: "Features" },
    { value: "subclass", label: "Subclass" },
    { value: "note", label: "Note" },
    { value: "genesymbol", label: "Gene Symbol" },
    { value: "side", label: "Side" },
    { value: "tcid", label: "TCID" },
    { value: "ensg", label: "ENSG" },
    { value: "state", label: "State" },
    { value: "group", label: "Group" },
    { value: "datasets", label: "Datasets" },
    { value: "marker_type", label: "Marker Type" },
    { value: "tier", label: "Tier" },
    { value: "subsubclass", label: "Sub-subclass" },
    { value: "genetics", label: "Genetics" },
    { value: "inferred_from", label: "Inferred From" },
    { value: "fold", label: "Fold" },
    { value: "intrinsic", label: "Intrinsic" },
    { value: "pdb", label: "PDB" },
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
              {Object.entries(SOURCE_GROUPS).map(([groupName, sources]) => {
                // Filter sources with non-zero counts and sort by count
                const filteredSources = sources
                  .filter(source => (filterCounts.sources[source.value.toLowerCase()] || 0) > 0)
                  .sort((a, b) => {
                    const countA = filterCounts.sources[a.value.toLowerCase()] || 0;
                    const countB = filterCounts.sources[b.value.toLowerCase()] || 0;
                    return countB - countA;
                  });

                // Only render the group if it has sources with non-zero counts
                if (filteredSources.length === 0) return null;

                return (
                  <div key={groupName} className="mb-4">
                    <h4 className="text-sm font-medium mb-2">{groupName}</h4>
                    <div className="space-y-2">
                      {filteredSources.map((source) => (
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
                            {filterCounts.sources[source.value.toLowerCase()] || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="annotationTypes">
            <AccordionTrigger>Annotation Types</AccordionTrigger>
            <AccordionContent>
              {Object.entries(ANNOTATION_TYPES).map(([groupName, types]) => {
                // Filter types with non-zero counts and sort by count
                const filteredTypes = types
                  .filter(type => (filterCounts.annotationTypes[type.value.toLowerCase()] || 0) > 0)
                  .sort((a, b) => {
                    const countA = filterCounts.annotationTypes[a.value.toLowerCase()] || 0;
                    const countB = filterCounts.annotationTypes[b.value.toLowerCase()] || 0;
                    return countB - countA;
                  });

                // Only render the group if it has types with non-zero counts
                if (filteredTypes.length === 0) return null;

                return (
                  <div key={groupName} className="mb-4">
                    <h4 className="text-sm font-medium mb-2">{groupName}</h4>
                    <div className="space-y-2">
                      {filteredTypes.map((type) => (
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
                            {filterCounts.annotationTypes[type.value.toLowerCase()] || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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

