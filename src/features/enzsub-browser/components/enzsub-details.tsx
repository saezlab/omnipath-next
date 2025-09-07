import { Badge } from "@/components/ui/badge"
import { Search, ArrowRight } from "lucide-react"
import { EnzSubEntry } from "../types"
import { EntityBadge } from "@/components/EntityBadge"
import { ReferencesDisplay } from "@/components/shared/references-display"
import { SourcesDisplay } from "@/components/shared/sources-display"

interface EnzSubDetailsProps {
  selectedEntry: EnzSubEntry | null
}

function formatResidue(residueType: string | null, residueOffset: number | null): string {
  if (!residueType) return "-"
  if (residueOffset !== null) {
    return `${residueType}${residueOffset}`
  }
  return residueType
}

export function EnzSubDetails({ selectedEntry }: EnzSubDetailsProps) {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-primary/20 hover:border-primary/40 bg-card p-4 transition-all duration-200">
        {selectedEntry ? (
          <div className="space-y-6">
            {/* Enzyme-Substrate Relationship Display */}
            <div className="flex items-center justify-center gap-6 py-2">
              <EntityBadge 
                geneSymbol={selectedEntry.enzymeGenesymbol || ''} 
                uniprotId={selectedEntry.enzyme || ''} 
              />
              
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <ArrowRight className="h-6 w-6" />
              </div>

              <EntityBadge 
                geneSymbol={selectedEntry.substrateGenesymbol || ''} 
                uniprotId={selectedEntry.substrate || ''} 
              />
            </div>

            {/* Modification and Residue Information */}
            <div className="flex justify-center gap-4">
              {selectedEntry.modification && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Modification</p>
                  <Badge variant="outline" className="text-sm">
                    {selectedEntry.modification}
                  </Badge>
                </div>
              )}
              
              {(selectedEntry.residueType || selectedEntry.residueOffset !== null) && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Residue</p>
                  <Badge variant="secondary" className="text-sm">
                    {formatResidue(selectedEntry.residueType, selectedEntry.residueOffset)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Sources Section */}
            {selectedEntry.sources && (
              <div className="border-t pt-4">
                <SourcesDisplay sources={selectedEntry.sources} />
              </div>
            )}

            {/* References Section */}
            <div className="border-t pt-4">
              <ReferencesDisplay references={selectedEntry.references} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Select an entry to view details</p>
            <p className="text-xs text-muted-foreground">Sources and references will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}