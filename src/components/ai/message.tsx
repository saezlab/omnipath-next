"use client";

import { ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { BotIcon, UserIcon, ChevronRightIcon } from "lucide-react";
import { Markdown } from "@/components/ai/markdown";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToolResponse } from "@/components/ai/tool-response";

const ToolDetails = ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
  const { toolName, args, state } = toolInvocation;

  return (
    <div className="flex flex-col gap-2">
      <Dialog>
        <DialogTrigger className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
          <ChevronRightIcon className="h-4 w-4" />
          <div className="font-mono font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
            {toolName}(<span className="text-zinc-600 dark:text-zinc-400">{args.query}</span>)
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{toolName}(<span className="text-zinc-600 dark:text-zinc-400">{args.query}</span>)</DialogTitle>

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
        </DialogContent>
      </Dialog>

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
}: {
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
}) => {
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => (
              <ToolDetails key={toolInvocation.toolCallId} toolInvocation={toolInvocation} />
            ))}
          </div>
        )}

        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 