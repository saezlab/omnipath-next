"use client";

import { Chat } from "@/components/ai/chat";
import { SiteLayout } from "@/components/layout/chat-layout";
import { Message } from "ai";

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
      <Chat id="main-chat" initialMessages={initialMessages} />
    </SiteLayout>
  );
} 