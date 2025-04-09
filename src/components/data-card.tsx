"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, Network, BarChart, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataCardProps<T extends string> {
  title: string
  children: React.ReactNode
  totalItems?: number
  viewMode: T
  onViewModeChange: (mode: T) => void
  onExport?: () => void
  className?: string
  headerActions?: React.ReactNode
}

export function DataCard<T extends string>({
  title,
  children,
  totalItems,
  viewMode,
  onViewModeChange,
  onExport,
  className,
  headerActions,
}: DataCardProps<T>) {
  return (
    <Card className={cn(
      "overflow-hidden",
      "border-2 border-muted shadow-sm hover:shadow-md",
      "bg-background",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-background">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {totalItems !== undefined && (
            <span className="text-sm text-muted-foreground">
              ({totalItems.toLocaleString()})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {headerActions}
          <div className="flex items-center space-x-1">
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant={viewMode === "table" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => onViewModeChange("table" as T)}
                      >
                        <Table className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Table view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant={viewMode === "network" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => onViewModeChange("network" as T)}
                        disabled={true}
                      >
                        <Network className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Network view - Coming Soon?</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant={viewMode === "chart" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => onViewModeChange("chart" as T)}  
                        disabled={true}
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Charts - Coming Soon?</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {onExport && (
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button variant="outline" size="icon" onClick={onExport}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
} 