"use client"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink } from "lucide-react"

interface EntityCardProps {
  entity: {
    entity_id: string
    entity_type: string
    primary_identifier: string
    secondary_identifier: string
    name: string
    ncbi_tax_id: string
  }
  taxonomyLabel: string
}

export function EntityCard({ entity, taxonomyLabel }: EntityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span className="text-xl">{entity.secondary_identifier}</span>
            <Badge variant="outline" className="ml-2">
              {entity.entity_type}
            </Badge>
          </div>
          <Badge variant="secondary">{taxonomyLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-medium">{entity.name}</h3>
          <p className="text-sm text-muted-foreground">
            Primary ID: {entity.primary_identifier} | Entity ID: {entity.entity_id}
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">External Resources</h4>
            <div className="space-y-1">
              {entity.entity_type === "Protein" && (
                <>
                  <p className="text-sm">
                    <a
                      href={`https://www.uniprot.org/uniprot/${entity.primary_identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      UniProt <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="text-sm">
                    <a
                      href={`https://www.ebi.ac.uk/interpro/protein/UniProt/${entity.primary_identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      InterPro <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </>
              )}
              {entity.entity_type === "Gene" && (
                <>
                  <p className="text-sm">
                    <a
                      href={`https://www.ensembl.org/id/${entity.primary_identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Ensembl <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="text-sm">
                    <a
                      href={`https://www.ncbi.nlm.nih.gov/gene/?term=${entity.secondary_identifier}%5BGene%20Name%5D%20AND%20${entity.ncbi_tax_id}%5BTaxonomy%20ID%5D`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      NCBI Gene <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </>
              )}
              <p className="text-sm">
                <a
                  href={`https://www.ebi.ac.uk/QuickGO/search/${entity.secondary_identifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  QuickGO <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-sm">
                <a
                  href={`https://www.proteinatlas.org/search/${entity.secondary_identifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Human Protein Atlas <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

