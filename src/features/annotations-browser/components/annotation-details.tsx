"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type React from "react"

interface Annotation {
  uniprot: string | null
  genesymbol: string | null
  entityType: string | null
  source: string | null
  label: string | null
  value: string | null
  recordId: number | null
}

interface AnnotationDetailsProps {
  selectedAnnotation: Annotation | null
  getCategoryIcon: (label: string | null) => React.ReactNode
  getCategoryColor: (label: string | null) => string
}

export function AnnotationDetails({
  selectedAnnotation,
  getCategoryIcon,
  getCategoryColor,
}: AnnotationDetailsProps) {
  if (!selectedAnnotation) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(selectedAnnotation.label)}>
              <div className="flex items-center gap-1">
                {getCategoryIcon(selectedAnnotation.label)}
                {selectedAnnotation.label || "Unknown"}
              </div>
            </Badge>
            <Badge variant="outline">{selectedAnnotation.source || "Unknown"}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Gene Symbol</h4>
              <p className="mt-1">{selectedAnnotation.genesymbol || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">UniProt ID</h4>
              <p className="mt-1">{selectedAnnotation.uniprot || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground">Value</h4>
              <p className="mt-1">{selectedAnnotation.value || "N/A"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

