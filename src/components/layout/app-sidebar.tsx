"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { 
  Search, 
  Moon, 
  Sun, 
  MessageSquare, 
  Network, 
  Tag
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useSearchStore } from "@/store/search-store"
import { NewChatButton } from "@/components/ai/new-chat-button"
import Image from "next/image"

const navigationItems = [
  {
    title: "Interactions",
    url: "/interactions",
    icon: Network,
  },
  {
    title: "Annotations", 
    url: "/annotations",
    icon: Tag,
  },
  {
    title: "Chat",
    url: "/chat", 
    icon: MessageSquare,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { searchHistory, clearSearchHistory } = useSearchStore()

  // Get entity type color
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case "annotation":
        return "bg-primary/10 text-primary"
      case "interaction":
        return "bg-secondary/10 text-secondary"
      case "chat":
        return "bg-blue-500/10 text-blue-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Get icon for history item type
  const getHistoryIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />
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
    <Sidebar>
      <SidebarHeader className="border-b">
        <Link href="/" className="flex items-center gap-3 px-4 py-4">
          <Image 
            src="/omnipath-logo-gradient.svg" 
            alt="OmniPath Logo" 
            width={32} 
            height={32} 
          />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#007B7F] via-[#6EA945] to-[#FCCC06] bg-clip-text text-transparent">
            OmniPath
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link href={item.url}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {pathname === '/chat' && (
          <>
            <SidebarSeparator />
            <div className="px-3 py-2">
              <NewChatButton 
                initialMessages={[]}
                variant="default"
                className="w-full"
              />
            </div>
          </>
        )}

        {searchHistory.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <div className="flex items-center justify-between px-4 py-2">
                <SidebarGroupLabel className="text-sm font-medium">Recent</SidebarGroupLabel>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSearchHistory}
                  className="h-6 text-xs px-2"
                >
                  Clear
                </Button>
              </div>
              <SidebarGroupContent>
                <ScrollArea className="h-[300px]">
                  <SidebarMenu>
                    {searchHistory.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                          <Link 
                            href={getHistoryItemUrl(item)}
                            className="flex items-center gap-3 py-2 px-4"
                          >
                            {getHistoryIcon(item.type)}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm">{item.query}</p>
                            </div>
                            <Badge className={`${getEntityTypeColor(item.type)} text-xs`}>
                              {item.type}
                            </Badge>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center justify-center p-2">
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
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}