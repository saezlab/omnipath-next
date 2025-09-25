"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SidebarMenuBadge, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { IntercellFilters } from "@/features/intercell-browser/types"
import { X } from "lucide-react"

interface FilterCounts {
  aspects: Record<string, number>
  sources: Record<string, number>
  databases: Record<string, number>
  scopes: Record<string, number>
  parents: Record<string, number>
  transmitter: { true: number; false: number }
  receiver: { true: number; false: number }
  secreted: { true: number; false: number }
  plasmaMembraneTransmembrane: { true: number; false: number }
  plasmaMembranePeripheral: { true: number; false: number }
}

interface IntercellFilterSidebarProps {
  filters: IntercellFilters
  onFilterChange: (type: keyof IntercellFilters, value: string | boolean | null) => void
  filterCounts: FilterCounts
  onClearFilters: () => void
}

export function IntercellFilterSidebar({
  filters,
  onFilterChange,
  filterCounts,
  onClearFilters,
}: IntercellFilterSidebarProps) {
  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length
    if (value !== null) return count + 1
    return count
  }, 0)

  // Check if there's data to filter
  const hasData = Object.values(filterCounts).some(counts => {
    if (typeof counts === 'object' && counts !== null) {
      return Object.values(counts).some((count: unknown) => (typeof count === 'number' ? count > 0 : false))
    }
    return false
  })

  // Helper to get items with counts for string array filters
  const getFilterItemsWithCounts = (
    filterKey: keyof FilterCounts
  ) => {
    const counts = filterCounts[filterKey] as Record<string, number>
    return Object.entries(counts)
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
        {/* Aspect Filter */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Aspect">
            <span>Aspect</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {getFilterItemsWithCounts('aspects').map((item) => (
              <SidebarMenuSubItem key={item.value}>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor={`aspect-${item.value}`}
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.aspects.includes(item.value) ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`aspect-${item.value}`}
                      checked={filters.aspects.includes(item.value)}
                      onCheckedChange={() => onFilterChange('aspects', item.value)}
                      className={filters.aspects.includes(item.value) ? "border-sidebar-primary" : ""}
                    />
                    {item.value}
                  </Label>
                  <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{item.count}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>

        {/* Parent Filter */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Parent">
            <span>Parent</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {getFilterItemsWithCounts('parents').map((item) => (
              <SidebarMenuSubItem key={item.value}>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor={`parent-${item.value}`}
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.parents.includes(item.value) ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`parent-${item.value}`}
                      checked={filters.parents.includes(item.value)}
                      onCheckedChange={() => onFilterChange('parents', item.value)}
                      className={filters.parents.includes(item.value) ? "border-sidebar-primary" : ""}
                    />
                    {item.value}
                  </Label>
                  <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{item.count}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>

        {/* Source Filter */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Source">
            <span>Source</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {getFilterItemsWithCounts('sources').map((item) => (
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

        {/* Database Filter */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Database">
            <span>Database</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {getFilterItemsWithCounts('databases').map((item) => (
              <SidebarMenuSubItem key={item.value}>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor={`database-${item.value}`}
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.databases.includes(item.value) ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`database-${item.value}`}
                      checked={filters.databases.includes(item.value)}
                      onCheckedChange={() => onFilterChange('databases', item.value)}
                      className={filters.databases.includes(item.value) ? "border-sidebar-primary" : ""}
                    />
                    {item.value}
                  </Label>
                  <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{item.count}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>

        {/* Scope Filter */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Scope">
            <span>Scope</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            {getFilterItemsWithCounts('scopes').map((item) => (
              <SidebarMenuSubItem key={item.value}>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor={`scope-${item.value}`}
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.scopes.includes(item.value) ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`scope-${item.value}`}
                      checked={filters.scopes.includes(item.value)}
                      onCheckedChange={() => onFilterChange('scopes', item.value)}
                      className={filters.scopes.includes(item.value) ? "border-sidebar-primary" : ""}
                    />
                    {item.value}
                  </Label>
                  <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{item.count}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>

        {/* Causality Filters */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Causality">
            <span>Causality</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            <SidebarMenuSubItem>
              <div className="flex items-center justify-between w-full">
                <Label
                  htmlFor="transmitter-filter"
                  className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                    filters.transmitter === true ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  <Checkbox
                    id="transmitter-filter"
                    checked={filters.transmitter === true}
                    onCheckedChange={() => onFilterChange('transmitter', filters.transmitter === true ? null : true)}
                    className={filters.transmitter === true ? "border-sidebar-primary" : ""}
                  />
                  Transmitter
                </Label>
                <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{filterCounts.transmitter.true}</SidebarMenuBadge>
              </div>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <div className="flex items-center justify-between w-full">
                <Label
                  htmlFor="receiver-filter"
                  className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                    filters.receiver === true ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  <Checkbox
                    id="receiver-filter"
                    checked={filters.receiver === true}
                    onCheckedChange={() => onFilterChange('receiver', filters.receiver === true ? null : true)}
                    className={filters.receiver === true ? "border-sidebar-primary" : ""}
                  />
                  Receiver
                </Label>
                <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{filterCounts.receiver.true}</SidebarMenuBadge>
              </div>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>

        {/* Location Filters */}
        <SidebarMenuItem>
          <SidebarMenuButton className="pointer-events-none" tooltip="Location">
            <span>Location</span>
          </SidebarMenuButton>
          <SidebarMenuSub className="space-y-1">
            <SidebarMenuSubItem>
              <div className="flex items-center justify-between w-full">
                <Label
                  htmlFor="secreted-filter"
                  className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                    filters.secreted === true ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  <Checkbox
                    id="secreted-filter"
                    checked={filters.secreted === true}
                    onCheckedChange={() => onFilterChange('secreted', filters.secreted === true ? null : true)}
                    className={filters.secreted === true ? "border-sidebar-primary" : ""}
                  />
                  Secreted
                </Label>
                <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{filterCounts.secreted.true}</SidebarMenuBadge>
              </div>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <div className="flex items-center justify-between w-full">
                <Label
                  htmlFor="transmembrane-filter"
                  className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                    filters.plasmaMembraneTransmembrane === true ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  <Checkbox
                    id="transmembrane-filter"
                    checked={filters.plasmaMembraneTransmembrane === true}
                    onCheckedChange={() => onFilterChange('plasmaMembraneTransmembrane', filters.plasmaMembraneTransmembrane === true ? null : true)}
                    className={filters.plasmaMembraneTransmembrane === true ? "border-sidebar-primary" : ""}
                  />
                  Transmembrane
                </Label>
                <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{filterCounts.plasmaMembraneTransmembrane.true}</SidebarMenuBadge>
              </div>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <div className="flex items-center justify-between w-full">
                <Label
                  htmlFor="peripheral-filter"
                  className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                    filters.plasmaMembranePeripheral === true ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  <Checkbox
                    id="peripheral-filter"
                    checked={filters.plasmaMembranePeripheral === true}
                    onCheckedChange={() => onFilterChange('plasmaMembranePeripheral', filters.plasmaMembranePeripheral === true ? null : true)}
                    className={filters.plasmaMembranePeripheral === true ? "border-sidebar-primary" : ""}
                  />
                  Peripheral
                </Label>
                <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{filterCounts.plasmaMembranePeripheral.true}</SidebarMenuBadge>
              </div>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>
      )}
    </>
  )
}