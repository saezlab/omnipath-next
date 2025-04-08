import { Suspense } from "react"
import { AnnotationsPage } from "@/features/annotations-browser/annotations-page"

export default function Annotations() {
  return (
    <Suspense>
      <AnnotationsPage />
    </Suspense>
  )
}

