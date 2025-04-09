"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterCardProps {
  title: string
  children: React.ReactNode
  activeFilterCount?: number
  onClearFilters?: () => void
  className?: string
  showMobileFilters?: boolean
}

export function FilterCard({
  title,
  children,
  activeFilterCount = 0,
  onClearFilters,
  className,
  showMobileFilters = false,
}: FilterCardProps) {
  return (
    <Card 
      className={cn(
        "w-full md:w-64 lg:w-72 shrink-0 transition-all duration-200",
        "border-2 border-muted shadow-sm hover:shadow-md",
        "bg-background",
        showMobileFilters ? "block" : "hidden md:block",
        className
      )}
    >
      <CardHeader className="sticky top-24 z-10 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          {activeFilterCount > 0 && onClearFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters} 
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear all ({activeFilterCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {children}
      </CardContent>
    </Card>
  )
} 