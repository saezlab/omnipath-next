import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';
import { executeReadOnlyQuery } from '@/db/queries';

const handler = createMcpHandler(
  server => {
    server.tool(
      'execute_sql_query_on_omnipath_db',
      `Execute a read-only SQL query (must start with SELECT) against the Omnipath database.
Available tables and their columns:
- annotations: id, uniprot, genesymbol, entity_type, source, label, value, record_id
- complexes: id, name, components (array), components_genesymbols (array), stoichiometry, sources (array), references, identifiers
- enzsub: id, enzyme, enzyme_genesymbol, substrate, substrate_genesymbol, isoforms, residue_type, residue_offset, modification, sources (array), references, curation_effort, ncbi_tax_id
- interactions: id, source, target, source_genesymbol, target_genesymbol, is_directed, is_stimulation, is_inhibition, consensus_direction, consensus_stimulation, consensus_inhibition, sources (array), references, omnipath, kinaseextra, ligrecextra, pathwayextra, mirnatarget, dorothea, collectri, tf_target, lncrna_mrna, tf_mirna, small_molecule, dorothea_curated, dorothea_chipseq, dorothea_tfbs, dorothea_coexp, dorothea_level (array), type, curation_effort, extra_attrs (jsonb), evidences (jsonb), ncbi_tax_id_source, entity_type_source, ncbi_tax_id_target, entity_type_target
- intercell: id, category, parent, database, scope, aspect, source, uniprot, genesymbol, entity_type, consensus_score, transmitter, receiver, secreted, plasma_membrane_transmembrane, plasma_membrane_peripheral
- uniprot_identifiers: id, uniprot_accession, identifier_type, identifier_value`,
      {
        sqlQuery: z.string().describe("The read-only SQL query (starting with SELECT) to execute.")
      },
      async ({ sqlQuery }) => {
        console.log(`Executing SQL query: ${sqlQuery}`);
        try {
          if (!sqlQuery.trim().toUpperCase().startsWith("SELECT")) {
            return {
              content: [{ type: 'text', text: "Invalid query. Only SELECT statements are allowed." }],
            };
          }
          const results = await executeReadOnlyQuery(sqlQuery);
          console.log(`SQL query returned ${results.length} results.`);
          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify({ 
                results: results,
                totalCount: results.length,
                limited: false
              }, null, 2)
            }],
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
          return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          };
        }
      }
    );
  },
  {
    // Optional server options
  },
  {
    // You need these endpoints
    basePath: '/api', // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST }; 