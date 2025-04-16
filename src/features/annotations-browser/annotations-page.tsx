"use client"

import { SiteLayout } from "@/components/layout/main-layout"
import { AnnotationsBrowser } from "@/features/annotations-browser/components/annotations-browser"

export function AnnotationsPage() {

  return (
    <SiteLayout>
      <AnnotationsBrowser />
    </SiteLayout>
  )
}

