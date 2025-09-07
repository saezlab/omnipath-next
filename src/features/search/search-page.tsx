"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchIdentifiers, searchMultipleIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { Search } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useSearchStore } from "@/store/search-store"
import { InteractionsBrowser } from "@/features/interactions-browser/components/interactions-browser"
import { AnnotationsBrowser } from "@/features/annotations-browser/components/annotations-browser"
import { IntercellBrowser } from "@/features/intercell-browser/components/intercell-browser"
import { ComplexesBrowser } from "@/features/complexes-browser/components/complexes-browser"
import { EnzSubBrowser } from "@/features/enzsub-browser/components/enzsub-browser"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"

// Helper functions
function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

function isMultiQuery(queryString: string): boolean {
  return parseQueries(queryString).length > 1
}

export function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToSearchHistory } = useSearchStore()
  
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState("9606")
  const [identifierResults, setIdentifierResults] = useState<Record<string, SearchIdentifiersResponse>>({})
  const [lastQueryType, setLastQueryType] = useState<'single' | 'multi' | null>(null)
  
  // Get active tab from URL, default to interactions
  const activeTab = searchParams.get('tab') || 'interactions'
  const urlQuery = searchParams.get('q') || ''

  // Update query when URL changes
  useEffect(() => {
    const currentQuery = urlQuery || ''
    setQuery(currentQuery)
  }, [urlQuery])

  // Fetch identifier results for all queries (single and multi)
  useEffect(() => {
    if (urlQuery) {
      const currentQueryType = isMultiQuery(urlQuery) ? 'multi' : 'single'
      
      // Clear cache if query type changed
      if (lastQueryType !== null && lastQueryType !== currentQueryType) {
        setIdentifierResults({})
      }
      setLastQueryType(currentQueryType)
      
      const fetchIdentifiers = async () => {
        if (isMultiQuery(urlQuery)) {
          // For multi-query, use searchMultipleIdentifiers with limit=1
          const proteins = parseQueries(urlQuery)
          const newProteins = proteins.filter(protein => !identifierResults[protein])
          
          if (newProteins.length > 0) {
            try {
              const results = await searchMultipleIdentifiers(newProteins, 1, selectedSpecies)
              const identifiers: Record<string, SearchIdentifiersResponse> = {}
              
              // Group results by protein (since searchMultipleIdentifiers returns flattened results)
              newProteins.forEach((protein) => {
                // Find results for this protein
                const proteinResults = results.filter(result => 
                  result.identifierValue.toLowerCase().startsWith(protein.trim().toLowerCase())
                )
                identifiers[protein] = proteinResults
              })
              
              setIdentifierResults(prev => ({ ...prev, ...identifiers }))
            } catch (error) {
              console.error("Error fetching multi identifiers:", error)
              // Fallback to empty results
              const identifiers: Record<string, SearchIdentifiersResponse> = {}
              newProteins.forEach(protein => {
                identifiers[protein] = []
              })
              setIdentifierResults(prev => ({ ...prev, ...identifiers }))
            }
          }
        } else {
          // For single query, use searchIdentifiers with limit=20
          const protein = urlQuery
          if (!identifierResults[protein]) {
            try {
              const results = await searchIdentifiers(protein.trim(), 20, selectedSpecies)
              setIdentifierResults(prev => ({ ...prev, [protein]: results }))
            } catch (error) {
              console.error(`Error fetching identifiers for ${protein}:`, error)
              setIdentifierResults(prev => ({ ...prev, [protein]: [] }))
            }
          }
        }
      }
      fetchIdentifiers()
    } else {
      // Clear results when no query
      setIdentifierResults({})
      setLastQueryType(null)
    }
  }, [urlQuery, selectedSpecies])

  // Create flattened list of all identifier results for InteractionsBrowser
  const resolvedIdentifiers = useMemo(() => {
    if (!urlQuery) return []
    
    const proteins = isMultiQuery(urlQuery) ? parseQueries(urlQuery) : [urlQuery]
    const flattened: SearchIdentifiersResponse = []
    
    proteins.forEach(protein => {
      const results = identifierResults[protein] || []
      flattened.push(...results)
    })
    
    return flattened
  }, [urlQuery, identifierResults])


  const handleSearch = async (searchQuery: string, displayTerm?: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    // Use displayTerm for UI and URL, fallback to searchQuery
    const termForDisplay = displayTerm || searchQuery.trim()

    // Create new URL with display term and current tab
    const params = new URLSearchParams()
    params.set('q', termForDisplay)
    params.set('tab', activeTab)
    const newUrl = `/search?${params.toString()}`
    
    // Add to search history with display term
    addToSearchHistory(termForDisplay, activeTab as 'interaction' | 'annotation' | 'intercell' | 'complexes' | 'enzsub', newUrl)
    
    // Navigate to search page with query and tab
    router.push(newUrl)
    
    setIsLoading(false)
  }

  const handleEnterPress = async () => {
    if (!query.trim()) return

    try {
      // Fetch suggestions for the current query with species filter
      const results = await searchIdentifiers(query.trim(), 20, selectedSpecies)
      if (results.length > 0) {
        // Auto-select the best match (first result)
        const bestMatch = results[0]
        
        // Use the original query (not bestMatch.identifierValue) to maintain consistency
        await handleSearch(query.trim(), bestMatch.identifierValue)
      } else {
        // No suggestions found, search with the raw query
        await handleSearch(query.trim())
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast.error("Failed to fetch search suggestions")
      // Fallback to searching with raw query
      await handleSearch(query)
    }
  }



  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    if (query) {
      params.set('q', query)
    }
    router.push(`/search?${params.toString()}`)
  }

  const getPlaceholderText = () => {
    if (activeTab === 'annotations') {
      return "Search annotations..."
    } else if (activeTab === 'intercell') {
      return "Search intercell data..."
    } else if (activeTab === 'complexes') {
      return "Search complexes..."
    } else if (activeTab === 'enzsub') {
      return "Search enzyme-substrate data..."
    } else {
      return "Search interactions..."
    }
  }

  return (
    <div className="grid grid-rows-[auto_1fr] h-screen max-w-7xl mx-auto px-2 sm:px-4 pb-6 pt-4 gap-4">
      {/* Header Content */}
      <div className="flex flex-col gap-4">
        {/* Search Bar and Protein Card Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full">
          {/* Protein Card - only for single queries */}
          {urlQuery && !isMultiQuery(urlQuery) && (
            <div className="flex-shrink-0 flex sm:justify-start justify-center">
              <ProteinSummaryCard 
                geneSymbol={urlQuery}
                identifierResults={identifierResults[urlQuery] || []}
              />
            </div>
          )}

          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                type="search"
                placeholder={getPlaceholderText()}
                className="w-full pl-9 pr-32 h-10 text-base rounded-md shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20 border border-border/40 hover:border-border/60"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnterPress()}
              />
              <div className="absolute right-20 top-1/2 -translate-y-1/2">
                <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                  <SelectTrigger size="sm" className="h-6 w-18 text-xs border-0 bg-transparent shadow-none p-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9606">Human</SelectItem>
                    <SelectItem value="10090">Mouse</SelectItem>
                    <SelectItem value="10116">Rat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleEnterPress}
                disabled={isLoading || !query.trim()}
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  </div>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            
            {/* Multi-query protein cards */}
            {urlQuery && isMultiQuery(urlQuery) && (
              <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {parseQueries(urlQuery).map((term, index) => (
                  <ProteinSummaryCard
                    key={index}
                    geneSymbol={term}
                    identifierResults={identifierResults[term] || []}
                    onRemove={() => {
                      const remaining = parseQueries(urlQuery).filter((_, i) => i !== index)
                      const newQuery = remaining.join(', ')
                      if (newQuery) {
                        router.push(`/search?q=${encodeURIComponent(newQuery)}&tab=${activeTab}`)
                      } else {
                        router.push(`/search?tab=${activeTab}`)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs Header */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="relative rounded-sm overflow-x-auto h-9 bg-muted">
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
          </Tabs>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="min-h-0 w-full max-w-full overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full">
          <TabsContent value="interactions" className="h-full w-full max-w-full overflow-x-hidden">
            <InteractionsBrowser identifierResults={resolvedIdentifiers} />
          </TabsContent>

          <TabsContent value="annotations" className="h-full w-full max-w-full overflow-x-hidden">
            <AnnotationsBrowser identifierResults={resolvedIdentifiers} />
          </TabsContent>

          <TabsContent value="intercell" className="h-full w-full max-w-full overflow-x-hidden">
            <IntercellBrowser identifierResults={resolvedIdentifiers} />
          </TabsContent>

          <TabsContent value="complexes" className="h-full w-full max-w-full overflow-x-hidden">
            <ComplexesBrowser identifierResults={resolvedIdentifiers} />
          </TabsContent>

          <TabsContent value="enzsub" className="h-full w-full max-w-full overflow-x-hidden">
            <EnzSubBrowser identifierResults={resolvedIdentifiers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}