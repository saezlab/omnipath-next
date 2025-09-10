import { SearchProteinNeighborsResponse } from '@/features/interactions-browser/api/queries'
import { InteractionsFilters } from '../types'

type Interaction = SearchProteinNeighborsResponse['interactions'][number]

interface FilterCounts {
  interactionType: Record<string, number>
  entityTypeSource: Record<string, number>
  entityTypeTarget: Record<string, number>
  topology: Record<string, number>
  direction: Record<string, number>
  sign: Record<string, number>
  onlyBetweenQueryProteins: { true: number; false: number }
  excludeSelfLoops: { true: number; false: number }
}

export class InteractionsFilterService {
  static getReferenceCount(interaction: Interaction): number {
    return interaction.references ? interaction.references.split(';').length : 0
  }

  static isUpstreamInteraction(interaction: Interaction, query: string): boolean {
    return interaction.isDirected === true && interaction.targetGenesymbol === query
  }

  static isDownstreamInteraction(interaction: Interaction, query: string): boolean {
    return interaction.isDirected === true && interaction.sourceGenesymbol === query
  }

  static isBetweenQueryProteins(interaction: Interaction, queryProteins: string[]): boolean {
    const queryUpperSet = new Set(queryProteins.map(p => p.toUpperCase()))
    
    // Check if source is in query set
    const sourceInQuery = queryUpperSet.has(interaction.source?.toUpperCase() || '') || 
                          queryUpperSet.has(interaction.sourceGenesymbol?.toUpperCase() || '')
    
    // Check if target is in query set
    const targetInQuery = queryUpperSet.has(interaction.target?.toUpperCase() || '') || 
                          queryUpperSet.has(interaction.targetGenesymbol?.toUpperCase() || '')
    
    return sourceInQuery && targetInQuery
  }

  static isSelfLoop(interaction: Interaction): boolean {
    // Check if source and target are the same protein using both accession and gene symbol
    const sourceAccession = interaction.source?.toUpperCase()
    const targetAccession = interaction.target?.toUpperCase()
    const sourceSymbol = interaction.sourceGenesymbol?.toUpperCase()
    const targetSymbol = interaction.targetGenesymbol?.toUpperCase()
    
    // Same if accessions match (and both exist)
    if (sourceAccession && targetAccession && sourceAccession === targetAccession) {
      return true
    }
    
    // Same if gene symbols match (and both exist)
    if (sourceSymbol && targetSymbol && sourceSymbol === targetSymbol) {
      return true
    }
    
    // Cross-check: source accession matches target symbol or vice versa
    if ((sourceAccession && targetSymbol && sourceAccession === targetSymbol) ||
        (sourceSymbol && targetAccession && sourceSymbol === targetAccession)) {
      return true
    }
    
    return false
  }

  static evaluateAllFilters(
    interaction: Interaction,
    filters: InteractionsFilters,
    query: string,
    queryProteins?: string[]
  ): Record<keyof InteractionsFilters, boolean> {
    return {
      interactionType: this.applyFilter(interaction, 'interactionType', filters.interactionType, query, queryProteins),
      entityTypeSource: this.applyFilter(interaction, 'entityTypeSource', filters.entityTypeSource, query, queryProteins),
      entityTypeTarget: this.applyFilter(interaction, 'entityTypeTarget', filters.entityTypeTarget, query, queryProteins),
      topology: this.applyFilter(interaction, 'topology', filters.topology, query, queryProteins),
      direction: this.applyFilter(interaction, 'direction', filters.direction, query, queryProteins),
      sign: this.applyFilter(interaction, 'sign', filters.sign, query, queryProteins),
      minReferences: this.applyFilter(interaction, 'minReferences', filters.minReferences, query, queryProteins),
      search: this.applyFilter(interaction, 'search', filters.search, query, queryProteins),
      onlyBetweenQueryProteins: this.applyFilter(interaction, 'onlyBetweenQueryProteins', filters.onlyBetweenQueryProteins, query, queryProteins),
      excludeSelfLoops: this.applyFilter(interaction, 'excludeSelfLoops', filters.excludeSelfLoops, query, queryProteins),
    }
  }

  static applyFilter(
    interaction: Interaction,
    filterType: keyof InteractionsFilters,
    filterValue: string[] | number | string | boolean | null,
    query: string,
    queryProteins?: string[]
  ): boolean {
    switch (filterType) {
      case 'interactionType':
        if (!Array.isArray(filterValue)) return false
        if (filterValue.length === 0) return true
        return filterValue.includes(interaction.type || "")
      case 'entityTypeSource':
        if (!Array.isArray(filterValue)) return false
        if (filterValue.length === 0) return true
        return filterValue.includes(interaction.entityTypeSource || "")
      case 'entityTypeTarget':
        if (!Array.isArray(filterValue)) return false
        if (filterValue.length === 0) return true
        return filterValue.includes(interaction.entityTypeTarget || "")
      case 'topology':
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        if (filterValue.includes('directed') && interaction.isDirected === true) return true
        if (filterValue.includes('undirected') && interaction.isDirected === false) return true
        return false
      case 'direction':
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        if (filterValue.includes('upstream') && this.isUpstreamInteraction(interaction, query)) return true
        if (filterValue.includes('downstream') && this.isDownstreamInteraction(interaction, query)) return true
        return false
      case 'sign':
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        if (filterValue.includes('stimulation') && interaction.consensusStimulation === true) return true
        if (filterValue.includes('inhibition') && interaction.consensusInhibition === true) return true
        return false
      case 'minReferences':
        return filterValue === null || (typeof filterValue === 'number' && this.getReferenceCount(interaction) >= filterValue)
      case 'search':
        if (!filterValue || typeof filterValue !== 'string') return true
        const searchTerm = filterValue.toLowerCase()
        return [
          interaction.sourceGenesymbol,
          interaction.source,
          interaction.targetGenesymbol,
          interaction.target,
          interaction.type,
          interaction.sources
        ].some(field => field?.toLowerCase().includes(searchTerm))
      case 'onlyBetweenQueryProteins':
        if (typeof filterValue !== 'boolean' || !filterValue || !queryProteins) return true
        return this.isBetweenQueryProteins(interaction, queryProteins)
      case 'excludeSelfLoops':
        if (typeof filterValue !== 'boolean' || !filterValue) return true
        return !this.isSelfLoop(interaction)
      default:
        return true
    }
  }

