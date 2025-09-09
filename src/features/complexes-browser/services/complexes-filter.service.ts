import { ComplexEntry, ComplexesFilters, ParsedComplex } from '../types'

interface FilterCounts {
  sources: Record<string, number>
}

export class ComplexesFilterService {
  static parseComplexData(complex: ComplexEntry): ParsedComplex {
    const parsedComponents = complex.components?.split(/[;,]/).map(c => c.trim()).filter(Boolean) || []
    const parsedGeneSymbols = complex.componentsGenesymbols?.split(/[;,]/).map(g => g.trim()).filter(Boolean) || []
    const parsedSources = complex.sources?.split(/[;,]/).map(s => s.trim()).filter(Boolean) || []
    
    return {
      ...complex,
      parsedComponents,
      parsedGeneSymbols,
      parsedSources,
      componentCount: parsedGeneSymbols.length || parsedComponents.length
    }
  }

  static filterData(
    data: ComplexEntry[], 
    filters: ComplexesFilters
  ): ComplexEntry[] {
    return data.filter((entry) => {
      const parsedEntry = this.parseComplexData(entry)
      
      // Filter by sources
      if (filters.sources.length > 0) {
        const sourceMatch = filters.sources.some(filterSource => 
          parsedEntry.parsedSources.some(source => 
            source.toLowerCase().includes(filterSource.toLowerCase())
          )
        )
        if (!sourceMatch) return false
      }

      return true
    })
  }
  
  static calculateCounts(data: ComplexEntry[]): FilterCounts {
    const counts: FilterCounts = {
      sources: {},
    }

    data.forEach(entry => {
      const parsedEntry = this.parseComplexData(entry)
      
      // Count sources
      parsedEntry.parsedSources.forEach(source => {
        counts.sources[source] = (counts.sources[source] || 0) + 1
      })
    })

    return counts
  }
}