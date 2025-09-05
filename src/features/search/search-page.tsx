"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchIdentifiers } from "@/db/queries"
import { getProteinInformation, GetProteinInformationResponse } from "@/features/annotations-browser/api/queries"
import { Search, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useSearchStore } from "@/store/search-store"
import { InteractionsBrowser } from "@/features/interactions-browser/components/interactions-browser"
import { AnnotationsBrowser } from "@/features/annotations-browser/components/annotations-browser"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"

export function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { 
    addToSearchHistory, 
    currentSearchTerm, 
    setCurrentSearchTerm,
    setIdentifierResults,
    setSpeciesFilter 
  } = useSearchStore()
  
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchIdentifiers>>>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState("9606")
  const [proteinData, setProteinData] = useState<GetProteinInformationResponse | null>(null)
  const [isLoadingProtein, setIsLoadingProtein] = useState(false)

  // Get active tab from URL, default to interactions
  const activeTab = searchParams.get('tab') || 'interactions'
  const urlQuery = searchParams.get('q') || ''

  // Update query when URL changes or shared search term changes
  useEffect(() => {
    const currentQuery = urlQuery || currentSearchTerm || ''
    setQuery(currentQuery)
  }, [urlQuery, currentSearchTerm])

  const handleSearch = async (searchQuery: string, displayTerm?: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    // Use displayTerm for UI and URL, fallback to searchQuery
    const termForDisplay = displayTerm || searchQuery.trim()

    // Update shared search term with display term
    setCurrentSearchTerm(termForDisplay)

    // Create new URL with display term and current tab
    const params = new URLSearchParams()
    params.set('q', termForDisplay)
    params.set('tab', activeTab)
    const newUrl = `/search?${params.toString()}`
    
    // Add to search history with display term
    addToSearchHistory(termForDisplay, activeTab as 'interaction' | 'annotation', newUrl)
    
    // Navigate to search page with query and tab
    router.push(newUrl)
    
    setIsLoading(false)
  }

  const handleEnterPress = async () => {
    if (!query.trim()) return

    try {
      // Fetch suggestions for the current query with species filter
      const results = await searchIdentifiers(query.trim(), 20, selectedSpecies)
      setSuggestions(results)
      
      // Store the identifier results and species filter immediately
      setIdentifierResults(query.trim(), results)
      setSpeciesFilter(selectedSpecies)
      
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
        // Show alternatives if there are more than 1 result
        setShowAlternatives(results.length > 1)
        
        // Use the original query (not bestMatch.identifierValue) to maintain consistency
        await handleSearch(query.trim(), bestMatch.identifierValue)
      } else {
        // No suggestions found, search with the raw query
        await handleSearch(query.trim())
        setShowAlternatives(false)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast.error("Failed to fetch search suggestions")
      // Fallback to searching with raw query
      await handleSearch(query)
      setShowAlternatives(false)
    }
  }

  const handleSelect = (identifierValue: string, uniprotAccession: string) => {
    setQuery(identifierValue)
    handleSearch(uniprotAccession, identifierValue)
    setShowAlternatives(false)
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
    } else {
      return "Search interactions..."
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-2 sm:px-4 pb-6 mt-4">
      {/* Search Bar */}
      <div className="w-full">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="search"
            placeholder={getPlaceholderText()}
            className="w-full pl-9 pr-24 h-12 text-base rounded-md shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20 border border-border/40 hover:border-border/60"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnterPress()}
          />
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger size="sm" className="h-8 w-20 text-sm border-0 bg-transparent shadow-none p-2">
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
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-4 text-sm"
          >
            {isLoading ? "..." : "Search"}
          </Button>
        </div>
        
        {/* Or did you mean section */}
        {showAlternatives && suggestions.length > 1 && (
          <Collapsible className="mt-2">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span>Or did you mean:</span>
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-1">
                {suggestions.slice(1, 8).map((suggestion, index) => (
                  <button
                    key={`${suggestion.uniprotAccession}-${suggestion.identifierValue}-${index}`}
                    onClick={() => handleSelect(suggestion.identifierValue, suggestion.uniprotAccession)}
                    className="w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm truncate">{suggestion.identifierValue}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="truncate">{suggestion.uniprotAccession}</span>
                        {suggestion.taxonId && (
                          <>
                            <span>•</span>
                            <span className="truncate">{suggestion.taxonId === '9606' ? 'Human' : suggestion.taxonId === '10090' ? 'Mouse' : suggestion.taxonId === '10116' ? 'Rat' : suggestion.taxonId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Protein Summary Card - shown when there's a search query */}
      {urlQuery && (
        <div className="w-full">
          <ProteinSummaryCard 
            proteinData={proteinData ?? undefined}
            isLoading={isLoadingProtein}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="annotations">Annotations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interactions" className="mt-6">
          <InteractionsBrowser />
        </TabsContent>
        
        <TabsContent value="annotations" className="mt-6">
          <AnnotationsBrowser />
        </TabsContent>
      </Tabs>
    </div>
  )
}