  static passesFilters(
    interaction: Interaction,
    filters: InteractionsFilters,
    query: string,
    queryProteins?: string[]
  ): boolean {
    return Object.entries(filters).every(([key, value]) => 
      this.applyFilter(interaction, key as keyof InteractionsFilters, value, query, queryProteins)
    )
  }

  static passesFiltersExcept(
    interaction: Interaction,
    filters: InteractionsFilters,
    query: string,
    excluded: (keyof InteractionsFilters)[],
    queryProteins?: string[]
  ): boolean {
    return Object.entries(filters).every(([key, value]) => {
      if (excluded.includes(key as keyof InteractionsFilters)) return true
      return this.applyFilter(interaction, key as keyof InteractionsFilters, value, query, queryProteins)
    })
  }

  static filterData(
    interactions: Interaction[], 
    filters: InteractionsFilters,
    query: string,
    queryProteins?: string[]
  ): Interaction[] {
    return interactions.filter(interaction => 
      this.passesFilters(interaction, filters, query, queryProteins)
    )
  }

  static calculateCounts(
    interactions: Interaction[], 
    filters: InteractionsFilters, 
    query: string,
    queryProteins?: string[]
  ): FilterCounts {
    const counts: FilterCounts = {
      interactionType: {},
      entityTypeSource: {},
      entityTypeTarget: {},
      topology: {},
      direction: {},
      sign: {},
      onlyBetweenQueryProteins: { true: 0, false: 0 },
      excludeSelfLoops: { true: 0, false: 0 },
    }

    const isMultiQuery = query.split(/[,;]/).filter(q => q.trim().length > 0).length > 1

    interactions.forEach((interaction) => {
      // Evaluate all filters once for this interaction
      const filterResults = this.evaluateAllFilters(interaction, filters, query, queryProteins)
      
      // Count for interactionType (excluding interactionType filter)
      if (interaction.type && Object.entries(filterResults).every(([key, passes]) => 
        key === 'interactionType' || passes)) {
        counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1
      }
      
      // Count for entityTypeSource (excluding entityTypeSource filter)
      if (interaction.entityTypeSource && Object.entries(filterResults).every(([key, passes]) => 
        key === 'entityTypeSource' || passes)) {
        counts.entityTypeSource[interaction.entityTypeSource] = (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1
      }
      
      // Count for entityTypeTarget (excluding entityTypeTarget filter)
      if (interaction.entityTypeTarget && Object.entries(filterResults).every(([key, passes]) => 
        key === 'entityTypeTarget' || passes)) {
        counts.entityTypeTarget[interaction.entityTypeTarget] = (counts.entityTypeTarget[interaction.entityTypeTarget] || 0) + 1
      }
      
      // Count for topology (excluding topology filter)
      if (Object.entries(filterResults).every(([key, passes]) => 
        key === 'topology' || passes)) {
        if (interaction.isDirected === true) {
          counts.topology['directed'] = (counts.topology['directed'] || 0) + 1
        } else if (interaction.isDirected === false) {
          counts.topology['undirected'] = (counts.topology['undirected'] || 0) + 1
        }
      }
      
      // Count for direction filters - only for single protein queries
      if (!isMultiQuery && Object.entries(filterResults).every(([key, passes]) => 
        key === 'direction' || passes)) {
        const upstream = this.isUpstreamInteraction(interaction, query)
        const downstream = this.isDownstreamInteraction(interaction, query)
        if (upstream) {
          counts.direction['upstream'] = (counts.direction['upstream'] || 0) + 1
        }
        if (downstream) {
          counts.direction['downstream'] = (counts.direction['downstream'] || 0) + 1
        }
      }
      
      // Count for sign filters (excluding sign filter)
      if (Object.entries(filterResults).every(([key, passes]) => 
        key === 'sign' || passes)) {
        if (interaction.consensusStimulation === true) {
          counts.sign['stimulation'] = (counts.sign['stimulation'] || 0) + 1
        }
        if (interaction.consensusInhibition === true) {
          counts.sign['inhibition'] = (counts.sign['inhibition'] || 0) + 1
        }
      }
      
      // Count for onlyBetweenQueryProteins filter (excluding onlyBetweenQueryProteins filter)
      if (Object.entries(filterResults).every(([key, passes]) => 
        key === 'onlyBetweenQueryProteins' || passes)) {
        if (queryProteins && this.isBetweenQueryProteins(interaction, queryProteins)) {
          counts.onlyBetweenQueryProteins.true += 1
        } else {
          counts.onlyBetweenQueryProteins.false += 1
        }
      }
      
      // Count for excludeSelfLoops filter (excluding excludeSelfLoops filter)
      if (Object.entries(filterResults).every(([key, passes]) => 
        key === 'excludeSelfLoops' || passes)) {
        if (this.isSelfLoop(interaction)) {
          counts.excludeSelfLoops.false += 1  // false count = self-loops (would be excluded)
        } else {
          counts.excludeSelfLoops.true += 1   // true count = non-self-loops (would be included)
        }
      }
    })
    return counts
  }
}