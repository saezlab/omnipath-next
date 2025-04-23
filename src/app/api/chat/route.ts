import { google } from "@/ai";
import { getProteinAnnotations } from "@/features/annotations-browser/api/queries";
import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries";
import { convertToCoreMessages, smoothStream, streamText } from "ai";
import { z } from "zod";

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
  searchInteractions: {
    description: "Search for interactions involving a specific protein or gene. Provide the gene symbol or UniProt ID.",
    parameters: z.object({
      query: z.string().describe("Gene symbol or UniProt ID (e.g., 'TP53', 'P04637')."),
    }),
    execute: async ({ query }: { query: string }) => {
      console.log(`Executing searchInteractions for query: ${query}`);
      try {
        const result = await searchProteinNeighbors(query);
        console.log(`Found ${result.interactions.length} interactions.`);
        // Return only the first 5 interactions with minimal fields
        return { 
          interactions: result.interactions.slice(0, 5).map(i => ({
            source: i.sourceGenesymbol,
            target: i.targetGenesymbol,
            type: i.type
          }))
        };
      } catch (error) {
        console.error("Error in searchInteractions tool:", error);
        return { error: `Failed to fetch interactions for ${query}.` };
      }
    },
  },
  getAnnotations: {
    description: "Get functional annotations for a specific protein or gene. Provide the gene symbol or UniProt ID.",
    parameters: z.object({
      query: z.string().describe("Gene symbol or UniProt ID (e.g., 'EGFR', 'P00533')."),
    }),
    execute: async ({ query }: { query: string }) => {
      console.log(`Executing getAnnotations for query: ${query}`);
      try {
        const result = await getProteinAnnotations(query);
        console.log(`Found ${result.annotations.length} annotations.`);
        
        // Group annotations by category and take only the most important ones
        const essentialInfo = {
          location: new Set<string>(),
          function: new Set<string>(),
          disease: new Set<string>(),
          pathway: new Set<string>()
        };

        result.annotations.forEach(ann => {
          const value = ann.value;
          if (!value) return;

          // Categorize annotations
          if (ann.source?.includes('location') || ann.source?.includes('LOCATE') || ann.source?.includes('Membranome')) {
            essentialInfo.location.add(value);
          } else if (ann.source?.includes('family') || ann.source?.includes('InterPro')) {
            essentialInfo.function.add(value);
          } else if (ann.source?.includes('DisGeNet') || ann.source?.includes('disease')) {
            essentialInfo.disease.add(value);
          } else if (ann.source?.includes('pathway') || ann.source?.includes('KEGG')) {
            essentialInfo.pathway.add(value);
          }
        });

        // Convert sets to arrays and take only top 2-3 items per category
        return {
          location: Array.from(essentialInfo.location).slice(0, 3),
          function: Array.from(essentialInfo.function).slice(0, 2),
          disease: Array.from(essentialInfo.disease).slice(0, 2),
          pathway: Array.from(essentialInfo.pathway).slice(0, 2),
          totalCount: result.annotations.length
        };
      } catch (error) {
        console.error("Error in getAnnotations tool:", error);
        return { error: `Failed to fetch annotations for ${query}.` };
      }
    },
  },
/*   displayInteractionsTable: {
    description: "Display a table of protein interactions.",
    parameters: z.object({
      interactions: z.array(z.object({
        id: z.number(),
        source: z.string().nullable(),
        target: z.string().nullable(),
        sourceGenesymbol: z.string().nullable(),
        targetGenesymbol: z.string().nullable(),
        isDirected: z.boolean().nullable(),
        isStimulation: z.boolean().nullable(),
        isInhibition: z.boolean().nullable(),
        type: z.string().nullable(),
        references: z.string().nullable(),
        sources: z.array(z.string()).nullable(),
      })),
    }),
    execute: async (data: any) => {
      console.log(`Signaling to display ${data.interactions.length} interactions.`);
      return data;
    }
  },
  displayAnnotationSummary: {
    description: "Display a summary card or list of annotations for a protein.",
    parameters: z.object({
      summary: z.record(z.array(z.string().nullable())),
      totalCount: z.number(),
    }),
    execute: async (data: any) => {
      console.log(`Signaling to display annotation summary.`);
      return data;
    }
  },
 */};

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
        content: `You are OmniPath AI, a helpful assistant knowledgeable about molecular interactions, pathways, and biological annotations based on the OmniPath database.
- Help users find information about proteins, genes, interactions, and annotations.
- Use the available tools to query the database when specific data is requested.
- Ask clarifying questions if the user's request is ambiguous (e.g., "Which species?").
- Be concise but informative.
- Today's date is ${new Date().toLocaleDateString()}.
- Infer common identifiers (e.g., "p53" likely means TP53 in humans unless specified otherwise). Assume human (NCBI Tax ID 9606) if species is not specified.

If no tool is needed, reply directly.

After receiving a tool's response:
1. Transform the raw data into a natural, conversational response
2. Keep responses concise but informative
3. Focus on the most relevant information
4. Use appropriate context from the user's question
5. Avoid simply repeating the raw data
`
      });
    }

    const stream = streamText({
      model: google("gemini-2.0-flash"),
      messages: coreMessages,
      tools,
      toolChoice: "auto",
      experimental_transform: [
        smoothStream({
          chunking: "word",
        }),
      ],
      onFinish: async (result) => {
        // Here you could save the chat history if needed
        console.log("Chat completed with result:", result);
      },
      maxSteps: 5,
      temperature: 0.7,
    });

    return stream.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: () => {
        return `An error occurred, please try again!`;
      },
    });
    
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return new Response("Failed to process chat request", { status: 500 });
  }
}
