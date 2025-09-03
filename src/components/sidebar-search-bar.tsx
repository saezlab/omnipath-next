"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchIdentifiers } from "@/db/queries"
import { Search, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { toast } from "sonner"
import { useSearchStore } from "@/store/search-store"

interface SidebarSearchBarProps {
  placeholder?: string
  className?: string
}

export function SidebarSearchBar({
  placeholder = "Search...",
  className = "",
}: SidebarSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
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

  // Update query when URL changes or shared search term changes
  useEffect(() => {
    const currentQuery = searchParams.get('q') || currentSearchTerm || ''
    setQuery(currentQuery)
  }, [searchParams, currentSearchTerm])



  const handleSearch = async (searchQuery: string, displayTerm?: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    // Use displayTerm for UI and URL, fallback to searchQuery
    const termForDisplay = displayTerm || searchQuery.trim()

    // Update shared search term with display term
    setCurrentSearchTerm(termForDisplay)

    // Determine target page based on current pathname or default to interactions
    const isAnnotationsPage = pathname === '/annotations'
    const targetPath = isAnnotationsPage ? '/annotations' : '/interactions'
    const searchType = isAnnotationsPage ? 'annotation' : 'interaction'
    
    // Create new URL with display term
    const params = new URLSearchParams()
    params.set('q', termForDisplay)
    const newUrl = `${targetPath}?${params.toString()}`
    
    // Add to search history with display term
    addToSearchHistory(termForDisplay, searchType, newUrl)
    
    // Navigate to search page
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

  const getPlaceholderText = () => {
    if (pathname === '/annotations') {
      return "Search annotations..."
    } else if (pathname === '/interactions') {
      return "Search interactions..."
    }
    return placeholder
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          type="search"
          placeholder={getPlaceholderText()}
          className="w-full pl-9 pr-24 h-9 text-sm rounded-md shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20 border border-border/40 hover:border-border/60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEnterPress()}
        />
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
            <SelectTrigger size="sm" className="h-7 w-16 text-xs border-0 bg-transparent shadow-none p-1">
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
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
        >
          {isLoading ? "..." : "Go"}
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
  )
}