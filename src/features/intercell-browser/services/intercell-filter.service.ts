import { IntercellEntry, IntercellFilters } from '../types'

interface FilterCounts {
  aspects: Record<string, number>
  sources: Record<string, number>
  databases: Record<string, number>
  scopes: Record<string, number>
  parents: Record<string, number>
  transmitter: { true: number; false: number }
  receiver: { true: number; false: number }
  secreted: { true: number; false: number }
  plasmaMembraneTransmembrane: { true: number; false: number }
  plasmaMembranePeripheral: { true: number; false: number }
}

export class IntercellFilterService {
  static filterData(
    data: IntercellEntry[], 
    filters: IntercellFilters
  ): IntercellEntry[] {
    return data.filter((entry) => {
      // Filter by aspects
      if (filters.aspects.length > 0 && entry.aspect) {
        const aspectMatch = filters.aspects.some(filterAspect => 
          filterAspect.toLowerCase() === entry.aspect?.toLowerCase()
        )
        if (!aspectMatch) return false
      }

      // Filter by sources
      if (filters.sources.length > 0 && entry.source) {
        const sourceMatch = filters.sources.some(filterSource => 
          filterSource.toLowerCase() === entry.source?.toLowerCase()
        )
        if (!sourceMatch) return false
      }

      // Filter by databases
      if (filters.databases.length > 0 && entry.database) {
        const databaseMatch = filters.databases.some(filterDatabase => 
          filterDatabase.toLowerCase() === entry.database?.toLowerCase()
        )
        if (!databaseMatch) return false
      }

      // Filter by scopes
      if (filters.scopes.length > 0 && entry.scope) {
        const scopeMatch = filters.scopes.some(filterScope =>
          filterScope.toLowerCase() === entry.scope?.toLowerCase()
        )
        if (!scopeMatch) return false
      }

      // Filter by parents
      if (filters.parents.length > 0 && entry.parent) {
        const parentMatch = filters.parents.some(filterParent =>
          filterParent.toLowerCase() === entry.parent?.toLowerCase()
        )
        if (!parentMatch) return false
      }

      // Filter by boolean fields
      if (filters.transmitter !== null && entry.transmitter !== filters.transmitter) {
        return false
      }

      if (filters.receiver !== null && entry.receiver !== filters.receiver) {
        return false
      }

      if (filters.secreted !== null && entry.secreted !== filters.secreted) {
        return false
      }

      if (filters.plasmaMembraneTransmembrane !== null && entry.plasmaMembraneTransmembrane !== filters.plasmaMembraneTransmembrane) {
        return false
      }

      if (filters.plasmaMembranePeripheral !== null && entry.plasmaMembranePeripheral !== filters.plasmaMembranePeripheral) {
        return false
      }

      return true
    })
  }
  
  static calculateCounts(data: IntercellEntry[]): FilterCounts {
    const counts: FilterCounts = {
      aspects: {},
      sources: {},
      databases: {},
      scopes: {},
      parents: {},
      transmitter: { true: 0, false: 0 },
      receiver: { true: 0, false: 0 },
      secreted: { true: 0, false: 0 },
      plasmaMembraneTransmembrane: { true: 0, false: 0 },
      plasmaMembranePeripheral: { true: 0, false: 0 },
    }

    data.forEach(entry => {
      // Count aspects
      if (entry.aspect) {
        counts.aspects[entry.aspect] = (counts.aspects[entry.aspect] || 0) + 1
      }

      // Count sources
      if (entry.source) {
        counts.sources[entry.source] = (counts.sources[entry.source] || 0) + 1
      }

      // Count databases
      if (entry.database) {
        counts.databases[entry.database] = (counts.databases[entry.database] || 0) + 1
      }

      // Count scopes
      if (entry.scope) {
        counts.scopes[entry.scope] = (counts.scopes[entry.scope] || 0) + 1
      }

      // Count parents
      if (entry.parent) {
        counts.parents[entry.parent] = (counts.parents[entry.parent] || 0) + 1
      }

      // Count boolean fields
      if (entry.transmitter === true) counts.transmitter.true++
      if (entry.transmitter === false) counts.transmitter.false++
      
      if (entry.receiver === true) counts.receiver.true++
      if (entry.receiver === false) counts.receiver.false++
      
      if (entry.secreted === true) counts.secreted.true++
      if (entry.secreted === false) counts.secreted.false++
      
      if (entry.plasmaMembraneTransmembrane === true) counts.plasmaMembraneTransmembrane.true++
      if (entry.plasmaMembraneTransmembrane === false) counts.plasmaMembraneTransmembrane.false++
      
      if (entry.plasmaMembranePeripheral === true) counts.plasmaMembranePeripheral.true++
      if (entry.plasmaMembranePeripheral === false) counts.plasmaMembranePeripheral.false++
    })

    return counts
  }
}