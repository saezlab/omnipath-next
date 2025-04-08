"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { ProteinCatalog } from "@/features/interactions-browser/components/protein-catalog"
import { QuickSwitchButton } from "@/components/shared/quick-switch-button"
import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries"
import { useSearchStore } from "@/store/search-store"

export function InteractionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  
  const {
    interactionsQuery,
    interactionsResults,
    setInteractionsQuery,
    setInteractionsResults,
  } = useSearchStore()

  const lastSearchRef = useRef<string>("")

  const handleSearch = async (searchQuery: string, isFromUrl = false) => {
    if (!searchQuery.trim()) return

    // Prevent double search
    if (lastSearchRef.current === searchQuery) return
    lastSearchRef.current = searchQuery

    try {
      const response = await searchProteinNeighbors(searchQuery)
      setInteractionsResults(response.interactions)
      setInteractionsQuery(searchQuery)
      if (!isFromUrl) {
        router.push(`/interactions?q=${encodeURIComponent(searchQuery)}`)
      }
    } catch (error) {
      console.error("Error fetching interactions:", error)
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
        initialInteractions={interactionsResults}
        isLoading={false}
      />
      <QuickSwitchButton currentView="interactions" entityName={interactionsQuery || undefined} />
    </SiteLayout>
  )
}

