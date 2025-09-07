// Central type definitions for chat functionality

export interface MessagePart {
  type: 'text' | 'image' | 'reasoning' | string;
  text?: string;
  toolCallId?: string;
  id?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  result?: unknown;
  args?: Record<string, unknown>;
  arguments?: Record<string, unknown>;
  state?: 'output-available' | 'call' | 'result' | string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  parts: MessagePart[];
}

export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'call' | 'result';
  result?: unknown;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'annotation' | 'interaction' | 'intercell' | 'complexes' | 'enzsub';
  timestamp: number;
  url: string;
}

// SQL Tool specific types
export interface SqlResultRow {
  [key: string]: unknown;
}

export interface SqlToolResult {
  results: SqlResultRow[];
  totalCount: number;
  limited: boolean;
}

export interface SqlToolError {
  error: string;
}

export type ToolResult = SqlToolResult | SqlToolError;

