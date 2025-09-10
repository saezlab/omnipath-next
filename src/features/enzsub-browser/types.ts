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
  [key: string]: unknown // Index signature for DataRow compatibility
}

export interface EnzSubFilters {
  sources: string[]
  residueTypes: string[]
  modifications: string[]
  onlyBetweenQueryProteins: boolean
}