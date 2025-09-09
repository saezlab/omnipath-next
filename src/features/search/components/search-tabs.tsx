"use client"

import { SearchIdentifiersResponse } from "@/db/queries"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { GetProteinAnnotationsResponse } from "@/features/annotations-browser/api/queries"
import { GetIntercellDataResponse } from "@/features/intercell-browser/api/queries"
import { GetComplexesDataResponse } from "@/features/complexes-browser/api/queries"
import { GetEnzSubDataResponse } from "@/features/enzsub-browser/api/queries"
import { InteractionsBrowser } from "@/features/interactions-browser/components/interactions-browser"
import { AnnotationsBrowser } from "@/features/annotations-browser/components/annotations-browser"
import { IntercellBrowser } from "@/features/intercell-browser/components/intercell-browser"
import { ComplexesBrowser } from "@/features/complexes-browser/components/complexes-browser"
import { EnzSubBrowser } from "@/features/enzsub-browser/components/enzsub-browser"
import { useMemo } from "react"
import useSWR from "swr"

interface SearchTabsProps {
  query: string
  activeTab: string
  identifierResults: Record<string, SearchIdentifiersResponse>
  initialTabData: unknown
  selectedSpecies?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function SearchTabs({ query, activeTab, identifierResults, initialTabData, selectedSpecies = "9606" }: SearchTabsProps) {
  // Create flattened list of all identifier results for data fetching
  const resolvedIdentifiers = useMemo(() => {
    if (!query) return []
    
    const flattened: SearchIdentifiersResponse = []
    Object.values(identifierResults).forEach(results => {
      flattened.push(...results)
    })
    
    return flattened
  }, [query, identifierResults])

  // SWR for current active tab - only fetches when tab becomes active
  const { data, isLoading } = useSWR(
    query ? `/api/search/${activeTab}?q=${encodeURIComponent(query)}&species=${selectedSpecies}` : null,
    fetcher,
    {
      // Use initial data for the first tab if provided and it matches current tab
      fallbackData: initialTabData && activeTab ? initialTabData : undefined,
      // Keep data fresh but don't refetch on tab switch
      revalidateOnFocus: false,
      // Cache for 5 minutes
      dedupingInterval: 300000
    }
  )

  return (
    <div className="h-full w-full overflow-hidden">
      {/* Tab Content Area */}
      {activeTab === 'interactions' && (
        <InteractionsBrowser 
          data={data as SearchProteinNeighborsResponse | undefined}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'annotations' && (
        <AnnotationsBrowser 
          identifierResults={resolvedIdentifiers}
          data={data as GetProteinAnnotationsResponse | undefined}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'intercell' && (
        <IntercellBrowser 
          data={data as GetIntercellDataResponse | undefined}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'complexes' && (
        <ComplexesBrowser 
          data={data as GetComplexesDataResponse | undefined}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'enzsub' && (
        <EnzSubBrowser 
          data={data as GetEnzSubDataResponse | undefined}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}