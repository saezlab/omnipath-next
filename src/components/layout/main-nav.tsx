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
            <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-2 font-medium">
              <Menu className="size-4" />
              <span>{getPageName()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem asChild>
              <Link 
                href="/interactions" 
                className={cn(
                  "flex items-center gap-3 cursor-pointer py-3 px-4",
                  pathname === "/interactions" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <Network className="h-5 w-5" />
                <span className="text-base">Interactions</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                href="/annotations" 
                className={cn(
                  "flex items-center gap-3 cursor-pointer py-3 px-4",
                  pathname === "/annotations" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <Tag className="h-5 w-5" />
                <span className="text-base">Annotations</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                href="/chat" 
                className={cn(
                  "flex items-center gap-3 cursor-pointer py-3 px-4",
                  pathname === "/chat" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-base">Chat</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Desktop: Original layout */}
      <nav className="hidden sm:flex items-center space-x-2">
        <Link
          href="/interactions"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all hover:bg-accent/50",
            pathname === "/interactions" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Network className="h-5 w-5" />
          <span>Interactions</span>
        </Link>
        <Link
          href="/annotations"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all hover:bg-accent/50",
            pathname === "/annotations" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Tag className="h-5 w-5" />
          <span>Annotations</span>
        </Link>
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all hover:bg-accent/50",
            pathname === "/chat" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Chat</span>
        </Link>
      </nav>
    </>
  )
}

