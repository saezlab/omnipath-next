"use client"

import { SiteLayout } from "@/components/layout/site-layout"
import { ProteinCatalog } from "@/features/interactions-browser/components/protein-catalog"

export function InteractionsPage() {
  return (
    <SiteLayout>
      <ProteinCatalog 
      />
    </SiteLayout>
  )
}

