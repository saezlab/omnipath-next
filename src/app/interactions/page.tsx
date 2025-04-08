import { InteractionsPage } from "@/features/interactions-browser/interactions-page"
import { Suspense } from "react"

export default function Interactions() {
  return (
    <Suspense>
      <InteractionsPage />
    </Suspense>
  )
}

