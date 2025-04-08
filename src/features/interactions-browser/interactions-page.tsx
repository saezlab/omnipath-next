"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { ProteinCatalog } from "@/features/interactions-browser/components/protein-catalog"
import { QuickSwitchButton } from "@/components/shared/quick-switch-button"
import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries"

export function InteractionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [entityName, setEntityName] = useState<string | null>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const lastSearchRef = useRef<string>("")

  const handleSearch = async (searchQuery: string, isFromUrl = false) => {
    if (!searchQuery.trim()) return

    // Prevent double search
    if (lastSearchRef.current === searchQuery) return
    lastSearchRef.current = searchQuery

    setIsLoading(true)
    try {
      const response = await searchProteinNeighbors(searchQuery)
      setInteractions(response.interactions)
      setEntityName(searchQuery)
      if (!isFromUrl) {
        router.push(`/interactions?q=${encodeURIComponent(searchQuery)}`)
      }
    } catch (error) {
      console.error("Error fetching interactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (query) {
      handleSearch(query, true)
    }
  }, [query])

  return (
    <SiteLayout>
      <ProteinCatalog 
        initialQuery={query} 
        onEntitySelect={(searchQuery) => handleSearch(searchQuery, false)}
        initialInteractions={interactions}
        isLoading={isLoading}
      />
      <QuickSwitchButton currentView="interactions" entityName={entityName || undefined} />
    </SiteLayout>
  )
}

