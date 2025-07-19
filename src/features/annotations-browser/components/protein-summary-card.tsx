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
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
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

  return (
    <div className="w-full">
      <div className="sm:border sm:border-2 rounded-lg relative">
        {/* Main Card Header - Always Visible */}
        <Card className="w-full border-0 shadow-none">
          <CardHeader className="p-2 sm:p-6">
            <div className="flex items-start justify-between w-full gap-2 sm:gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-2xl font-bold">
                  {proteinNames.main}
                </CardTitle>
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
                  <Badge variant="outline" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2.5 h-5 sm:h-6">
                    {proteinData.entry}
                  </Badge>
                  {proteinData.geneNamesPrimary && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 text-[10px] sm:text-xs px-1.5 sm:px-2.5 h-5 sm:h-6">
                      <Dna className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      {proteinData.geneNamesPrimary}
                    </Badge>
                  )}
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
          {proteinData.functionCc && (
            <CardContent className="pt-0 pb-8 sm:pb-12 px-3 sm:px-6">
              <div className="max-h-64 overflow-y-auto">
                <div className="text-sm leading-relaxed">
                  {formatUniprotText(proteinData.functionCc).map((statement) => (
                    <span key={statement.key}>
                      <span className="inline-block bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm rounded border border-border/30 mr-1 mb-1">
                        {statement.text}
                        {statement.pubmedIds.length > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-3 w-3 sm:h-4 sm:w-4 p-0 ml-0.5 sm:ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  onClick={() => {
                                    const pubmedUrl = statement.pubmedIds.length === 1 
                                      ? `https://pubmed.ncbi.nlm.nih.gov/${statement.pubmedIds[0]}/`
                                      : `https://pubmed.ncbi.nlm.nih.gov/?term=${statement.pubmedIds.join('%20OR%20')}`
                                    window.open(pubmedUrl, '_blank')
                                  }}
                                >
                                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {statement.pubmedIds.length === 1 
                                  ? `PubMed: ${statement.pubmedIds[0]}`
                                  : `PubMed: ${statement.pubmedIds.length} references`
                                }
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
        
        {/* Expand/Collapse Button */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full bg-background border-2 shadow-sm hover:shadow-md transition-all"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExpanded ? 'Hide details' : 'Show more details'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Collapsible Details Section */}
        {isExpanded && (
          <div className="p-0 sm:p-6 pt-6 sm:pt-8 border-t">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-2 sm:gap-4 space-y-3 sm:space-y-4 [&>*]:break-inside-avoid">
              
              {/* Subcellular Location Card */}
              {proteinData.subcellularLocation && (
                <Card className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Subcellular Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0">
                    <div className="text-sm leading-relaxed max-h-64 overflow-y-auto">
                      {formatUniprotText(proteinData.subcellularLocation).map((statement) => (
                        <span key={statement.key}>
                          <span className="inline-block bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm rounded border border-border/30 mr-1 mb-1">
                            {statement.text}
                            {statement.pubmedIds.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-3 w-3 sm:h-4 sm:w-4 p-0 ml-0.5 sm:ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                      onClick={() => {
                                        const pubmedUrl = statement.pubmedIds.length === 1 
                                          ? `https://pubmed.ncbi.nlm.nih.gov/${statement.pubmedIds[0]}/`
                                          : `https://pubmed.ncbi.nlm.nih.gov/?term=${statement.pubmedIds.join('%20OR%20')}`
                                        window.open(pubmedUrl, '_blank')
                                      }}
                                    >
                                      <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {statement.pubmedIds.length === 1 
                                      ? `PubMed: ${statement.pubmedIds[0]}`
                                      : `PubMed: ${statement.pubmedIds.length} references`
                                    }
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Disease Involvement Card */}
              {proteinData.involvementInDisease && (
                <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                      Disease Involvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0">
                    <div className="text-sm leading-relaxed max-h-64 overflow-y-auto">
                      {formatUniprotText(proteinData.involvementInDisease).map((statement) => (
                        <span key={statement.key}>
                          <span className="inline-block bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm rounded border border-border/30 mr-1 mb-1">
                            {statement.text}
                            {statement.pubmedIds.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-3 w-3 sm:h-4 sm:w-4 p-0 ml-0.5 sm:ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                      onClick={() => {
                                        const pubmedUrl = statement.pubmedIds.length === 1 
                                          ? `https://pubmed.ncbi.nlm.nih.gov/${statement.pubmedIds[0]}/`
                                          : `https://pubmed.ncbi.nlm.nih.gov/?term=${statement.pubmedIds.join('%20OR%20')}`
                                        window.open(pubmedUrl, '_blank')
                                      }}
                                    >
                                      <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {statement.pubmedIds.length === 1 
                                      ? `PubMed: ${statement.pubmedIds[0]}`
                                      : `PubMed: ${statement.pubmedIds.length} references`
                                    }
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Protein Family & EC Number Card */}
              {(proteinData.proteinFamilies || proteinData.ecNumber) && (
                <Card className="border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Network className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Classification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0 space-y-3 max-h-64 overflow-y-auto">
                    {proteinData.proteinFamilies && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Protein Family</p>
                        <p className="text-sm">{proteinData.proteinFamilies}</p>
                      </div>
                    )}
                    {proteinData.ecNumber && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">EC Number</p>
                        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                          {proteinData.ecNumber}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Keywords Card */}
              {proteinData.keywords && (
                <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Tag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0">
                    <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                      {proteinData.keywords.split(';').map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs border-orange-300 dark:border-orange-800 bg-white/70 dark:bg-gray-900/30 text-orange-800 dark:text-orange-200"
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
                <Card className="border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Microscope className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      Gene Ontology
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 gap-3">
                      {goTerms.process.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Biological Process</p>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-2">
                            {goTerms.process.map((term, index) => {
                              const match = term.match(/(.+?)\s*\((GO:\d+)\)$/)
                              if (match) {
                                const [, name, goId] = match
                                return (
                                  <p key={index} className="text-xs text-muted-foreground">
                                    • {name} (
                                    <a 
                                      href={`https://amigo.geneontology.org/amigo/term/${goId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                      {goId}
                                    </a>
                                    )
                                  </p>
                                )
                              }
                              return <p key={index} className="text-xs text-muted-foreground">• {term}</p>
                            })}
                          </div>
                        </div>
                      )}
                      {goTerms.function.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Molecular Function</p>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-2">
                            {goTerms.function.map((term, index) => {
                              const match = term.match(/(.+?)\s*\((GO:\d+)\)$/)
                              if (match) {
                                const [, name, goId] = match
                                return (
                                  <p key={index} className="text-xs text-muted-foreground">
                                    • {name} (
                                    <a 
                                      href={`https://amigo.geneontology.org/amigo/term/${goId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                      {goId}
                                    </a>
                                    )
                                  </p>
                                )
                              }
                              return <p key={index} className="text-xs text-muted-foreground">• {term}</p>
                            })}
                          </div>
                        </div>
                      )}
                      {goTerms.component.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Cellular Component</p>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-2">
                            {goTerms.component.map((term, index) => {
                              const match = term.match(/(.+?)\s*\((GO:\d+)\)$/)
                              if (match) {
                                const [, name, goId] = match
                                return (
                                  <p key={index} className="text-xs text-muted-foreground">
                                    • {name} (
                                    <a 
                                      href={`https://amigo.geneontology.org/amigo/term/${goId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                      {goId}
                                    </a>
                                    )
                                  </p>
                                )
                              }
                              return <p key={index} className="text-xs text-muted-foreground">• {term}</p>
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Post-translational Modifications Card */}
              {proteinData.postTranslationalModification && (
                <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Modifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0">
                    <div className="text-sm leading-relaxed max-h-64 overflow-y-auto">
                      {formatUniprotText(proteinData.postTranslationalModification).map((statement) => (
                        <span key={statement.key}>
                          <span className="inline-block bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm rounded border border-border/30 mr-1 mb-1">
                            {statement.text}
                            {statement.pubmedIds.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-3 w-3 sm:h-4 sm:w-4 p-0 ml-0.5 sm:ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                      onClick={() => {
                                        const pubmedUrl = statement.pubmedIds.length === 1 
                                          ? `https://pubmed.ncbi.nlm.nih.gov/${statement.pubmedIds[0]}/`
                                          : `https://pubmed.ncbi.nlm.nih.gov/?term=${statement.pubmedIds.join('%20OR%20')}`
                                        window.open(pubmedUrl, '_blank')
                                      }}
                                    >
                                      <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {statement.pubmedIds.length === 1 
                                      ? `PubMed: ${statement.pubmedIds[0]}`
                                      : `PubMed: ${statement.pubmedIds.length} references`
                                    }
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* External Resources Card */}
              <Card className="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
                    External Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
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
                </CardContent>
              </Card>

              {/* References Card */}
              {proteinData.pubmedId && (
                <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
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
                        className="h-7 text-xs"
                      >
                        View all
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0">
                    <div className="max-h-64 overflow-y-auto pr-2">
                      <div className="flex flex-wrap gap-1.5">
                        {proteinData.pubmedId.split(';').map((pmid, index) => (
                          <a
                            key={index}
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid.trim()}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
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
    </div>
  )
}