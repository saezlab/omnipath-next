// Central type definitions for chat functionality

export interface MessagePart {
  type: 'text' | 'image' | 'reasoning' | string;
  text?: string;
  toolCallId?: string;
  id?: string;
  input?: any;
  output?: any;
  result?: any;
  args?: any;
  arguments?: any;
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
  args: Record<string, any>;
  state: 'call' | 'result';
  result?: any;
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
  type: 'annotation' | 'interaction' | 'intercell';
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

export interface CustomToolInvocation {
  toolName: string;
  args: { sqlQuery: string };
  state: string;
  result?: ToolResult;
}