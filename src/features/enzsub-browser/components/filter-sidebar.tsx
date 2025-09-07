"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SidebarMenuBadge, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { EnzSubFilters } from "@/features/enzsub-browser/types"
import { X } from "lucide-react"

interface FilterCounts {
  sources: Record<string, number>
  residueTypes: Record<string, number>
  modifications: Record<string, number>
}

interface EnzSubFilterSidebarProps {
  filters: EnzSubFilters
  onFilterChange: (type: keyof EnzSubFilters, value: string) => void
  filterCounts: FilterCounts
  onClearFilters: () => void
}

export function EnzSubFilterSidebar({
  filters,
  onFilterChange,
  filterCounts,
  onClearFilters,
}: EnzSubFilterSidebarProps) {
  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length
    return count
  }, 0)

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


      {/* Sources */}
      <SidebarMenu className="space-y-2">
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Data Sources">
            <span>Sources</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {Object.entries(filterCounts.sources)
              .filter(([, count]) => count > 0)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([source, count]) => (
                <SidebarMenuSubItem key={source}>
                  <div className="flex items-center justify-between w-full">
                    <Label
                      htmlFor={`source-${source}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.sources.includes(source) ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`source-${source}`}
                        checked={filters.sources.includes(source)}
                        onCheckedChange={() => onFilterChange("sources", source)}
                        className={filters.sources.includes(source) ? "border-sidebar-primary" : ""}
                      />
                      {source}
                    </Label>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Residue Types */}
      <SidebarMenu className="space-y-2">
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Residue Types">
            <span>Residue Types</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {Object.entries(filterCounts.residueTypes)
              .filter(([, count]) => count > 0)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([residueType, count]) => (
                <SidebarMenuSubItem key={residueType}>
                  <div className="flex items-center justify-between w-full">
                    <Label
                      htmlFor={`residue-${residueType}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.residueTypes.includes(residueType) ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`residue-${residueType}`}
                        checked={filters.residueTypes.includes(residueType)}
                        onCheckedChange={() => onFilterChange("residueTypes", residueType)}
                        className={filters.residueTypes.includes(residueType) ? "border-sidebar-primary" : ""}
                      />
                      {residueType}
                    </Label>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Modifications */}
      <SidebarMenu className="space-y-2">
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Modification Types">
            <span>Modifications</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {Object.entries(filterCounts.modifications)
              .filter(([, count]) => count > 0)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([modification, count]) => (
                <SidebarMenuSubItem key={modification}>
                  <div className="flex items-center justify-between w-full">
                    <Label
                      htmlFor={`modification-${modification}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.modifications.includes(modification) ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`modification-${modification}`}
                        checked={filters.modifications.includes(modification)}
                        onCheckedChange={() => onFilterChange("modifications", modification)}
                        className={filters.modifications.includes(modification) ? "border-sidebar-primary" : ""}
                      />
                      {modification}
                    </Label>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>

    </>
  )
}