"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { searchIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { Search } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  identifierResults: Record<string, SearchIdentifiersResponse>
  activeTab: string
  selectedSpecies?: string
}

export function SearchHeader({ identifierResults, activeTab, selectedSpecies = "9606" }: SearchHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToSearchHistory } = useSearchStore()
  
  // Use URL as source of truth for query
  const currentQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(currentQuery)
  const [isLoading, setIsLoading] = useState(false)
  
  // Sync local state with URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    setQuery(urlQuery)
  }, [searchParams])


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
    // Check if query contains badges (comma-separated values ending with comma)
    const hasSelectedBadges = query.endsWith(',') && query.split(',').some(part => part.trim())
    const hasCurrentTyping = query.trim() && !query.endsWith(',')
    
    // If there are selected badges but no current typing, trigger search
    if (hasSelectedBadges && !hasCurrentTyping) {
      await handleSearch(query.trim())
      return
    }
    
    // If there's no meaningful content at all, don't search
    if (!query.trim()) {
      return
    }

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEnterPress()
    }
  }, [handleEnterPress])

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
    <div className="flex flex-col gap-4">
      {/* Search Bar and Protein Card Row */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full">
        {/* Entity Card - only for single queries and only for proteins/genes */}
        {currentQuery && parseQueries(currentQuery).length === 1 && (() => {
          const singleQuery = parseQueries(currentQuery)[0]
          const isEntityTypePrefixed = singleQuery.includes(':')
          const isProteinOrGene = !isEntityTypePrefixed
          
          return isProteinOrGene && (
            <div className="flex-shrink-0 flex sm:justify-start justify-center">
              <ProteinSummaryCard 
                geneSymbol={singleQuery}
                identifierResults={identifierResults[singleQuery] || []}
              />
            </div>
          )
        })()}

        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
            <AutocompleteInput
              value={query}
              onChange={setQuery}
              onKeyDown={handleKeyDown}
              onSearch={(searchQuery) => handleSearch(searchQuery)}
              placeholder={getPlaceholderText()}
              className="w-full pl-9 pr-32 h-10 text-base rounded-md shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20 border border-border/40 hover:border-border/60"
              selectedSpecies={selectedSpecies}
              disabled={isLoading}
            />
            <div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
              <Select value={selectedSpecies} onValueChange={(value) => {
                // Update URL with new species
                const params = new URLSearchParams(searchParams.toString())
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
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-sm z-10"
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
          {currentQuery && parseQueries(currentQuery).length > 1 && (() => {
            const queries = parseQueries(currentQuery)
            const proteinQueries = queries.filter(term => !term.includes(':')) // Only show cards for proteins/genes
            
            return proteinQueries.length > 0 && (
              <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {queries.map((term, index) => {
                  const isProteinOrGene = !term.includes(':')
                  
                  return isProteinOrGene ? (
                    <ProteinSummaryCard
                      key={index}
                      geneSymbol={term}
                      identifierResults={identifierResults[term] || []}
                      onRemove={() => {
                        const remaining = queries.filter((_, i) => i !== index)
                        const newQuery = remaining.length > 0 ? remaining.join(', ') + ', ' : ''
                        setQuery(newQuery)
                        
                        const params = new URLSearchParams(searchParams.toString())
                        if (remaining.length > 0) {
                          params.set('q', remaining.join(', ') + ', ')
                        } else {
                          params.delete('q')
                        }
                        params.set('tab', activeTab)
                        router.push(`/search?${params.toString()}`)
                      }}
                    />
                  ) : null
                })}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="relative rounded-sm overflow-x-auto h-9 bg-muted flex-shrink-0">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
        </Tabs>
      </div>
    </div>
  )
}