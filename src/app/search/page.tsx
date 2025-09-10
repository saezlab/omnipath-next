import { SearchIdentifiersResponse } from "@/db/queries"
import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries"
import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"
import { getIntercellData } from "@/features/intercell-browser/api/queries"
import { getComplexesData } from "@/features/complexes-browser/api/queries"
import { getEnzSubData } from "@/features/enzsub-browser/api/queries"
import { SearchHeader } from "@/features/search/components/search-header"
import { SearchTabs } from "@/features/search/components/search-tabs"
import { resolveIdentifiers } from "@/lib/search-utils"

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
      // Resolve identifiers using utility function
      const { identifierResults: resolvedIdentifierResults, resolvedIdentifiers } = await resolveIdentifiers(query, selectedSpecies)
      
      // Copy results to local variable
      Object.assign(identifierResults, resolvedIdentifierResults)

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
      // Fallback to empty results - no need to parse queries manually
    }
  }

  return (
    <div className="grid grid-rows-[auto_1fr] h-screen max-w-7xl mx-auto px-2 sm:px-4 pb-6 pt-4 gap-4">
      <div className="sticky top-0 bg-background z-10">
        <SearchHeader 
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