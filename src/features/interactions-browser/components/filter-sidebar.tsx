"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Check } from "lucide-react"

interface FilterSidebarProps {
  filters: any
  filterCounts: {
    interactionType: Record<string, number>
    curationEffort: Record<string, number>
    ncbiTaxIdSource: Record<string, number>
    entityTypeSource: Record<string, number>
    ncbiTaxIdTarget: Record<string, number>
    entityTypeTarget: Record<string, number>
    isDirected: { true: number; false: number }
    isStimulation: { true: number; false: number }
    isInhibition: { true: number; false: number }
    consensusDirection: { true: number; false: number }
    consensusStimulation: { true: number; false: number }
    consensusInhibition: { true: number; false: number }
  }
  onFilterChange: (type: string, value: any) => void
  showMobileFilters: boolean
  onClearFilters: () => void
}

export function FilterSidebar({
  filters,
  filterCounts,
  onFilterChange,
  showMobileFilters,
  onClearFilters,
}: FilterSidebarProps) {
  // Get unique values for each filter type
  const interactionTypes = Object.keys(filterCounts.interactionType)
  const curationEfforts = Object.keys(filterCounts.curationEffort)
  const ncbiTaxIds = [...new Set([
    ...Object.keys(filterCounts.ncbiTaxIdSource),
    ...Object.keys(filterCounts.ncbiTaxIdTarget)
  ])]
  const entityTypes = [...new Set([
    ...Object.keys(filterCounts.entityTypeSource),
    ...Object.keys(filterCounts.entityTypeTarget)
  ])]

  return (
    <div className={`md:w-64 lg:w-72 shrink-0 space-y-4 ${showMobileFilters ? "block" : "hidden"} md:block`}>
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear all
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={["interactionType", "properties"]} className="w-full">
          <AccordionItem value="interactionType">
            <AccordionTrigger>Interaction Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {interactionTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label
                      htmlFor={`type-${type}`}
                      className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                    >
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.interactionType.includes(type)}
                        onCheckedChange={() => onFilterChange("interactionType", type)}
                      />
                      {type}
                    </Label>
                    <Badge variant="outline" className="ml-auto">
                      {filterCounts.interactionType[type] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="curation">
            <AccordionTrigger>Curation Effort</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {curationEfforts.map((effort) => (
                  <div key={effort} className="flex items-center justify-between">
                    <Label
                      htmlFor={`effort-${effort}`}
                      className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                    >
                      <Checkbox
                        id={`effort-${effort}`}
                        checked={filters.curationEffort.includes(effort)}
                        onCheckedChange={() => onFilterChange("curationEffort", effort)}
                      />
                      {effort}
                    </Label>
                    <Badge variant="outline" className="ml-auto">
                      {filterCounts.curationEffort[effort] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="source">
            <AccordionTrigger>Source Entity</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Taxonomy ID</Label>
                  <div className="space-y-2 mt-2">
                    {ncbiTaxIds.map((tax) => (
                      <div key={tax} className="flex items-center justify-between">
                        <Label
                          htmlFor={`source-tax-${tax}`}
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id={`source-tax-${tax}`}
                            checked={filters.ncbiTaxIdSource.includes(tax)}
                            onCheckedChange={() => onFilterChange("ncbiTaxIdSource", tax)}
                          />
                          {tax}
                        </Label>
                        <Badge variant="outline" className="ml-auto">
                          {filterCounts.ncbiTaxIdSource[tax] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <div className="space-y-2 mt-2">
                    {entityTypes.map((type) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label
                          htmlFor={`source-type-${type}`}
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id={`source-type-${type}`}
                            checked={filters.entityTypeSource.includes(type)}
                            onCheckedChange={() => onFilterChange("entityTypeSource", type)}
                          />
                          {type}
                        </Label>
                        <Badge variant="outline" className="ml-auto">
                          {filterCounts.entityTypeSource[type] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="target">
            <AccordionTrigger>Target Entity</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Taxonomy ID</Label>
                  <div className="space-y-2 mt-2">
                    {ncbiTaxIds.map((tax) => (
                      <div key={tax} className="flex items-center justify-between">
                        <Label
                          htmlFor={`target-tax-${tax}`}
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id={`target-tax-${tax}`}
                            checked={filters.ncbiTaxIdTarget.includes(tax)}
                            onCheckedChange={() => onFilterChange("ncbiTaxIdTarget", tax)}
                          />
                          {tax}
                        </Label>
                        <Badge variant="outline" className="ml-auto">
                          {filterCounts.ncbiTaxIdTarget[tax] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <div className="space-y-2 mt-2">
                    {entityTypes.map((type) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label
                          htmlFor={`target-type-${type}`}
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id={`target-type-${type}`}
                            checked={filters.entityTypeTarget.includes(type)}
                            onCheckedChange={() => onFilterChange("entityTypeTarget", type)}
                          />
                          {type}
                        </Label>
                        <Badge variant="outline" className="ml-auto">
                          {filterCounts.entityTypeTarget[type] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="properties">
            <AccordionTrigger>Interaction Properties</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-directed" className="text-sm">
                    Is Directed
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                      <Button variant="outline" size="sm">
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
                      <Button variant="outline" size="sm">
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="consensus-direction" className="text-sm">
                    Consensus Direction
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {filters.consensusDirection === null ? "Any" : filters.consensusDirection ? "Yes" : "No"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusDirection", null)}>
                        Any
                        {filters.consensusDirection === null && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusDirection", true)}>
                        Yes ({filterCounts.consensusDirection.true})
                        {filters.consensusDirection === true && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusDirection", false)}>
                        No ({filterCounts.consensusDirection.false})
                        {filters.consensusDirection === false && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="consensus-stimulation" className="text-sm">
                    Consensus Stimulation
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {filters.consensusStimulation === null ? "Any" : filters.consensusStimulation ? "Yes" : "No"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusStimulation", null)}>
                        Any
                        {filters.consensusStimulation === null && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusStimulation", true)}>
                        Yes ({filterCounts.consensusStimulation.true})
                        {filters.consensusStimulation === true && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusStimulation", false)}>
                        No ({filterCounts.consensusStimulation.false})
                        {filters.consensusStimulation === false && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="consensus-inhibition" className="text-sm">
                    Consensus Inhibition
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {filters.consensusInhibition === null ? "Any" : filters.consensusInhibition ? "Yes" : "No"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusInhibition", null)}>
                        Any
                        {filters.consensusInhibition === null && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusInhibition", true)}>
                        Yes ({filterCounts.consensusInhibition.true})
                        {filters.consensusInhibition === true && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFilterChange("consensusInhibition", false)}>
                        No ({filterCounts.consensusInhibition.false})
                        {filters.consensusInhibition === false && <Check className="ml-2 h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum References</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[filters.minReferences]}
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

