"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MainNav } from "@/components/layout/main-nav"
import { Search } from "lucide-react"

// Sample recent searches
const RECENT_SEARCHES = [
  { id: 1, query: "TP53", type: "protein" },
  { id: 2, query: "EGFR", type: "protein" },
  { id: 3, query: "mTORC1", type: "complex" },
  { id: 4, query: "IL6", type: "protein" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [searchHistory, setSearchHistory] = useState(RECENT_SEARCHES)

  // Get entity type color
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case "protein":
        return "bg-blue-100 text-blue-800"
      case "gene":
        return "bg-green-100 text-green-800"
      case "complex":
        return "bg-purple-100 text-purple-800"
      case "interaction":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background">
      <div className="container flex h-16 items-center px-4 mx-auto">
        <div className="flex items-center gap-2 mr-4">
          <Database className="h-6 w-6" />
          <Link href="/" className="text-xl font-bold tracking-tight">
            OmniPath
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          <MainNav />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled>
                <History className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="flex items-center justify-between px-3 py-2">
                <h4 className="font-medium">Recent Searches</h4>
                <Button variant="ghost" size="sm" onClick={() => setSearchHistory([])}>
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                {searchHistory.length > 0 ? (
                  searchHistory.map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link href={`/interactions?q=${item.query}`} className="flex items-center gap-2 py-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p>{item.query}</p>
                        </div>
                        <Badge className={`${getEntityTypeColor(item.type)} text-xs`}>{item.type}</Badge>
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-muted-foreground">
                    <p>No recent searches</p>
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

