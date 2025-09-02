"use client";

import { UIMessage } from "ai";
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Message as PreviewMessage } from "@/components/ai/message";
import { useScrollToBottom } from "@/components/ai/use-scroll-to-bottom";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ArrowUp, StopCircle, X as XIcon, Loader2, AlertTriangleIcon, Plus } from "lucide-react";
import { useWindowSize } from "./use-window-size";
import { useSearchStore } from "@/store/search-store";
import { useRouter } from "next/navigation";

const suggestedActions = [
  {
    title: "Which pathways does EGFR belong to?",
    label: "Find canonical pathways for a protein",
    action: "Which canonical pathways does EGFR belong to?",
  },
  {
    title: "Which TFs regulate MYC?",
    label: "Find transcriptional regulators",
    action: "Which transcription factors regulate the expression of MYC?",
  },
  {
    title: "Which TFs suppress CDKN1A?",
    label: "Find transcriptional suppressors",
    action: "Which transcription factors suppress the expression of CDKN1A?",
  },
  {
    title: "Is TP53 a transcription factor?",
    label: "Check if protein has TF activity",
    action: "Is TP53 a transcription factor?",
  },
  {
    title: "What are the ligands of EGFR?",
    label: "Find receptor-ligand interactions",
    action: "What are the ligands of EGFR?",
  },
];

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
}) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const { currentChatId, startNewChat, removeMessage, setMessages: setStoreMessages, messages: storeMessages, addChatToHistory } = useSearchStore();
  const router = useRouter();

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
    const messagesToInit = storeMessages.length > 0 
      ? storeMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          parts: [{ type: 'text' as const, text: msg.content }],
        }))
      : initialMessages;
    
    if (messagesToInit.length > 0 && messages.length === 0) {
      setMessages(messagesToInit);
    }
  }, [initialMessages, storeMessages, messages.length, setMessages]);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Debug logging for message parts
  console.log('Chat component - messages:', messages);


  // Helper function to extract tool invocations from message parts
  const extractToolInvocations = (parts: any[]) => {
    console.log('extractToolInvocations - all part types:', parts.map(p => p.type));
    // Look for parts that start with 'tool-' (like 'tool-executeSql')
    const toolParts = parts.filter(part => part.type && part.type.startsWith('tool-'));
    console.log('extractToolInvocations - tool parts found:', toolParts);
    toolParts.forEach((part, i) => {
      console.log(`Tool part ${i}:`, JSON.stringify(part, null, 2));
    });
    
    if (toolParts.length === 0) return undefined;

    // Convert tool parts to the old ToolInvocation format
    const toolInvocations = toolParts.map((part, index) => ({
      toolCallId: part.toolCallId || part.id || `tool-${index}-${Date.now()}`,
      toolName: part.type.replace('tool-', '') || 'unknown', // Extract tool name from type
      args: part.input || part.args || part.arguments || {},
      state: part.state === 'output-available' || part.output !== undefined ? 'result' : 'call',
      result: part.output || part.result || undefined
    }));

    console.log('extractToolInvocations - converted to tool invocations:', toolInvocations);
    return toolInvocations;
  };

    if (messages.length > 1) {
    console.log('Latest message parts:', messages[messages.length - 1].parts);
    console.log('Tool invocations extracted:', extractToolInvocations(messages[messages.length - 1].parts));
  }
  // Sync messages to store when they change (with debounce to prevent loops)
  const syncToStore = useCallback(() => {
    if (messages.length > 0) {
      const chatMessages = messages.map(msg => {
        // Extract text content from parts
        const textContent = msg.parts
          .filter(part => part.type === 'text')
          .map(part => (part as any).text || '')
          .join('');
        
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: textContent,
        };
      });
      setStoreMessages(chatMessages);
      
      // Check if this chat should be added to history (has user messages)
      const hasUserMessages = messages.some(msg => msg.role === 'user');
      const actualChatId = currentChatId || id;
      if (hasUserMessages && actualChatId) {
        // Find the first user message to use as preview
        const firstUserMessage = messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
          const textContent = firstUserMessage.parts
            .filter(part => part.type === 'text')
            .map(part => (part as any).text || '')
            .join('');
          if (textContent) {
            addChatToHistory(actualChatId, textContent);
          }
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
    textareaRef.current?.focus();
    adjustHeight();
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInput("");
    adjustHeight();
  }, []);

  const handleRerunQuery = useCallback((newQuery: string) => {
    sendMessage({
      role: 'user',
      parts: [{ type: 'text' as const, text: newQuery }]
    });
  }, [sendMessage]);

  const handleEditAndRerun = useCallback((messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      console.error("Could not find message to edit:", messageId);
      toast.error("Failed to edit message. Please try again.");
      return;
    }

    if (messages[messageIndex].role !== 'user') {
      console.error("Attempted to edit a non-user message:", messageId);
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
    adjustHeight();

  }, [messages, setMessages, regenerate]);

  const lastMessageContent = messages.length > 0 
    ? messages[messages.length - 1].parts
        .filter(part => part.type === 'text')
        .map(part => (part as any).text || '')
        .join('')
    : undefined;

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>(messages.length, lastMessageContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!editingMessageId) return;

      const target = event.target as Node;

      // Don't cancel if clicking inside the main input area
      if (inputAreaRef.current?.contains(target)) {
        return;
      }
      
      // --- Check if the click target or its parent is an edit button --- 
      const clickedEditButton = (target as HTMLElement).closest('[data-edit-button="true"]');
      if (clickedEditButton) {
          return; // Don't cancel if clicking any edit button
      }

      // If the click wasn't in the input area and wasn't on an edit button, cancel.
      cancelEdit();
    };

    if (editingMessageId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingMessageId, cancelEdit, inputAreaRef]);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  // Prevent body scrolling when chat is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Prevent scrolling on body/html
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 0}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    if (editingMessageId) {
      handleEditAndRerun(editingMessageId, input);
    } else {
      sendMessage({
        role: 'user',
        parts: [{ type: 'text' as const, text: input }]
      });
      setInput("");
      adjustHeight();
    }

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [sendMessage, width, editingMessageId, input, handleEditAndRerun]);

  const editingIndex = editingMessageId ? messages.findIndex(m => m.id === editingMessageId) : -1;

  return (
    <div className="h-screen">
      {messages.length <= 1 ? (
        <div className="h-full flex items-center justify-center">
          <div className="max-w-2xl w-full px-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <PreviewMessage
                  id={message.id}
                  role={message.role}
                  content={message.parts
                    .filter(part => part.type === 'text')
                    .map(part => (part as any).text || '')
                    .join('')}
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
                {/* New Chat Button */}
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    // First create the new chat in store
                    const chatMessages = initialMessages.map(msg => ({
                      id: msg.id,
                      role: msg.role as 'user' | 'assistant' | 'system',
                      content: msg.parts
                        .filter(part => part.type === 'text')
                        .map(part => (part as any).text || '')
                        .join(''),
                    }));
                    const newChatId = startNewChat(chatMessages);
                    
                    // Navigate to the new chat URL
                    router.push(`/chat?id=${newChatId}`);
                  }}
                  className="h-8 px-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </div>
              
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={editingMessageId ? "Edit message..." : "Send a message..."}
                  value={input}
                  onChange={handleInput}
                  className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none pr-12 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                  rows={3}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();

                      if (isLoading) {
                        toast.error("Please wait for the model to finish its response!");
                      } else {
                        submitForm();
                      }
                    }
                  }}
                />

                {editingMessageId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-11 right-2 m-0.5 h-7 w-7 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={(event) => {
                      event.preventDefault();
                      cancelEdit();
                    }}
                    aria-label="Cancel edit"
                  >
                    <XIcon size={16} />
                  </Button>
                )}

                <div className="absolute bottom-2 right-2 flex items-center">
                  {isLoading ? (
                    <Button
                      className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                      onClick={(event) => {
                        event.preventDefault();
                        stop();
                      }}
                    >
                      <StopCircle size={14} />
                    </Button>
                  ) : (
                    <Button
                      className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(event) => {
                        event.preventDefault();
                        submitForm();
                      }}
                      disabled={input.length === 0}
                    >
                      <ArrowUp size={14} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="w-full mt-4">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 w-max pb-2">
                    {suggestedActions.map((suggestedAction, index) => (
                      <button
                        key={index}
                        onClick={async () => {
                          sendMessage({
                            role: 'user',
                            parts: [{ type: 'text' as const, text: suggestedAction.action }]
                          });
                        }}
                        className="border-none bg-muted/50 min-w-[280px] text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                      >
                        <span className="font-medium">{suggestedAction.title}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {suggestedAction.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Shared limits: 10 requests/min, 250/day. Check back later if unavailable.
                </p>
              </div>
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
                    content={message.parts
                      .filter(part => part.type === 'text')
                      .map(part => (part as any).text || '')
                      .join('')}
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
              {/* New Chat Button */}
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  // First create the new chat in store
                  const chatMessages = initialMessages.map(msg => ({
                    id: msg.id,
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.parts
                      .filter(part => part.type === 'text')
                      .map(part => (part as any).text || '')
                      .join(''),
                  }));
                  const newChatId = startNewChat(chatMessages);
                  
                  // Navigate to the new chat URL
                  router.push(`/chat?id=${newChatId}`);
                }}
                className="h-8 px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            </div>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={editingMessageId ? "Edit message..." : "Send a message..."}
                value={input}
                onChange={handleInput}
                className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none pr-12 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                rows={3}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();

                    if (isLoading) {
                      toast.error("Please wait for the model to finish its response!");
                    } else {
                      submitForm();
                    }
                  }
                }}
              />

              {editingMessageId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-11 right-2 m-0.5 h-7 w-7 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  onClick={(event) => {
                    event.preventDefault();
                    cancelEdit();
                  }}
                  aria-label="Cancel edit"
                >
                  <XIcon size={16} />
                </Button>
              )}

              <div className="absolute bottom-2 right-2 flex items-center">
                {isLoading ? (
                  <Button
                    className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    onClick={(event) => {
                      event.preventDefault();
                      stop();
                    }}
                  >
                    <StopCircle size={14} />
                  </Button>
                ) : (
                  <Button
                    className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(event) => {
                      event.preventDefault();
                      submitForm();
                    }}
                    disabled={input.length === 0}
                  >
                    <ArrowUp size={14} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 