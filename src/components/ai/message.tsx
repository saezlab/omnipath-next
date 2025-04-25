"use client";

import { ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { Markdown } from "@/components/ai/markdown";
import { ToolResponse } from "@/components/ai/tool-response";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, TerminalIcon, Pencil } from "lucide-react";

// Extend the ToolInvocation type locally if needed, or handle potential errors defensively.
// This assumes result might contain an error property.
type ExtendedToolInvocation = ToolInvocation & { result?: { error?: string } };

const ToolDetails = ({
  toolInvocation,
  onRerunQuery
}: {
  toolInvocation: ExtendedToolInvocation;
  onRerunQuery?: (newQuery: string) => void;
}) => {
  const { toolName, args, state, result } = toolInvocation;
  const displayArgs = JSON.stringify(args, null, 2);
  const hasError = result?.error != null;

  return (
    <div className={`flex flex-col gap-2 border rounded-lg p-3 ${hasError ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'}`}>
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {hasError ? (
           <AlertTriangleIcon className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
        ) : (
           <TerminalIcon className="h-4 w-4 flex-shrink-0" />
        )}
        <div className={`font-mono font-medium ${hasError ? 'text-red-700 dark:text-red-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
          {toolName}
        </div>
        {state === "call" && !hasError && (
          <div className="flex items-center gap-1 text-xs text-blue-500">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Running...
          </div>
        )}
        {state === "result" && !hasError && (
           <div className="text-xs text-green-600 dark:text-green-400">(Completed)</div>
        )}
      </div>

      {state === "result" && result && (
          <ToolResponse toolInvocation={toolInvocation} onRerunQuery={onRerunQuery} />
      )}
    </div>
  );
};

export const Message = ({
  role,
  content,
  toolInvocations,
  isInitialMessage,
  onRerunQuery,
  id,
  startEdit
}: {
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  isInitialMessage?: boolean;
  onRerunQuery?: (newQuery: string) => void;
  id: string;
  startEdit?: (messageId: string, currentContent: string) => void;
}) => {
  const canEdit = role === 'user' && typeof content === 'string' && !!startEdit;

  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:px-0 mb-8 ${
        role === "user" ? "justify-end" : "justify-start"
      } ${isInitialMessage ? "text-center" : ""}`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={`flex flex-col gap-4 ${role === "user" ? "w-[66%] items-end" : "w-full items-start"} ${isInitialMessage ? "items-center" : ""}`}>
        {toolInvocations && toolInvocations.length > 0 && (
          <div className="flex flex-col gap-3 w-full max-w-2xl">
            {toolInvocations.map((toolInvocation) => (
              <ToolDetails 
                key={toolInvocation.toolCallId} 
                toolInvocation={toolInvocation} 
                onRerunQuery={onRerunQuery}
              />
            ))}
          </div>
        )}

        {content && typeof content === "string" && (
          <div className={`relative group text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 w-full ${
            role === "user" 
              ? "bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3" 
              : isInitialMessage 
                ? "text-lg font-medium" 
                : ""
          }`}>
            <Markdown>{content as string}</Markdown>
            {canEdit && (
               <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => startEdit(id, content as string)}
                  className="absolute top-1 right-1 h-6 w-6 text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  aria-label="Edit message"
                  data-edit-button="true"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 