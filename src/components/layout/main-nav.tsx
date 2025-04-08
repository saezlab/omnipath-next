"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Network, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
{/*       <Link
        href="/"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Home</span>
      </Link> */}
      <Link
        href="/interactions"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/interactions" ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Network className="h-4 w-4" />
        <span className="hidden sm:inline">Interactions</span>
      </Link>
      <Link
        href="/annotations"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/annotations" ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Tag className="h-4 w-4" />
        <span className="hidden sm:inline">Annotations</span>
      </Link>
    </nav>
  )
}

