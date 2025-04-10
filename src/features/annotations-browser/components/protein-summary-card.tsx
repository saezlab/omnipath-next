import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"

export function ProteinSummaryCard() {
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
          Coming soon: A concise summary of relevant protein information will be displayed here.
        </div>
      </CardContent>
    </Card>
  )
} 