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
    addToSearchHistory(termForDisplay, activeTab as 'interaction' | 'annotation' | 'intercell', newUrl)
    
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
    } else {
      return "Search interactions..."
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto px-2 sm:px-4 pb-6 mt-4">
      {/* Full Width Search Bar */}
      <div className="w-full">
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

      {/* Centered Protein Card */}
      {urlQuery && (
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <ProteinSummaryCard 
              proteinData={proteinData ?? undefined}
              isLoading={isLoadingProtein}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="annotations">Annotations</TabsTrigger>
          <TabsTrigger value="intercell">Intercell</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interactions">
          <InteractionsBrowser />
        </TabsContent>

        <TabsContent value="annotations">
          <AnnotationsBrowser />
        </TabsContent>

        <TabsContent value="intercell">
          <IntercellBrowser />
        </TabsContent>
      </Tabs>
    </div>
  )
}