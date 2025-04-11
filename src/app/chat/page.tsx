"use client";

import { Chat } from "@/components/ai/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Message } from "ai";
import { SiteLayout } from "@/components/layout/site-layout";

export default function ChatPage() {
  const initialMessages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?",
    },
  ];

  return (
    <SiteLayout>
      <div className="container mx-auto p-4">
        <Card className="h-[calc(100vh-12rem)]">
          <CardContent className="h-[calc(100%-4rem)] p-0">
            <Chat id="main-chat" initialMessages={initialMessages} />
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
} 