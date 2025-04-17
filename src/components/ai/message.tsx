"use client";

import { ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { Markdown } from "@/components/ai/markdown";
import { ToolResponse } from "@/components/ai/tool-response";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronRightIcon } from "lucide-react";

const ToolDetails = ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
  const { toolName, args, state } = toolInvocation;

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
          <ChevronRightIcon className="h-4 w-4" />
          <div className="font-mono font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
            {toolName}(<span className="text-zinc-600 dark:text-zinc-400">{args.query}</span>)
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[90vw] md:w-full p-4" align="start">
          <div className="flex flex-col gap-2">
            <div className="font-mono font-medium text-lg">
              {toolName}(<span className="text-zinc-600 dark:text-zinc-400">{args.query}</span>)
            </div>

            {state === "result" && (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Response:
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <ToolResponse toolInvocation={toolInvocation} />
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {state === "call" && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Loading {toolName}...
        </div>
      )}
    </div>
  );
};

export const Message = ({
  role,
  content,
  toolInvocations,
  isInitialMessage,
}: {
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  isInitialMessage?: boolean;
}) => {
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:px-0 first-of-type:pt-20 mb-8 ${
        role === "user" ? "justify-end" : "justify-start"
      } ${isInitialMessage ? "text-center" : ""}`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={`flex flex-col gap-2 ${role === "user" ? "w-[66%] items-end" : "w-full items-start"} ${isInitialMessage ? "items-center" : ""}`}>
        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => (
              <ToolDetails key={toolInvocation.toolCallId} toolInvocation={toolInvocation} />
            ))}
          </div>
        )}

        {content && typeof content === "string" && (
          <div className={`text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 ${
            role === "user" 
              ? "bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3" 
              : isInitialMessage 
                ? "text-lg font-medium" 
                : ""
          }`}>
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 