import { EnzSubEntry, EnzSubFilters } from '../types'

interface FilterCounts {
  sources: Record<string, number>
  residueTypes: Record<string, number>
  modifications: Record<string, number>
}

export class EnzSubFilterService {
  static filterData(data: EnzSubEntry[], filters: EnzSubFilters): EnzSubEntry[] {
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

      return true
    })
  }
  
  static calculateCounts(data: EnzSubEntry[]): FilterCounts {
    const counts: FilterCounts = {
      sources: {},
      residueTypes: {},
      modifications: {},
    }

    data.forEach(entry => {
      // Count sources (split by semicolon)
      if (entry.sources) {
        const sources = entry.sources.split(';').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)
        sources.forEach(source => {
          counts.sources[source] = (counts.sources[source] || 0) + 1
        })
      }

      // Count residue types
      if (entry.residueType) {
        counts.residueTypes[entry.residueType] = (counts.residueTypes[entry.residueType] || 0) + 1
      }

      // Count modifications
      if (entry.modification) {
        const modKey = entry.modification.toLowerCase()
        counts.modifications[modKey] = (counts.modifications[modKey] || 0) + 1
      }
    })

    return counts
  }
}