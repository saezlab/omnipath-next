"use client"

import { MainNav } from "@/components/layout/main-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Database, History, Search, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useSearchStore } from "@/store/search-store"

export function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const { searchHistory, clearSearchHistory } = useSearchStore()

  // Get entity type color
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case "annotation":
        return "bg-blue-100 text-blue-800"
      case "interaction":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get the URL for a history item
  const getHistoryItemUrl = (item: typeof searchHistory[0]) => {
    if (item.url) {
      return item.url
    } else {
      // Fallback for old history items that don't have URL
      if (item.type === 'annotation') {
        return `/annotations?q=${encodeURIComponent(item.query)}`
      } else {
        return `/interactions?q=${encodeURIComponent(item.query)}`
      }
    }
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-background">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="flex items-center justify-between px-3 py-2">
                <h4 className="font-medium">Recent Searches</h4>
                <Button variant="ghost" size="sm" onClick={clearSearchHistory}>
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                {searchHistory.length > 0 ? (
                  searchHistory.map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link 
                        href={getHistoryItemUrl(item)}
                        className="flex items-center gap-2 py-2 cursor-pointer"
                      >
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

