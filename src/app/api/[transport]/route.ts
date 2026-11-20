// app/api/[transport]/route.ts
import { createMcpHandler } from "mcp-handler";
import { LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/sdk/types.js";
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

// Some clients (Claude's connector among them) send an MCP-Protocol-Version
// header newer than the SDK knows, and the SDK rejects every such request with
// a 400. Answer those requests as the newest version we support instead.
async function handleWithProtocolFallback(req: Request): Promise<Response> {
  const version = req.headers.get("mcp-protocol-version");
  if (version === null || SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
    return handler(req);
  }
  console.log(`MCP request with unsupported protocol version ${version}, answered as ${LATEST_PROTOCOL_VERSION}`);
  const headers = new Headers(req.headers);
  headers.set("mcp-protocol-version", LATEST_PROTOCOL_VERSION);
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  return handler(new Request(req.url, { method: req.method, headers, body, signal: req.signal }));
}

export { handleWithProtocolFallback as GET, handleWithProtocolFallback as POST };