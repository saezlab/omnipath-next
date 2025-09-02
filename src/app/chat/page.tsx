"use client";

import { Chat } from "@/components/ai/chat";
import { UIMessage } from "ai";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStore } from "@/store/search-store";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('id');
  const { chats, switchChat, startNewChat } = useSearchStore();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatIdToUse, setChatIdToUse] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [storeLoaded, setStoreLoaded] = useState(false);

  // Wait for the store to load from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setStoreLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasInitialized || !storeLoaded) return;
    
    if (chatId) {
      // Try to find and load the specific chat
      const existingChat = chats.find(chat => chat.id === chatId);
      if (existingChat) {
        // Convert ChatMessage[] to UIMessage[] for useChat
        const messages = existingChat.messages.map(msg => ({
          id: msg.id,
          role: msg.role === 'function' || msg.role === 'tool' ? 'assistant' : msg.role as 'user' | 'assistant' | 'system',
          parts: msg.parts,
        }));
        setInitialMessages(messages as UIMessage[]);
        setChatIdToUse(chatId);
        switchChat(chatId);
        setHasInitialized(true);
      } else {
        // Chat ID doesn't exist, create a new one and redirect
        const defaultMessages = [
          {
            id: "1",
            role: "assistant" as const,
            parts: [{ type: 'text' as const, text: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?" }],
          },
        ];
        const newChatId = startNewChat(defaultMessages);
        router.replace(`/chat?id=${newChatId}`);
        return;
      }
    } else {
      // No chat ID in URL - create a new chat
      const defaultMessages = [
        {
          id: "1",
          role: "assistant" as const,
          parts: [{ type: 'text' as const, text: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?" }],
        },
      ];
      const newChatId = startNewChat(defaultMessages);
      router.replace(`/chat?id=${newChatId}`);
      return;
    }
  }, [chatId, chats, switchChat, startNewChat, router, hasInitialized, storeLoaded]);

  if (!chatIdToUse) {
    return <div>Loading...</div>;
  }

  return <Chat id={chatIdToUse} initialMessages={initialMessages} />;
} 