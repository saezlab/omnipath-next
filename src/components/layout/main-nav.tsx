"use client"

import { cn } from "@/lib/utils"
import { Network, Tag, MessageSquare, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function MainNav() {
  const pathname = usePathname()

  const getPageName = () => {
    if (pathname === "/interactions") return "Interactions"
    if (pathname === "/annotations") return "Annotations"
    if (pathname === "/chat") return "Chat"
    return "Menu"
  }

  return (
    <>
      {/* Mobile: Dropdown menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Menu className="h-4 w-4" />
              <span className="font-medium">{getPageName()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem asChild>
              <Link 
                href="/interactions" 
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  pathname === "/interactions" && "text-primary"
                )}
              >
                <Network className="h-4 w-4" />
                <span>Interactions</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                href="/annotations" 
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  pathname === "/annotations" && "text-primary"
                )}
              >
                <Tag className="h-4 w-4" />
                <span>Annotations</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                href="/chat" 
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  pathname === "/chat" && "text-primary"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Desktop: Original layout */}
      <nav className="hidden sm:flex items-center space-x-4 lg:space-x-6">
        <Link
          href="/interactions"
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
            pathname === "/interactions" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Network className="h-4 w-4" />
          <span>Interactions</span>
        </Link>
        <Link
          href="/annotations"
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
            pathname === "/annotations" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Tag className="h-4 w-4" />
          <span>Annotations</span>
        </Link>
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
            pathname === "/chat" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat</span>
        </Link>
      </nav>
    </>
  )
}

