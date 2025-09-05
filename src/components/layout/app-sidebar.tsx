"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar"
import { 
  Search, 
  Moon, 
  Sun, 
  MessageSquare,
  ChevronsUpDown,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useSearchStore } from "@/store/search-store"
import { NewChatButton } from "@/components/ai/new-chat-button"
import Image from "next/image"
import { useFilters } from "@/contexts/filter-context"
import { FilterSidebar } from "@/features/interactions-browser/components/filter-sidebar"
import { AnnotationsFilterSidebar } from "@/features/annotations-browser/components/filter-sidebar"

const navigationItems = [
  {
    title: "Search",
    url: "/search",
    icon: Search,
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
  const { searchHistory, clearSearchHistory, chats, currentChatId, switchChat, deleteChat } = useSearchStore()
  const { isMobile } = useSidebar()
  const { filterData } = useFilters()

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
      const tabParam = item.type === 'annotation' ? 'annotations' : 'interactions'
      return `/search?tab=${tabParam}&q=${encodeURIComponent(item.query)}`
    }
  }

  // Get chat preview text from messages
  const getChatPreview = (chat: typeof chats[0]) => {
    if (chat.messages.length === 0) {
      return "New chat"
    }
    
    // Find first user message
    const firstUserMessage = chat.messages.find(msg => msg.role === 'user')
    if (firstUserMessage && firstUserMessage.parts && firstUserMessage.parts.length > 0) {
      const textPart = firstUserMessage.parts.find(part => part.type === 'text')
      if (textPart?.text) {
        return textPart.text.length > 15 
          ? textPart.text.slice(0, 15) + '...'
          : textPart.text
      }
    }
    
    return "New chat"
  }

  // Handle chat deletion
  const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    deleteChat(chatId)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    <Image 
                      src="/omnipath-logo-gradient.svg" 
                      alt="OmniPath Logo" 
                      width={40} 
                      height={40}
                    />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-lg bg-gradient-to-r from-[#007B7F] via-[#6EA945] to-[#FCCC06] bg-clip-text text-transparent">
                      OmniPath
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {searchHistory.length} recent items
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Recent Activity
                </DropdownMenuLabel>
                {searchHistory.length > 0 ? (
                  <>
                    <ScrollArea className="h-[300px]">
                      {searchHistory.map((item) => (
                        <DropdownMenuItem key={item.id} asChild>
                          <Link 
                            href={getHistoryItemUrl(item)}
                            className="flex items-center gap-3 py-2 px-2"
                          >
                            {getHistoryIcon(item.type)}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm">{item.query}</p>
                            </div>
                            <Badge className={`${getEntityTypeColor(item.type)} text-xs`}>
                              {item.type}
                            </Badge>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </ScrollArea>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={clearSearchHistory}
                      className="gap-2 p-2 text-muted-foreground"
                    >
                      Clear History
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="px-3 py-6 text-center text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/"
                    className="gap-2 p-2 text-muted-foreground"
                  >
                    Go to Home
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
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
            <div className="px-3">
              <SidebarSeparator />
            </div>
            <div className="px-3 py-2">
              <NewChatButton 
                variant="default"
                className="w-full"
              />
            </div>
            
            {/* Chat History Section */}
            {chats.filter(chat => 
              chat.messages.length > 0 && 
              chat.messages.some(msg => msg.role === 'user')
            ).length > 0 && (
              <>
                <div className="px-3">
                  <SidebarSeparator />
                </div>
                <SidebarGroup>
                  <div className="px-3 py-1">
                    <h3 className="text-xs font-medium text-muted-foreground">Chat History</h3>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <SidebarMenu>
                      {chats
                        .filter(chat => 
                          chat.messages.length > 0 && 
                          chat.messages.some(msg => msg.role === 'user')
                        )
                        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
                        .map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <div className="group relative">
                              <SidebarMenuButton
                                asChild
                                isActive={currentChatId === chat.id}
                                className="pr-8"
                              >
                                <Link href={`/chat?id=${chat.id}`} onClick={() => switchChat(chat.id)}>
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="truncate">{getChatPreview(chat)}</span>
                                </Link>
                              </SidebarMenuButton>
                              {chats.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                  </ScrollArea>
                </SidebarGroup>
              </>
            )}
          </>
        )}

        {/* Render filters only on search page with appropriate tab */}
        {filterData && pathname === '/search' && (
          <>
            <div className="px-3">
              <SidebarSeparator />
            </div>
            <div className="flex-1 overflow-hidden pb-4">
              <ScrollArea className="h-full">
                <div className="px-1">
                  {filterData.type === "interactions" && (
                    <FilterSidebar
                      filters={filterData.filters}
                      filterCounts={filterData.filterCounts}
                      onFilterChange={filterData.onFilterChange}
                      onClearFilters={filterData.onClearFilters}
                    />
                  )}
                  {filterData.type === "annotations" && (
                    <AnnotationsFilterSidebar
                      filters={filterData.filters}
                      filterCounts={filterData.filterCounts}
                      onFilterChange={filterData.onFilterChange}
                      onClearFilters={filterData.onClearFilters}
                    />
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}


      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center justify-center">
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