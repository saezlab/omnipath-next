"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/store/search-store";
import { UIMessage } from "ai";
import { ChatMessage } from "@/types/chat";

interface NewChatButtonProps {
  initialMessages: UIMessage[];
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  className?: string;
}

export function NewChatButton({ 
  initialMessages, 
  size = "sm",
  variant = "default",
  className
}: NewChatButtonProps) {
  const router = useRouter();
  const { startNewChat } = useSearchStore();

  const handleNewChat = () => {
    // Convert UIMessage to ChatMessage format (if any initial messages provided)
    const chatMessages: ChatMessage[] = initialMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      parts: msg.parts
    }));
    
    // Create new chat with proper ID generation
    const newChatId = startNewChat(chatMessages);
    
    // Navigate to the new chat URL
    router.push(`/chat?id=${newChatId}`);
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleNewChat}
      className={className || "h-8 px-3"}
    >
      <Plus className="h-4 w-4 mr-1" />
      New Chat
    </Button>
  );
}