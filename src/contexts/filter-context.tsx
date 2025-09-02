"use client"

import { createContext, useContext, ReactNode, useState } from "react"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { SearchFilters } from "@/features/annotations-browser/types"

// Types for filter props
interface InteractionFilterProps {
  type: "interactions"
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

interface AnnotationFilterProps {
  type: "annotations"
  filters: SearchFilters
  filterCounts: {
    sources: Record<string, number>
    annotationTypes: Record<string, number>
  }
  onFilterChange: (type: keyof SearchFilters, value: string) => void
  onClearFilters: () => void
}

type FilterContextValue = InteractionFilterProps | AnnotationFilterProps | null

interface FilterContextType {
  filterData: FilterContextValue
  setFilterData: (data: FilterContextValue) => void
}

const FilterContext = createContext<FilterContextType>({
  filterData: null,
  setFilterData: () => {}
})

interface FilterProviderProps {
  children: ReactNode
  value?: FilterContextValue
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filterData, setFilterData] = useState<FilterContextValue>(null)

  return (
    <FilterContext.Provider value={{ filterData, setFilterData }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  return useContext(FilterContext)
}