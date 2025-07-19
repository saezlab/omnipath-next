export interface Annotation {
  uniprot: string | null
  genesymbol: string | null
  entityType: string | null
  source: string | null
  label: string | null
  value: string | null
  recordId: number | null
}

export interface SearchFilters {
  sources: string[]
  annotationTypes: string[]
  valueSearch: string
}