"use client";

import { ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { BotIcon, UserIcon } from "@/components/icons";
import { Markdown } from "@/components/custom/markdown";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
}: {
  chatId: string;
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
        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
            <Markdown>{content}</Markdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;
                return (
                  <div key={toolCallId} className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    Loading {toolName}...
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 