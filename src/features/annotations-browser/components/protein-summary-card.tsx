import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface ProteinSummaryCardProps {
  proteinData?: GetProteinInformationResponse
  isLoading?: boolean
  defaultExpanded?: boolean
}

export function ProteinSummaryCard({ proteinData, isLoading, defaultExpanded = true }: ProteinSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const formatMass = (mass: number | null) => {
    if (!mass) return null
    return `${(mass / 1000).toFixed(1)} kDa`
  }

  const renderProteinHeader = () => {
    if (!proteinData) {
      return (
        <div className="text-muted-foreground text-sm">
          No protein information available
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="font-semibold text-base">
          {proteinData.proteinNames || 'Unknown Protein'}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>UniProt: {proteinData.entry}</span>
          {proteinData.geneNamesPrimary && (
            <>
              <span>•</span>
              <span>Gene: {proteinData.geneNamesPrimary}</span>
            </>
          )}
          {proteinData.length && (
            <>
              <span>•</span>
              <span>{proteinData.length} aa</span>
            </>
          )}
          {proteinData.mass && (
            <>
              <span>•</span>
              <span>{formatMass(proteinData.mass)}</span>
            </>
          )}
          {proteinData.organismId && (
            <>
              <span>•</span>
              <span>{proteinData.organismId}</span>
            </>
          )}
        </div>
      </div>
    )
  }
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="animate-pulse space-y-2">
              <div className="h-5 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  if (!proteinData) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {renderProteinHeader()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="text-muted-foreground">
              No additional protein information available for this query.
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {renderProteinHeader()}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-6 w-6"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">

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
      )}
    </Card>
  )
} 