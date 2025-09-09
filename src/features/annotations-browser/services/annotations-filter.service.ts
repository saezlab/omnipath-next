import { Annotation, SearchFilters } from '../types'

interface FilterCounts {
  sources: Record<string, number>
  annotationTypes: Record<string, number>
}

export class AnnotationsFilterService {
  static filterData(data: Annotation[], filters: SearchFilters): Annotation[] {
    // First, find all recordIds that match the value search in any field
    const matchingRecordIds = new Set<number>()
    
    if (filters.valueSearch) {
      const searchTerm = filters.valueSearch.toLowerCase()
      data.forEach((annotation) => {
        // Check if any field contains the search term
        const matches = 
          (annotation.value?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.label?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.source?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.genesymbol?.toLowerCase().includes(searchTerm) || false) ||
          (annotation.uniprot?.toLowerCase().includes(searchTerm) || false)
        
        if (matches && annotation.recordId) {
          matchingRecordIds.add(annotation.recordId)
        }
      })
    }

    // Then filter annotations based on all criteria
    return data.filter((annotation) => {
      // Filter by sources
      if (filters.sources.length > 0 && annotation.source) {
        const sourceMatch = filters.sources.some(filterSource => 
          filterSource.toLowerCase() === annotation.source?.toLowerCase()
        )
        if (!sourceMatch) return false
      }

      // Filter by annotation types
      if (filters.annotationTypes.length > 0 && annotation.label) {
        const typeMatch = filters.annotationTypes.some(filterType => 
          filterType.toLowerCase() === annotation.label?.toLowerCase()
        )
        if (!typeMatch) return false
      }

      // Filter by value search - include all annotations for matching records
      if (filters.valueSearch && matchingRecordIds.size > 0) {
        if (!annotation.recordId || !matchingRecordIds.has(annotation.recordId)) {
          return false
        }
      }

      return true
    })
  }
  
  static calculateCounts(data: Annotation[]): FilterCounts {
    const counts: FilterCounts = {
      sources: {},
      annotationTypes: {},
    }

    // Get unique records first (as per original logic)
    const uniqueRecords = new Set(data.map(a => a.recordId))
    
    // For each unique record, count its sources and types
    uniqueRecords.forEach(recordId => {
      const recordAnnotations = data.filter(a => a.recordId === recordId)
      
      // Count unique sources for this record
      const uniqueSources = new Set(recordAnnotations.map(a => a.source?.toLowerCase()))
      uniqueSources.forEach(source => {
        if (source) {
          counts.sources[source] = (counts.sources[source] || 0) + 1
        }
      })

      // Count unique types for this record
      const uniqueTypes = new Set(recordAnnotations.map(a => a.label?.toLowerCase()))
      uniqueTypes.forEach(type => {
        if (type) {
          counts.annotationTypes[type] = (counts.annotationTypes[type] || 0) + 1
        }
      })
    })

    return counts
  }
}