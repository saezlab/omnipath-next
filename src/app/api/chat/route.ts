import {google} from "@ai-sdk/google"
import { executeReadOnlyQuery } from '@/db/queries';
import { smoothStream, streamText, stepCountIs } from "ai";
import { z } from 'zod/v3';
import { DATABASE_SCHEMA_DESCRIPTION, SYSTEM_PROMPT, handleSqlError, validateSqlQuery, SQL_VALIDATION_ERROR } from '@/lib/api-constants';

// Define the message schema for the new UIMessage format
const messagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(messagePartSchema).optional(),
  content: z.string().optional(), // Keep for backward compatibility
});

// Define the request schema
const requestSchema = z.object({
  messages: z.array(messageSchema),
});

// Define the tools as provided
const tools = {
  executeSql: {
    description: DATABASE_SCHEMA_DESCRIPTION,
    inputSchema: z.object({
      sqlQuery: z.string().describe("The read-only SQL query (starting with SELECT) to execute."),
    }),
    execute: async ({ sqlQuery }: { sqlQuery: string }) => {
      try {
        if (!validateSqlQuery(sqlQuery)) {
           return { error: SQL_VALIDATION_ERROR };
        }
        const results = await executeReadOnlyQuery(sqlQuery);
        return { 
          results: results,
          totalCount: results.length,
          limited: false
        };
      } catch (error: unknown) {
        const errorMessage = handleSqlError(error);
        return { error: errorMessage };
      }
    },
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = requestSchema.parse(body);
    
    // Convert messages to UIMessage format for the new AI SDK
    const uiMessages = messages.map((msg, index) => {
      // Handle new format with parts
      if (msg.parts && msg.parts.length > 0) {
        return {
          id: msg.id || `msg-${index}`,
          role: msg.role,
          parts: msg.parts.map(part => ({
            ...part,
            type: part.type as 'text' | 'image' | 'reasoning'
          }))
        };
      }
      // Handle old format with content (backward compatibility)
      else if (msg.content) {
        return {
          id: msg.id || `msg-${index}`,
          role: msg.role,
          parts: [{ type: 'text' as const, text: msg.content }]
        };
      }
      // Fallback for empty messages
      else {
        return {
          id: msg.id || `msg-${index}`,
          role: msg.role,
          parts: [{ type: 'text' as const, text: '' }]
        };
      }
    });
    
    // Convert UIMessages to CoreMessages format
    const coreMessages = uiMessages.map(msg => {
      // Extract text content from parts
      const textContent = msg.parts
        .filter(part => part.type === 'text')
        .map(part => part.text || '')
        .join('');
      
      return {
        role: msg.role,
        content: textContent
      };
    }).filter(message => message.content && message.content.length > 0);

    // Add system message if not present
    if (!coreMessages.some(m => m.role === "system")) {
      coreMessages.unshift({
        role: "system",
        content: SYSTEM_PROMPT
      });
    }

    const stream = streamText({
      model: google("gemini-2.5-flash"),
      messages: coreMessages,
      tools,
      toolChoice: "auto",

      experimental_transform: [
        smoothStream({
          chunking: "word",
        }),
      ],

      stopWhen: stepCountIs(5),
      temperature: 0.7
    });

    return stream.toUIMessageStreamResponse({
      sendReasoning: true,
      onError: () => {
        return `An error occurred, please try again!`;
      },
    });
    
  } catch (error: unknown) {
    console.error("Error in chat endpoint:", error);
    return new Response("Failed to process chat request", { status: 500 });
  }
}
