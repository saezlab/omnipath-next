export interface ComplexEntry {
  id: number
  name: string | null
  components: string | null
  componentsGenesymbols: string | null
  stoichiometry: string | null
  sources: string | null
  references: string | null
  identifiers: string | null
}

export interface ComplexesFilters {
  sources: string[]
}

export interface ParsedComplex extends ComplexEntry {
  parsedComponents: string[]
  parsedGeneSymbols: string[]
  parsedSources: string[]
  componentCount: number
}