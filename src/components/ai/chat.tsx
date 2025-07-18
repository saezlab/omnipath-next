"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Message as PreviewMessage } from "@/components/ai/message";
import { useScrollToBottom } from "@/components/ai/use-scroll-to-bottom";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ArrowUp, StopCircle, X as XIcon } from "lucide-react";
import { useWindowSize } from "./use-window-size";

const suggestedActions = [
  {
    title: "Which pathways does EGFR belong to?",
    label: "Find canonical pathways for a protein",
    action: "Which canonical pathways does EGFR belong to?",
  },
  {
    title: "Is EGFR a transmembrane protein?",
    label: "Check membrane localization",
    action: "Is EGFR a transmembrane protein?",
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
  initialMessages: Array<Message>;
}) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    setMessages,
    reload,
  } = useChat({
    id,
    body: { id },
    initialMessages,
    maxSteps: 10,
  });

  const startEdit = useCallback((messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setInput(currentContent);
    textareaRef.current?.focus();
    adjustHeight();
  }, [setInput]);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInput("");
    adjustHeight();
  }, [setInput]);

  const handleRerunQuery = useCallback((newQuery: string) => {
    append({
      role: 'user',
      content: `Please run this SQL query:\\n\\n\\\`\\\`\\\`sql\\n${newQuery}\\n\\\`\\\`\\\``
    });
  }, [append]);

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
        content: newContent,
      };
    }

    setMessages(updatedHistory);
    reload();
    setEditingMessageId(null);
    setInput("");
    adjustHeight();

  }, [messages, setMessages, setInput, reload]);

  const lastMessageContent = messages.length > 0 ? messages[messages.length - 1].content : undefined;

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
      handleSubmit();
    }

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleSubmit, width, editingMessageId, input, handleEditAndRerun]);

  const editingIndex = editingMessageId ? messages.findIndex(m => m.id === editingMessageId) : -1;

  return (
    <div className="h-full">
      <div className="h-[calc(100vh-130px)] w-full overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="p-4 space-y-4 w-full overflow-auto h-full"
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
                  content={message.content}
                  toolInvocations={message.toolInvocations}
                  isInitialMessage={messages.length === 1 && index === 0}
                  onRerunQuery={handleRerunQuery}
                  startEdit={startEdit}
                />
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      <div ref={inputAreaRef} className="fixed bottom-0 left-0 right-0">
        <div className={`relative w-full flex flex-col gap-4 max-w-2xl mx-auto px-4 md:px-0 ${
          messages.length === 1 ? "md:translate-y-[-230%] translate-y-[-50%]" : "translate-y-[-20%]"
        }`}>
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

            {isLoading ? (
              <Button
                className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                onClick={(event) => {
                  event.preventDefault();
                  stop();
                }}
              >
                <StopCircle size={14} />
              </Button>
            ) : (
              <Button
                className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
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

          {messages.length === 1 && (
            <div className="w-full mt-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 w-max pb-2">
                {suggestedActions.map((suggestedAction, index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      append({
                        role: "user",
                        content: suggestedAction.action,
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
          )}
        </div>
      </div>
    </div>
  );
} 