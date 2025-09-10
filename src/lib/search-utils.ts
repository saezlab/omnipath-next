import { searchMultipleIdentifiers, SearchIdentifiersResponse } from "@/db/queries"

export function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

export async function resolveIdentifiers(query: string, species: string = '9606'): Promise<{
  identifierResults: Record<string, SearchIdentifiersResponse>
  resolvedIdentifiers: SearchIdentifiersResponse
}> {
  const proteins = parseQueries(query)
  
  // Separate entity type prefixed identifiers from regular search terms
  const entityTypePrefixed: string[] = []
  const searchTerms: string[] = []
  const entityTypeMapping: Record<string, { entityType: string, value: string }> = {}
  
  proteins.forEach(protein => {
    // Check for entity type prefixes (e.g., "complex:CPX-123", "mirna:MIR21")
    const colonIndex = protein.indexOf(':')
    if (colonIndex > 0) {
      const entityType = protein.substring(0, colonIndex)
      const value = protein.substring(colonIndex + 1)
      entityTypePrefixed.push(protein)
      entityTypeMapping[protein] = { entityType, value }
    } else {
      searchTerms.push(protein)
    }
  })
  
  // Handle search terms normally
  let results: SearchIdentifiersResponse = []
  if (searchTerms.length > 0) {
    results = await searchMultipleIdentifiers(searchTerms, 1, species)
  }
  
  // Group search results by protein
  const identifierResults: Record<string, SearchIdentifiersResponse> = {}
  searchTerms.forEach((protein) => {
    const proteinResults = results.filter(result => 
      result.identifierValue.toLowerCase().includes(protein.trim().toLowerCase()) ||
      protein.trim().toLowerCase().includes(result.identifierValue.toLowerCase())
    )
    identifierResults[protein] = proteinResults
  })
  
  // Create direct results for entity type prefixed identifiers
  entityTypePrefixed.forEach((prefixedId) => {
    const { entityType, value } = entityTypeMapping[prefixedId]
    identifierResults[prefixedId] = [{
      uniprotAccession: value, // Use the value as identifier
      identifierValue: value,
      identifierType: entityType, // Use entity type as identifier type
      taxonId: species
    }]
  })

  // Create flattened list
  const resolvedIdentifiers = Object.values(identifierResults).flat()
  
  return { identifierResults, resolvedIdentifiers }
}