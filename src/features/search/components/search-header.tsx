"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { searchIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { Search } from "lucide-react"
import { useState, useCallback, useRef } from "react"
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

function getCurrentQuerySegment(fullQuery: string, cursorPosition?: number): {
  currentSegment: string
  beforeCurrentSegment: string
  afterCurrentSegment: string
  segmentStartIndex: number
  segmentEndIndex: number
} {
  // If no cursor position provided, use the last segment (backward compatibility)
  if (cursorPosition === undefined) {
    const lastCommaIndex = fullQuery.lastIndexOf(',')
    const lastSemicolonIndex = fullQuery.lastIndexOf(';')
    const lastSeparatorIndex = Math.max(lastCommaIndex, lastSemicolonIndex)
    
    if (lastSeparatorIndex === -1) {
      return {
        currentSegment: fullQuery.trim(),
        beforeCurrentSegment: '',
        afterCurrentSegment: '',
        segmentStartIndex: 0,
        segmentEndIndex: fullQuery.length
      }
    }
    
    const afterLastComma = fullQuery.substring(lastSeparatorIndex + 1)
    return {
      currentSegment: afterLastComma.trim(),
      beforeCurrentSegment: fullQuery.substring(0, lastSeparatorIndex + 1),
      afterCurrentSegment: '',
      segmentStartIndex: lastSeparatorIndex + 1,
      segmentEndIndex: fullQuery.length
    }
  }

  // Find all separator positions
  const separators: number[] = []
  for (let i = 0; i < fullQuery.length; i++) {
    if (fullQuery[i] === ',' || fullQuery[i] === ';') {
      separators.push(i)
    }
  }

  // Find which segment contains the cursor
  let segmentStart = 0
  let segmentEnd = fullQuery.length

  for (const separatorPos of separators) {
    if (cursorPosition <= separatorPos) {
      segmentEnd = separatorPos
      break
    }
    segmentStart = separatorPos + 1
  }

  const currentSegment = fullQuery.substring(segmentStart, segmentEnd).trim()
  const beforeCurrentSegment = fullQuery.substring(0, segmentStart)
  const afterCurrentSegment = fullQuery.substring(segmentEnd)

  return {
    currentSegment,
    beforeCurrentSegment,
    afterCurrentSegment,
    segmentStartIndex: segmentStart,
    segmentEndIndex: segmentEnd
  }
}

interface SearchHeaderProps {
  initialQuery: string
  identifierResults: Record<string, SearchIdentifiersResponse>
  activeTab: string
  selectedSpecies?: string
}

export function SearchHeader({ initialQuery, identifierResults, activeTab, selectedSpecies = "9606" }: SearchHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToSearchHistory } = useSearchStore()
  
  const [query, setQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchIdentifiersResponse>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced suggestion fetching
  const debouncedFetchSuggestions = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (searchTerm: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (searchTerm.length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
          }

          setIsFetchingSuggestions(true)
          try {
            const results = await searchIdentifiers(searchTerm, 20, selectedSpecies)
            
            // Deduplicate suggestions by identifier value, keeping the first occurrence
            const seen = new Set<string>()
            const deduplicatedResults = results.filter(result => {
              const key = result.identifierValue.toLowerCase()
              if (seen.has(key)) {
                return false
              }
              seen.add(key)
              return true
            }).slice(0, 10) // Limit to 10 after deduplication
            
            setSuggestions(deduplicatedResults)
            setShowSuggestions(true)
          } catch (error) {
            console.error("Error fetching suggestions:", error)
            setSuggestions([])
            setShowSuggestions(false)
          }
          setIsFetchingSuggestions(false)
        }, 300)
      }
    })(),
    [selectedSpecies]
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const newCursorPosition = e.target.selectionStart || 0
    
    setQuery(newValue)
    setCursorPosition(newCursorPosition)
    setSelectedSuggestionIndex(-1)
    
    const { currentSegment } = getCurrentQuerySegment(newValue, newCursorPosition)
    debouncedFetchSuggestions(currentSegment)
  }, [debouncedFetchSuggestions])

  const handleInputClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    const newCursorPosition = input.selectionStart || 0
    setCursorPosition(newCursorPosition)
    
    // Trigger suggestions for the segment at cursor position
    const { currentSegment } = getCurrentQuerySegment(input.value, newCursorPosition)
    if (currentSegment.length >= 2) {
      debouncedFetchSuggestions(currentSegment)
    }
  }, [debouncedFetchSuggestions])

  const handleInputKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Update cursor position on arrow key navigation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      const input = e.target as HTMLInputElement
      const newCursorPosition = input.selectionStart || 0
      setCursorPosition(newCursorPosition)
      
      // Trigger suggestions for the segment at cursor position
      const { currentSegment } = getCurrentQuerySegment(input.value, newCursorPosition)
      if (currentSegment.length >= 2) {
        debouncedFetchSuggestions(currentSegment)
      }
    }
  }, [debouncedFetchSuggestions])

  const handleSuggestionSelect = useCallback((suggestion: SearchIdentifiersResponse[0]) => {
    const { beforeCurrentSegment, afterCurrentSegment, segmentStartIndex, segmentEndIndex } = 
      getCurrentQuerySegment(query, cursorPosition)
    
    // Replace the current segment with the suggestion
    const newQuery = beforeCurrentSegment + suggestion.identifierValue + afterCurrentSegment
    
    setQuery(newQuery)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestionIndex(-1)
    
    // Set cursor position after the inserted suggestion
    const newCursorPosition = segmentStartIndex + suggestion.identifierValue.length
    setCursorPosition(newCursorPosition)
    
    // Update the actual input cursor position after the state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }, [query, cursorPosition])

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleEnterPress()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex])
        } else {
          handleEnterPress()
        }
        break
      case "Escape":
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, handleSuggestionSelect])

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
          <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder={getPlaceholderText()}
                  className="w-full pl-9 pr-32 h-10 text-base rounded-md shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20 border border-border/40 hover:border-border/60"
                  value={query}
                  onChange={handleInputChange}
                  onClick={handleInputClick}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleInputKeyUp}
                  onBlur={() => {
                    // Close suggestions after a small delay to allow for clicks
                    setTimeout(() => setShowSuggestions(false), 150)
                  }}
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
            </PopoverTrigger>
            
            <PopoverContent 
              className="w-[400px] p-0 bg-popover border-border shadow-lg" 
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command className="bg-popover">
                <CommandList className="max-h-[300px]">
                  {isFetchingSuggestions ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2"></div>
                      Loading suggestions...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <CommandGroup>
                      {suggestions.map((suggestion, index) => (
                        <CommandItem
                          key={`${suggestion.uniprotAccession}-${suggestion.identifierValue}-${index}`}
                          value={suggestion.identifierValue}
                          onSelect={() => handleSuggestionSelect(suggestion)}
                          className={`cursor-pointer px-3 py-2 hover:bg-muted hover:text-foreground dark:hover:bg-secondary dark:hover:text-secondary-foreground transition-colors ${
                            index === selectedSuggestionIndex 
                              ? 'bg-muted text-foreground dark:bg-secondary dark:text-secondary-foreground' 
                              : 'text-popover-foreground'
                          }`}
                        >
                          <div className="flex flex-col w-full">
                            <span className="font-medium text-foreground leading-tight">
                              {suggestion.identifierValue}
                            </span>
                            <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                              {suggestion.identifierType} • {suggestion.uniprotAccession}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      No suggestions found.
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
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