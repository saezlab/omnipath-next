"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  placeholder?: string
  defaultValue?: string
  onSearch?: (query: string) => void
  redirectPath?: string
}

export function SearchBar({
  placeholder = "Search for proteins, genes, complexes, or interactions...",
  defaultValue = "",
  onSearch,
  redirectPath,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return

    setIsLoading(true)

    if (onSearch) {
      onSearch(query)
    }

    if (redirectPath) {
      router.push(`${redirectPath}?q=${encodeURIComponent(query)}`)
    }

    setIsLoading(false)
  }

  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className="w-full pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <Button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </div>
  )
}

