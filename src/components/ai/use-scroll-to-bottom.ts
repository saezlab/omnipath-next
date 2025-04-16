import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(
  messagesLength: number,
  lastMessageContent: string | undefined,
): [RefObject<T | null>, RefObject<T | null>] {
  const containerRef = useRef<T | null>(null);
  const endRef = useRef<T | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      end.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messagesLength, lastMessageContent]);

  return [containerRef, endRef];
} 