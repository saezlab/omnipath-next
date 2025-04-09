import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, ArrowRight, Minus } from "lucide-react"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { cn } from "@/lib/utils"

interface InteractionDetailsProps {
  selectedInteraction: SearchProteinNeighborsResponse['interactions'][number] | null
}

export function InteractionDetails({ selectedInteraction }: InteractionDetailsProps) {
  const getInteractionColor = () => {
    if (selectedInteraction?.consensusStimulation) return "text-green-500"
    if (selectedInteraction?.consensusInhibition) return "text-red-500"
    return "text-orange-500"
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="rounded-lg border bg-card p-4">
          {selectedInteraction ? (
            <div className="space-y-6">
              {/* Visual Interaction Representation */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center">
                  <Badge variant="outline" className="text-sm">
                    {selectedInteraction.sourceGenesymbol || selectedInteraction.source}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{selectedInteraction.entityTypeSource}</p>
                </div>
                
                <div className={cn("flex items-center", getInteractionColor())}>
                  {selectedInteraction.isDirected ? (
                    <ArrowRight className="h-6 w-6" />
                  ) : (
                    <Minus className="h-6 w-6" />
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <Badge variant="outline" className="text-sm">
                    {selectedInteraction.targetGenesymbol || selectedInteraction.target}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{selectedInteraction.entityTypeTarget}</p>
                </div>
              </div>

              {/* Interaction Type Badge */}
              <div className="flex justify-center">
                <Badge variant="secondary" className={cn("text-sm", getInteractionColor())}>
                  {selectedInteraction.type}
                </Badge>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Taxonomy IDs</p>
                  <p>{selectedInteraction.ncbiTaxIdSource} → {selectedInteraction.ncbiTaxIdTarget}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Curation Effort</p>
                  <p>{selectedInteraction.curationEffort}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Select an entry to view details</p>
              <p className="text-xs text-muted-foreground">Detailed information will appear here</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="references" className="rounded-lg border bg-card p-4">
          {selectedInteraction ? (
            <div className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

