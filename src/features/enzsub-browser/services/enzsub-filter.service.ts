import { EnzSubEntry, EnzSubFilters } from '../types'

interface FilterCounts {
  sources: Record<string, number>
  residueTypes: Record<string, number>
  modifications: Record<string, number>
  onlyBetweenQueryProteins: { true: number; false: number }
}

export class EnzSubFilterService {
  static isBetweenQueryProteins(entry: EnzSubEntry, queryProteins: string[]): boolean {
    const queryUpperSet = new Set(queryProteins.map(p => p.toUpperCase()))
    
    // Check if enzyme is in query set
    const enzymeInQuery = queryUpperSet.has(entry.enzyme?.toUpperCase() || '') || 
                          queryUpperSet.has(entry.enzymeGenesymbol?.toUpperCase() || '')
    
    // Check if substrate is in query set
    const substrateInQuery = queryUpperSet.has(entry.substrate?.toUpperCase() || '') || 
                             queryUpperSet.has(entry.substrateGenesymbol?.toUpperCase() || '')
    
    return enzymeInQuery && substrateInQuery
  }

  static filterData(data: EnzSubEntry[], filters: EnzSubFilters, queryProteins?: string[]): EnzSubEntry[] {
    return data.filter((entry) => {
      // Filter by sources
      if (filters.sources.length > 0 && entry.sources) {
        const entrySources = entry.sources.split(';').map(s => s.trim().toLowerCase())
        const sourceMatch = filters.sources.some(filterSource => 
          entrySources.includes(filterSource.toLowerCase())
        )
        if (!sourceMatch) return false
      }

      // Filter by residue types
      if (filters.residueTypes.length > 0 && entry.residueType) {
        if (!filters.residueTypes.includes(entry.residueType)) return false
      }

      // Filter by modifications
      if (filters.modifications.length > 0 && entry.modification) {
        const modificationMatch = filters.modifications.some(filterMod => 
          entry.modification?.toLowerCase().includes(filterMod.toLowerCase())
        )
        if (!modificationMatch) return false
      }

      // Filter by onlyBetweenQueryProteins
      if (filters.onlyBetweenQueryProteins && queryProteins) {
        if (!this.isBetweenQueryProteins(entry, queryProteins)) return false
      }

      return true
    })
  }
  
  static passesFiltersExcept(
    entry: EnzSubEntry,
    filters: EnzSubFilters,
    excluded: (keyof EnzSubFilters)[],
    queryProteins?: string[]
  ): boolean {
    // Check sources filter (if not excluded)
    if (!excluded.includes('sources') && filters.sources.length > 0 && entry.sources) {
      const entrySources = entry.sources.split(';').map(s => s.trim().toLowerCase())
      const sourceMatch = filters.sources.some(filterSource => 
        entrySources.includes(filterSource.toLowerCase())
      )
      if (!sourceMatch) return false
    }

    // Check residue types filter (if not excluded)
    if (!excluded.includes('residueTypes') && filters.residueTypes.length > 0 && entry.residueType) {
      if (!filters.residueTypes.includes(entry.residueType)) return false
    }

    // Check modifications filter (if not excluded)
    if (!excluded.includes('modifications') && filters.modifications.length > 0 && entry.modification) {
      const modificationMatch = filters.modifications.some(filterMod => 
        entry.modification?.toLowerCase().includes(filterMod.toLowerCase())
      )
      if (!modificationMatch) return false
    }

    // Check onlyBetweenQueryProteins filter (if not excluded)
    if (!excluded.includes('onlyBetweenQueryProteins') && filters.onlyBetweenQueryProteins && queryProteins) {
      if (!this.isBetweenQueryProteins(entry, queryProteins)) return false
    }

    return true
  }

  static calculateCounts(data: EnzSubEntry[], filters: EnzSubFilters, queryProteins?: string[]): FilterCounts {
    const counts: FilterCounts = {
      sources: {},
      residueTypes: {},
      modifications: {},
      onlyBetweenQueryProteins: { true: 0, false: 0 },
    }

    data.forEach(entry => {
      // Count sources (excluding sources filter)
      if (this.passesFiltersExcept(entry, filters, ['sources'], queryProteins) && entry.sources) {
        const sources = entry.sources.split(';').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)
        sources.forEach(source => {
          counts.sources[source] = (counts.sources[source] || 0) + 1
        })
      }

      // Count residue types (excluding residueTypes filter)
      if (this.passesFiltersExcept(entry, filters, ['residueTypes'], queryProteins) && entry.residueType) {
        counts.residueTypes[entry.residueType] = (counts.residueTypes[entry.residueType] || 0) + 1
      }

      // Count modifications (excluding modifications filter)
      if (this.passesFiltersExcept(entry, filters, ['modifications'], queryProteins) && entry.modification) {
        const modKey = entry.modification.toLowerCase()
        counts.modifications[modKey] = (counts.modifications[modKey] || 0) + 1
      }

      // Count for onlyBetweenQueryProteins filter (excluding onlyBetweenQueryProteins filter)
      if (this.passesFiltersExcept(entry, filters, ['onlyBetweenQueryProteins'], queryProteins)) {
        if (queryProteins && this.isBetweenQueryProteins(entry, queryProteins)) {
          counts.onlyBetweenQueryProteins.true += 1
        } else {
          counts.onlyBetweenQueryProteins.false += 1
        }
      }
    })

    return counts
  }
}