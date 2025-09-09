"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { Search } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSearchStore } from "@/store/search-store"
import { ProteinSummaryCard } from "@/features/annotations-browser/components/protein-summary-card"

function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

interface SearchHeaderProps {
  initialQuery: string
  identifierResults: Record<string, SearchIdentifiersResponse>
  activeTab: string
  selectedSpecies?: string
}

export function SearchHeader({ initialQuery, identifierResults, activeTab, selectedSpecies = "9606" }: SearchHeaderProps) {
  const router = useRouter()
  const { addToSearchHistory } = useSearchStore()
  
  const [query, setQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (searchQuery: string, displayTerm?: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    // Use displayTerm for UI and URL, fallback to searchQuery
    const termForDisplay = displayTerm || searchQuery.trim()

    // Create new URL with display term, current tab, and species
    const params = new URLSearchParams()
    params.set('q', termForDisplay)
    params.set('tab', activeTab)
    params.set('species', selectedSpecies)
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
    <div className="flex flex-col gap-4">
      {/* Search Bar and Protein Card Row */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full">
        {/* Protein Card - only for single queries */}
        {initialQuery && parseQueries(initialQuery).length === 1 && (
          <div className="flex-shrink-0 flex sm:justify-start justify-center">
            <ProteinSummaryCard 
              geneSymbol={parseQueries(initialQuery)[0]}
              identifierResults={identifierResults[parseQueries(initialQuery)[0]] || []}
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
              <Select value={selectedSpecies} onValueChange={(value) => {
                // Update URL with new species
                const params = new URLSearchParams(window.location.search)
                params.set('species', value)
                if (query) params.set('q', query)
                params.set('tab', activeTab)
                router.push(`/search?${params.toString()}`)
              }}>
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
          {initialQuery && parseQueries(initialQuery).length > 1 && (
            <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {parseQueries(initialQuery).map((term, index) => (
                <ProteinSummaryCard
                  key={index}
                  geneSymbol={term}
                  identifierResults={identifierResults[term] || []}
                  onRemove={() => {
                    const remaining = parseQueries(initialQuery).filter((_, i) => i !== index)
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
    </div>
  )
}