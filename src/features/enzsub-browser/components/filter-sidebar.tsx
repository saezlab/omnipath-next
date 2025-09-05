"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  onFilterChange: (type: keyof EnzSubFilters, value: string | number | boolean | null) => void
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
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'searchTerm' && !value) return count
    if (key === 'enzymeSearch' && !value) return count
    if (key === 'substrateSearch' && !value) return count
    if (key === 'curationEffortMin' && value === null) return count
    if (key === 'hasResidueOffset' && value === null) return count
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

      {/* Search Controls */}
      <SidebarMenu className="space-y-2">
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="General Search">
            <span>Search</span>
          </SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <Input
                type="text"
                placeholder="Search all fields..."
                value={filters.searchTerm}
                onChange={(e) => onFilterChange("searchTerm", e.target.value)}
                className={`w-full ${filters.searchTerm ? "border-sidebar-primary" : ""}`}
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Enzyme Search">
            <span>Enzyme Search</span>
          </SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <Input
                type="text"
                placeholder="Search enzymes..."
                value={filters.enzymeSearch}
                onChange={(e) => onFilterChange("enzymeSearch", e.target.value)}
                className={`w-full ${filters.enzymeSearch ? "border-sidebar-primary" : ""}`}
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Substrate Search">
            <span>Substrate Search</span>
          </SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <Input
                type="text"
                placeholder="Search substrates..."
                value={filters.substrateSearch}
                onChange={(e) => onFilterChange("substrateSearch", e.target.value)}
                className={`w-full ${filters.substrateSearch ? "border-sidebar-primary" : ""}`}
              />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Sources */}
      <SidebarMenu className="space-y-2">
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Data Sources">
            <span>Sources</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {Object.entries(filterCounts.sources)
              .filter(([_, count]) => count > 0)
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
                    <SidebarMenuBadge>{count}</SidebarMenuBadge>
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
              .filter(([_, count]) => count > 0)
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
                    <SidebarMenuBadge>{count}</SidebarMenuBadge>
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
              .filter(([_, count]) => count > 0)
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
                    <SidebarMenuBadge>{count}</SidebarMenuBadge>
                  </div>
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Additional Filters */}
      <SidebarMenu className="space-y-2">
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Additional Filters">
            <span>Additional Filters</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-2">
            <SidebarMenuSubItem>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has-residue-offset"
                  checked={filters.hasResidueOffset === true}
                  onCheckedChange={(checked) => 
                    onFilterChange("hasResidueOffset", checked ? true : null)
                  }
                  className={filters.hasResidueOffset === true ? "border-sidebar-primary" : ""}
                />
                <Label
                  htmlFor="has-residue-offset"
                  className={`text-sm font-normal cursor-pointer ${
                    filters.hasResidueOffset === true ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  Has Position Info
                </Label>
              </div>
            </SidebarMenuSubItem>

            <SidebarMenuSubItem>
              <div className="space-y-2">
                <Label className="text-sm font-normal">Min Curation Effort</Label>
                <Select 
                  value={filters.curationEffortMin?.toString() || "any"} 
                  onValueChange={(value) => 
                    onFilterChange("curationEffortMin", value === "any" ? null : parseInt(value))
                  }
                >
                  <SelectTrigger className={`w-full ${filters.curationEffortMin !== null ? "border-sidebar-primary" : ""}`}>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}