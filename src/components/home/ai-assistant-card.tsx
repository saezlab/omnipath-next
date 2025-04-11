"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
export function AIAssistantCard() {
  const [chatMessage, setChatMessage] = useState("")

  return (

      <Card className="md:w-1/2 relative overflow-hidden group">
    <Link href="/chat">

      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500 opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity duration-300" />
      <div className="absolute top-3 right-3">
        <Badge
          variant="outline"
          className="border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400 font-medium px-2 py-1 flex items-center gap-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-400"></span>
          </span>
          New (experimental)
        </Badge>
      </div>
      <CardHeader className="pb-3 relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
          <MessageSquare className="h-6 w-6 text-purple-700 dark:text-purple-400" />
        </div>
        <CardTitle className="text-xl font-bold">OmniPath AI Assistant</CardTitle>
        <CardDescription className="text-base">
          Get help finding information about proteins, interactions, and biological pathways
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-4">
          <div className="bg-muted/50 dark:bg-muted/30 p-4 rounded-lg group-hover:bg-muted/70 dark:group-hover:bg-muted/50 transition-colors duration-300">
            <p className="text-sm">
              Hello! I can help you find information about proteins, interactions, and biological pathways. What would
              you like to know?
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              placeholder="Ask about a protein or pathway..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled
              className="bg-background/50 dark:bg-background/30"
            />
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600" 
              disabled
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground mt-2">
            Powered by advanced AI models trained on biological data
          </div>
        </div>
      </CardContent>
      </Link>

    </Card>
  )
}

