"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SidebarMenuBadge, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { ComplexesFilters } from "@/features/complexes-browser/types"
import { X } from "lucide-react"

interface FilterCounts {
  sources: Record<string, number>
}

interface ComplexesFilterSidebarProps {
  filters: ComplexesFilters
  onFilterChange: (type: keyof ComplexesFilters, value: string) => void
  filterCounts: FilterCounts
  onClearFilters: () => void
}

export function ComplexesFilterSidebar({
  filters,
  onFilterChange,
  filterCounts,
  onClearFilters,
}: ComplexesFilterSidebarProps) {
  // Calculate active filter count
  const activeFilterCount = filters.sources.length

  // Check if there's data to filter
  const hasData = Object.values(filterCounts).some(counts => 
    Object.values(counts).some(count => typeof count === 'number' && count > 0)
  )

  // Get unique sources with counts
  const getSourcesWithCounts = () => {
    return Object.entries(filterCounts.sources)
      .filter(([, count]) => count > 0)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
  }

  return (
    <>
      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <div className="px-3 pb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="w-full justify-start gap-2"
          >
            <X className="h-4 w-4" />
            Clear all ({activeFilterCount})
          </Button>
        </div>
      )}

      {/* All Filters */}
      {hasData && (
        <SidebarMenu className="space-y-2">
          {/* Sources Filter */}
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Data Sources">
              <span>Data Sources</span>
            </SidebarMenuButton>
            <SidebarMenuSub className="space-y-1 max-h-[400px] overflow-y-auto">
              {getSourcesWithCounts().map((item) => (
                <SidebarMenuSubItem key={item.value}>
                  <div className="flex items-center justify-between w-full">
                    <Label
                      htmlFor={`source-${item.value}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.sources.includes(item.value) ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`source-${item.value}`}
                        checked={filters.sources.includes(item.value)}
                        onCheckedChange={() => onFilterChange('sources', item.value)}
                        className={filters.sources.includes(item.value) ? "border-sidebar-primary" : ""}
                      />
                      {item.value}
                    </Label>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{item.count}</SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  )
}