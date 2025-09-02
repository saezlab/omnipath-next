"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, StopCircle, X as XIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStop: () => void;
  editingMessageId?: string | null;
  onCancelEdit?: () => void;
  placeholder?: string;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  onStop,
  editingMessageId,
  onCancelEdit,
  placeholder = "Send a message..."
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isLoading) {
        toast.error("Please wait for the model to finish its response!");
      } else {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder={editingMessageId ? "Edit message..." : placeholder}
        value={input}
        onChange={handleInput}
        className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none pr-12 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        rows={3}
        onKeyDown={handleKeyDown}
      />

      {editingMessageId && onCancelEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-11 right-2 m-0.5 h-7 w-7 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          onClick={(event) => {
            event.preventDefault();
            onCancelEdit();
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
              onStop();
            }}
          >
            <StopCircle size={14} />
          </Button>
        ) : (
          <Button
            className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            disabled={input.length === 0}
          >
            <ArrowUp size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}