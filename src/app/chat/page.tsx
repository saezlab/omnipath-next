"use client";

import { Chat } from "@/components/ai/chat";
import { UIMessage } from "ai";
import { useSearchParams } from "next/navigation";
import { useSearchStore } from "@/store/search-store";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id');
  const { chats, currentChatId, switchChat } = useSearchStore();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatIdToUse, setChatIdToUse] = useState<string>("main-chat");

  useEffect(() => {
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
      } else {
        // Chat ID doesn't exist, create a new chat with this ID
        const defaultMessages: UIMessage[] = [
          {
            id: "1",
            role: "assistant",
            parts: [{ type: 'text' as const, text: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?" }],
          },
        ];
        
        setInitialMessages(defaultMessages);
        setChatIdToUse(chatId);
      }
    } else {
      // No chat ID in URL - check if we should load an existing chat
      if (currentChatId && chats.find(chat => chat.id === currentChatId)) {
        // Load the current active chat
        const existingChat = chats.find(chat => chat.id === currentChatId);
        if (existingChat) {
          const messages = existingChat.messages.map(msg => ({
            id: msg.id,
            role: msg.role === 'function' || msg.role === 'tool' ? 'assistant' : msg.role as 'user' | 'assistant' | 'system',
            parts: msg.parts,
          }));
          setInitialMessages(messages as UIMessage[]);
          setChatIdToUse(currentChatId);
        }
      } else if (chats.length > 0) {
        // Load the most recent chat (first in array since they're newest first)
        const mostRecentChat = chats[chats.length - 1]; // Actually last in array is most recent due to how we add them
        const messages = mostRecentChat.messages.map(msg => ({
          id: msg.id,
          role: msg.role === 'function' || msg.role === 'tool' ? 'assistant' : msg.role as 'user' | 'assistant' | 'system',
          parts: msg.parts,
        }));
        setInitialMessages(messages as UIMessage[]);
        setChatIdToUse(mostRecentChat.id);
        switchChat(mostRecentChat.id);
      } else {
        // No existing chats, create default
        const defaultMessages: UIMessage[] = [
          {
            id: "1",
            role: "assistant",
            parts: [{ type: 'text' as const, text: "Hello! I'm OmniPath AI. I can help you explore protein interactions, pathways, and biological annotations. What would you like to know?" }],
          },
        ];
        setInitialMessages(defaultMessages);
        setChatIdToUse("main-chat");
      }
    }
  }, [chatId, chats, currentChatId, switchChat]);

  return <Chat id={chatIdToUse} initialMessages={initialMessages} />;
} 