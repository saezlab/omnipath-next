import { Skeleton } from "@/components/ui/skeleton"
import { Search as SearchIcon } from "lucide-react"

export default function Loading() {
  return (
    <div className="grid grid-rows-[auto_1fr] h-screen max-w-7xl mx-auto px-2 sm:px-4 pb-6 pt-4 gap-4 animate-pulse">
      {/* Header Content Skeleton */}
      <div className="flex flex-col gap-4">
        {/* Search Bar Row Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full">
          {/* Search Bar Skeleton */}
          <div className="flex-1">
            <div className="relative group">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Skeleton className="w-full h-10 rounded-md" />
              <Skeleton className="absolute right-20 top-1/2 -translate-y-1/2 h-6 w-18 rounded" />
              <Skeleton className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-16 rounded" />
            </div>
          </div>
        </div>

        {/* Tabs Header Skeleton */}
        <div className="w-full">
          <div className="relative rounded-sm overflow-x-auto h-9 bg-muted">
            <div className="absolute flex flex-row justify-stretch w-full min-w-fit p-1 gap-1">
              <Skeleton className="h-7 flex-1 rounded-sm" />
              <Skeleton className="h-7 flex-1 rounded-sm" />
              <Skeleton className="h-7 flex-1 rounded-sm" />
              <Skeleton className="h-7 flex-1 rounded-sm" />
              <Skeleton className="h-7 flex-1 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="min-h-0 w-full max-w-full overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="h-12 w-12 rounded-full bg-muted mb-4 flex items-center justify-center">
            <SearchIcon size={24} className="text-muted-foreground" />
          </div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  )
}