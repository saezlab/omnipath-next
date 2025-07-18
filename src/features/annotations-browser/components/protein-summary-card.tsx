import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { Info, Hash, Weight } from "lucide-react"

interface ProteinSummaryCardProps {
  proteinData?: GetProteinInformationResponse
  isLoading?: boolean
}

export function ProteinSummaryCard({ proteinData, isLoading }: ProteinSummaryCardProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Protein Information Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!proteinData) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Protein Information Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            No protein information available for this query.
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatMass = (mass: number | null) => {
    if (!mass) return null
    return `${(mass / 1000).toFixed(1)} kDa`
  }

  return (
    <Card className="mb-6">
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-lg">{proteinData.proteinNames}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>UniProt: {proteinData.entry}</span>
              {proteinData.geneNamesPrimary && (
                <>
                  <span>•</span>
                  <span>Gene: {proteinData.geneNamesPrimary}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {proteinData.length && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {proteinData.length} aa
              </Badge>
            )}
            {proteinData.mass && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Weight className="h-3 w-3" />
                {formatMass(proteinData.mass)}
              </Badge>
            )}
            {proteinData.organismId && (
              <Badge variant="outline">
                {proteinData.organismId}
              </Badge>
            )}
          </div>
        </div>

        {proteinData.functionCc && (
          <div>
            <h4 className="font-medium mb-2">Function</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {proteinData.functionCc}
            </p>
          </div>
        )}

        {proteinData.subcellularLocation && (
          <div>
            <h4 className="font-medium mb-2">Subcellular Location</h4>
            <p className="text-sm text-muted-foreground">
              {proteinData.subcellularLocation}
            </p>
          </div>
        )}

        {proteinData.proteinFamilies && (
          <div>
            <h4 className="font-medium mb-2">Protein Family</h4>
            <p className="text-sm text-muted-foreground">
              {proteinData.proteinFamilies}
            </p>
          </div>
        )}

        {proteinData.keywords && (
          <div>
            <h4 className="font-medium mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {proteinData.keywords.split(';').slice(0, 8).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 