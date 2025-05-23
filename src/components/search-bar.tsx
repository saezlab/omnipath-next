"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { searchIdentifiers } from "@/db/queries"
import { Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  isLoading?: boolean
  initialQuery?: string
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  isLoading = false,
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof searchIdentifiers>>>([])
  const [isOpen, setIsOpen] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const querySetBySelectionRef = useRef(false)
  const prevQueryRef = useRef(initialQuery)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (query === prevQueryRef.current) {
      return
    }

    prevQueryRef.current = query

    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    if (querySetBySelectionRef.current) {
      querySetBySelectionRef.current = false
      return
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await searchIdentifiers(query)
        setSuggestions(results)
        setIsOpen(results.length > 0)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        toast.error("Failed to fetch search suggestions")
        setIsOpen(false)
      } 
    }, 300)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  const handleSearch = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    if (query.trim()) {
      onSearch(query)
      setIsOpen(false)
    }
  }

  const handleSelect = (uniprotAccession: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    querySetBySelectionRef.current = true
    setQuery(uniprotAccession)
    onSearch(uniprotAccession)
    setIsOpen(false)
  }

  return (
    <div className="w-full bg-background sticky top-0 z-10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    type="search"
                    placeholder={placeholder}
                    className="w-full pl-12 pr-4 h-12 text-lg rounded-full shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full shadow-sm transition-all hover:shadow-md"
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command>
                  <CommandGroup>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`${suggestion.uniprotAccession}-${suggestion.identifierValue}-${index}`}
                        onSelect={() => handleSelect(suggestion.uniprotAccession)}
                      >
                        <div className="flex flex-col">
                          <span>{suggestion.identifierValue}</span>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.identifierType} - {suggestion.uniprotAccession}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  )
}