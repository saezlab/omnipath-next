"use client"

import { MainNav } from "@/components/layout/main-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Search, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useSearchStore } from "@/store/search-store"
import Image from "next/image"

export function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const { searchHistory, clearSearchHistory } = useSearchStore()

  // Get entity type color
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case "annotation":
        return "bg-primary/10 text-primary"
      case "interaction":
        return "bg-secondary/10 text-secondary"
      default:
        return "bg-muted text-muted-foreground"
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
    <header className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        {/* Mobile Layout */}
        <div className="sm:hidden flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/omnipath-logo-gradient.svg" alt="OmniPath Logo" width={32} height={32} />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#007B7F] via-[#6EA945] to-[#FCCC06] bg-clip-text text-transparent">
              OmniPath
            </span>
          </Link>
          
          {/* Navigation dropdown in the middle */}
          <MainNav />
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <History className="size-4" />
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

        {/* Desktop Layout */}
        <div className="hidden sm:flex h-16 items-center">
          <Link href="/" className="flex items-center gap-3 mr-8">
            <Image src="/omnipath-logo-gradient.svg" alt="OmniPath Logo" width={56} height={56} />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#007B7F] via-[#6EA945] to-[#FCCC06] bg-clip-text text-transparent">
              OmniPath
            </span>
          </Link>

          <div className="flex-1 flex justify-center">
            <div className="bg-muted/30 rounded-full">
              <MainNav />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <History className="h-5 w-5" />
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
      </div>
    </header>
  )
}

