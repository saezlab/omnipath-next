"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/store/search-store";

interface NewChatButtonProps {
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  className?: string;
}

export function NewChatButton({ 
  size = "sm",
  variant = "default",
  className
}: NewChatButtonProps) {
  const router = useRouter();
  const { startNewChat } = useSearchStore();

  const handleNewChat = () => {
    // Create new chat with greeting message
    const defaultMessages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [{ type: 'text' as const, text: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?" }],
      },
    ];
    const newChatId = startNewChat(defaultMessages);
    
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