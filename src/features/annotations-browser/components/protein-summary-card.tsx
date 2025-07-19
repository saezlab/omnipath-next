import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { 
  Copy, 
  ExternalLink,
  Dna,
  FlaskConical,
  Heart,
  MapPin,
  Network,
  Tag,
  TestTube,
  Microscope,
  BookOpen,
  Globe
} from "lucide-react"

interface ProteinSummaryCardProps {
  proteinData?: GetProteinInformationResponse
  isLoading?: boolean
}

export function ProteinSummaryCard({ proteinData, isLoading }: ProteinSummaryCardProps) {
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
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )

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

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!proteinData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No protein information available for this query.
          </p>
        </CardContent>
      </Card>
    )
  }

  const goTerms = parseGOTerms(proteinData.geneOntology)

  return (
    <div className="w-full space-y-4">
      {/* Hero Section with Function */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {proteinData.proteinNames || 'Unknown Protein'}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{proteinData.entry}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-blue-100"
                          onClick={() => copyToClipboard(proteinData.entry)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy UniProt ID</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {proteinData.entryName && (
                  <span className="text-gray-500">• {proteinData.entryName}</span>
                )}
                {proteinData.geneNamesPrimary && (
                  <Badge variant="secondary" className="bg-white/70">
                    <Dna className="h-3 w-3 mr-1" />
                    {proteinData.geneNamesPrimary}
                  </Badge>
                )}
                {proteinData.length && proteinData.mass && (
                  <span className="text-gray-500">
                    • {proteinData.length} aa • {formatMass(proteinData.mass)}
                  </span>
                )}
                {proteinData.organismId && (
                  <span className="text-gray-500">
                    • {parseOrganism(proteinData.organismId)}
                  </span>
                )}
              </div>
              {proteinData.geneNamesSynonym && (
                <p className="text-xs text-gray-500 italic">
                  Also known as: {proteinData.geneNamesSynonym}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        {proteinData.functionCc && (
          <CardContent className="pt-0">
            <div className="bg-white/60 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm leading-relaxed text-gray-700">
                {proteinData.functionCc}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Masonry Grid of Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
        
        {/* Subcellular Location Card */}
        {proteinData.subcellularLocation && (
          <Card className="hover:shadow-lg transition-shadow border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Subcellular Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {proteinData.subcellularLocation.split(';').map((location, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    {location.trim()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disease Involvement Card */}
        {proteinData.involvementInDisease && (
          <Card className="hover:shadow-lg transition-shadow border-red-200 bg-gradient-to-br from-red-50 to-pink-50 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" />
                Disease Involvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {proteinData.involvementInDisease.split('DISEASE:').filter(Boolean).map((disease, index) => (
                  <div key={index} className="p-3 bg-white/70 rounded-lg text-sm text-gray-700 border border-red-100">
                    {disease.trim()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Protein Family & EC Number Card */}
        {(proteinData.proteinFamilies || proteinData.ecNumber) && (
          <Card className="hover:shadow-lg transition-shadow border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4 text-purple-600" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proteinData.proteinFamilies && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Protein Family</p>
                  <p className="text-sm text-gray-700">{proteinData.proteinFamilies}</p>
                </div>
              )}
              {proteinData.ecNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">EC Number</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {proteinData.ecNumber}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Keywords Card */}
        {proteinData.keywords && (
          <Card className="hover:shadow-lg transition-shadow border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-600" />
                Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {proteinData.keywords.split(';').map((keyword, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs border-orange-300 bg-white/70 text-orange-800"
                  >
                    {keyword.trim()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gene Ontology Card */}
        {proteinData.geneOntology && (
          <Card className="hover:shadow-lg transition-shadow border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Microscope className="h-4 w-4 text-cyan-600" />
                Gene Ontology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {goTerms.process.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-cyan-700 mb-1">Biological Process</p>
                    <div className="space-y-0.5">
                      {goTerms.process.slice(0, 3).map((term, index) => (
                        <p key={index} className="text-xs text-gray-600">• {term}</p>
                      ))}
                      {goTerms.process.length > 3 && (
                        <p className="text-xs text-gray-400 italic">+{goTerms.process.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {goTerms.function.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-cyan-700 mb-1">Molecular Function</p>
                    <div className="space-y-0.5">
                      {goTerms.function.slice(0, 3).map((term, index) => (
                        <p key={index} className="text-xs text-gray-600">• {term}</p>
                      ))}
                      {goTerms.function.length > 3 && (
                        <p className="text-xs text-gray-400 italic">+{goTerms.function.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {goTerms.component.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-cyan-700 mb-1">Cellular Component</p>
                    <div className="space-y-0.5">
                      {goTerms.component.slice(0, 3).map((term, index) => (
                        <p key={index} className="text-xs text-gray-600">• {term}</p>
                      ))}
                      {goTerms.component.length > 3 && (
                        <p className="text-xs text-gray-400 italic">+{goTerms.component.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post-translational Modifications Card */}
        {proteinData.postTranslationalModification && (
          <Card className="hover:shadow-lg transition-shadow border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-indigo-600" />
                Modifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {proteinData.postTranslationalModification}
              </p>
            </CardContent>
          </Card>
        )}

        {/* External Resources Card */}
        <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600" />
              External Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {proteinData.entry && (
                <div>
                  {renderExternalLink(
                    `https://www.uniprot.org/uniprot/${proteinData.entry}`,
                    'UniProt'
                  )}
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
              {proteinData.kegg && (
                <div>
                  {renderExternalLink(
                    `https://www.kegg.jp/entry/${proteinData.kegg}`,
                    'KEGG'
                  )}
                </div>
              )}
              {proteinData.pdb && (
                <div className="col-span-2">
                  <span className="text-sm font-medium">PDB: </span>
                  <span className="text-sm text-gray-600">
                    {proteinData.pdb.split(';').slice(0, 3).join(', ')}
                    {proteinData.pdb.split(';').length > 3 && ' ...'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* References Card */}
        {proteinData.pubmedId && (
          <Card className="hover:shadow-lg transition-shadow border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-yellow-700" />
                References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {proteinData.pubmedId.split(';').slice(0, 8).map((pmid, index) => (
                  <a
                    key={index}
                    href={`https://pubmed.ncbi.nlm.nih.gov/${pmid.trim()}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                  >
                    {pmid.trim()}
                  </a>
                ))}
                {proteinData.pubmedId.split(';').length > 8 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{proteinData.pubmedId.split(';').length - 8} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information Accordion for remaining details */}
        {(proteinData.transmembrane || proteinData.activityRegulation || proteinData.pathway) && (
          <Card className="hover:shadow-lg transition-shadow border-gray-300 lg:col-span-3">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="additional" className="border-none">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-gray-600" />
                    <span className="text-base font-semibold">Additional Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {proteinData.transmembrane && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Transmembrane Regions</h4>
                        <p className="text-sm text-gray-600">{proteinData.transmembrane}</p>
                      </div>
                    )}
                    {proteinData.activityRegulation && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Activity Regulation</h4>
                        <p className="text-sm text-gray-600">{proteinData.activityRegulation}</p>
                      </div>
                    )}
                    {proteinData.pathway && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Pathways</h4>
                        <p className="text-sm text-gray-600">{proteinData.pathway}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )}
      </div>
    </div>
  )
}