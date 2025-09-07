import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="h-screen overflow-hidden animate-pulse">
      {/* Initial Chat View Skeleton */}
      <div className="h-full flex items-center justify-center">
        <div className="max-w-2xl w-full px-4 space-y-4">
          {/* AI Welcome Message Skeleton */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
          
          {/* Chat Input Area Skeleton */}
          <div className="space-y-4">
            {/* Input Field Skeleton */}
            <div className="relative">
              <Skeleton className="w-full h-12 rounded-lg" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>

            {/* Suggested Actions Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 rounded bg-muted"></div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3 mt-1" />
                </div>
                <div className="p-3 rounded-lg border border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 rounded bg-muted"></div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4 mt-1" />
                </div>
                <div className="p-3 rounded-lg border border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 rounded bg-muted"></div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
                <div className="p-3 rounded-lg border border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 rounded bg-muted"></div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}