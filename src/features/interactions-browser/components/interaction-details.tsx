import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, FileText } from "lucide-react"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
interface InteractionDetailsProps {
  selectedInteraction: SearchProteinNeighborsResponse['interactions'][number] | null
}

export function InteractionDetails({ selectedInteraction }: InteractionDetailsProps) {
  return (
    <div className="p-4">
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="references">References</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="rounded-lg border bg-card p-4">
        {selectedInteraction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Source</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p>{selectedInteraction.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gene Symbol</p>
                    <p>{selectedInteraction.sourceGenesymbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taxonomy ID</p>
                    <p>{selectedInteraction.ncbiTaxIdSource}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity Type</p>
                    <p className="capitalize">{selectedInteraction.entityTypeSource}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Target</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p>{selectedInteraction.target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gene Symbol</p>
                    <p>{selectedInteraction.targetGenesymbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taxonomy ID</p>
                    <p>{selectedInteraction.ncbiTaxIdTarget}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity Type</p>
                    <p className="capitalize">{selectedInteraction.entityTypeTarget}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Interaction Properties</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p>{selectedInteraction.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Curation Effort</p>
                  <p>{selectedInteraction.curationEffort}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Is Directed</p>
                  <p>{selectedInteraction.isDirected ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Is Stimulation</p>
                  <p>{selectedInteraction.isStimulation ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Is Inhibition</p>
                  <p>{selectedInteraction.isInhibition ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consensus Direction</p>
                  <p>{selectedInteraction.consensusDirection ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consensus Stimulation</p>
                  <p>{selectedInteraction.consensusStimulation ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consensus Inhibition</p>
                  <p>{selectedInteraction.consensusInhibition ? "Yes" : "No"}</p>
                </div>
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
              <div className="text-sm space-y-3">
                {selectedInteraction.references.split(";").map((ref: string, index: number) => {
                  // Extract the source and PubMed ID
                  const [source, pubmedId] = ref.split(":")

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-muted-foreground min-w-[2rem]">[{index + 1}]</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source}
                          </Badge>
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {pubmedId}
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
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

