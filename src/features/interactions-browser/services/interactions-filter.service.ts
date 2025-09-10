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

  static isUpstreamInteraction(interaction: Interaction, queryUpper: string): boolean {
    return interaction.isDirected === true && 
      (interaction.target === queryUpper || interaction.targetGenesymbol === queryUpper)
  }

  static isDownstreamInteraction(interaction: Interaction, queryUpper: string): boolean {
    return interaction.isDirected === true && 
      (interaction.source === queryUpper || interaction.sourceGenesymbol === queryUpper)
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

  static applyFilter(
    interaction: Interaction,
    filterType: keyof InteractionsFilters,
    filterValue: string[] | number | string | boolean | null,
    queryUpper: string,
    queryProteins?: string[]
  ): boolean {
    switch (filterType) {
      case 'interactionType':
        return Array.isArray(filterValue) && (filterValue.length === 0 || filterValue.includes(interaction.type || ""))
      case 'entityTypeSource':
        return Array.isArray(filterValue) && (filterValue.length === 0 || filterValue.includes(interaction.entityTypeSource || ""))
      case 'entityTypeTarget':
        return Array.isArray(filterValue) && (filterValue.length === 0 || filterValue.includes(interaction.entityTypeTarget || ""))
      case 'topology':
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        const topologyMatches = []
        if (filterValue.includes('directed') && interaction.isDirected === true) topologyMatches.push(true)
        if (filterValue.includes('undirected') && interaction.isDirected === false) topologyMatches.push(true)
        return topologyMatches.length > 0
      case 'direction':
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        const directionMatches = []
        if (filterValue.includes('upstream') && this.isUpstreamInteraction(interaction, queryUpper)) directionMatches.push(true)
        if (filterValue.includes('downstream') && this.isDownstreamInteraction(interaction, queryUpper)) directionMatches.push(true)
        return directionMatches.length > 0
      case 'sign':
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true
        const signMatches = []
        if (filterValue.includes('stimulation') && interaction.consensusStimulation === true) signMatches.push(true)
        if (filterValue.includes('inhibition') && interaction.consensusInhibition === true) signMatches.push(true)
        return signMatches.length > 0
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
    const queryUpper = query.toUpperCase()
    return Object.entries(filters).every(([key, value]) => 
      this.applyFilter(interaction, key as keyof InteractionsFilters, value, queryUpper, queryProteins)
    )
  }

  static passesFiltersExcept(
    interaction: Interaction,
    filters: InteractionsFilters,
    query: string,
    excluded: (keyof InteractionsFilters)[],
    queryProteins?: string[]
  ): boolean {
    const queryUpper = query.toUpperCase()
    return Object.entries(filters).every(([key, value]) => {
      if (excluded.includes(key as keyof InteractionsFilters)) return true
      return this.applyFilter(interaction, key as keyof InteractionsFilters, value, queryUpper, queryProteins)
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

    const queryUpper = query.toUpperCase()
    interactions.forEach((interaction) => {
      // Count for array-based filters (excluding the filter being counted)
      if (this.passesFiltersExcept(interaction, filters, query, ['interactionType'], queryProteins) && interaction.type) {
        counts.interactionType[interaction.type] = (counts.interactionType[interaction.type] || 0) + 1
      }
      if (this.passesFiltersExcept(interaction, filters, query, ['entityTypeSource'], queryProteins) && interaction.entityTypeSource) {
        counts.entityTypeSource[interaction.entityTypeSource] = (counts.entityTypeSource[interaction.entityTypeSource] || 0) + 1
      }
      if (this.passesFiltersExcept(interaction, filters, query, ['entityTypeTarget'], queryProteins) && interaction.entityTypeTarget) {
        counts.entityTypeTarget[interaction.entityTypeTarget] = (counts.entityTypeTarget[interaction.entityTypeTarget] || 0) + 1
      }
      
      // Count for topology filters
      if (this.passesFiltersExcept(interaction, filters, query, ['topology'], queryProteins)) {
        if (interaction.isDirected === true) {
          counts.topology['directed'] = (counts.topology['directed'] || 0) + 1
        } else if (interaction.isDirected === false) {
          counts.topology['undirected'] = (counts.topology['undirected'] || 0) + 1
        }
      }
      
      // Count for direction filters - only for single protein queries
      const isMultiQuery = query.split(/[,;]/).filter(q => q.trim().length > 0).length > 1
      if (!isMultiQuery && this.passesFiltersExcept(interaction, filters, query, ['direction'], queryProteins)) {
        const upstream = this.isUpstreamInteraction(interaction, queryUpper)
        const downstream = this.isDownstreamInteraction(interaction, queryUpper)
        if (upstream) {
          counts.direction['upstream'] = (counts.direction['upstream'] || 0) + 1
        }
        if (downstream) {
          counts.direction['downstream'] = (counts.direction['downstream'] || 0) + 1
        }
      }
      
      // Count for sign filters
      if (this.passesFiltersExcept(interaction, filters, query, ['sign'], queryProteins)) {
        if (interaction.consensusStimulation === true) {
          counts.sign['stimulation'] = (counts.sign['stimulation'] || 0) + 1
        }
        if (interaction.consensusInhibition === true) {
          counts.sign['inhibition'] = (counts.sign['inhibition'] || 0) + 1
        }
      }
      
      // Count for onlyBetweenQueryProteins filter
      if (this.passesFiltersExcept(interaction, filters, query, ['onlyBetweenQueryProteins'], queryProteins)) {
        if (queryProteins && this.isBetweenQueryProteins(interaction, queryProteins)) {
          counts.onlyBetweenQueryProteins.true += 1
        } else {
          counts.onlyBetweenQueryProteins.false += 1
        }
      }
      
      // Count for excludeSelfLoops filter
      if (this.passesFiltersExcept(interaction, filters, query, ['excludeSelfLoops'], queryProteins)) {
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