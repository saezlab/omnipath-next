export interface InteractionsFilters {
  interactionType: string[]
  curationEffort: string[]
  entityTypeSource: string[]
  entityTypeTarget: string[]
  isDirected: boolean | null
  isStimulation: boolean | null
  isInhibition: boolean | null
  isUpstream: boolean | null
  isDownstream: boolean | null
  minReferences: number | null
}