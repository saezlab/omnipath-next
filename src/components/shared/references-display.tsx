import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface ReferencesDisplayProps {
  references: string | null
  className?: string
}

export function ReferencesDisplay({ references, className }: ReferencesDisplayProps) {
  if (!references) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No references available</p>
      </div>
    )
  }

  // Parse references - handle both "source:pubmedId" and just "pubmedId" formats
  const referenceGroups = references
    .split(";")
    .reduce((acc: Record<string, string[]>, ref: string) => {
      const trimmedRef = ref.trim()
      if (!trimmedRef) return acc
      
      if (trimmedRef.includes(":")) {
        // Format: "source:pubmedId"
        const [source, pubmedId] = trimmedRef.split(":")
        if (pubmedId && source && pubmedId.trim() && source.trim()) {
          const cleanPubmedId = pubmedId.trim()
          const cleanSource = source.trim()
          if (!acc[cleanPubmedId]) {
            acc[cleanPubmedId] = []
          }
          if (!acc[cleanPubmedId].includes(cleanSource)) {
            acc[cleanPubmedId].push(cleanSource)
          }
        }
      } else {
        // Format: just "pubmedId" (for complexes)
        const pubmedId = trimmedRef
        if (pubmedId && /^\d+$/.test(pubmedId)) { // Check if it's just numbers
          if (!acc[pubmedId]) {
            acc[pubmedId] = []
          }
        }
      }
      return acc
    }, {})

  const hasValidReferences = Object.keys(referenceGroups).length > 0

  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-foreground mb-3">References</h4>
      {hasValidReferences ? (
        <div className="text-sm space-y-4">
          {Object.entries(referenceGroups).map(([pubmedId, sources], index) => (
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
                {sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Raw reference data:</p>
          <div className="bg-muted p-2 rounded text-xs font-mono break-words">
            {references.substring(0, 500)}{references.length > 500 ? '...' : ''}
          </div>
        </div>
      )}
    </div>
  )
}