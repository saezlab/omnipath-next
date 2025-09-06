"use client"

import { ArrowRight, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AIAssistantCard() {
  return (
    <Link href="/chat" className="block h-full">
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-accent/10 cursor-pointer h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5 dark:from-accent/10 dark:via-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className="border-accent text-secondary font-medium px-2 py-1 flex items-center gap-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Experimental
          </Badge>
        </div>
        <CardHeader className="pb-3 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="h-6 w-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl font-bold">OmniPath AI Assistant</CardTitle>
          </div>
          <CardDescription className="text-base">
            Get help finding information about proteins, interactions, and biological pathways
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex-1">
          <div className="bg-muted/50 dark:bg-muted/30 p-4 rounded-lg group-hover:bg-muted/70 dark:group-hover:bg-muted/50 transition-colors duration-300">
            <p className="text-sm text-muted-foreground">
              Ask questions about proteins, pathways, and interactions. Get instant insights from OmniPath&apos;s comprehensive biological database.
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
                  Shared limits: 10 requests/min, 250/day. Check back later if unavailable.
            </p>
          </div>
        </CardContent>
        <CardFooter className="relative">
          <div className="w-full flex items-center justify-center gap-2 text-sm font-medium text-accent-foreground">
            Start Chat
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

