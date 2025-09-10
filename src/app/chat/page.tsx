"use client";

import { Chat } from "@/components/ai/chat";
import { UIMessage } from "ai";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchStore } from "@/store/search-store";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('id');
  const { chats, switchChat, startNewChat } = useSearchStore();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatIdToUse, setChatIdToUse] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Wait for the store to load from localStorage
  useEffect(() => {
    // Check if the store has been hydrated from localStorage
    // The store should have at least initialized (even if empty)
    const checkStoreReady = () => {
      // If we have chats or if enough time has passed, consider store loaded
      if (chats.length > 0) {
        setStoreLoaded(true);
        return;
      }
      
      // Fallback timer in case store is truly empty
      const timer = setTimeout(() => {
        setStoreLoaded(true);
      }, 150);
      
      return () => clearTimeout(timer);
    };
    
    // Check immediately and set a short delay
    const cleanup = checkStoreReady();
    return cleanup;
  }, [chats.length]);

  useEffect(() => {
    if (hasInitialized || !storeLoaded || isCreatingChat) return;
    
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
        // Chat ID doesn't exist - create a new empty chat with this ID to avoid redirect loop
        console.warn(`Chat with ID ${chatId} not found, creating new empty chat`);
        setIsCreatingChat(true);
        
        // Create empty chat (no default messages for invalid chat IDs)
        const newChatId = startNewChat([]);
        
        // Small delay to ensure the chat is created in the store
        setTimeout(() => {
          router.replace(`/chat?id=${newChatId}`, { scroll: false });
          setIsCreatingChat(false);
        }, 50);
        return;
      }
    } else {
      // No chat ID in URL - create a new chat with greeting (first visit)
      if (!isCreatingChat) {
        setIsCreatingChat(true);
        
        const defaultMessages = [
          {
            id: "1",
            role: "assistant" as const,
            parts: [{ type: 'text' as const, text: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?" }],
          },
        ];
        const newChatId = startNewChat(defaultMessages);
        
        // Small delay to ensure the chat is created in the store
        setTimeout(() => {
          router.replace(`/chat?id=${newChatId}`, { scroll: false });
          setIsCreatingChat(false);
        }, 50);
      }
      return;
    }
  }, [chatId, chats, switchChat, startNewChat, router, hasInitialized, storeLoaded, isCreatingChat]);

  if (!chatIdToUse) {
    return (
      <div className="h-dvh overflow-hidden animate-pulse">
        <div className="h-full flex items-center justify-center">
          <div className="max-w-2xl w-full px-4 space-y-4">
            {/* AI Welcome Message Skeleton */}
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
            
            {/* Chat Input Area Skeleton */}
            <div className="space-y-4">
              <div className="relative">
                <Skeleton className="w-full h-12 rounded-lg" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-muted">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Chat id={chatIdToUse} initialMessages={initialMessages} />;
} 