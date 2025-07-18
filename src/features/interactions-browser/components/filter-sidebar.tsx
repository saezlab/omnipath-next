"use client"

import { FilterCard } from "@/components/filter-card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { ArrowRight, Atom, Check, Dna, FlaskConical, Info, Mic } from "lucide-react"

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
  showMobileFilters?: boolean
  onClearFilters: () => void
}


const INTERACTION_TYPE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  post_translational: { icon: <Atom className="h-4 w-4" />, label: "Post-translational" },
  transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Transcriptional" },
  post_transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Post-transcriptional" },
  mirna_transcriptional: { icon: <Mic className="h-4 w-4" />, label: "miRNA Transcriptional" },
  small_molecule_protein: { icon: <FlaskConical className="h-4 w-4" />, label: "Small Molecule-Protein" },
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

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'minReferences' && value === 0) return count
    if (Array.isArray(value)) return count + value.length
    if (value !== null) return count + 1
    return count
  }, 0)

  return (
    <FilterCard
      title="Filters"
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearFilters}
      showMobileFilters={showMobileFilters}
    >
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
            <ArrowRight className="h-4 w-4 mr-1" />
            Directed ({filterCounts.isDirected.true})
          </Button>
          <Button
            variant={filters.isStimulation === true ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("isStimulation", filters.isStimulation === true ? null : true)}
            className={filters.isStimulation === true ? "bg-primary text-primary-foreground" : ""}
          >
            <span className="text-green-500 mr-1">→</span>
            Stimulation ({filterCounts.isStimulation.true})
          </Button>
          <Button
            variant={filters.isInhibition === true ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("isInhibition", filters.isInhibition === true ? null : true)}
            className={filters.isInhibition === true ? "bg-primary text-primary-foreground" : ""}
          >
            <span className="text-red-500 mr-1">→</span>
            Inhibition ({filterCounts.isInhibition.true})
          </Button>
          <Button
            variant={filters.isUpstream === true ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("isUpstream", filters.isUpstream === true ? null : true)}
            className={filters.isUpstream === true ? "bg-primary text-primary-foreground" : ""}
          >
            <span className="text-blue-500 mr-1">↑</span>
            Upstream ({filterCounts.isUpstream.true})
          </Button>
          <Button
            variant={filters.isDownstream === true ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("isDownstream", filters.isDownstream === true ? null : true)}
            className={filters.isDownstream === true ? "bg-primary text-primary-foreground" : ""}
          >
            <span className="text-blue-500 mr-1">↓</span>
            Downstream ({filterCounts.isDownstream.true})
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["interactionType"]} className="w-full">
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
              {interactionTypes.map((type) => {
                const typeIcon = INTERACTION_TYPE_ICONS[type] || { icon: <Atom className="h-4 w-4" />, label: type }
                return (
                  <div key={type} className="flex items-center justify-between group">
                    <Label
                      htmlFor={`type-${type}`}
                      className={`flex items-center gap-2 text-sm font-normal cursor-pointer group-hover:text-primary transition-colors ${
                        filters.interactionType?.includes(type) ? "text-primary font-medium" : ""
                      }`}
                    >
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.interactionType?.includes(type) || false}
                        onCheckedChange={() => onFilterChange("interactionType", type)}
                        className={filters.interactionType?.includes(type) ? "border-primary" : ""}
                      />
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground">
                          {typeIcon.icon}
                        </div>
                        <span>{typeIcon.label}</span>
                      </div>
                    </Label>
                    <Badge 
                      variant={filters.interactionType?.includes(type) ? "default" : "outline"} 
                      className={`ml-auto group-hover:bg-primary/10 transition-colors ${
                        filters.interactionType?.includes(type) ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      {filterCounts.interactionType[type] || 0}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <div className="px-4 py-2 space-y-2">
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


        <AccordionItem value="sourceEntity">
          <AccordionTrigger>Source Entity Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {entityTypesSource.map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <Label
                    htmlFor={`source-type-${type}`}
                    className={`flex items-center gap-2 text-sm font-normal cursor-pointer ${
                      filters.entityTypeSource?.includes(type) ? "text-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`source-type-${type}`}
                      checked={filters.entityTypeSource?.includes(type) || false}
                      onCheckedChange={() => onFilterChange("entityTypeSource", type)}
                      className={filters.entityTypeSource?.includes(type) ? "border-primary" : ""}
                    />
                    {type}
                  </Label>
                  <Badge 
                    variant={filters.entityTypeSource?.includes(type) ? "default" : "outline"}
                    className={filters.entityTypeSource?.includes(type) ? "bg-primary text-primary-foreground" : ""}
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
                      filters.entityTypeTarget?.includes(type) ? "text-primary font-medium" : ""
                    }`}
                  >
                    <Checkbox
                      id={`target-type-${type}`}
                      checked={filters.entityTypeTarget?.includes(type) || false}
                      onCheckedChange={() => onFilterChange("entityTypeTarget", type)}
                      className={filters.entityTypeTarget?.includes(type) ? "border-primary" : ""}
                    />
                    {type}
                  </Label>
                  <Badge 
                    variant={filters.entityTypeTarget?.includes(type) ? "default" : "outline"}
                    className={filters.entityTypeTarget?.includes(type) ? "bg-primary text-primary-foreground" : ""}
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </FilterCard>
  )
}

