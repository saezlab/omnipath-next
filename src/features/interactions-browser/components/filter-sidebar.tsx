"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { INTERACTION_TYPE_ICONS } from "@/features/interactions-browser/constants/interaction-icons"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { ArrowRight, HeartHandshake, X } from "lucide-react"
import { useCallback, useState } from "react"

interface FilterSidebarProps {
  filters: InteractionsFilters
  filterCounts: {
    interactionType: Record<string, number>
    entityTypeSource: Record<string, number>
    entityTypeTarget: Record<string, number>
    isDirected: { true: number; false: number }
    isStimulation: { true: number; false: number }
    isInhibition: { true: number; false: number }
    isUpstream: { true: number; false: number }
    isDownstream: { true: number; false: number }
  }
  onFilterChange: (type: keyof InteractionsFilters, value: string | boolean | null | number) => void
  onClearFilters: () => void
}



export function FilterSidebar({
  filters,
  filterCounts,
  onFilterChange,
  onClearFilters,
}: FilterSidebarProps) {
  // Get unique values for each filter type
  const interactionTypes = Object.keys(filterCounts.interactionType)
  const entityTypesSource = Object.keys(filterCounts.entityTypeSource)
  const entityTypesTarget = Object.keys(filterCounts.entityTypeTarget)

  // Local state for immediate slider UI updates
  const [localMinReferences, setLocalMinReferences] = useState(filters.minReferences || 0)

  // Debounced handler for filter changes
  const debouncedSliderChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (value: number) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onFilterChange("minReferences", value)
        }, 300)
      }
    })(),
    [onFilterChange]
  )

  // Handle slider changes - update UI immediately, debounce filter calls
  const handleSliderChange = useCallback((value: number[]) => {
    const newValue = value[0]
    setLocalMinReferences(newValue)
    debouncedSliderChange(newValue)
  }, [debouncedSliderChange])

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'minReferences' && value === 0) return count
    if (Array.isArray(value)) return count + value.length
    if (value !== null) return count + 1
    return count
  }, 0)

  return (
    <>
      {/* Main Filters Group with Clear Action */}
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
      <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Quick Filters">
              <span>Quick Filters</span>
            </SidebarMenuButton>
            <SidebarMenuSub className="space-y-1">
              <SidebarMenuSubItem>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor="filter-directed"
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.isDirected === true ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id="filter-directed"
                      checked={filters.isDirected === true}
                      onCheckedChange={() => onFilterChange("isDirected", filters.isDirected === true ? null : true)}
                      className={filters.isDirected === true ? "border-sidebar-primary" : ""}
                    />
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      <span>Directed</span>
                    </div>
                  </Label>
                  <SidebarMenuBadge>{filterCounts.isDirected.true}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor="filter-stimulation"
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.isStimulation === true ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id="filter-stimulation"
                      checked={filters.isStimulation === true}
                      onCheckedChange={() => onFilterChange("isStimulation", filters.isStimulation === true ? null : true)}
                      className={filters.isStimulation === true ? "border-sidebar-primary" : ""}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">→</span>
                      <span>Stimulation</span>
                    </div>
                  </Label>
                  <SidebarMenuBadge>{filterCounts.isStimulation.true}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor="filter-inhibition"
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.isInhibition === true ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id="filter-inhibition"
                      checked={filters.isInhibition === true}
                      onCheckedChange={() => onFilterChange("isInhibition", filters.isInhibition === true ? null : true)}
                      className={filters.isInhibition === true ? "border-sidebar-primary" : ""}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⊣</span>
                      <span>Inhibition</span>
                    </div>
                  </Label>
                  <SidebarMenuBadge>{filterCounts.isInhibition.true}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor="filter-upstream"
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.isUpstream === true ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id="filter-upstream"
                      checked={filters.isUpstream === true}
                      onCheckedChange={() => onFilterChange("isUpstream", filters.isUpstream === true ? null : true)}
                      className={filters.isUpstream === true ? "border-sidebar-primary" : ""}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">↑</span>
                      <span>Upstream</span>
                    </div>
                  </Label>
                  <SidebarMenuBadge>{filterCounts.isUpstream.true}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <div className="flex items-center justify-between w-full">
                  <Label
                    htmlFor="filter-downstream"
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.isDownstream === true ? "text-sidebar-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id="filter-downstream"
                      checked={filters.isDownstream === true}
                      onCheckedChange={() => onFilterChange("isDownstream", filters.isDownstream === true ? null : true)}
                      className={filters.isDownstream === true ? "border-sidebar-primary" : ""}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">↓</span>
                      <span>Downstream</span>
                    </div>
                  </Label>
                  <SidebarMenuBadge>{filterCounts.isDownstream.true}</SidebarMenuBadge>
                </div>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Interaction Type">
              <span>Interaction Type</span>
            </SidebarMenuButton>
            <SidebarMenuSub className="space-y-1">
              {interactionTypes.map((type) => {
                const typeIcon = INTERACTION_TYPE_ICONS[type] || { icon: <HeartHandshake className="h-4 w-4" />, label: type }
                const count = filterCounts.interactionType[type] || 0
                const isSelected = filters.interactionType?.includes(type) || false
                const isDisabled = count === 0 && !isSelected
                
                return (
                  <SidebarMenuSubItem key={type}>
                    <div className={`flex items-center justify-between w-full ${isDisabled ? 'opacity-50' : ''}`}>
                      <Label
                        htmlFor={`type-${type}`}
                        className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                          isSelected ? "text-sidebar-primary font-medium" : ""
                        }`}
                      >
                        <Checkbox
                          id={`type-${type}`}
                          checked={isSelected}
                          onCheckedChange={() => onFilterChange("interactionType", type)}
                          className={isSelected ? "border-sidebar-primary" : ""}
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <div className="text-sidebar-foreground/60">
                                  {typeIcon.icon}
                                </div>
                                <span>{typeIcon.label}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{typeIcon.fullName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Minimum References">
              <span>Minimum References</span>
            </SidebarMenuButton>
            <SidebarMenuSub className="space-y-1">
              <SidebarMenuSubItem>
                <div className="flex items-center gap-2 w-full">
                  <Slider
                    value={[localMinReferences]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm w-8 text-right text-sidebar-foreground/70">{localMinReferences}</span>
                </div>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Source Entity Type">
              <span>Source Entity Type</span>
            </SidebarMenuButton>
            <SidebarMenuSub className="space-y-1">
              {entityTypesSource.map((type) => {
                const count = filterCounts.entityTypeSource[type] || 0
                const isSelected = filters.entityTypeSource?.includes(type) || false
                const isDisabled = count === 0 && !isSelected
                
                return (
                  <SidebarMenuSubItem key={type}>
                    <div className={`flex items-center justify-between w-full ${isDisabled ? 'opacity-50' : ''}`}>
                      <Label
                        htmlFor={`source-type-${type}`}
                        className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                          isSelected ? "text-sidebar-primary font-medium" : ""
                        }`}
                      >
                        <Checkbox
                          id={`source-type-${type}`}
                          checked={isSelected}
                          onCheckedChange={() => onFilterChange("entityTypeSource", type)}
                          className={isSelected ? "border-sidebar-primary" : ""}
                        />
                        {type}
                      </Label>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Target Entity Type">
              <span>Target Entity Type</span>
            </SidebarMenuButton>
            <SidebarMenuSub className="space-y-1">
              {entityTypesTarget.map((type) => {
                const count = filterCounts.entityTypeTarget[type] || 0
                const isSelected = filters.entityTypeTarget?.includes(type) || false
                const isDisabled = count === 0 && !isSelected
                
                return (
                  <SidebarMenuSubItem key={type}>
                    <div className={`flex items-center justify-between w-full ${isDisabled ? 'opacity-50' : ''}`}>
                      <Label
                        htmlFor={`target-type-${type}`}
                        className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                          isSelected ? "text-sidebar-primary font-medium" : ""
                        }`}
                      >
                        <Checkbox
                          id={`target-type-${type}`}
                          checked={isSelected}
                          onCheckedChange={() => onFilterChange("entityTypeTarget", type)}
                          className={isSelected ? "border-sidebar-primary" : ""}
                        />
                        {type}
                      </Label>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>

    </>
  )
}
