import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TableSkeletonProps {
  rows?: number
  variant?: "default" | "compact"
  showHeader?: boolean
  showToolbar?: boolean
}

export function TableSkeleton({ 
  rows = 8, 
  variant = "default",
  showHeader = true,
  showToolbar = true 
}: TableSkeletonProps) {
  const isCompact = variant === "compact"
  
  return (
    <div className="w-full max-w-full flex flex-col animate-pulse">
      <div className={cn(
        "relative w-full max-w-full overflow-hidden border border-primary/20 shadow-sm bg-background rounded-lg flex flex-col",
        isCompact ? "h-full" : ""
      )}>
        
        {/* Export Button Skeleton */}
        {showToolbar && (
          <div className="absolute top-2 right-4 z-50">
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        )}

        {/* Header/Toolbar Skeleton */}
        {showHeader && (
          <div className="flex flex-row items-center justify-start space-y-0 p-4 bg-background flex-shrink-0 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 pr-12">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className={cn(
          "overflow-x-auto",
          isCompact ? "flex-1 overflow-y-auto relative" : "overflow-y-auto max-h-[400px]"
        )}>
          {/* Table */}
          <div className="w-full min-w-max">
            {/* Table Header Skeleton */}
            <div className={cn(
              "border-b border-primary/20 bg-background",
              isCompact ? "sticky top-0 z-20 shadow-sm" : ""
            )}>
              <div className="flex items-center h-12 px-2">
                {/* Dynamic header columns with varying widths */}
                <div className="flex items-center gap-4 w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>

            {/* Table Body Skeleton */}
            <div className="divide-y divide-primary/20">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center px-2 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 w-full">
                    {/* Varying content widths for realism */}
                    <Skeleton className={cn("h-3", getRandomWidth(rowIndex, 0))} />
                    <Skeleton className={cn("h-3", getRandomWidth(rowIndex, 1))} />
                    <Skeleton className={cn("h-3", getRandomWidth(rowIndex, 2))} />
                    <Skeleton className={cn("h-3", getRandomWidth(rowIndex, 3))} />
                    <Skeleton className={cn("h-3", getRandomWidth(rowIndex, 4))} />
                    <Skeleton className={cn("h-3", getRandomWidth(rowIndex, 5))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infinite scroll indicator skeleton */}
        {isCompact && (
          <div className="flex justify-center py-8">
            <Skeleton className="h-4 w-32" />
          </div>
        )}
      </div>

      {/* Pagination skeleton for non-infinite scroll */}
      {!isCompact && (
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to generate realistic varying widths
function getRandomWidth(row: number, col: number): string {
  const widths = ["w-16", "w-20", "w-24", "w-28", "w-32", "w-36", "w-40", "w-44", "w-48"]
  // Use row and col to create deterministic but varied widths
  const index = (row * 6 + col) % widths.length
  return widths[index]
} 