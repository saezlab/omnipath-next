"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useEffect } from "react"

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

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <div className="w-full bg-background sticky top-0 z-10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                type="search"
                placeholder={placeholder}
                className="w-full pl-12 pr-4 h-12 text-lg rounded-full shadow-sm transition-all focus:shadow-md focus:ring-2 focus:ring-primary/20"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
          </div>
        </div>
      </div>
    </div>
  )
} 