"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
    topology: Record<string, number>
    direction: Record<string, number>
    sign: Record<string, number>
    onlyBetweenQueryProteins: { true: number; false: number }
  }
  onFilterChange: (type: keyof InteractionsFilters, value: string | boolean | null | number) => void
  onClearFilters: () => void
  isMultiQuery?: boolean
}



export function FilterSidebar({
  filters,
  filterCounts,
  onFilterChange,
  onClearFilters,
  isMultiQuery = false,
}: FilterSidebarProps) {
  // Get unique values for each filter type
  const interactionTypes = Object.keys(filterCounts.interactionType)
  const entityTypesSource = Object.keys(filterCounts.entityTypeSource)
  const entityTypesTarget = Object.keys(filterCounts.entityTypeTarget)
  const topologyOptions = Object.keys(filterCounts.topology)
  const directionOptions = Object.keys(filterCounts.direction)
  const signOptions = Object.keys(filterCounts.sign)

  // Local state for immediate UI updates
  const [localMinReferences, setLocalMinReferences] = useState(filters.minReferences || 0)
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  // Debounced handler for slider changes
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

  // Debounced handler for search changes
  const debouncedSearchChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (value: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onFilterChange("search", value)
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

  // Handle search changes - update UI immediately, debounce filter calls
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalSearch(newValue)
    debouncedSearchChange(newValue)
  }, [debouncedSearchChange])

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'minReferences' && value === 0) return count
    if (key === 'search' && !value) return count
    if (key === 'onlyBetweenQueryProteins' && !value) return count
    if (Array.isArray(value)) return count + value.length
    if (value !== null) return count + 1
    return count
  }, 0)

  // Check if there's data to filter
  const hasData = Object.values(filterCounts).some(counts => 
    Object.values(counts).some(count => typeof count === 'number' && count > 0)
  )

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
      {hasData && (
        <SidebarMenu className="space-y-2">
          {/* Search */}
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" tooltip="Search">
              <span>Search</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <Input
                  type="text"
                  placeholder="Search interactions..."
                  value={localSearch}
                  onChange={handleSearchChange}
                  className={`w-full ${localSearch ? "border-sidebar-primary" : ""}`}
                />
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
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
                      htmlFor="only-between-query-proteins"
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.onlyBetweenQueryProteins ? "text-sidebar-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id="only-between-query-proteins"
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
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          {topologyOptions.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton className="pointer-events-none" tooltip="Topology">
                <span>Topology</span>
              </SidebarMenuButton>
              <SidebarMenuSub className="space-y-1">
                {topologyOptions.map((option) => {
                const count = filterCounts.topology[option] || 0
                const isSelected = filters.topology?.includes(option) || false
                const isDisabled = count === 0 && !isSelected
                
                return (
                  <SidebarMenuSubItem key={option}>
                    <div className={`flex items-center justify-between w-full ${isDisabled ? 'opacity-50' : ''}`}>
                      <Label
                        htmlFor={`topology-${option}`}
                        className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                          isSelected ? "text-sidebar-primary font-medium" : ""
                        }`}
                      >
                        <Checkbox
                          id={`topology-${option}`}
                          checked={isSelected}
                          onCheckedChange={() => onFilterChange("topology", option)}
                          className={isSelected ? "border-sidebar-primary" : ""}
                        />
                        <div className="flex items-center gap-2">
                          {option === 'directed' && <ArrowRight className="h-3 w-3" />}
                          {option === 'undirected' && <span className="h-3 w-3 text-center">—</span>}
                          <span className="capitalize">{option}</span>
                        </div>
                      </Label>
                      <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          {!isMultiQuery && directionOptions.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton className="pointer-events-none" tooltip="Direction">
                <span>Direction</span>
              </SidebarMenuButton>
              <SidebarMenuSub className="space-y-1">
                {directionOptions.map((option) => {
                  const count = filterCounts.direction[option] || 0
                  const isSelected = filters.direction?.includes(option) || false
                  const isDisabled = count === 0 && !isSelected
                  
                  return (
                    <SidebarMenuSubItem key={option}>
                      <div className={`flex items-center justify-between w-full ${isDisabled ? 'opacity-50' : ''}`}>
                        <Label
                          htmlFor={`direction-${option}`}
                          className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                            isSelected ? "text-sidebar-primary font-medium" : ""
                          }`}
                        >
                          <Checkbox
                            id={`direction-${option}`}
                            checked={isSelected}
                            onCheckedChange={() => onFilterChange("direction", option)}
                            className={isSelected ? "border-sidebar-primary" : ""}
                          />
                          <div className="flex items-center gap-2">
                            {option === 'upstream' && <span className="text-blue-500">↑</span>}
                            {option === 'downstream' && <span className="text-blue-500">↓</span>}
                            <span className="capitalize">{option}</span>
                          </div>
                        </Label>
                        <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                      </div>
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          {signOptions.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton className="pointer-events-none" tooltip="Sign">
                <span>Sign</span>
              </SidebarMenuButton>
              <SidebarMenuSub className="space-y-1">
                {signOptions.map((option) => {
                const count = filterCounts.sign[option] || 0
                const isSelected = filters.sign?.includes(option) || false
                const isDisabled = count === 0 && !isSelected
                
                return (
                  <SidebarMenuSubItem key={option}>
                    <div className={`flex items-center justify-between w-full ${isDisabled ? 'opacity-50' : ''}`}>
                      <Label
                        htmlFor={`sign-${option}`}
                        className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                          isSelected ? "text-sidebar-primary font-medium" : ""
                        }`}
                      >
                        <Checkbox
                          id={`sign-${option}`}
                          checked={isSelected}
                          onCheckedChange={() => onFilterChange("sign", option)}
                          className={isSelected ? "border-sidebar-primary" : ""}
                        />
                        <div className="flex items-center gap-2">
                          {option === 'stimulation' && <span className="text-green-500">→</span>}
                          {option === 'inhibition' && <span className="text-red-500">⊣</span>}
                          <span className="capitalize">{option}</span>
                        </div>
                      </Label>
                      <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          {interactionTypes.length > 0 && (
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
                      <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
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
          {entityTypesSource.length > 0 && (
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
                      <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          {entityTypesTarget.length > 0 && (
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
                      <SidebarMenuBadge className="bg-muted text-muted-foreground font-medium">{count}</SidebarMenuBadge>
                    </div>
                  </SidebarMenuSubItem>
                )
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      )}

    </>
  )
}
