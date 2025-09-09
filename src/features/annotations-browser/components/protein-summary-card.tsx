import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GetProteinInformationResponse, getProteinInformation } from "@/features/annotations-browser/api/queries"
import { SearchIdentifiersResponse } from "@/db/queries"
import {
  BookOpen,
  Dna,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  Heart,
  Info,
  MapPin,
  Microscope,
  Network,
  Tag,
  X,
  AlertTriangle
} from "lucide-react"
import { useState } from "react"

interface ProteinSummaryCardProps {
  geneSymbol: string
  identifierResults: SearchIdentifiersResponse
  onRemove?: () => void
  onClick?: () => void
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
  
  // Split into sentences and clean them up, avoiding splits inside parentheses and with decimals
  const sentences = []
  let current = ''
  let parenDepth = 0
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const prevChar = cleanText[i - 1]
    const nextChar = cleanText[i + 1]
    
    if (char === '(') parenDepth++
    else if (char === ')') parenDepth--
    
    if ((char === '.' || char === ';') && parenDepth === 0) {
      // Don't split on decimals (digit.digit)
      if (char === '.' && prevChar && nextChar && /\d/.test(prevChar) && /\d/.test(nextChar)) {
        current += char
      } else {
        // This is a sentence boundary
        if (current.trim()) sentences.push(current.trim())
        current = ''
        continue
      }
    } else {
      current += char
    }
  }
  
  // Add the last sentence if there's content
  if (current.trim()) sentences.push(current.trim())
  
  const filteredSentences = sentences.filter(s => s.length > 0)
  
  return filteredSentences.map((sentence, index) => {
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

export function ProteinSummaryCard({ 
  geneSymbol, 
  identifierResults,
  onRemove, 
  onClick 
}: ProteinSummaryCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [proteinData, setProteinData] = useState<GetProteinInformationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch protein data when expanding from minimal mode or when not in minimal mode
  const fetchProteinData = async () => {
    if (!identifierResults || identifierResults.length === 0) return
    
    setIsLoading(true)
    try {
      const proteinResponse = await getProteinInformation(identifierResults)
      setProteinData(proteinResponse)
    } catch (error) {
      console.error("Error fetching protein information:", error)
      setProteinData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Note: Data is now fetched only when dialog opens, not automatically

  // Handle dialog open - fetch data when dialog opens if not already loaded
  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open)
    if (open && !proteinData && !isLoading) {
      fetchProteinData()
    }
  }

  
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

  // Check if identifier couldn't be resolved
  const isUnresolved = !identifierResults || identifierResults.length === 0

  // Always render minimal card, regardless of fetchOnClick
  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
      {/* Integrated Badge with Icons */}
      <Badge className={`h-8 text-xs px-2 py-0.5 h-auto font-semibold flex items-center gap-1 ${
        isUnresolved 
          ? "bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50" 
          : "bg-primary hover:bg-primary/90 text-primary-foreground"
      }`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {isUnresolved ? (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="line-through decoration-2 decoration-orange-600 dark:decoration-orange-400">
                    {geneSymbol}
                  </span>
                </div>
              ) : (
                <DialogTrigger asChild>
                  <button
                    className="flex items-center gap-1 hover:bg-primary/80 rounded px-1 py-0.5 -mx-1 -my-0.5"
                    onClick={() => onClick?.()}
                  >
                    <Info className="h-4 w-4" />
                    <Dna className="h-4 w-4" />
                    {geneSymbol}
                  </button>
                </DialogTrigger>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isUnresolved ? (
                <p>Identifier &quot;{geneSymbol}&quot; could not be resolved</p>
              ) : (
                <p>Show more info</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {onRemove && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                  className="ml-1 hover:bg-red-500/20 rounded p-0.5 -mr-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Badge>

      {/* Dialog Content */}
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <>
            <DialogHeader>
              <DialogTitle>Loading protein information...</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-primary/20 rounded-md"></div>
                <div className="h-6 w-48 bg-muted-foreground/30 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted-foreground/30 rounded"></div>
                <div className="h-4 w-32 bg-muted-foreground/30 rounded"></div>
              </div>
              <div className="h-32 bg-muted-foreground/20 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-24 bg-muted-foreground/20 rounded"></div>
                <div className="h-24 bg-muted-foreground/20 rounded"></div>
              </div>
            </div>
          </>
        ) : !proteinData ? (
          <>
            <DialogHeader>
              <DialogTitle>Protein Information</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No protein data available</p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                {proteinData.geneNamesPrimary && (
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-2.5 py-1 h-auto font-semibold">
                    <Dna className="h-3 w-3 mr-1.5" />
                    {proteinData.geneNamesPrimary}
                  </Badge>
                )}
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  {parseProteinNames(proteinData.proteinNames).main}
                </DialogTitle>
              </div>
              
              {/* Metadata Row */}
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <a
                  href={`https://www.uniprot.org/uniprot/${proteinData.entry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <Badge variant="outline" className="font-mono text-xs px-2 py-1 hover:bg-primary/10 cursor-pointer border-primary/30">
                    {proteinData.entry}
                    <ExternalLink className="h-2.5 w-2.5 ml-1" />
                  </Badge>
                </a>
                
                {proteinData.length && proteinData.mass && (
                  <>
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {proteinData.length} aa
                    </span>
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {formatMass(proteinData.mass)}
                    </span>
                  </>
                )}
                {proteinData.organismId && (
                  <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    {parseOrganism(proteinData.organismId)}
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Function Section */}
              {proteinData.functionCc && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Function
                  </h4>
                  <StatementRenderer statements={formatUniprotText(proteinData.functionCc)} />
                </div>
              )}

              {/* Detail Cards Grid */}
              <div className="columns-1 md:columns-2 lg:columns-3 gap-3 space-y-3 [&>*]:break-inside-avoid">
                {(() => {
                  const goTerms = parseGOTerms(proteinData?.geneOntology ?? null);
                  return (
                    <>
                      {/* Subcellular Location Card */}
                      {proteinData.subcellularLocation && (
                        <DetailCard 
                          title="Subcellular Location" 
                          icon={(props) => <MapPin {...props} className="h-4 w-4 text-secondary dark:text-secondary" />}
                          colorClass="border-secondary/30 bg-secondary/10"
                        >
                          <StatementRenderer statements={formatUniprotText(proteinData.subcellularLocation)} />
                        </DetailCard>
                      )}

                      {/* Disease Involvement Card */}
                      {proteinData.involvementInDisease && (
                        <DetailCard 
                          title="Disease Involvement" 
                          icon={(props) => <Heart {...props} className="h-4 w-4 text-destructive" />}
                          colorClass="border-destructive/30 bg-destructive/10"
                        >
                          <StatementRenderer statements={formatUniprotText(proteinData.involvementInDisease)} />
                        </DetailCard>
                      )}

                      {/* Protein Family & EC Number Card */}
                      {(proteinData.proteinFamilies || proteinData.ecNumber) && (
                        <DetailCard 
                          title="Classification" 
                          icon={(props) => <Network {...props} className="h-4 w-4 text-accent-foreground" />}
                          colorClass="border-accent/50 bg-accent/20"
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
                                  <Badge variant="secondary" className="bg-accent/30 text-accent-foreground hover:bg-accent/50 cursor-pointer">
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
                          icon={(props) => <Tag {...props} className="h-4 w-4 text-highlight-foreground" />}
                          colorClass="border-highlight/30 bg-highlight/10"
                        >
                          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                            {proteinData.keywords.split(';').map((keyword, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs border-highlight/60 bg-highlight/40 text-foreground font-medium px-1.5 py-0.5"
                              >
                                {keyword.trim()}
                              </Badge>
                            ))}
                          </div>
                        </DetailCard>
                      )}

                      {/* Gene Ontology Card */}
                      {proteinData?.geneOntology && goTerms.length > 0 && (
                        <DetailCard 
                          title="Gene Ontology Terms" 
                          icon={(props) => <Microscope {...props} className="h-4 w-4 text-primary" />}
                          colorClass="border-primary/30 bg-primary/10"
                        >
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                            {goTerms.map((term, index) => (
                              <p key={index} className="text-xs text-muted-foreground leading-tight">
                                • {term.name} (
                                <a 
                                  href={`https://amigo.geneontology.org/amigo/term/${term.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
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
                          icon={(props) => <FlaskConical {...props} className="h-4 w-4 text-chart-4" />}
                          colorClass="border-chart-4/30 bg-chart-4/10"
                        >
                          <StatementRenderer statements={formatUniprotText(proteinData.postTranslationalModification)} />
                        </DetailCard>
                      )}

                      {/* External Resources Card */}
                      <DetailCard 
                        title="External Resources" 
                        icon={(props) => <Globe {...props} className="h-4 w-4 text-muted-foreground" />}
                        colorClass="border-border bg-muted/30"
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
                        <Card className="border-chart-3/30 bg-chart-3/10">
                          <CardHeader className="p-2 sm:p-3 pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-chart-3" />
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
                                    className="text-xs px-1.5 py-0.5 bg-chart-3/40 text-foreground font-medium rounded hover:bg-chart-3/60 border border-chart-3/60"
                                  >
                                    {pmid.trim()}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}