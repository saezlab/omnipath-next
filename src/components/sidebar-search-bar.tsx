"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { searchIdentifiers } from "@/db/queries"
import { Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
  const { addToSearchHistory, currentSearchTerm, setCurrentSearchTerm } = useSearchStore()
  
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchIdentifiers>>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  // Update query when URL changes or shared search term changes
  useEffect(() => {
    const currentQuery = searchParams.get('q') || currentSearchTerm || ''
    setQuery(currentQuery)
  }, [searchParams, currentSearchTerm])

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await searchIdentifiers(query)
        setSuggestions(results)
        setIsOpen(results.length > 0)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        toast.error("Failed to fetch search suggestions")
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    // Update shared search term
    setCurrentSearchTerm(searchQuery.trim())

    // Determine target page based on current pathname or default to interactions
    const isAnnotationsPage = pathname === '/annotations'
    const targetPath = isAnnotationsPage ? '/annotations' : '/interactions'
    const searchType = isAnnotationsPage ? 'annotation' : 'interaction'
    
    // Create new URL with search query
    const params = new URLSearchParams()
    params.set('q', searchQuery)
    const newUrl = `${targetPath}?${params.toString()}`
    
    // Add to search history
    addToSearchHistory(searchQuery, searchType, newUrl)
    
    // Navigate to search page
    router.push(newUrl)
    
    setIsOpen(false)
    setIsLoading(false)
  }

  const handleSelect = (uniprotAccession: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    setQuery(uniprotAccession)
    handleSearch(uniprotAccession)
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
      <Popover open={isOpen && suggestions.length > 0} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              type="search"
              placeholder={getPlaceholderText()}
              className="w-full pl-9 pr-16 h-9 text-sm rounded-md shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20 border border-border/40 hover:border-border/60"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            />
            <Button
              onClick={() => handleSearch(query)}
              disabled={isLoading || !query.trim()}
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
            >
              {isLoading ? "..." : "Go"}
            </Button>
          </div>
        </PopoverTrigger>
        {suggestions.length > 0 && (
          <PopoverContent 
            className="w-[--radix-popover-trigger-width] p-0 max-h-60 overflow-y-auto border border-border/40" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandGroup>
                {suggestions.slice(0, 8).map((suggestion, index) => (
                  <CommandItem
                    key={`${suggestion.uniprotAccession}-${suggestion.identifierValue}-${index}`}
                    onSelect={() => handleSelect(suggestion.uniprotAccession)}
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
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}