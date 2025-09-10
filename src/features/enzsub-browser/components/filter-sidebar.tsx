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
  onlyBetweenQueryProteins: { true: number; false: number }
  excludeSelfLoops: { true: number; false: number }
}

interface EnzSubFilterSidebarProps {
  filters: EnzSubFilters
  onFilterChange: (type: keyof EnzSubFilters, value: string | boolean) => void
  filterCounts: FilterCounts
  onClearFilters: () => void
  isMultiQuery?: boolean
}

export function EnzSubFilterSidebar({
  filters,
  onFilterChange,
  filterCounts,
  onClearFilters,
  isMultiQuery = false,
}: EnzSubFilterSidebarProps) {
  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length
    if (typeof value === 'boolean' && value) return count + 1
    return count
  }, 0)

  // Check if there's data to filter
  const hasData = Object.values(filterCounts).some(counts => 
    Object.values(counts).some(count => typeof count === 'number' && count > 0)
  )

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
          {/* Scope Filter - only show for multi-query */}
          {isMultiQuery && (
            <SidebarMenuItem>
              <SidebarMenuButton className="pointer-events-none" tooltip="Scope">
                <span>Scope</span>
              </SidebarMenuButton>
              <SidebarMenuSub className="space-y-1">
                <SidebarMenuSubItem>
                  <div className="flex items-center justify-between w-full">
                    <Label
                      htmlFor="enzsub-only-between-query-proteins"
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.onlyBetweenQueryProteins ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id="enzsub-only-between-query-proteins"
                        checked={filters.onlyBetweenQueryProteins}
                        onCheckedChange={(checked) => onFilterChange("onlyBetweenQueryProteins", !!checked)}
                        className={filters.onlyBetweenQueryProteins ? "border-sidebar-primary" : ""}
                      />
                      <span>Within query set only</span>
                    </Label>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">
                      {filterCounts.onlyBetweenQueryProteins.true}
                    </SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <div className="flex items-center justify-between w-full">
                    <Label
                      htmlFor="enzsub-exclude-self-loops"
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.excludeSelfLoops ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id="enzsub-exclude-self-loops"
                        checked={filters.excludeSelfLoops}
                        onCheckedChange={(checked) => onFilterChange("excludeSelfLoops", !!checked)}
                        className={filters.excludeSelfLoops ? "border-sidebar-primary" : ""}
                      />
                      <span>Exclude self-loops</span>
                    </Label>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">
                      {filterCounts.excludeSelfLoops.false}
                    </SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          
          {/* Sources */}
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

          {/* Residue Types */}
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

          {/* Modifications */}
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
      )}

    </>
  )
}