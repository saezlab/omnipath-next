"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { AnnotationsBrowser } from "@/features/annotations-browser/components/annotations-browser"
import { QuickSwitchButton } from "@/components/shared/quick-switch-button"

export function AnnotationsPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [entityName, setEntityName] = useState<string | null>(null)

  useEffect(() => {
    if (query) {
      setEntityName(query)
    }
  }, [query])

  return (
    <SiteLayout>
      <AnnotationsBrowser initialQuery={query} />
      <QuickSwitchButton currentView="annotations" entityName={entityName || undefined} />
    </SiteLayout>
  )
}

