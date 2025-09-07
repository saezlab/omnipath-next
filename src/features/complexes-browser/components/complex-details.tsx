import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { ComplexEntry, ParsedComplex } from "../types"
import { EntityBadge } from "@/components/EntityBadge"
import { ReferencesDisplay } from "@/components/shared/references-display"
import { SourcesDisplay } from "@/components/shared/sources-display"

interface ComplexDetailsProps {
  selectedEntry: ComplexEntry | null
}

function parseComplexData(complex: ComplexEntry): ParsedComplex {
  const parsedComponents = complex.components?.split(/[;,]/).map(c => c.trim()).filter(Boolean) || []
  const parsedGeneSymbols = complex.componentsGenesymbols?.split(/[;,]/).map(g => g.trim()).filter(Boolean) || []
  const parsedSources = complex.sources?.split(/[;,]/).map(s => s.trim()).filter(Boolean) || []
  
  return {
    ...complex,
    parsedComponents,
    parsedGeneSymbols,
    parsedSources,
    componentCount: parsedGeneSymbols.length || parsedComponents.length
  }
}

function formatStoichiometry(stoichiometry: string | null) {
  if (!stoichiometry) return null
  const parts = stoichiometry.split(/[;,:]/).map(s => s.trim()).filter(Boolean)
  return parts
}

export function ComplexDetails({ selectedEntry }: ComplexDetailsProps) {
  if (!selectedEntry) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-primary/20 hover:border-primary/40 bg-card p-4 transition-all duration-200">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Select an entry to view details</p>
            <p className="text-xs text-muted-foreground">Complex details, sources and references will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  const parsedComplex = parseComplexData(selectedEntry)
  const stoichiometryParts = formatStoichiometry(selectedEntry.stoichiometry)

  return (
    <div className="p-4">
      <div className="rounded-lg border border-primary/20 hover:border-primary/40 bg-card p-4 transition-all duration-200">
        <div className="space-y-6">
          {/* Complex Name */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {selectedEntry.name || "Unnamed Complex"}
            </h3>
            <Badge variant="secondary" className="text-sm">
              {parsedComplex.componentCount} components
            </Badge>
          </div>

          {/* Components */}
          {(parsedComplex.parsedGeneSymbols.length > 0 || parsedComplex.parsedComponents.length > 0) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Components</h4>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: Math.max(parsedComplex.parsedGeneSymbols.length, parsedComplex.parsedComponents.length) }).map((_, index) => (
                  <EntityBadge 
                    key={index} 
                    geneSymbol={parsedComplex.parsedGeneSymbols[index] || ""} 
                    uniprotId={parsedComplex.parsedComponents[index] || ""} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stoichiometry */}
          {stoichiometryParts && stoichiometryParts.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Stoichiometry</h4>
              <div className="flex gap-2 flex-wrap">
                {stoichiometryParts.map((part, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {part}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External Identifiers */}
          {selectedEntry.identifiers && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">External Identifiers</h4>
              <div className="flex gap-2 flex-wrap">
                {selectedEntry.identifiers.split(/[;,]/).map(id => id.trim()).filter(Boolean).map((identifier, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-mono">
                    {identifier}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
      </div>
    </div>
  )
}