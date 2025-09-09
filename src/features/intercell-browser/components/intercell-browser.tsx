"use client"

import { GetIntercellDataResponse } from "@/features/intercell-browser/api/queries"
import { IntercellTable } from "@/features/intercell-browser/components/intercell-table"
import { useIntercellBrowser } from "@/features/intercell-browser/hooks/useIntercellBrowser"
import { Info } from "lucide-react"

interface IntercellBrowserProps {
  data?: GetIntercellDataResponse
  isLoading?: boolean
}

export function IntercellBrowser({ data, isLoading = false }: IntercellBrowserProps) {
  const { query, filteredData } = useIntercellBrowser(data)

  return (
    <div className="flex flex-col w-full h-full">
      {query ? (
        <div className="flex flex-col w-full h-full min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading intercell data...</p>
            </div>
          ) : data?.intercellEntries && data.intercellEntries.length > 0 ? (
            filteredData.length > 0 ? (
              <IntercellTable entries={filteredData} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results match your filters</h3>
                <p className="text-muted-foreground max-w-md">
                  Try adjusting your filter criteria to see more intercell data.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No intercell data found</h3>
              <p className="text-muted-foreground max-w-md">
                No intercell data found for &ldquo;{query}&rdquo;. Try searching for a different protein.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Welcome to Intercell Browser</h3>
          <p className="text-muted-foreground max-w-md">
            Search for a protein to explore its intercellular communication roles and cellular localization data.
          </p>
        </div>
      )}
    </div>
  )
}