"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Message as PreviewMessage } from "@/components/ai/message";
import { useScrollToBottom } from "@/components/ai/use-scroll-to-bottom";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ArrowUp, StopCircle } from "lucide-react";
import { useWindowSize } from "./use-window-size";

const suggestedActions = [
  {
    title: "What are interactions involving PLN?",
    label: "Query interactions from OmniPath",
    action: "What are interactions involving PLN?",
  },
  {
    title: "What are the annotations of TP53?",
    label: "Query annotations from OmniPath",
    action: "What are the annotations of TP53?",
  },
];

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id,
      body: { id },
      initialMessages,
      maxSteps: 10,
    });

  const lastMessageContent = messages.length > 0 ? messages[messages.length - 1].content : undefined;

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>(messages.length, lastMessageContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

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
    handleSubmit();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleSubmit, width]);

  return (
    <div className="h-full">
      <div className="h-[calc(100vh-130px)] w-full overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="p-4 space-y-4 w-full overflow-auto h-full"
        >
          <div className="max-w-2xl mx-auto">
            {messages.map((message, index) => (
              <PreviewMessage
                key={message.id}
                role={message.role}
                content={message.content}
                toolInvocations={message.toolInvocations}
                isInitialMessage={messages.length === 1 && index === 0}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <div className={`relative w-full flex flex-col gap-4 max-w-2xl mx-auto px-4 md:px-0 ${
          messages.length === 1 ? "md:translate-y-[-230%] translate-y-[-50%]" : "translate-y-[-20%]"
        }`}>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Send a message..."
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
            <div className="grid sm:grid-cols-2 gap-4 w-full mt-4">
              {suggestedActions.map((suggestedAction, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    append({
                      role: "user",
                      content: suggestedAction.action,
                    });
                  }}
                  className="border-none bg-muted/50 w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                >
                  <span className="font-medium">{suggestedAction.title}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {suggestedAction.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 