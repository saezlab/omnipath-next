"use client";

import { UIMessage } from "ai";
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Message as PreviewMessage } from "@/components/ai/message";
import { useScrollToBottom } from "@/components/ai/use-scroll-to-bottom";
import { Loader2, AlertTriangleIcon } from "lucide-react";
import { ChatInput } from "./chat-input";
import { SuggestedActions } from "./suggested-actions";
import { NewChatButton } from "./new-chat-button";
import { useSearchStore } from "@/store/search-store";
import { ChatMessage } from "@/types/chat";

// Helper function to extract text content from message parts
const extractTextContent = (parts: any[]): string => {
  return parts
    .filter(part => part.type === 'text')
    .map(part => part.text || '')
    .join('');
};


export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
}) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const { currentChatId, removeMessage, setMessages: setStoreMessages, messages: storeMessages, addChatToHistory } = useSearchStore();

  const [input, setInput] = useState("");
  const {
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
    regenerate,
    error,
  } = useChat({
    id: currentChatId || id,
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    },
  });

  // Initialize messages when component mounts or initialMessages change
  useEffect(() => {
    let messagesToInit;
    if (storeMessages.length > 0) {
      // Convert ChatMessage to UIMessage format
      messagesToInit = storeMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        parts: msg.parts as any
      }));
    } else {
      messagesToInit = initialMessages;
    }
    
    if (messagesToInit.length > 0 && messages.length === 0) {
      setMessages(messagesToInit);
    }
  }, [initialMessages, storeMessages, messages.length, setMessages]);

  const isLoading = status === 'streaming' || status === 'submitted';



  // Helper function to extract tool invocations from message parts
  const extractToolInvocations = (parts: any[]) => {
    const toolParts = parts.filter(part => part.type?.startsWith('tool-'));
    
    if (toolParts.length === 0) return undefined;

    return toolParts.map((part, index) => ({
      toolCallId: part.toolCallId || part.id || `tool-${index}-${Date.now()}`,
      toolName: part.type.replace('tool-', '') || 'unknown',
      args: part.input || part.args || part.arguments || {},
      state: part.state === 'output-available' || part.output !== undefined ? 'result' : 'call',
      result: part.output || part.result || undefined
    }));
  };

  // Sync messages to store when they change
  const syncToStore = useCallback(() => {
    if (messages.length > 0) {
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        parts: msg.parts
      }));
      setStoreMessages(chatMessages);
      
      // Add to history if it has user messages
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      const actualChatId = currentChatId || id;
      if (firstUserMessage && actualChatId) {
        const textContent = extractTextContent(firstUserMessage.parts);
        if (textContent) {
          addChatToHistory(actualChatId, textContent);
        }
      }
    }
  }, [messages, setStoreMessages, currentChatId, id, addChatToHistory]);

  useEffect(() => {
    const timeoutId = setTimeout(syncToStore, 100);
    return () => clearTimeout(timeoutId);
  }, [syncToStore]);

  // Custom remove message function that syncs both states
  const handleRemoveMessage = useCallback((messageId: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    removeMessage(messageId);
  }, [messages, setMessages, removeMessage]);

  const startEdit = useCallback((messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setInput(currentContent);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInput("");
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    sendMessage({
      role: 'user',
      parts: [{ type: 'text' as const, text }]
    });
  }, [sendMessage]);

  const handleRerunQuery = useCallback((newQuery: string) => {
    handleSendMessage(newQuery);
  }, [handleSendMessage]);

  const handleEditAndRerun = useCallback((messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      toast.error("Failed to edit message. Please try again.");
      return;
    }

    if (messages[messageIndex].role !== 'user') {
      toast.error("Cannot edit non-user messages.");
      return;
    }

    const updatedHistory = messages.slice(0, messageIndex + 1);

    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        parts: [{ type: 'text' as const, text: newContent }],
      };
    }

    setMessages(updatedHistory);
    regenerate({ messageId });
    setEditingMessageId(null);
    setInput("");
  }, [messages, setMessages, regenerate]);

  const lastMessageContent = messages.length > 0 
    ? extractTextContent(messages[messages.length - 1].parts)
    : undefined;

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>(messages.length, lastMessageContent);





  const submitForm = useCallback(() => {
    if (editingMessageId) {
      handleEditAndRerun(editingMessageId, input);
    } else {
      handleSendMessage(input);
      setInput("");
    }

  }, [handleSendMessage, editingMessageId, input, handleEditAndRerun]);

  const editingIndex = editingMessageId ? messages.findIndex(m => m.id === editingMessageId) : -1;

  return (
    <div className="h-screen overflow-hidden">
      {messages.length <= 1 ? (
        <div className="h-full flex items-center justify-center">
          <div className="max-w-2xl w-full px-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <PreviewMessage
                  id={message.id}
                  role={message.role}
                  content={extractTextContent(message.parts)}
                  toolInvocations={extractToolInvocations(message.parts)}
                  isInitialMessage={true}
                  onRerunQuery={handleRerunQuery}
                  startEdit={startEdit}
                  deleteMessage={handleRemoveMessage}
                />
              </div>
            ))}
            
            <div className="space-y-4">
              {/* Chat Controls */}
              <div className="flex items-center justify-end gap-2 mb-4">
                <NewChatButton initialMessages={initialMessages} />
              </div>
              
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={submitForm}
                isLoading={isLoading}
                onStop={stop}
                editingMessageId={editingMessageId}
                onCancelEdit={cancelEdit}
              />

              <SuggestedActions onActionSelect={handleSendMessage} />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col">
          <div
            ref={messagesContainerRef}
            className="p-4 space-y-4 w-full overflow-auto flex-1 pb-24"
          >
            <div className="max-w-2xl mx-auto">
              {messages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`${editingIndex !== -1 && index > editingIndex ? "opacity-50 pointer-events-none" : ""} transition-opacity duration-300`}
                >
                  <PreviewMessage
                    id={message.id}
                    role={message.role}
                    content={extractTextContent(message.parts)}
                    toolInvocations={extractToolInvocations(message.parts)}
                    isInitialMessage={false}
                    onRerunQuery={handleRerunQuery}
                    startEdit={startEdit}
                    deleteMessage={handleRemoveMessage}
                  />
                </div>
              ))}
              
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <span>Error: {error.message || "Something went wrong. Please try again."}</span>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>
      )}

      {messages.length > 1 && (
        <div ref={inputAreaRef} className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t">
          <div className="relative w-full flex flex-col gap-4 max-w-2xl mx-auto px-4 py-4 md:px-0">
            {/* Chat Controls */}
            <div className="flex items-center justify-end gap-2">
              <NewChatButton initialMessages={initialMessages} />
            </div>
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={submitForm}
              isLoading={isLoading}
              onStop={stop}
              editingMessageId={editingMessageId}
              onCancelEdit={cancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
} 