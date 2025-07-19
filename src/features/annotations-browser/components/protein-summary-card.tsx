import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"

interface ProteinSummaryCardProps {
  proteinData?: GetProteinInformationResponse
  isLoading?: boolean
  defaultExpanded?: boolean
}

export function ProteinSummaryCard({ proteinData, isLoading, defaultExpanded = true }: ProteinSummaryCardProps) {
  const formatMass = (mass: number | null) => {
    if (!mass) return null
    return `${(mass / 1000).toFixed(1)} kDa`
  }

  const renderProteinHeader = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-1">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-3 bg-gray-200 rounded w-64"></div>
        </div>
      )
    }

    if (!proteinData) {
      return (
        <div className="text-muted-foreground text-sm">
          No protein information available
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-0.5">
        <div className="font-semibold text-lg">
          {proteinData.proteinNames || 'Unknown Protein'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

  const renderAccordionContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      )
    }

    if (!proteinData) {
      return (
        <div className="text-muted-foreground">
          No additional protein information available for this query.
        </div>
      )
    }

    return (
      <div className="space-y-4">
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
      </div>
    )
  }

  return (
      <Accordion
        type="single"
        collapsible
        className="w-full border-2 rounded-lg"
        defaultValue={defaultExpanded ? "protein-info" : undefined}
      >
        <AccordionItem value="protein-info" className="">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            {renderProteinHeader()}
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            {renderAccordionContent()}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
  )
}