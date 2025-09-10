"use client"

import { createContext, useContext, ReactNode, useState } from "react"
import { InteractionsFilters } from "@/features/interactions-browser/types"
import { SearchFilters } from "@/features/annotations-browser/types"
import { IntercellFilters } from "@/features/intercell-browser/types"
import { ComplexesFilters } from "@/features/complexes-browser/types"
import { EnzSubFilters } from "@/features/enzsub-browser/types"

// Types for filter props
interface InteractionFilterProps {
  type: "interactions"
  filters: InteractionsFilters
  filterCounts: {
    interactionType: Record<string, number>
    entityTypeSource: Record<string, number>
    entityTypeTarget: Record<string, number>
    topology: Record<string, number>
    direction: Record<string, number>
    sign: Record<string, number>
    onlyBetweenQueryProteins: { true: number; false: number }
    excludeSelfLoops: { true: number; false: number }
  }
  onFilterChange: (type: keyof InteractionsFilters, value: string | boolean | null | number) => void
  onClearFilters: () => void
  isMultiQuery?: boolean
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

interface IntercellFilterProps {
  type: "intercell"
  filters: IntercellFilters
  filterCounts: {
    aspects: Record<string, number>
    sources: Record<string, number>
    databases: Record<string, number>
    scopes: Record<string, number>
    transmitter: { true: number; false: number }
    receiver: { true: number; false: number }
    secreted: { true: number; false: number }
    plasmaMembraneTransmembrane: { true: number; false: number }
    plasmaMembranePeripheral: { true: number; false: number }
  }
  onFilterChange: (type: keyof IntercellFilters, value: string | boolean | null) => void
  onClearFilters: () => void
}

interface ComplexesFilterProps {
  type: "complexes"
  filters: ComplexesFilters
  filterCounts: {
    sources: Record<string, number>
  }
  onFilterChange: (type: keyof ComplexesFilters, value: string) => void
  onClearFilters: () => void
}

interface EnzSubFilterProps {
  type: "enzsub"
  filters: EnzSubFilters
  filterCounts: {
    sources: Record<string, number>
    residueTypes: Record<string, number>
    modifications: Record<string, number>
    onlyBetweenQueryProteins: { true: number; false: number }
    excludeSelfLoops: { true: number; false: number }
  }
  onFilterChange: (type: keyof EnzSubFilters, value: string | boolean) => void
  onClearFilters: () => void
  isMultiQuery?: boolean
}

type FilterContextValue = InteractionFilterProps | AnnotationFilterProps | IntercellFilterProps | ComplexesFilterProps | EnzSubFilterProps | null

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