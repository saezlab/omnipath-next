import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { 
  ExternalLink,
  Dna,
  FlaskConical,
  Heart,
  MapPin,
  Network,
  Tag,
  Microscope,
  BookOpen,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface ProteinSummaryCardProps {
  proteinData?: GetProteinInformationResponse
  isLoading?: boolean
  defaultExpanded?: boolean
}

const formatUniprotText = (text: string) => {
  // Remove ECO statements, similarity markers, and UniProt prefixes
  const cleanText = text
    .replace(/\{ECO:[^}]+\}/g, '')
    .replace(/\(By similarity\)/g, '')
    .replace(/FUNCTION:\s*/gi, '')
    .replace(/SUBCELLULAR LOCATION:\s*/gi, '')
    .replace(/PTM:\s*/gi, '')
    .replace(/DISEASE:\s*/gi, '')
  
  // Split into sentences and clean them up
  const sentences = cleanText
    .split(/[.;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  return sentences.map((sentence, index) => {
    // Extract all PubMed IDs from this sentence (including comma-separated lists)
    const pubmedMatches = [...sentence.matchAll(/PubMed:(\d+)/g)]
    
    // Remove all PubMed references from the sentence
    const cleanSentence = sentence
      .replace(/\(PubMed:[\d\s,]+\)/g, '')
      .replace(/\(PubMed:\d+(?:,\s*PubMed:\d+)*\)/g, '')
      .trim()
    
    return {
      text: cleanSentence + '.',
      pubmedIds: pubmedMatches.map(match => match[1]),
      key: index
    }
  }).filter(item => item.text.length > 0)
}

export function ProteinSummaryCard({ proteinData, isLoading, defaultExpanded = false }: ProteinSummaryCardProps) {
  const [showMainCardDetails, setShowMainCardDetails] = useState(defaultExpanded)
  
  const parseProteinNames = (proteinNames: string | null) => {
    if (!proteinNames) return { main: 'Unknown Protein', alternatives: [] }
    
    // Extract main name (everything before the first parenthesis)
    const mainNameMatch = proteinNames.match(/^([^(]+)/)
    const mainName = mainNameMatch ? mainNameMatch[1].trim() : proteinNames
    
    // Extract all alternative names from parentheses
    const parenthesesMatches = proteinNames.match(/\(([^)]+)\)/g)
    const alternatives = parenthesesMatches 
      ? parenthesesMatches.map(match => match.slice(1, -1).trim()).filter(Boolean)
      : []
    
    return {
      main: mainName || 'Unknown Protein',
      alternatives
    }
  }
  
  const formatMass = (mass: number | null) => {
    if (!mass) return null
    return `${(mass / 1000).toFixed(1)} kDa`
  }

  const parseOrganism = (organismId: string | null) => {
    if (!organismId) return null
    const match = organismId.match(/\d+/)
    return match ? `Tax ID: ${match[0]}` : organismId
  }


  const renderExternalLink = (url: string, label: string) => (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 sm:gap-1 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium"
    >
      {label}
      <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
    </a>
  )

  const parseGOTerms = (goTerms: string | null) => {
    if (!goTerms) return []
    
    const terms = goTerms.split(';').map(term => term.trim()).filter(Boolean)
    
    return terms.map(term => {
      const match = term.match(/(.+?)\s*\[GO:(\d+)\]/)
      if (match) {
        const [, name, id] = match
        return { name: name.trim(), id: `GO:${id}` }
      }
      return null
    }).filter(Boolean) as Array<{ name: string; id: string }>
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
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
  const proteinNames = parseProteinNames(proteinData.proteinNames)

  const PubMedButton = ({ pubmedIds }: { pubmedIds: string[] }) => {
    if (pubmedIds.length === 0) return null
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 sm:h-4 sm:w-4 p-0 ml-0.5 sm:ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              onClick={() => {
                const pubmedUrl = pubmedIds.length === 1 
                  ? `https://pubmed.ncbi.nlm.nih.gov/${pubmedIds[0]}/`
                  : `https://pubmed.ncbi.nlm.nih.gov/?term=${pubmedIds.join('%20OR%20')}`
                window.open(pubmedUrl, '_blank')
              }}
            >
              <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {pubmedIds.length === 1 
              ? `PubMed: ${pubmedIds[0]}`
              : `PubMed: ${pubmedIds.length} references`
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const StatementRenderer = ({ statements }: { statements: ReturnType<typeof formatUniprotText> }) => (
    <div className="text-sm leading-relaxed max-h-48 overflow-y-auto">
      {statements.map((statement) => (
        <span key={statement.key}>
          <span className="inline-block bg-background/80 px-1.5 py-0.5 text-xs sm:text-sm rounded border border-border/30 mr-1 mb-1">
            {statement.text}
            <PubMedButton pubmedIds={statement.pubmedIds} />
          </span>
        </span>
      ))}
    </div>
  )

  const DetailCard = ({ 
    title, 
    icon: Icon, 
    children, 
    colorClass 
  }: { 
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    colorClass: string 
  }) => (
    <Card className={`${colorClass}`}>
      <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-1">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 pt-1 sm:pt-1">
        {children}
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full">
        {/* Main Card Header - Always Visible */}
        <Card 
          className="w-full border-0 shadow-none py-0 gap-0 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setShowMainCardDetails(!showMainCardDetails)}
        >
          <CardHeader className="p-2 sm:p-6 pb-0">
            <div className="flex items-start justify-between w-full gap-2 sm:gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                {/* Gene Symbol and Protein Name on same line */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {proteinData.geneNamesPrimary && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2 h-auto font-bold flex-shrink-0">
                      <Dna className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {proteinData.geneNamesPrimary}
                    </Badge>
                  )}
                  <CardTitle className="text-lg sm:text-2xl font-bold min-w-0">
                    {proteinNames.main}
                  </CardTitle>
                </div>
                {proteinNames.alternatives.length > 0 && (
                  <div className="text-sm text-muted-foreground">
        {proteinNames.alternatives.join(', ')}
                  </div>
                )}
              </div>
              
              {/* Metadata in top right */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Primary Identifiers Row */}
                <div className="flex items-center gap-1 sm:gap-2 text-sm">
                  <a
                    href={`https://www.uniprot.org/uniprot/${proteinData.entry}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-105 transition-transform"
                  >
                    <Badge variant="outline" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2.5 h-5 sm:h-6 hover:bg-primary/10 cursor-pointer">
                      {proteinData.entry}
                      <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5 sm:ml-1" />
                    </Badge>
                  </a>
                </div>
                
                {/* Properties Row */}
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  {proteinData.length && proteinData.mass && (
                    <>
                      <span className="bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                        {proteinData.length} aa
                      </span>
                      <span className="bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                        {formatMass(proteinData.mass)}
                      </span>
                    </>
                  )}
                  {proteinData.organismId && (
                    <span className="bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                      {parseOrganism(proteinData.organismId)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          {proteinData.functionCc && showMainCardDetails && (
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="max-h-64 overflow-y-auto">
                <StatementRenderer statements={formatUniprotText(proteinData.functionCc)} />
              </div>
            </CardContent>
          )}
        </Card>
        

        {/* Collapsible Details Section */}
        {showMainCardDetails && (
          <div className="p-0 sm:pt-6 border-t">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-2 sm:gap-3 space-y-2 sm:space-y-3 [&>*]:break-inside-avoid">
              
              {/* Subcellular Location Card */}
              {proteinData.subcellularLocation && (
                <DetailCard 
                  title="Subcellular Location" 
                  icon={(props) => <MapPin {...props} className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  colorClass="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20"
                >
                  <StatementRenderer statements={formatUniprotText(proteinData.subcellularLocation)} />
                </DetailCard>
              )}

              {/* Disease Involvement Card */}
              {proteinData.involvementInDisease && (
                <DetailCard 
                  title="Disease Involvement" 
                  icon={(props) => <Heart {...props} className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  colorClass="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
                >
                  <StatementRenderer statements={formatUniprotText(proteinData.involvementInDisease)} />
                </DetailCard>
              )}

              {/* Protein Family & EC Number Card */}
              {(proteinData.proteinFamilies || proteinData.ecNumber) && (
                <DetailCard 
                  title="Classification" 
                  icon={(props) => <Network {...props} className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                  colorClass="border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20"
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {proteinData.proteinFamilies && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Protein Family</p>
                        <p className="text-sm">{proteinData.proteinFamilies}</p>
                      </div>
                    )}
                    {proteinData.ecNumber && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">EC Number</p>
                        <a
                          href={`https://www.brenda-enzymes.org/enzyme.php?ecno=${proteinData.ecNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:scale-105 transition-transform inline-block"
                        >
                          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50 cursor-pointer">
                            {proteinData.ecNumber}
                            <ExternalLink className="h-2.5 w-2.5 ml-1" />
                          </Badge>
                        </a>
                      </div>
                    )}
                  </div>
                </DetailCard>
              )}

              {/* Keywords Card */}
              {proteinData.keywords && (
                <DetailCard 
                  title="Keywords" 
                  icon={(props) => <Tag {...props} className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                  colorClass="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20"
                >
                  <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                    {proteinData.keywords.split(';').map((keyword, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs border-orange-300 dark:border-orange-800 bg-white/70 dark:bg-gray-900/30 text-orange-800 dark:text-orange-200 px-1.5 py-0.5"
                      >
                        {keyword.trim()}
                      </Badge>
                    ))}
                  </div>
                </DetailCard>
              )}

              {/* Gene Ontology Card */}
              {proteinData.geneOntology && goTerms.length > 0 && (
                <DetailCard 
                  title="Gene Ontology Terms" 
                  icon={(props) => <Microscope {...props} className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                  colorClass="border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20"
                >
                  <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                    {goTerms.map((term, index) => (
                      <p key={index} className="text-xs text-muted-foreground leading-tight">
                        • {term.name} (
                        <a 
                          href={`https://amigo.geneontology.org/amigo/term/${term.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          {term.id}
                        </a>
                        )
                      </p>
                    ))}
                  </div>
                </DetailCard>
              )}

              {/* Post-translational Modifications Card */}
              {proteinData.postTranslationalModification && (
                <DetailCard 
                  title="Modifications" 
                  icon={(props) => <FlaskConical {...props} className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                  colorClass="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20"
                >
                  <StatementRenderer statements={formatUniprotText(proteinData.postTranslationalModification)} />
                </DetailCard>
              )}

              {/* External Resources Card */}
              <DetailCard 
                title="External Resources" 
                icon={(props) => <Globe {...props} className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />}
                colorClass="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
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
                      <span className="text-sm">
                        {proteinData.pdb.split(';').slice(0, 3).map((pdbId, index) => (
                          <span key={index}>
                            {index > 0 && ', '}
                            <a
                              href={`https://www.rcsb.org/structure/${pdbId.trim()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {pdbId.trim()}
                            </a>
                          </span>
                        ))}
                        {proteinData.pdb.split(';').length > 3 && (
                          <span>
                            {' ... '}
                            <a
                              href={`https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22text%22%2C%22parameters%22%3A%7B%22attribute%22%3A%22rcsb_entry_container_identifiers.entry_id%22%2C%22operator%22%3A%22in%22%2C%22value%22%3A%5B${proteinData.pdb.split(';').map(id => '%22' + id.trim() + '%22').join('%2C')}%5D%7D%7D%2C%22return_type%22%3A%22entry%22%7D`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                            >
                              view all {proteinData.pdb.split(';').length} structures
                            </a>
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </DetailCard>

              {/* References Card */}
              {proteinData.pubmedId && (
                <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <CardHeader className="p-2 sm:p-3 pb-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                        References
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const pmids = proteinData.pubmedId!.split(';').map(id => id.trim()).filter(Boolean)
                          const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${pmids.join('%20OR%20')}`
                          window.open(pubmedUrl, '_blank')
                        }}
                        className="h-6 text-xs px-2"
                      >
                        View all
                        <ExternalLink className="ml-1 h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-3 pt-1">
                    <div className="max-h-48 overflow-y-auto pr-1">
                      <div className="flex flex-wrap gap-1">
                        {proteinData.pubmedId.split(';').map((pmid, index) => (
                          <a
                            key={index}
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid.trim()}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                          >
                            {pmid.trim()}
                          </a>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
    </div>
  )
}