"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AIAssistantCard() {
  const [chatMessage, setChatMessage] = useState("")

  return (
    <Card className="md:w-1/2 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500"></div>
      <div className="absolute top-3 right-3">
        <Badge
          variant="outline"
          className="border-amber-500 text-amber-600 font-medium px-2 py-1 flex items-center gap-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Coming Soon
        </Badge>
      </div>
      <CardHeader className="pb-3">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
          <MessageSquare className="h-6 w-6 text-purple-700" />
        </div>
        <CardTitle>OmniPath AI Assistant</CardTitle>
        <CardDescription>
          Get help finding information about proteins, interactions, and biological pathways
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
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
            />
            <Button className="w-full" disabled>
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground mt-2">
            Powered by advanced AI models trained on biological data
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

