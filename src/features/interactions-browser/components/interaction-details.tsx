import { Badge } from "@/components/ui/badge"
import { FileText, Search, ArrowRight, Minus } from "lucide-react"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { EntityBadge } from "@/components/EntityBadge"
import { cn } from "@/lib/utils"
import { getInteractionColor, getInteractionColorMeaning } from "@/features/interactions-browser/constants/interaction-colors"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InteractionDetailsProps {
  selectedInteraction: SearchProteinNeighborsResponse['interactions'][number] | null
}

export function InteractionDetails({ selectedInteraction }: InteractionDetailsProps) {

  return (
    <div className="p-4">
      <div className="rounded-lg border border-primary/20 hover:border-primary/40 bg-card p-4 transition-all duration-200">
        {selectedInteraction ? (
          <div className="space-y-4">
            {/* Interaction Type Indicator */}
            <div className="flex items-center justify-center gap-4 py-4">
              <EntityBadge 
                geneSymbol={selectedInteraction.sourceGenesymbol || ''} 
                uniprotId={selectedInteraction.source || ''} 
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("flex items-center", getInteractionColor(selectedInteraction))}>
                      {selectedInteraction.isDirected ? (
                        <ArrowRight className="h-6 w-6" />
                      ) : (
                        <Minus className="h-6 w-6" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getInteractionColorMeaning(getInteractionColor(selectedInteraction))}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <EntityBadge 
                geneSymbol={selectedInteraction.targetGenesymbol || ''} 
                uniprotId={selectedInteraction.target || ''} 
              />
            </div>

            {/* Interaction Type Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className={cn("text-sm", getInteractionColor(selectedInteraction))}>
                {selectedInteraction.type}
              </Badge>
            </div>

            <h4 className="text-sm font-semibold text-foreground">References</h4>
            {selectedInteraction.references ? (
              <div className="text-sm space-y-4">
                {Object.entries(
                  selectedInteraction.references.split(";").reduce((acc: Record<string, string[]>, ref: string) => {
                    const [source, pubmedId] = ref.split(":")
                    if (!acc[pubmedId]) {
                      acc[pubmedId] = []
                    }
                    acc[pubmedId].push(source)
                    return acc
                  }, {})
                ).map(([pubmedId, sources], index) => (
                  <div key={pubmedId} className="flex items-start gap-3">
                    <span className="text-muted-foreground min-w-[2rem]">[{index + 1}]</span>
                    <div className="space-y-2">
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        PMID: {pubmedId}
                      </a>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((source) => (
                          <Badge key={source} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No references available for this interaction</p>
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
      </div>
    </div>
  )
}

