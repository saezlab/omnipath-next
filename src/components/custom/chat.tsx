"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { ArrowUpIcon, StopIcon } from "./icons";
import { useWindowSize } from "./use-window-size";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

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

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
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
    <div className="flex flex-col h-full overflow-y-auto">
      <div
        ref={messagesContainerRef}
        className="flex-1 p-16 space-y-4 mx-auto overflow-x-hidden"
      >
        {messages.map((message) => (
          <PreviewMessage
            key={message.id}
            chatId={id}
            role={message.role}
            content={message.content}
            toolInvocations={message.toolInvocations}
          />
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 border-t">
        <div className="relative w-full flex flex-col gap-4 max-w-2xl mx-auto">
          {messages.length === 1 && (
            <div className="grid sm:grid-cols-2 gap-4 w-full md:px-0 mx-auto md:max-w-[500px]">
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

          <Textarea
            ref={textareaRef}
            placeholder="Send a message..."
            value={input}
            onChange={handleInput}
            className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none"
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
              className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 text-white"
              onClick={(event) => {
                event.preventDefault();
                stop();
              }}
            >
              <StopIcon size={14} />
            </Button>
          ) : (
            <Button
              className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 text-white"
              onClick={(event) => {
                event.preventDefault();
                submitForm();
              }}
              disabled={input.length === 0}
            >
              <ArrowUpIcon size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 