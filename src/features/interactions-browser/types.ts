export interface InteractionsFilters {
  interactionType: string[]
  entityTypeSource: string[]
  entityTypeTarget: string[]
  topology: string[]
  direction: string[]
  sign: string[]
  minReferences: number | null
  search: string
  onlyBetweenQueryProteins: boolean
}