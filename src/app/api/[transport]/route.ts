// app/api/[transport]/route.ts
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { executeReadOnlyQuery } from '@/db/queries';
import { DATABASE_SCHEMA_DESCRIPTION, handleSqlError, validateSqlQuery, SQL_VALIDATION_ERROR } from '@/lib/api-constants';

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "execute_sql_query_on_omnipath_db",
      {
        title: "Execute SQL Query on Omnipath DB",
        description: DATABASE_SCHEMA_DESCRIPTION,
        inputSchema: {
          sqlQuery: z.string().describe("The read-only SQL query (starting with SELECT) to execute.")
        },
      },
      async ({ sqlQuery }) => {
        if (!sqlQuery || typeof sqlQuery !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: sqlQuery parameter is required and must be a string' }],
          };
        }

        console.log(`Executing SQL query: ${sqlQuery}`);
        try {
          if (!validateSqlQuery(sqlQuery)) {
            return {
              content: [{ type: 'text', text: SQL_VALIDATION_ERROR }],
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
          const errorMessage = handleSqlError(error);
          return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          };
        }
      }
    );
  },
  {},
  {
    basePath: "/api", // must match where [transport] is located
    maxDuration: 60,
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };