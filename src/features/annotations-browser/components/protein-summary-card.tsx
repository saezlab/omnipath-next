import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { Copy, ExternalLink } from "lucide-react"

interface ProteinSummaryCardProps {
  proteinData?: GetProteinInformationResponse
  isLoading?: boolean
  defaultExpanded?: boolean
}

export function ProteinSummaryCard({ proteinData, isLoading, defaultExpanded = true }: ProteinSummaryCardProps) {
  const formatMass = (mass: number | null) => {
    if (!mass) return null
    return `${(mass / 1000).toFixed(1)} kDa`
  }

  const parseOrganism = (organismId: string | null) => {
    if (!organismId) return null
    const match = organismId.match(/\d+/)
    return match ? `Tax ID: ${match[0]}` : organismId
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderExternalLink = (url: string, label: string) => (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )

  const renderProteinHeader = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-1">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-3 bg-gray-200 rounded w-64"></div>
        </div>
      )
    }

    if (!proteinData) {
      return (
        <div className="text-muted-foreground text-sm">
          No protein information available
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col gap-0.5">
            <div className="font-semibold text-lg">
              {proteinData.proteinNames || 'Unknown Protein'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>UniProt: {proteinData.entry}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(proteinData.entry)
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy UniProt ID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {proteinData.entryName && (
                <>
                  <span>•</span>
                  <span>{proteinData.entryName}</span>
                </>
              )}
              {proteinData.geneNamesPrimary && (
                <>
                  <span>•</span>
                  <span>Gene: {proteinData.geneNamesPrimary}</span>
                </>
              )}
              {proteinData.length && (
                <>
                  <span>•</span>
                  <span>{proteinData.length} aa</span>
                </>
              )}
              {proteinData.mass && (
                <>
                  <span>•</span>
                  <span>{formatMass(proteinData.mass)}</span>
                </>
              )}
              {proteinData.organismId && (
                <>
                  <span>•</span>
                  <span>{parseOrganism(proteinData.organismId)}</span>
                </>
              )}
            </div>
            {proteinData.geneNamesSynonym && (
              <div className="text-xs text-muted-foreground">
                Also known as: {proteinData.geneNamesSynonym}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderAccordionContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      )
    }

    if (!proteinData) {
      return (
        <div className="text-muted-foreground">
          No additional protein information available for this query.
        </div>
      )
    }

    const parseGOTerms = (goTerms: string | null) => {
      if (!goTerms) return { process: [], function: [], component: [] }
      
      const terms = goTerms.split(';').map(term => term.trim()).filter(Boolean)
      const categorized = {
        process: [] as string[],
        function: [] as string[],
        component: [] as string[]
      }
      
      terms.forEach(term => {
        const match = term.match(/(.+?)\s*\[GO:(\d+)\]/)
        if (match) {
          const [, name, id] = match
          const goTerm = { name: name.trim(), id: `GO:${id}` }
          
          // Simple categorization based on common patterns
          if (name.includes('binding') || name.includes('activity')) {
            categorized.function.push(`${goTerm.name} (${goTerm.id})`)
          } else if (name.includes('membrane') || name.includes('cell') || name.includes('space')) {
            categorized.component.push(`${goTerm.name} (${goTerm.id})`)
          } else {
            categorized.process.push(`${goTerm.name} (${goTerm.id})`)
          }
        }
      })
      
      return categorized
    }

    const goTerms = parseGOTerms(proteinData.geneOntology)

    return (
      <div className="space-y-4">
        <Accordion type="multiple" className="w-full" defaultValue={["basic-info"]}>
          {/* Basic Information Section */}
          <AccordionItem value="basic-info" className="border-none">
            <AccordionTrigger className="text-sm font-semibold py-2">
              Basic Information
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {proteinData.functionCc && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Function</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {proteinData.functionCc}
                  </p>
                </div>
              )}

              {proteinData.subcellularLocation && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Subcellular Location</h4>
                  <div className="text-sm text-muted-foreground">
                    {proteinData.subcellularLocation.split(';').map((location, index) => (
                      <div key={index} className="ml-2">
                        • {location.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proteinData.proteinFamilies && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Protein Family</h4>
                  <p className="text-sm text-muted-foreground">
                    {proteinData.proteinFamilies}
                  </p>
                </div>
              )}

              {proteinData.ecNumber && (
                <div>
                  <h4 className="font-medium text-sm mb-1">EC Number</h4>
                  <Badge variant="secondary" className="text-xs">
                    {proteinData.ecNumber}
                  </Badge>
                </div>
              )}

              {proteinData.transmembrane && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Transmembrane Regions</h4>
                  <p className="text-sm text-muted-foreground">
                    {proteinData.transmembrane}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Disease & Clinical Section */}
          {(proteinData.involvementInDisease || proteinData.activityRegulation) && (
            <AccordionItem value="disease-clinical" className="border-none">
              <AccordionTrigger className="text-sm font-semibold py-2">
                Disease & Clinical
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {proteinData.involvementInDisease && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Disease Involvement</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {proteinData.involvementInDisease.split('DISEASE:').filter(Boolean).map((disease, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded">
                          {disease.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proteinData.activityRegulation && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Activity Regulation</h4>
                    <p className="text-sm text-muted-foreground">
                      {proteinData.activityRegulation}
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Molecular Details Section */}
          <AccordionItem value="molecular-details" className="border-none">
            <AccordionTrigger className="text-sm font-semibold py-2">
              Molecular Details
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {proteinData.postTranslationalModification && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Post-translational Modifications</h4>
                  <p className="text-sm text-muted-foreground">
                    {proteinData.postTranslationalModification}
                  </p>
                </div>
              )}

              {proteinData.keywords && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {proteinData.keywords.split(';').map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {proteinData.geneOntology && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-1">Gene Ontology</h4>
                  
                  {goTerms.process.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Biological Process</h5>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {goTerms.process.slice(0, 5).map((term, index) => (
                          <div key={index} className="ml-2">• {term}</div>
                        ))}
                        {goTerms.process.length > 5 && (
                          <div className="ml-2 text-muted-foreground/70">
                            ... and {goTerms.process.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {goTerms.function.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Molecular Function</h5>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {goTerms.function.slice(0, 5).map((term, index) => (
                          <div key={index} className="ml-2">• {term}</div>
                        ))}
                        {goTerms.function.length > 5 && (
                          <div className="ml-2 text-muted-foreground/70">
                            ... and {goTerms.function.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {goTerms.component.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Cellular Component</h5>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {goTerms.component.slice(0, 5).map((term, index) => (
                          <div key={index} className="ml-2">• {term}</div>
                        ))}
                        {goTerms.component.length > 5 && (
                          <div className="ml-2 text-muted-foreground/70">
                            ... and {goTerms.component.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {proteinData.pathway && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Pathways</h4>
                  <p className="text-sm text-muted-foreground">
                    {proteinData.pathway}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* External Resources Section */}
          <AccordionItem value="external-resources" className="border-none">
            <AccordionTrigger className="text-sm font-semibold py-2">
              External Resources
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {proteinData.entry && (
                  <div>
                    {renderExternalLink(
                      `https://www.uniprot.org/uniprot/${proteinData.entry}`,
                      'UniProt'
                    )}
                  </div>
                )}

                {proteinData.pdb && (
                  <div>
                    <span className="text-sm font-medium">PDB: </span>
                    <span className="text-sm text-muted-foreground">
                      {proteinData.pdb.split(';').slice(0, 3).join(', ')}
                      {proteinData.pdb.split(';').length > 3 && ' ...'}
                    </span>
                  </div>
                )}

                {proteinData.alphafolddb && (
                  <div>
                    {renderExternalLink(
                      `https://alphafold.ebi.ac.uk/entry/${proteinData.alphafolddb}`,
                      'AlphaFold'
                    )}
                  </div>
                )}

                {proteinData.chembl && (
                  <div>
                    {renderExternalLink(
                      `https://www.ebi.ac.uk/chembl/target_report_card/${proteinData.chembl}/`,
                      'ChEMBL'
                    )}
                  </div>
                )}

                {proteinData.ensembl && (
                  <div>
                    <span className="text-sm font-medium">Ensembl: </span>
                    <span className="text-sm text-muted-foreground">
                      {proteinData.ensembl.split(';')[0]}
                    </span>
                  </div>
                )}

                {proteinData.kegg && (
                  <div>
                    {renderExternalLink(
                      `https://www.kegg.jp/entry/${proteinData.kegg}`,
                      'KEGG'
                    )}
                  </div>
                )}
              </div>

              {proteinData.pubmedId && (
                <div>
                  <h4 className="font-medium text-sm mb-1">PubMed References</h4>
                  <div className="flex flex-wrap gap-2">
                    {proteinData.pubmedId.split(';').slice(0, 10).map((pmid, index) => (
                      <a
                        key={index}
                        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid.trim()}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {pmid.trim()}
                      </a>
                    ))}
                    {proteinData.pubmedId.split(';').length > 10 && (
                      <span className="text-xs text-muted-foreground">
                        ... and {proteinData.pubmedId.split(';').length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border-2 rounded-lg"
      defaultValue={defaultExpanded ? "protein-info" : undefined}
    >
      <AccordionItem value="protein-info" className="">
        <AccordionTrigger className="px-3 py-2 hover:no-underline">
          {renderProteinHeader()}
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          {renderAccordionContent()}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}