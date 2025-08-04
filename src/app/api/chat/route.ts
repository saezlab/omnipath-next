import { google } from "@/ai";
import { executeReadOnlyQuery } from '@/db/queries';
import { convertToCoreMessages, smoothStream, streamText } from "ai";
import { z } from "zod";
import { DATABASE_SCHEMA_DESCRIPTION, SYSTEM_PROMPT, handleSqlError, validateSqlQuery, SQL_VALIDATION_ERROR } from '@/lib/api-constants';

// Define the message schema
const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

// Define the request schema
const requestSchema = z.object({
  messages: z.array(messageSchema),
});

// Define the tools as provided
const tools = {
  executeSql: {
    description: DATABASE_SCHEMA_DESCRIPTION,
    parameters: z.object({
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
    
    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages).filter(
      (message) => message.content.length > 0,
    );

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
      // onFinish: async (result) => {
      //   // Here you could save the chat history if needed
      // },
      maxSteps: 5,
      temperature: 0.7,
    });

    return stream.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: () => {
        return `An error occurred, please try again!`;
      },
    });
    
  } catch (error: unknown) {
    console.error("Error in chat endpoint:", error);
    return new Response("Failed to process chat request", { status: 500 });
  }
}
