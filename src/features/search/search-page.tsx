"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchIdentifiers } from "@/db/queries"
import { getProteinInformation, GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useSearchStore } from "@/store/search-store"
import { InteractionsBrowser } from "@/features/interactions-browser/components/interactions-browser"
import { AnnotationsBrowser } from "@/features/annotations-browser/components/annotations-browser"
import { IntercellBrowser } from "@/features/intercell-browser/components/intercell-browser"
import { ComplexesBrowser } from "@/features/complexes-browser/components/complexes-browser"
import { EnzSubBrowser } from "@/features/enzsub-browser/components/enzsub-browser"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"

export function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToSearchHistory } = useSearchStore()
  
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState("9606")
  const [proteinData, setProteinData] = useState<GetProteinInformationResponse | null>(null)
  const [isLoadingProtein, setIsLoadingProtein] = useState(false)

  // Get active tab from URL, default to interactions
  const activeTab = searchParams.get('tab') || 'interactions'
  const urlQuery = searchParams.get('q') || ''

  // Update query when URL changes
  useEffect(() => {
    const currentQuery = urlQuery || ''
    setQuery(currentQuery)
  }, [urlQuery])

  // Fetch protein data when URL query exists on mount/refresh
  useEffect(() => {
    const fetchProteinData = async (searchQuery: string, species: string) => {
      if (!searchQuery.trim()) {
        setProteinData(null)
        return
      }

      setIsLoadingProtein(true)
      try {
        const results = await searchIdentifiers(searchQuery.trim(), 20, species)
        if (results.length > 0) {
          const proteinResponse = await getProteinInformation(results)
          setProteinData(proteinResponse)
        } else {
          setProteinData(null)
        }
      } catch (error) {
        console.error("Error fetching protein information on refresh:", error)
        setProteinData(null)
      } finally {
        setIsLoadingProtein(false)
      }
    }

    if (urlQuery) {
      fetchProteinData(urlQuery, selectedSpecies)
    }
  }, [urlQuery, selectedSpecies])

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
      
      // Fetch protein information
      if (results.length > 0) {
        setIsLoadingProtein(true)
        try {
          const proteinResponse = await getProteinInformation(results)
          setProteinData(proteinResponse)
        } catch (error) {
          console.error("Error fetching protein information:", error)
          setProteinData(null)
        } finally {
          setIsLoadingProtein(false)
        }
      } else {
        setProteinData(null)
      }
      
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
          {/* Protein Card */}
          {urlQuery && (
            <div className="flex-shrink-0 flex sm:justify-start justify-center">
              <ProteinSummaryCard 
                proteinData={proteinData ?? undefined}
                isLoading={isLoadingProtein}
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
                {isLoading ? "..." : "Search"}
              </Button>
            </div>
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
            <InteractionsBrowser />
          </TabsContent>

          <TabsContent value="annotations" className="h-full w-full max-w-full overflow-x-hidden">
            <AnnotationsBrowser />
          </TabsContent>

          <TabsContent value="intercell" className="h-full w-full max-w-full overflow-x-hidden">
            <IntercellBrowser />
          </TabsContent>

          <TabsContent value="complexes" className="h-full w-full max-w-full overflow-x-hidden">
            <ComplexesBrowser />
          </TabsContent>

          <TabsContent value="enzsub" className="h-full w-full max-w-full overflow-x-hidden">
            <EnzSubBrowser />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}