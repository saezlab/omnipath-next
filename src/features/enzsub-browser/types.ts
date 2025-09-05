export interface EnzSubEntry {
  id: number
  enzyme: string | null
  enzymeGenesymbol: string | null
  substrate: string | null
  substrateGenesymbol: string | null
  isoforms: string | null
  residueType: string | null
  residueOffset: number | null
  modification: string | null
  sources: string | null
  references: string | null
  curationEffort: number | null
  ncbiTaxId: number | null
}

export interface EnzSubFilters {
  sources: string[]
  residueTypes: string[]
  modifications: string[]
  hasResidueOffset: boolean | null
  curationEffortMin: number | null
  searchTerm: string
  enzymeSearch: string
  substrateSearch: string
}