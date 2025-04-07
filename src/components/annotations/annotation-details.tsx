"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink } from "lucide-react"

interface AnnotationDetailsProps {
  selectedAnnotation: any | null
  getCategoryIcon: (category: string) => React.ReactNode
  getCategoryColor: (category: string) => string
}

export function AnnotationDetails({ selectedAnnotation, getCategoryIcon, getCategoryColor }: AnnotationDetailsProps) {
  if (!selectedAnnotation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annotation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Select an annotation to view its details.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            Annotation Details
            <Badge className={`flex items-center gap-1 ${getCategoryColor(selectedAnnotation.category)}`}>
              {getCategoryIcon(selectedAnnotation.category)}
              <span className="capitalize">{selectedAnnotation.category}</span>
            </Badge>
          </div>
          <Badge variant="outline">ID: {selectedAnnotation.annotation_id}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main annotation value */}
        <div>
          <h4 className="text-sm font-medium mb-1">Value</h4>
          <p className="text-base">
            {selectedAnnotation.term_name ||
              selectedAnnotation.location_name ||
              selectedAnnotation.value ||
              selectedAnnotation.annotation_value ||
              "N/A"}
          </p>
          {selectedAnnotation.term_id && <p className="text-sm text-muted-foreground">{selectedAnnotation.term_id}</p>}
          {selectedAnnotation.location_term_id && (
            <p className="text-sm text-muted-foreground">{selectedAnnotation.location_term_id}</p>
          )}
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category and subcategory */}
          <div>
            <h4 className="text-sm font-medium mb-1">Classification</h4>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Category:</span> {selectedAnnotation.category}
              </p>
              {selectedAnnotation.subcategory && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Subcategory:</span> {selectedAnnotation.subcategory}
                </p>
              )}
              {selectedAnnotation.scope && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Scope:</span> {selectedAnnotation.scope}
                </p>
              )}
              {selectedAnnotation.aspect && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Aspect:</span> {selectedAnnotation.aspect}
                </p>
              )}
            </div>
          </div>

          {/* Properties */}
          {(selectedAnnotation.is_secreted !== undefined ||
            selectedAnnotation.is_plasma_membrane !== undefined ||
            selectedAnnotation.is_transmembrane !== undefined) && (
            <div>
              <h4 className="text-sm font-medium mb-1">Properties</h4>
              <div className="space-y-1">
                {selectedAnnotation.is_secreted !== undefined && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Secreted:</span>{" "}
                    {selectedAnnotation.is_secreted ? "Yes" : "No"}
                  </p>
                )}
                {selectedAnnotation.is_plasma_membrane !== undefined && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Plasma Membrane:</span>{" "}
                    {selectedAnnotation.is_plasma_membrane ? "Yes" : "No"}
                  </p>
                )}
                {selectedAnnotation.is_transmembrane !== undefined && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Transmembrane:</span>{" "}
                    {selectedAnnotation.is_transmembrane ? "Yes" : "No"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Confidence */}
          {selectedAnnotation.consensus_score && (
            <div>
              <h4 className="text-sm font-medium mb-1">Confidence</h4>
              <p className="text-sm">
                <span className="text-muted-foreground">Consensus Score:</span>{" "}
                {selectedAnnotation.consensus_score.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Sources and References */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sources */}
          <div>
            <h4 className="text-sm font-medium mb-1">Data Sources</h4>
            <div className="flex flex-wrap gap-1">
              {selectedAnnotation.sources.map((source: string) => (
                <Badge key={source} variant="outline">
                  {source}
                </Badge>
              ))}
            </div>
          </div>

          {/* References */}
          {selectedAnnotation.references && selectedAnnotation.references.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">References</h4>
              <ul className="space-y-1">
                {selectedAnnotation.references.map((ref: string) => (
                  <li key={ref} className="text-sm flex items-center gap-1">
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${ref.replace("PMID:", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {ref} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

