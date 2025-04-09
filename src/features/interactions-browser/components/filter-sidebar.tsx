"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InteractionsFilters } from "@/store/search-store"
import { Check, Filter, Info, X } from "lucide-react"

interface FilterSidebarProps {
  filters: InteractionsFilters
  filterCounts: {
    interactionType: Record<string, number>
    ncbiTaxId: Record<string, number>
    entityTypeSource: Record<string, number>
    entityTypeTarget: Record<string, number>
    isDirected: { true: number; false: number }
    isStimulation: { true: number; false: number }
    isInhibition: { true: number; false: number }
  }
  onFilterChange: (type: keyof InteractionsFilters, value: string | boolean | null | number) => void
  showMobileFilters: boolean
  onClearFilters: () => void
}

const TAXONOMY_MAPPING: Record<string, string> = {
  '9606': 'Human',
  '10090': 'Mouse',
  '10116': 'Rat'
}

export function FilterSidebar({
  filters,
  filterCounts,
  onFilterChange,
  showMobileFilters,
  onClearFilters,
}: FilterSidebarProps) {
  // Get unique values for each filter type, filtering out those with zero counts
  const interactionTypes = Object.entries(filterCounts.interactionType)
    .filter(([, count]) => count > 0)
    .map(([type]) => type)
  const entityTypesSource = Object.entries(filterCounts.entityTypeSource)
    .filter(([, count]) => count > 0)
    .map(([type]) => type)
  const entityTypesTarget = Object.entries(filterCounts.entityTypeTarget)
    .filter(([, count]) => count > 0)
    .map(([type]) => type)
  const taxonomyEntries = Object.entries(TAXONOMY_MAPPING)
    .filter(([taxId]) => filterCounts.ncbiTaxId[taxId] > 0)

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'minReferences' && value === 0) return count
    if (Array.isArray(value)) return count + value.length
    if (value !== null) return count + 1
    return count
  }, 0)

  return (
    <div className={`md:w-64 lg:w-72 shrink-0 space-y-4 ${showMobileFilters ? "block" : "hidden"} md:block`}>
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Filters</h3>
          </div>
          {activeFilterCount > 0 && (
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

        {/* Quick Filters */}
        <div className="mb-4 space-y-2">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.isDirected === true ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("isDirected", filters.isDirected === true ? null : true)}
              className={filters.isDirected === true ? "bg-primary text-primary-foreground" : ""}
            >
              Directed ({filterCounts.isDirected.true})
            </Button>
            <Button
              variant={filters.isStimulation === true ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("isStimulation", filters.isStimulation === true ? null : true)}
              className={filters.isStimulation === true ? "bg-primary text-primary-foreground" : ""}
            >
              Stimulation ({filterCounts.isStimulation.true})
            </Button>
            <Button
              variant={filters.isInhibition === true ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("isInhibition", filters.isInhibition === true ? null : true)}
              className={filters.isInhibition === true ? "bg-primary text-primary-foreground" : ""}
            >
              Inhibition ({filterCounts.isInhibition.true})
            </Button>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["interactionType", "properties"]} className="w-full">
          <AccordionItem value="interactionType">
            <AccordionTrigger className="flex items-center gap-2">
              <span>Interaction Type</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by the type of interaction between entities</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {interactionTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between group">
                    <Label
                      htmlFor={`type-${type}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer group-hover:text-primary transition-colors ${
                        filters.interactionType.includes(type) ? "text-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.interactionType.includes(type)}
                        onCheckedChange={() => onFilterChange("interactionType", type)}
                        className={filters.interactionType.includes(type) ? "border-primary" : ""}
                      />
                      {type}
                    </Label>
                    <Badge 
                      variant={filters.interactionType.includes(type) ? "default" : "outline"} 
                      className={`ml-auto group-hover:bg-primary/10 transition-colors ${
                        filters.interactionType.includes(type) ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      {filterCounts.interactionType[type] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="taxonomy">
            <AccordionTrigger>Organism</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {taxonomyEntries.map(([taxId, label]) => (
                  <div key={taxId} className="flex items-center justify-between">
                    <Label
                      htmlFor={`tax-${taxId}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.ncbiTaxId.includes(taxId) ? "text-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`tax-${taxId}`}
                        checked={filters.ncbiTaxId.includes(taxId)}
                        onCheckedChange={() => onFilterChange("ncbiTaxId", taxId)}
                        className={filters.ncbiTaxId.includes(taxId) ? "border-primary" : ""}
                      />
                      {label}
                    </Label>
                    <Badge 
                      variant={filters.ncbiTaxId.includes(taxId) ? "default" : "outline"}
                      className={filters.ncbiTaxId.includes(taxId) ? "bg-primary text-primary-foreground" : ""}
                    >
                      {filterCounts.ncbiTaxId[taxId] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sourceEntity">
            <AccordionTrigger>Source Entity Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {entityTypesSource.map((type) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label
                      htmlFor={`source-type-${type}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.entityTypeSource.includes(type) ? "text-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`source-type-${type}`}
                        checked={filters.entityTypeSource.includes(type)}
                        onCheckedChange={() => onFilterChange("entityTypeSource", type)}
                        className={filters.entityTypeSource.includes(type) ? "border-primary" : ""}
                      />
                      {type}
                    </Label>
                    <Badge 
                      variant={filters.entityTypeSource.includes(type) ? "default" : "outline"}
                      className={filters.entityTypeSource.includes(type) ? "bg-primary text-primary-foreground" : ""}
                    >
                      {filterCounts.entityTypeSource[type] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="targetEntity">
            <AccordionTrigger>Target Entity Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {entityTypesTarget.map((type) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label
                      htmlFor={`target-type-${type}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                        filters.entityTypeTarget.includes(type) ? "text-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`target-type-${type}`}
                        checked={filters.entityTypeTarget.includes(type)}
                        onCheckedChange={() => onFilterChange("entityTypeTarget", type)}
                        className={filters.entityTypeTarget.includes(type) ? "border-primary" : ""}
                      />
                      {type}
                    </Label>
                    <Badge 
                      variant={filters.entityTypeTarget.includes(type) ? "default" : "outline"}
                      className={filters.entityTypeTarget.includes(type) ? "bg-primary text-primary-foreground" : ""}
                    >
                      {filterCounts.entityTypeTarget[type] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="properties">
            <AccordionTrigger className="flex items-center gap-2">
              <span>Interaction Properties</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by specific properties of the interactions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-directed" className="text-sm">
                    Is Directed
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant={filters.isDirected !== null ? "default" : "outline"} 
                        size="sm"
                        className={filters.isDirected !== null ? "bg-primary text-primary-foreground" : ""}
                      >
                        {filters.isDirected === null ? "Any" : filters.isDirected ? "Yes" : "No"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFilterChange("isDirected", null)}>
                        Any
                        {filters.isDirected === null && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("isDirected", true)}>
                        Yes ({filterCounts.isDirected.true})
                        {filters.isDirected === true && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("isDirected", false)}>
                        No ({filterCounts.isDirected.false})
                        {filters.isDirected === false && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-stimulation" className="text-sm">
                    Is Stimulation
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant={filters.isStimulation !== null ? "default" : "outline"} 
                        size="sm"
                        className={filters.isStimulation !== null ? "bg-primary text-primary-foreground" : ""}
                      >
                        {filters.isStimulation === null ? "Any" : filters.isStimulation ? "Yes" : "No"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFilterChange("isStimulation", null)}>
                        Any
                        {filters.isStimulation === null && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("isStimulation", true)}>
                        Yes ({filterCounts.isStimulation.true})
                        {filters.isStimulation === true && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("isStimulation", false)}>
                        No ({filterCounts.isStimulation.false})
                        {filters.isStimulation === false && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-inhibition" className="text-sm">
                    Is Inhibition
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant={filters.isInhibition !== null ? "default" : "outline"} 
                        size="sm"
                        className={filters.isInhibition !== null ? "bg-primary text-primary-foreground" : ""}
                      >
                        {filters.isInhibition === null ? "Any" : filters.isInhibition ? "Yes" : "No"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFilterChange("isInhibition", null)}>
                        Any
                        {filters.isInhibition === null && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("isInhibition", true)}>
                        Yes ({filterCounts.isInhibition.true})
                        {filters.isInhibition === true && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("isInhibition", false)}>
                        No ({filterCounts.isInhibition.false})
                        {filters.isInhibition === false && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum References</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[filters.minReferences || 0]}
                      onValueChange={(value) => onFilterChange("minReferences", value[0])}
                      min={0}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm w-8 text-right">{filters.minReferences}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

