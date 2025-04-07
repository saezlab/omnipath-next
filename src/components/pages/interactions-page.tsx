"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { ProteinCatalog } from "@/components/protein-catalog"
import { QuickSwitchButton } from "@/components/shared/quick-switch-button"
import { searchProteinNeighbors } from "@/db/queries"

export function InteractionsPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [entityName, setEntityName] = useState<string | null>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchInteractions = async () => {
      if (query) {
        setIsLoading(true)
        try {
          const response = await searchProteinNeighbors(query)
          setInteractions(response.interactions)
        } catch (error) {
          console.error("Error fetching interactions:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchInteractions()
  }, [query])

  return (
    <SiteLayout>
      <ProteinCatalog 
        initialQuery={query} 
        onEntitySelect={setEntityName}
        initialInteractions={interactions}
        isLoading={isLoading}
      />
      <QuickSwitchButton currentView="interactions" entityName={entityName || undefined} />
    </SiteLayout>
  )
}

