import { searchMultipleIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries"
import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"
import { getIntercellData } from "@/features/intercell-browser/api/queries"
import { getComplexesData } from "@/features/complexes-browser/api/queries"
import { getEnzSubData } from "@/features/enzsub-browser/api/queries"
import { SearchHeader } from "@/features/search/components/search-header"
import { SearchTabs } from "@/features/search/components/search-tabs"

function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    tab?: string
    species?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ''
  const activeTab = resolvedSearchParams.tab || 'interactions'
  const selectedSpecies = resolvedSearchParams.species || "9606"

  const identifierResults: Record<string, SearchIdentifiersResponse> = {}
  let initialTabData: unknown = null

  if (query) {
    try {
      // Fetch identifier results for all queries
      const proteins = parseQueries(query)
      const results = await searchMultipleIdentifiers(proteins, 1, selectedSpecies)
      
      // Group results by protein
      proteins.forEach((protein) => {
        const proteinResults = results.filter(result => 
          result.identifierValue.toLowerCase().includes(protein.trim().toLowerCase()) ||
          protein.trim().toLowerCase().includes(result.identifierValue.toLowerCase())
        )
        identifierResults[protein] = proteinResults
      })

      // Create flattened list for initial tab data fetching
      const resolvedIdentifiers = Object.values(identifierResults).flat()

      if (resolvedIdentifiers.length > 0) {
        // Fetch initial tab data on server
        switch (activeTab) {
          case 'interactions':
            initialTabData = await searchProteinNeighbors(resolvedIdentifiers)
            break
          case 'annotations':
            initialTabData = await getProteinAnnotations(resolvedIdentifiers)
            break
          case 'intercell':
            initialTabData = await getIntercellData(resolvedIdentifiers)
            break
          case 'complexes':
            initialTabData = await getComplexesData(resolvedIdentifiers)
            break
          case 'enzsub':
            initialTabData = await getEnzSubData(resolvedIdentifiers)
            break
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      // Fallback to empty results
      const proteins = parseQueries(query)
      proteins.forEach(protein => {
        identifierResults[protein] = []
      })
    }
  }

  return (
    <div className="grid grid-rows-[auto_1fr] h-screen max-w-7xl mx-auto px-2 sm:px-4 pb-6 pt-4 gap-4">
      <div className="sticky top-0 bg-background z-10">
        <SearchHeader 
          initialQuery={query}
          identifierResults={identifierResults}
          activeTab={activeTab}
          selectedSpecies={selectedSpecies}
        />
      </div>
      
      <SearchTabs
        query={query}
        activeTab={activeTab}
        identifierResults={identifierResults}
        initialTabData={initialTabData}
        selectedSpecies={selectedSpecies}
      />
    </div>
  )
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q
  const tab = resolvedSearchParams.tab || 'interactions'
  
  if (query) {
    return {
      title: `${query} - ${tab} | OmniPath`,
      description: `Search results for ${query} in ${tab} data`
    }
  }
  
  return {
    title: 'Search | OmniPath',
    description: 'Search biological data across interactions, annotations, intercell, complexes, and enzyme-substrate datasets'
  }
}