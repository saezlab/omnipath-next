"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"

interface DataCardProps {
  title: string
  children: React.ReactNode
  totalItems?: number
  onExport?: () => void
  className?: string
  headerActions?: React.ReactNode
}

export function DataCard({
  title,
  children,
  totalItems,
  onExport,
  className,
  headerActions,
}: DataCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden",
      "border-2 border-muted shadow-sm hover:shadow-md",
      "bg-background",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-4 bg-background">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          {totalItems !== undefined && (
            <span className="text-sm text-muted-foreground">
              ({totalItems.toLocaleString()})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {onExport && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
} 