import { SearchPage } from "@/features/search/search-page"
import { Suspense } from "react"

export default function Search() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  )
}