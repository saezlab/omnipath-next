import { google } from "@/ai";
import { executeReadOnlyQuery } from '@/db/queries';
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
  executeSql: {
    description: `Execute a read-only SQL query (must start with SELECT) against the database.
Available tables and their columns:
- annotations: id, uniprot, genesymbol, entity_type, source, label, value, record_id
- complexes: id, name, components (array), components_genesymbols (array), stoichiometry, sources (array), references, identifiers
- enzsub: id, enzyme, enzyme_genesymbol, substrate, substrate_genesymbol, isoforms, residue_type, residue_offset, modification, sources (array), references, curation_effort, ncbi_tax_id
- interactions: id, source, target, source_genesymbol, target_genesymbol, is_directed, is_stimulation, is_inhibition, consensus_direction, consensus_stimulation, consensus_inhibition, sources (array), references, omnipath, kinaseextra, ligrecextra, pathwayextra, mirnatarget, dorothea, collectri, tf_target, lncrna_mrna, tf_mirna, small_molecule, dorothea_curated, dorothea_chipseq, dorothea_tfbs, dorothea_coexp, dorothea_level (array), type, curation_effort, extra_attrs (jsonb), evidences (jsonb), ncbi_tax_id_source, entity_type_source, ncbi_tax_id_target, entity_type_target
- intercell: id, category, parent, database, scope, aspect, source, uniprot, genesymbol, entity_type, consensus_score, transmitter, receiver, secreted, plasma_membrane_transmembrane, plasma_membrane_peripheral
- uniprot_identifiers: id, uniprot_accession, identifier_type, identifier_value
Example query: "SELECT sourceGenesymbol, targetGenesymbol, type FROM interactions WHERE sourceGenesymbol = 'EGFR' LIMIT 5"`,
    parameters: z.object({
      sqlQuery: z.string().describe("The read-only SQL query (starting with SELECT) to execute."),
    }),
    execute: async ({ sqlQuery }: { sqlQuery: string }) => {
      console.log(`Executing SQL query: ${sqlQuery}`);
      try {
        // Ensure the query is read-only server-side as well, although the function already does this.
        if (!sqlQuery.trim().toUpperCase().startsWith("SELECT")) {
           return { error: "Invalid query. Only SELECT statements are allowed." };
        }
        const results = await executeReadOnlyQuery(sqlQuery);
        console.log(`SQL query returned ${results.length} results.`);
        return { 
          results: results,
          totalCount: results.length,
          limited: false
        };
      } catch (error: unknown) {
        console.error("Error executing SQL query tool:", error);
        let errorMessage = 'Unknown database error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // Return the specific error message directly
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
        content: `You are OmniPath AI, an assistant for querying molecular interactions and biological data.

Key behaviors:
- Be concise and informative
- Summarize results >100 entries
- Ask for clarification if needed

Example queries:
• Canonical pathways for <protein>:
  SELECT * FROM annotations WHERE resource IN ('SignaLink_pathway', 'SIGNOR', 'NetPath', 'KEGG-PC') AND (uniprot = '<protein>' OR genesymbol = '<protein>')

• Is <protein> transmembrane:
  SELECT * FROM annotations WHERE resource = 'OPM' AND (uniprot = '<protein>' OR genesymbol = '<protein>')

• High-expression tissues:
  SELECT * FROM annotations WHERE resource = 'UniProt_tissue' AND (uniprot = '<protein>' OR genesymbol = '<protein>') AND level = 'high'

• Transcription factor regulators:
  SELECT * FROM interactions WHERE collectri AND (target = '<protein>' OR target_genesymbol = '<protein>')

• TF suppressors (inhibitors):
  SELECT * FROM interactions WHERE collectri AND (target = '<protein>' OR target_genesymbol = '<protein>') AND is_inhibition = 1

• Is <protein> a TF:
  SELECT * FROM annotations WHERE resource = 'TFcensus' AND tfcensus_class = 'a' AND (uniprot = '<protein>' OR genesymbol = '<protein>')

• Ligands of receptor:
  SELECT source_genesymbol FROM interactions WHERE ligrecextra AND (target = '<protein>' OR target_genesymbol = '<protein>')

Today: ${new Date().toLocaleDateString()}`
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
    
  } catch (error: unknown) {
    console.error("Error in chat endpoint:", error);
    return new Response("Failed to process chat request", { status: 500 });
  }
}
