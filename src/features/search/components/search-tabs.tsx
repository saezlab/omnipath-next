"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useRouter, useSearchParams } from "next/navigation"
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
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    if (query) {
      params.set('q', query)
    }
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full w-full">
        {/* Tabs Header */}
        <div className="relative rounded-sm overflow-x-auto h-9 bg-muted flex-shrink-0">
          <TabsList className="absolute flex flex-row justify-stretch w-full min-w-fit">
            <TabsTrigger value="interactions" className="w-full flex-shrink-0 whitespace-nowrap">
              Interactions
            </TabsTrigger>
            <TabsTrigger value="annotations" className="w-full flex-shrink-0 whitespace-nowrap">
              Annotations
            </TabsTrigger>
            <TabsTrigger value="intercell" className="w-full flex-shrink-0 whitespace-nowrap">
              Intercell
            </TabsTrigger>
            <TabsTrigger value="complexes" className="w-full flex-shrink-0 whitespace-nowrap">
              Complexes
            </TabsTrigger>
            <TabsTrigger value="enzsub" className="w-full flex-shrink-0 whitespace-nowrap">
              Enzyme-Substrate
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content Area - immediately after tabs */}
        <TabsContent value="interactions" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <InteractionsBrowser 
            data={activeTab === 'interactions' ? data as SearchProteinNeighborsResponse | undefined : undefined}
            isLoading={activeTab === 'interactions' ? isLoading : false}
          />
        </TabsContent>

        <TabsContent value="annotations" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <AnnotationsBrowser 
            identifierResults={resolvedIdentifiers}
            data={activeTab === 'annotations' ? data as GetProteinAnnotationsResponse | undefined : undefined}
            isLoading={activeTab === 'annotations' ? isLoading : false}
          />
        </TabsContent>

        <TabsContent value="intercell" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <IntercellBrowser 
            data={activeTab === 'intercell' ? data as GetIntercellDataResponse | undefined : undefined}
            isLoading={activeTab === 'intercell' ? isLoading : false}
          />
        </TabsContent>

        <TabsContent value="complexes" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ComplexesBrowser 
            data={activeTab === 'complexes' ? data as GetComplexesDataResponse | undefined : undefined}
            isLoading={activeTab === 'complexes' ? isLoading : false}
          />
        </TabsContent>

        <TabsContent value="enzsub" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <EnzSubBrowser 
            data={activeTab === 'enzsub' ? data as GetEnzSubDataResponse | undefined : undefined}
            isLoading={activeTab === 'enzsub' ? isLoading : false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}